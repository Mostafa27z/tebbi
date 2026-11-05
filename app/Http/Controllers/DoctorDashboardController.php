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
    public function index(Request $request): Response
    {
        $user = $request->user();
        $doctor = $user ? $user->doctorProfile : null;

        if (! $doctor) {
            abort(403, 'لا يوجد ملف طبيب مرتبط بهذا الحساب.');
        }

        $doctor->loadMissing(['user', 'specialty', 'clinic']);

        $today = Carbon::today();

        $todayAppointments = Appointment::with(['patient', 'queueTicket', 'prescription'])
            ->where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $today)
            ->orderBy('appointment_time')
            ->get();

        // Current patient in examination
        $currentSession = $todayAppointments->firstWhere('status', 'in_consultation')
                       ?? $todayAppointments->firstWhere('status', 'waiting');

        // Stats for doctor
        $totalToday = $todayAppointments->count();
        $completedToday = $todayAppointments->where('status', 'completed')->count();
        $waitingToday = $todayAppointments->where('status', 'waiting')->count();

        return Inertia::render('doctor/dashboard', [
            'doctor' => $doctor,
            'todayAppointments' => $todayAppointments,
            'currentSession' => $currentSession,
            'stats' => [
                'totalPatients' => $totalToday,
                'completedCount' => $completedToday,
                'waitingCount' => $waitingToday,
                'currentTicketNum' => $currentSession ? $currentSession->queueTicket?->ticket_number ?? 1 : 1,
            ]
        ]);
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

        // Find next waiting ticket
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
        }

        return back()->with('success', 'تم استدعاء الحالة التالية وتحديث شاشة الانتظار.');
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

        // Enforce strict ownership: only the assigned doctor or admin may complete the consultation
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

