<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\Prescription;
use App\Models\QueueTicket;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DoctorDashboardController extends Controller
{
    public static function pushFacilityLiveEvent(int $facilityId, array $eventData): void
    {
        if ($facilityId <= 0) {
            return;
        }

        $cacheKey = "facility_live_events_{$facilityId}";
        $events = Cache::get($cacheKey, []);
        if (! is_array($events)) {
            $events = [];
        }

        // Keep only events from the last 15 minutes
        $cutoff = Carbon::now()->subMinutes(15)->getTimestampMs();
        $events = array_values(array_filter($events, fn ($e) => ($e['timestamp_ms'] ?? 0) >= $cutoff));

        array_unshift($events, array_merge([
            'id' => uniqid('evt_', true),
            'created_at' => Carbon::now()->toIso8601String(),
            'timestamp_ms' => Carbon::now()->getTimestampMs(),
        ], $eventData));

        // Keep max 15 recent events
        $events = array_slice($events, 0, 15);
        Cache::put($cacheKey, $events, now()->addMinutes(30));
    }

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

        $doctor->loadMissing(['user', 'specialty']);
        $doctorId = $doctor->id;
        $today = Carbon::today();

        $gupshup = app(\App\Services\GupshupWhatsAppService::class);

        // 1. Complete any currently active consultation for this doctor today
        $activeAppts = Appointment::with('queueTicket')
            ->where('doctor_id', $doctorId)
            ->whereDate('appointment_date', $today)
            ->where('status', 'in_consultation')
            ->get();

        foreach ($activeAppts as $activeAppt) {
            $activeAppt->confirmFinishConsultation($user->id);
            $gupshup->notifyConsultationCompleted($activeAppt);
        }

        QueueTicket::whereHas('appointment', function ($q) use ($doctorId, $today) {
            $q->where('doctor_id', $doctorId)
              ->whereDate('appointment_date', $today);
        })->whereIn('status', ['examining', 'called'])->update([
            'status' => 'completed',
            'completed_at' => Carbon::now(),
        ]);

        // 2. Find next waiting appointment (priority: 'waiting', then 'confirmed'/'booked')
        $nextAppt = Appointment::with(['patient', 'queueTicket'])
            ->where('doctor_id', $doctorId)
            ->whereDate('appointment_date', $today)
            ->where('status', 'waiting')
            ->orderBy('appointment_time')
            ->first();

        if (! $nextAppt) {
            $nextAppt = Appointment::with(['patient', 'queueTicket'])
                ->where('doctor_id', $doctorId)
                ->whereDate('appointment_date', $today)
                ->whereIn('status', ['confirmed', 'booked'])
                ->orderBy('appointment_time')
                ->first();
        }

        if (! $nextAppt) {
            return back()->with('info', 'لا يوجد مرضى في قائمة الانتظار حالياً.');
        }

        // Ensure ticket exists
        $ticket = $nextAppt->queueTicket;
        if (! $ticket) {
            $maxNum = QueueTicket::whereHas('appointment', function ($q) use ($doctorId, $today) {
                $q->where('doctor_id', $doctorId)
                  ->whereDate('appointment_date', $today);
            })->max('ticket_number') ?? 0;

            $ticket = QueueTicket::create([
                'appointment_id' => $nextAppt->id,
                'ticket_number' => $maxNum + 1,
                'current_serving_number' => $maxNum + 1,
                'status' => 'called',
                'queue_date' => $today,
                'estimated_wait_minutes' => 0,
                'called_at' => Carbon::now(),
                'last_called_at' => Carbon::now(),
                'call_count' => 1,
                'started_at' => Carbon::now(),
            ]);
        } else {
            $ticket->update([
                'status' => 'called',
                'current_serving_number' => $ticket->ticket_number,
                'estimated_wait_minutes' => 0,
                'called_at' => Carbon::now(),
                'last_called_at' => Carbon::now(),
                'call_count' => ($ticket->call_count ?? 0) + 1,
                'started_at' => Carbon::now(),
            ]);
        }

        $nextAppt->update([
            'status' => 'in_consultation',
            'booking_confirmed_at' => $nextAppt->booking_confirmed_at ?? Carbon::now(),
            'booking_confirmed_by' => $nextAppt->booking_confirmed_by ?? $user->id,
            'arrival_confirmed_at' => $nextAppt->arrival_confirmed_at ?? Carbon::now(),
            'arrival_confirmed_by' => $nextAppt->arrival_confirmed_by ?? $user->id,
        ]);

        // Update current_serving_number on all remaining tickets for this doctor today
        $slotMinutes = $doctor->waiting_time_minutes ?: 15;
        $remainingTickets = QueueTicket::with('appointment.patient')
            ->whereHas('appointment', function ($q) use ($doctorId, $today) {
                $q->where('doctor_id', $doctorId)
                  ->whereDate('appointment_date', $today);
            })->where('status', 'waiting')->get();

        foreach ($remainingTickets as $remTicket) {
            $ahead = max(0, $remTicket->ticket_number - $ticket->ticket_number);
            $remTicket->update([
                'current_serving_number' => $ticket->ticket_number,
                'estimated_wait_minutes' => ($ahead * $slotMinutes) + (int) ($remTicket->delay_minutes ?? 0),
            ]);

            // Template 4: Notify the next patient in line that only 1 patient is ahead of them
            if ($ahead === 1 && $remTicket->appointment) {
                $gupshup->notifyTurnApproaching($remTicket->appointment);
            }
        }

        // Template 5: Notify the called patient to enter the consultation room now
        $gupshup->notifyPatientCalled($nextAppt);

        $facilityId = (int) ($nextAppt->facility_id ?: $doctor->clinic_id ?: 0);
        $doctorName = $doctor->user?->name ?? 'الطبيب';
        $patientName = $nextAppt->patient?->name ?? "تذكرة #{$ticket->ticket_number}";

        self::pushFacilityLiveEvent($facilityId, [
            'id' => 'call_' . $nextAppt->id . '_' . Carbon::now()->getTimestampMs(),
            'type' => 'call_next',
            'doctor_id' => $doctorId,
            'doctor_name' => $doctorName,
            'specialty_name' => $doctor->specialty?->name_ar ?? 'العيادة',
            'patient_name' => $patientName,
            'ticket_number' => $ticket->ticket_number,
            'booking_reference' => $nextAppt->booking_reference,
            'appointment_id' => $nextAppt->id,
            'message' => "🔔 نداء عيادة فوري: استدعى {$doctorName} المريض التالي ({$patientName}) - تذكرة رقم #{$ticket->ticket_number} للدخول إلى غرفة الفحص الآن!",
        ]);

        return back()->with('success', "تم استدعاء المريض ({$patientName} - تذكرة #{$ticket->ticket_number}) وإرسال تنبيه فوري لشاشة الاستقبال وشاشة المريض.");
    }

    public function addDelay(Request $request, Appointment $appointment)
    {
        $user = $request->user();
        $doctor = $user ? $user->doctorProfile : null;

        if (! $user || ($user->role !== 'admin' && (! $doctor || $appointment->doctor_id !== $doctor->id))) {
            abort(403, 'غير مصرح لك بتعديل مواعيد هذا الطبيب.');
        }

        $validated = $request->validate([
            'delay_minutes' => 'required|integer|min:5|max:180',
            'delay_reason' => 'nullable|string|max:255',
        ]);

        $addedMinutes = (int) $validated['delay_minutes'];
        $reason = $validated['delay_reason'] ?: 'نعتذر عن التأخير: تستدعي الحالة السريرية الحالية وقتاً إضافياً لتقديم العناية الطبية اللازمة. تم ترحيل وقت موعدك تلقائياً.';

        // 1. Update current appointment
        $appointment->increment('delay_minutes', $addedMinutes);
        $appointment->update(['delay_reason' => $reason]);
        if ($appointment->queueTicket) {
            $appointment->queueTicket->increment('delay_minutes', $addedMinutes);
        }

        // 2. Shift all waiting/confirmed/booked appointments for this doctor on the same date
        $subsequentAppts = Appointment::with('queueTicket')
            ->where('doctor_id', $appointment->doctor_id)
            ->whereDate('appointment_date', $appointment->appointment_date)
            ->where('id', '!=', $appointment->id)
            ->whereIn('status', ['waiting', 'confirmed', 'booked'])
            ->get();

        foreach ($subsequentAppts as $subAppt) {
            $subAppt->increment('delay_minutes', $addedMinutes);
            $subAppt->update(['delay_reason' => $reason]);

            if ($subAppt->queueTicket) {
                $subAppt->queueTicket->increment('estimated_wait_minutes', $addedMinutes);
                $subAppt->queueTicket->increment('delay_minutes', $addedMinutes);
            }
        }

        $appointment->loadMissing(['doctor.user', 'doctor.specialty', 'patient']);
        $docModel = $appointment->doctor;
        $facilityId = (int) ($appointment->facility_id ?: $docModel?->clinic_id ?: 0);
        $doctorName = $docModel?->user?->name ?? 'الطبيب';
        $patientName = $appointment->patient?->name ?? 'المريض الحالي';

        self::pushFacilityLiveEvent($facilityId, [
            'id' => 'delay_' . $appointment->id . '_' . $addedMinutes . '_' . Carbon::now()->getTimestampMs(),
            'type' => 'delay_added',
            'doctor_id' => $appointment->doctor_id,
            'doctor_name' => $doctorName,
            'specialty_name' => $docModel?->specialty?->name_ar ?? 'العيادة',
            'patient_name' => $patientName,
            'added_minutes' => $addedMinutes,
            'total_delay_minutes' => $appointment->delay_minutes,
            'delay_reason' => $reason,
            'affected_count' => $subsequentAppts->count(),
            'appointment_id' => $appointment->id,
            'message' => "⏰ تمديد وقت كشف: قام {$doctorName} بتمديد الكشف الحالي بمقدار (+{$addedMinutes} دقيقة) وتم تحديث أوقات انتظار المرضى تلقائياً.",
        ]);

        return back()->with('success', "تم تمديد وقت الكشف (+{$addedMinutes} دقيقة) بنجاح، وتحديث مواعيد كافة المرضى وإرسال تنبيه فوري للاستقبال والمرضى.");
    }

    public function startConsultation(Request $request, Appointment $appointment)
    {
        $user = $request->user();
        $doctor = $user ? $user->doctorProfile : null;

        if (! $user || ($user->role !== 'admin' && (! $doctor || $appointment->doctor_id !== $doctor->id))) {
            abort(403, 'غير مصرح لك ببدء كشف لطبيب آخر.');
        }

        $appointment->update([
            'status' => 'in_consultation',
            'booking_confirmed_at' => $appointment->booking_confirmed_at ?? Carbon::now(),
            'booking_confirmed_by' => $appointment->booking_confirmed_by ?? $user->id,
            'arrival_confirmed_at' => $appointment->arrival_confirmed_at ?? Carbon::now(),
            'arrival_confirmed_by' => $appointment->arrival_confirmed_by ?? $user->id,
        ]);

        $ticket = $appointment->queueTicket;
        if ($ticket) {
            $ticket->update([
                'status' => 'called',
                'current_serving_number' => $ticket->ticket_number,
                'called_at' => Carbon::now(),
                'last_called_at' => Carbon::now(),
                'call_count' => ($ticket->call_count ?? 0) + 1,
                'started_at' => Carbon::now(),
            ]);
        }

        $appointment->loadMissing(['doctor.user', 'doctor.specialty', 'patient']);
        $docModel = $appointment->doctor;
        $facilityId = (int) ($appointment->facility_id ?: $docModel?->clinic_id ?: 0);
        $doctorName = $docModel?->user?->name ?? 'الطبيب';
        $patientName = $appointment->patient?->name ?? 'المريض';
        $ticketNum = $ticket?->ticket_number ?? 1;

        self::pushFacilityLiveEvent($facilityId, [
            'id' => 'call_' . $appointment->id . '_' . Carbon::now()->getTimestampMs(),
            'type' => 'call_next',
            'doctor_id' => $appointment->doctor_id,
            'doctor_name' => $doctorName,
            'specialty_name' => $docModel?->specialty?->name_ar ?? 'العيادة',
            'patient_name' => $patientName,
            'ticket_number' => $ticketNum,
            'booking_reference' => $appointment->booking_reference,
            'appointment_id' => $appointment->id,
            'message' => "🔔 نداء عيادة فوري: استدعى {$doctorName} المريض ({$patientName}) - تذكرة رقم #{$ticketNum} للدخول إلى غرفة الفحص الآن!",
        ]);

        // Send WhatsApp notification (Template 5: Patient Called)
        app(\App\Services\GupshupWhatsAppService::class)->notifyPatientCalled($appointment);

        return back()->with('success', 'تم بدء الكشف الطبي للمريض وإشعار الاستقبال وشاشة المريض.');
    }

    public function completeConsultation(Request $request, Appointment $appointment)
    {
        $user = $request->user();
        $doctor = $user ? $user->doctorProfile : null;

        if (! $user || ($user->role !== 'admin' && (! $doctor || $appointment->doctor_id !== $doctor->id))) {
            abort(403, 'غير مصرح لك بإنهاء كشف لطبيب آخر.');
        }

        $appointment->confirmFinishConsultation($user->id);

        $prescription = null;
        if ($request->filled('diagnosis')) {
            $prescription = Prescription::create([
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

        // Send WhatsApp notification (Template 6: Stage 3 Consultation Completed & Prescription)
        app(\App\Services\GupshupWhatsAppService::class)->notifyConsultationCompleted($appointment, $prescription);

        return back()->with('success', 'تم إنهاء الكشف الطبي واعتماده بنجاح (المرحلة 3: تأكيد إنهاء الكشف من الطبيب).');
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
        
        $appointment->confirmFinishConsultation($user->id);

        $prescription = Prescription::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $appointment->patient_id,
            'doctor_id' => $appointment->doctor_id,
            'prescription_code' => 'RX-' . rand(100000, 999999),
            'diagnosis' => $validated['diagnosis'],
            'doctor_notes' => $validated['notes'] ?? null,
            'medications' => $validated['medications'] ?? [],
            'is_dispensed' => false,
        ]);

        // Send WhatsApp notification (Template 6: Stage 3 Consultation Completed & Prescription)
        app(\App\Services\GupshupWhatsAppService::class)->notifyConsultationCompleted($appointment, $prescription);

        return back()->with('success', 'تم إنهاء الكشف وإصدار الوصفة الطبية بنجاح.');
    }
}
