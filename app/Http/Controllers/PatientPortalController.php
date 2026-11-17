<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\MedicalRecord;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientPortalController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        $rawUpcoming = Appointment::with([
            'doctor.user',
            'doctor.specialty',
            'doctor.clinic',
            'facility',
            'queueTicket',
        ])
        ->where('patient_id', $user->id)
        ->whereIn('status', ['booked', 'waiting', 'confirmed', 'in_consultation'])
        ->orderBy('appointment_date')
        ->orderBy('appointment_time')
        ->get();

        $upcomingAppointments = $rawUpcoming->map(function ($appt) {
            $facility = $appt->facility ?? $appt->doctor?->clinic;

            // Calculate how many people ahead in lobby waiting for the same doctor today
            $peopleAhead = 0;
            if ($appt->status === 'waiting') {
                $peopleAhead = Appointment::where('doctor_id', $appt->doctor_id)
                    ->whereDate('appointment_date', $appt->appointment_date)
                    ->where('status', 'waiting')
                    ->where('id', '<', $appt->id)
                    ->count();
            }

            return array_merge($appt->toArray(), [
                'clinic_location' => $facility ? [
                    'id' => $facility->id,
                    'name' => $facility->name,
                    'branch_name' => $facility->branch_name,
                    'address' => $facility->address,
                    'city' => $facility->city,
                    'district' => $facility->district,
                    'phone' => $facility->phone,
                    'latitude' => $facility->latitude ?? 24.6978,
                    'longitude' => $facility->longitude ?? 46.6841,
                    'checkin_code' => 'TEBBY-FAC-' . $facility->id,
                ] : null,
                'people_ahead' => $peopleAhead,
            ]);
        });

        $pastAppointments = Appointment::with([
            'doctor.user',
            'doctor.specialty',
            'doctor.clinic',
            'facility',
            'prescription',
        ])
        ->where('patient_id', $user->id)
        ->whereIn('status', ['completed', 'cancelled'])
        ->orderByDesc('appointment_date')
        ->get();

        $prescriptions = Prescription::with([
            'doctor.user',
            'doctor.specialty',
            'doctor.clinic',
        ])
        ->where('patient_id', $user->id)
        ->orderByDesc('created_at')
        ->get();

        $medicalRecords = MedicalRecord::with(['doctor.user'])
        ->where('patient_id', $user->id)
        ->orderByDesc('record_date')
        ->get();

        return Inertia::render('patient/portal', [
            'patient' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? 'غير مسجل',
                'national_id' => $user->national_id ?? 'غير متوفر',
                'avatar' => $user->avatar,
                'insurance' => 'تأمين طبي معتمد',
                'membership_id' => $user->national_id ?? 'N/A',
                'national_address' => 'المملكة العربية السعودية',
            ],
            'upcomingAppointments' => $upcomingAppointments,
            'pastAppointments' => $pastAppointments,
            'prescriptions' => $prescriptions,
            'medicalRecords' => $medicalRecords,
        ]);
    }

    /**
     * Patient QR / Reception Self Check-In
     */
    public function checkIn(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $validated = $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
            'facility_code' => 'required|string',
        ]);

        $appointment = Appointment::with(['facility', 'doctor.clinic'])->findOrFail($validated['appointment_id']);

        // Check ownership or admin
        if ($appointment->patient_id !== $user->id && $user->role !== 'admin') {
            abort(403, 'غير مصرح لك بتأكيد حضور هذا الموعد.');
        }

        $facility = $appointment->facility ?? $appointment->doctor?->clinic;
        $targetFacilityId = $facility ? $facility->id : null;

        // Clean scanned code
        $scannedCode = trim(strtoupper($validated['facility_code']));
        $isValid = false;

        if ($targetFacilityId) {
            $validPatterns = [
                (string) $targetFacilityId,
                'FAC-' . $targetFacilityId,
                'TEBBY-FAC-' . $targetFacilityId,
                'TEBBY-FACILITY-' . $targetFacilityId,
            ];

            if (in_array($scannedCode, $validPatterns) || str_contains($scannedCode, (string) $targetFacilityId)) {
                $isValid = true;
            }
        } else {
            $isValid = true;
        }

        if (!$isValid) {
            return back()->withErrors([
                'facility_code' => 'رمز الـ QR الذي مسحته لا يطابق منشأة موعدك الحالي. يرجى مسح كود الاستقبال لـ: ' . ($facility?->name ?? 'العيادة'),
            ]);
        }

        // Confirm Arrival: sets status to 'waiting', confirms stage 2 & stage 1, generates/updates queue ticket
        $appointment->confirmArrival($user->id);

        // Send WhatsApp notification (Template 3: Arrival Confirmed & Ticket)
        app(\App\Services\GupshupWhatsAppService::class)->notifyArrivalConfirmed($appointment);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'تم تأكيد وصولك بالعيادة بنجاح! رقم تذكرتك هو: #' . ($appointment->queueTicket?->ticket_number ?? '01'),
                'ticket_number' => $appointment->queueTicket?->ticket_number ?? 1,
                'status' => 'waiting',
            ]);
        }

        return back()->with('success', 'تم تأكيد حضورك في العيادة بنجاح! رقم تذكرتك هو: #' . ($appointment->queueTicket?->ticket_number ?? '01'));
    }
}
