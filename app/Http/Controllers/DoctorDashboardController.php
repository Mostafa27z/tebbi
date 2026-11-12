<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\Prescription;
use App\Models\QueueTicket;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorDashboardController extends Controller
{
    private function getDoctorData(Request $request): array
    {
        $user = $request->user();
        $doctor = $user ? $user->doctorProfile : null;

        if (! $doctor) {
            abort(403, 'لا يوجد ملف طبيب مرتبط بهذا الحساب.');
        }

        $doctor->loadMissing(['user', 'specialty', 'clinic', 'doctorFacilities.facility']);

        $today = Carbon::today();

        $todayAppointments = Appointment::with(['patient', 'queueTicket', 'prescription', 'facility'])
            ->where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $today)
            ->orderBy('appointment_time')
            ->get();

        // Past completed consultations (last 100)
        $historyAppointments = Appointment::with(['patient', 'queueTicket', 'prescription', 'facility'])
            ->where('doctor_id', $doctor->id)
            ->where('status', 'completed')
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->take(100)
            ->get();

        // Current patient in examination
        $currentSession = $todayAppointments->firstWhere('status', 'in_consultation')
                       ?? $todayAppointments->firstWhere('status', 'waiting');

        // Stats for doctor
        $totalToday = $todayAppointments->count();
        $waitingInLobby = $todayAppointments->where('status', 'waiting')->count();
        $inConsultationCount = $todayAppointments->where('status', 'in_consultation')->count();
        $completedToday = $todayAppointments->where('status', 'completed')->count();
        $notArrivedToday = $todayAppointments->whereIn('status', ['confirmed', 'booked'])->count();
        $insuranceCount = $todayAppointments->where('payment_method', 'insurance')->count();

        return [
            'doctor' => $doctor,
            'todayAppointments' => $todayAppointments,
            'historyAppointments' => $historyAppointments,
            'currentSession' => $currentSession,
            'stats' => [
                'totalPatients' => $totalToday,
                'waitingCount' => $waitingInLobby,
                'inConsultationCount' => $inConsultationCount,
                'completedCount' => $completedToday,
                'notArrivedCount' => $notArrivedToday,
                'insuranceCount' => $insuranceCount,
                'currentTicketNum' => $currentSession ? ($currentSession->queueTicket?->ticket_number ?? null) : null,
            ]
        ];
    }

    public function index(Request $request): Response
    {
        $data = $this->getDoctorData($request);
        return Inertia::render('doctor/dashboard', $data);
    }

    public function history(Request $request): Response
    {
        $data = $this->getDoctorData($request);
        return Inertia::render('doctor/history', $data);
    }

    public function schedule(Request $request): Response
    {
        $data = $this->getDoctorData($request);
        return Inertia::render('doctor/schedule', $data);
    }

    public function callNext(Request $request)
    {
        $user = $request->user();
        $doctor = $user ? $user->doctorProfile : null;

        if (! $doctor) {
            abort(403, 'غير مصرح لك باستدعاء الحالات لعدم وجود ملف طبيب مرتبط.');
        }

        $doctorId = $doctor->id;
        $today = Carbon::today();

        // Complete current examining session if exists
        $currentExamining = QueueTicket::whereHas('appointment', function ($q) use ($doctorId, $today) {
            $q->where('doctor_id', $doctorId)
              ->whereDate('appointment_date', $today);
        })->where('status', 'examining')->first();

        if ($currentExamining) {
            $currentExamining->update([
                'status' => 'completed',
                'completed_at' => Carbon::now(),
            ]);
            $currentExamining->appointment->update(['status' => 'completed']);
        }

        // Find next waiting ticket (patient who checked in at reception)
        $nextTicket = QueueTicket::whereHas('appointment', function ($q) use ($doctorId, $today) {
            $q->where('doctor_id', $doctorId)
              ->whereDate('appointment_date', $today);
        })->where('status', 'waiting')->orderBy('ticket_number')->first();

        if ($nextTicket) {
            $nextTicket->update([
                'status' => 'examining',
                'started_at' => Carbon::now(),
            ]);
            $nextTicket->appointment->update(['status' => 'in_consultation']);
            return back()->with('success', 'تم استدعاء المريض التالي (' . $nextTicket->ticket_number . ') إلى العيادة.');
        }

        // Fallback: Check if there is an appointment with status 'waiting' without ticket
        $nextAppt = Appointment::where('doctor_id', $doctorId)
            ->whereDate('appointment_date', $today)
            ->where('status', 'waiting')
            ->orderBy('appointment_time')
            ->first();

        if ($nextAppt) {
            $nextAppt->update(['status' => 'in_consultation']);
            return back()->with('success', 'تم بدء الكشف للمريض بالعيادة.');
        }

        return back()->with('info', 'لا يوجد مرضى في صالة الانتظار حالياً.');
    }

    public function startConsultation(Request $request, Appointment $appointment)
    {
        $user = $request->user();
        $doctor = $user ? $user->doctorProfile : null;

        if (! $user || ($user->role !== 'admin' && (! $doctor || $appointment->doctor_id !== $doctor->id))) {
            abort(403, 'غير مصرح لك ببدء كشف لطبيب آخر.');
        }

        $appointment->update(['status' => 'in_consultation']);

        if ($appointment->queueTicket) {
            $appointment->queueTicket->update([
                'status' => 'examining',
                'started_at' => Carbon::now(),
            ]);
        }

        return back()->with('success', 'تم بدء الكشف الطبي للمريض.');
    }

    public function completeConsultation(Request $request, Appointment $appointment)
    {
        $user = $request->user();
        $doctor = $user ? $user->doctorProfile : null;

        if (! $user || ($user->role !== 'admin' && (! $doctor || $appointment->doctor_id !== $doctor->id))) {
            abort(403, 'غير مصرح لك بإنهاء كشف لطبيب آخر.');
        }

        $appointment->update(['status' => 'completed']);

        if ($appointment->queueTicket) {
            $appointment->queueTicket->update([
                'status' => 'completed',
                'completed_at' => Carbon::now(),
            ]);
        }

        if ($request->filled('diagnosis')) {
            Prescription::create([
                'appointment_id' => $appointment->id,
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $appointment->doctor_id,
                'prescription_code' => 'RX-' . rand(100000, 999999),
                'diagnosis' => $request->input('diagnosis'),
                'doctor_notes' => $request->input('notes'),
                'medications' => $request->input('medications', []),
                'is_dispensed' => false,
            ]);
        }

        return back()->with('success', 'تم إنهاء الكشف الطبي وحفظ السجل بنجاح.');
    }

    public function toggleAvailability(Request $request)
    {
        $user = $request->user();
        $doctor = $user ? $user->doctorProfile : null;

        if (! $doctor) {
            abort(403, 'لا يوجد ملف طبيب مرتبط بهذا الحساب.');
        }

        $doctor->update([
            'is_available_today' => ! $doctor->is_available_today,
        ]);

        $statusText = $doctor->is_available_today ? 'متاح لاستقبال المرضى' : 'غير متاح حالياً';
        return back()->with('success', 'تم تحديث حالة تواجد الطبيب إلى: ' . $statusText);
    }

    public function saveConsultation(Request $request, $appointmentId)
    {
        $validated = $request->validate([
            'diagnosis' => 'required|string',
            'notes' => 'nullable|string',
            'medications' => 'nullable|array',
        ]);

        $user = $request->user();
        $doctor = $user ? $user->doctorProfile : null;

        $appointment = Appointment::findOrFail($appointmentId);

        if (! $user || ($user->role !== 'admin' && (! $doctor || $appointment->doctor_id !== $doctor->id))) {
            abort(403, 'غير مصرح لك بتعديل أو إنهاء كشف يخص طبيباً آخر.');
        }
        
        $appointment->update([
            'status' => 'completed',
        ]);

        if ($appointment->queueTicket) {
            $appointment->queueTicket->update([
                'status' => 'completed',
                'completed_at' => Carbon::now(),
            ]);
        }

        Prescription::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $appointment->patient_id,
            'doctor_id' => $appointment->doctor_id,
            'prescription_code' => 'RX-' . rand(100000, 999999),
            'diagnosis' => $validated['diagnosis'],
            'doctor_notes' => $validated['notes'] ?? null,
            'medications' => $validated['medications'] ?? [],
            'is_dispensed' => false,
        ]);

        return back()->with('success', 'تم إنهاء الكشف وإصدار الوصفة الطبية بنجاح.');
    }
}
