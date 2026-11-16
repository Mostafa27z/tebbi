<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\QueueTicket;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LiveQueueController extends Controller
{
    private function authorizeQueueAccess(Request $request, Appointment $appointment): void
    {
        $user = $request->user();
        if (! $user) {
            abort(401);
        }

        $facilityId = $appointment->facility_id ?? $appointment->doctor?->clinic_id ?? 0;

        $isPatient = $user->id === $appointment->patient_id;
        $isDoctor = $user->doctorProfile && $user->doctorProfile->id === $appointment->doctor_id;
        $isAdmin = $user->role === 'admin';
        $isGroupAdmin = method_exists($user, 'isGroupAdmin') && $user->isGroupAdmin();
        $isFacilityStaff = (method_exists($user, 'isFacilityAdmin') && $user->isFacilityAdmin($facilityId))
            || (method_exists($user, 'isReceptionist') && $user->isReceptionist($facilityId))
            || (method_exists($user, 'isReceptionist') && $user->isReceptionist())
            || (method_exists($user, 'isFacilityAdmin') && $user->isFacilityAdmin());

        if ($isAdmin || $isDoctor || $isGroupAdmin || $isFacilityStaff || $isPatient) {
            return;
        }

        abort(403, 'غير مصرح لك بالاطلاع على تذكرة انتظار مريض آخر.');
    }

    private function formatArabicTime(Carbon $dt): string
    {
        $hour12 = $dt->format('h:i');
        $period = $dt->format('A') === 'AM' ? 'ص' : 'م';
        return "{$hour12} {$period}";
    }

    private function buildQueuePayload(Appointment $appointment, QueueTicket $ticket): array
    {
        $doctor = $appointment->doctor;

        $currentExamining = QueueTicket::whereHas('appointment', function ($q) use ($doctor, $appointment) {
            $q->where('doctor_id', $doctor->id)
              ->whereDate('appointment_date', $appointment->appointment_date);
        })->whereIn('status', ['called', 'examining'])->orderByDesc('called_at')->first();

        if (! $currentExamining) {
            $inConsultAppt = Appointment::with('queueTicket')
                ->where('doctor_id', $doctor->id)
                ->whereDate('appointment_date', $appointment->appointment_date)
                ->where('status', 'in_consultation')
                ->first();
            $currentExamining = $inConsultAppt?->queueTicket;
        }

        $currentServing = $currentExamining ? $currentExamining->ticket_number : 1;
        $isCalled = $appointment->status === 'in_consultation'
            || in_array($ticket->status, ['called', 'examining'], true);

        $patientsAhead = $isCalled ? 0 : max(0, $ticket->ticket_number - $currentServing);

        $delayMinutes = (int) ($appointment->delay_minutes ?? 0);
        $delayReason = $appointment->delay_reason;
        $slotMinutes = (int) ($doctor->waiting_time_minutes ?: 15);
        $queueWaitMinutes = $isCalled ? 0 : (($patientsAhead * $slotMinutes) + $delayMinutes);

        $apptDateStr = is_string($appointment->appointment_date)
            ? substr($appointment->appointment_date, 0, 10)
            : $appointment->appointment_date->toDateString();

        $scheduledTimeCarbon = Carbon::parse($apptDateStr . ' ' . $appointment->appointment_time);
        $expectedTimeCarbon = $scheduledTimeCarbon->copy()->addMinutes($delayMinutes);

        $now = Carbon::now();

        if ($isCalled) {
            $minutesRemaining = 0;
            $targetCarbon = $now;
        } elseif ($expectedTimeCarbon->gt($now)) {
            $minutesRemaining = (int) max(1, ceil($now->diffInSeconds($expectedTimeCarbon, false) / 60));
            $targetCarbon = $expectedTimeCarbon;
        } else {
            // When testing with an appointment time earlier in the day, compute live remaining wait from queue + delay
            $fallbackWait = max($patientsAhead > 0 ? ($patientsAhead * $slotMinutes) : $slotMinutes, 0) + $delayMinutes;
            $minutesRemaining = $fallbackWait;
            $targetCarbon = $now->copy()->addMinutes($fallbackWait);
        }

        return [
            'ticketNumber' => $ticket->ticket_number,
            'currentServingNumber' => $currentServing,
            'patientsAhead' => $patientsAhead,
            'estimatedWaitMinutes' => $isCalled ? 0 : max($queueWaitMinutes, $minutesRemaining),
            'queueStatus' => $ticket->status,
            'status' => $ticket->status,
            'appointmentStatus' => $appointment->status,
            'isYourTurn' => $isCalled,
            'isCalled' => $isCalled,
            'isNextInLine' => ! $isCalled && $patientsAhead === 0 && $appointment->status !== 'completed',
            'calledAt' => $ticket->called_at?->toIso8601String(),
            'callCount' => (int) ($ticket->call_count ?? 0),
            'delayMinutes' => $delayMinutes,
            'delayReason' => $delayReason,
            'scheduledTime' => $this->formatArabicTime($scheduledTimeCarbon),
            'expectedTime' => $this->formatArabicTime($expectedTimeCarbon->gt($now) || $delayMinutes > 0 ? $expectedTimeCarbon : $targetCarbon),
            'minutesRemaining' => $minutesRemaining,
            'targetTimestampMs' => $targetCarbon->getTimestampMs(),
            'doctorName' => $doctor?->user?->name ?? 'الطبيب',
            'doctorTitle' => $doctor?->title_ar ?? 'استشاري',
        ];
    }

    public function show(Request $request, string $bookingReference): Response
    {
        $appointment = Appointment::with([
            'patient',
            'facility',
            'doctor.user',
            'doctor.specialty',
            'doctor.clinic',
            'queueTicket',
        ])->where('booking_reference', $bookingReference)->firstOrFail();

        $this->authorizeQueueAccess($request, $appointment);

        $doctor = $appointment->doctor;
        $facility = $appointment->facility ?? $doctor?->clinic;

        $ticket = $appointment->queueTicket;
        if (! $ticket) {
            $today = $appointment->appointment_date ?? now();
            $nextNum = QueueTicket::whereDate('queue_date', $today)
                ->whereHas('appointment', fn ($q) => $q->where('doctor_id', $doctor->id))
                ->max('ticket_number') ?? 0;

            $ticket = QueueTicket::create([
                'appointment_id' => $appointment->id,
                'ticket_number' => $nextNum + 1,
                'status' => 'waiting',
                'queue_date' => $today,
                'estimated_wait_minutes' => 15,
            ]);
            $appointment->setRelation('queueTicket', $ticket);
        }

        $queueData = $this->buildQueuePayload($appointment, $ticket);

        $ticket->update([
            'current_serving_number' => $queueData['currentServingNumber'],
            'estimated_wait_minutes' => $queueData['estimatedWaitMinutes'],
        ]);

        return Inertia::render('live-queue', [
            'appointment' => $appointment,
            'queueData' => $queueData,
            'clinicLocation' => [
                'name' => $facility?->name ?? 'العيادة الطبية',
                'branch' => $facility?->branch_name ?? 'الفرع الرئيسي',
                'district' => $facility?->district ?? '',
                'city' => $facility?->city ?? 'الرياض',
                'address' => $facility?->address ?? '',
                'phone' => $facility?->phone ?? '',
                'mapUrl' => $facility?->map_url ?? '',
                'latitude' => (float) ($facility?->latitude ?? 24.6978),
                'longitude' => (float) ($facility?->longitude ?? 46.6841),
            ],
        ]);
    }

    public function status(Request $request, string $bookingReference): JsonResponse
    {
        $appointment = Appointment::with(['queueTicket', 'doctor.user'])->where('booking_reference', $bookingReference)->firstOrFail();

        $this->authorizeQueueAccess($request, $appointment);

        $ticket = $appointment->queueTicket;
        if (! $ticket) {
            return response()->json([
                'ticketNumber' => 1,
                'currentServingNumber' => 1,
                'patientsAhead' => 0,
                'estimatedWaitMinutes' => 0,
                'status' => 'waiting',
                'appointmentStatus' => $appointment->status,
                'isYourTurn' => false,
                'isCalled' => false,
                'delayMinutes' => (int) ($appointment->delay_minutes ?? 0),
                'delayReason' => $appointment->delay_reason,
                'minutesRemaining' => 0,
            ]);
        }

        return response()->json($this->buildQueuePayload($appointment, $ticket));
    }
}
