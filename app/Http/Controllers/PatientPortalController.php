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
        ->whereIn('status', ['waiting', 'confirmed', 'in_consultation'])
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
                    'name' => $facility->name,
                    'branch_name' => $facility->branch_name,
                    'address' => $facility->address,
                    'city' => $facility->city,
                    'district' => $facility->district,
                    'phone' => $facility->phone,
                    'latitude' => $facility->latitude ?? 24.6978,
                    'longitude' => $facility->longitude ?? 46.6841,
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
}
