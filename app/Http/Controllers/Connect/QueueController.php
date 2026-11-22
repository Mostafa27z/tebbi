<?php

namespace App\Http\Controllers\Connect;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\ConnectAppointmentLink;
use App\Models\QueueTicket;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QueueController extends Controller
{
    /**
     * GET /connect/v1/queue/{public_token}
     * Public queue status inquiry using cryptographically unguessable token.
     */
    public function show(Request $request, string $public_token): JsonResponse
    {
        $hash = hash('sha256', $public_token);

        /** @var ConnectAppointmentLink|null $link */
        $link = ConnectAppointmentLink::with([
            'appointment.queueTicket',
            'appointment.doctor.user',
        ])
            ->where('public_token_hash', $hash)
            ->where('public_token_expires_at', '>=', now())
            ->first();

        if (! $link || ! $link->appointment) {
            throw new ModelNotFoundException('Resource not found or public token has expired.');
        }

        $appointment = $link->appointment;
        $ticket = $appointment->queueTicket;
        $doctor = $appointment->doctor;

        $currentExamining = null;
        if ($doctor) {
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
        }

        $currentServing = $currentExamining ? (int) $currentExamining->ticket_number : 1;
        $ticketNumber = $ticket ? (int) $ticket->ticket_number : 1;
        $isCalled = $appointment->status === 'in_consultation'
            || ($ticket && in_array($ticket->status, ['called', 'examining'], true));

        $patientsAhead = $isCalled ? 0 : max(0, $ticketNumber - $currentServing);

        $delayMinutes = (int) ($appointment->delay_minutes ?? 0);
        $slotMinutes = (int) ($doctor?->waiting_time_minutes ?: 15);
        $estimatedWaitMinutes = $isCalled ? 0 : (($patientsAhead * $slotMinutes) + $delayMinutes);

        return response()->json([
            'ticket_number' => $ticketNumber,
            'current_serving_number' => $currentServing,
            'patients_ahead' => $patientsAhead,
            'estimated_wait_minutes' => $estimatedWaitMinutes,
            'delay_minutes' => $delayMinutes,
            'delay_reason_code' => $appointment->delay_reason ? 'DOCTOR_DELAY' : null,
            'status' => $ticket?->status ?? 'waiting',
        ]);
    }
}
