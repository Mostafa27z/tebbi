<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\QueueTicket;
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

        $isPatient = $user->id === $appointment->patient_id;
        $isDoctor = $user->doctorProfile && $user->doctorProfile->id === $appointment->doctor_id;
        $isAdmin = $user->role === 'admin';

        if (! ($isPatient || $isDoctor || $isAdmin)) {
            abort(403, 'غير مصرح لك بالاطلاع على تذكرة انتظار مريض آخر.');
        }
    }

    public function show(Request $request, string $bookingReference): Response
    {
        $appointment = Appointment::with([
            'patient',
            'doctor.user',
            'doctor.specialty',
            'doctor.clinic',
            'queueTicket',
        ])->where('booking_reference', $bookingReference)->firstOrFail();

        $this->authorizeQueueAccess($request, $appointment);

        $doctor = $appointment->doctor;
        $ticket = $appointment->queueTicket;

        // Recalculate latest queue dynamics
        $todayTickets = QueueTicket::whereHas('appointment', function ($q) use ($doctor, $appointment) {
            $q->where('doctor_id', $doctor->id)
              ->whereDate('appointment_date', $appointment->appointment_date);
        })->get();

        $currentExamining = $todayTickets->firstWhere('status', 'examining') 
                         ?? $todayTickets->firstWhere('status', 'called');

        $currentServing = $currentExamining ? $currentExamining->ticket_number : 1;
        $patientsAhead = max(0, $ticket->ticket_number - $currentServing);
        $estimatedWait = $patientsAhead * $doctor->waiting_time_minutes;

        // Update ticket cache
        $ticket->update([
            'current_serving_number' => $currentServing,
            'estimated_wait_minutes' => $estimatedWait,
        ]);

        return Inertia::render('live-queue', [
            'appointment' => $appointment,
            'queueData' => [
                'ticketNumber' => $ticket->ticket_number,
                'currentServingNumber' => $currentServing,
                'patientsAhead' => $patientsAhead,
                'estimatedWaitMinutes' => $estimatedWait,
                'queueStatus' => $ticket->status,
                'appointmentStatus' => $appointment->status,
            ],
            'clinicLocation' => [
                'name' => $doctor->clinic->name,
                'branch' => $doctor->clinic->branch_name,
                'district' => $doctor->clinic->district,
                'city' => $doctor->clinic->city,
                'address' => $doctor->clinic->address,
                'phone' => $doctor->clinic->phone,
                'mapUrl' => $doctor->clinic->map_url,
            ]
        ]);
    }

    public function status(Request $request, string $bookingReference): JsonResponse
    {
        $appointment = Appointment::with(['queueTicket', 'doctor'])->where('booking_reference', $bookingReference)->firstOrFail();
        
        $this->authorizeQueueAccess($request, $appointment);

        $ticket = $appointment->queueTicket;
        $doctor = $appointment->doctor;

        $currentExamining = QueueTicket::whereHas('appointment', function ($q) use ($doctor, $appointment) {
            $q->where('doctor_id', $doctor->id)
              ->whereDate('appointment_date', $appointment->appointment_date);
        })->whereIn('status', ['called', 'examining'])->first();

        $currentServing = $currentExamining ? $currentExamining->ticket_number : 1;
        $patientsAhead = max(0, $ticket->ticket_number - $currentServing);

        return response()->json([
            'ticketNumber' => $ticket->ticket_number,
            'currentServingNumber' => $currentServing,
            'patientsAhead' => $patientsAhead,
            'estimatedWaitMinutes' => $patientsAhead * $doctor->waiting_time_minutes,
            'status' => $ticket->status,
            'isYourTurn' => $patientsAhead === 0,
        ]);
    }
}
