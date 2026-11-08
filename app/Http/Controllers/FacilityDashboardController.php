<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\QueueTicket;
use App\Models\User;
use App\Services\ScopeResolver;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FacilityDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->isGroupAdmin() && !$user->isFacilityAdmin()) {
            abort(403, 'غير مصرح لك بالوصول إلى لوحة إدارة المنشأة الطبية.');
        }

        $resolver = new ScopeResolver();
        $facilityIds = $resolver->accessibleFacilityIds($user);
        $facilities = Facility::whereIn('id', $facilityIds)->with('group')->get();

        $primaryFacility = $facilities->first();
        if (!$primaryFacility) {
            abort(404, 'لا توجد منشأة طبية مرتبطة بحسابك.');
        }

        $today = Carbon::today();

        // Doctors practicing at this facility
        $doctors = DoctorProfile::where('clinic_id', $primaryFacility->id)
            ->orWhereHas('doctorFacilities', function ($q) use ($primaryFacility) {
                $q->where('facility_id', $primaryFacility->id)->where('is_active', true);
            })
            ->with(['user', 'specialty', 'doctorFacilities' => function ($q) use ($primaryFacility) {
                $q->where('facility_id', $primaryFacility->id);
            }])
            ->get();

        // Today's appointments at this facility
        $todayAppointments = Appointment::where('facility_id', $primaryFacility->id)
            ->whereDate('appointment_date', $today)
            ->with(['patient', 'doctor.user', 'queueTicket'])
            ->orderBy('appointment_time')
            ->get();

        $waitingCount = $todayAppointments->where('status', 'waiting')->count();
        $inConsultationCount = $todayAppointments->where('status', 'in_consultation')->count();
        $completedCount = $todayAppointments->where('status', 'completed')->count();

        return Inertia::render('facility/dashboard', [
            'facility' => $primaryFacility,
            'facilities' => $facilities,
            'metrics' => [
                'doctorsCount' => $doctors->count(),
                'totalToday' => $todayAppointments->count(),
                'waitingCount' => $waitingCount,
                'inConsultationCount' => $inConsultationCount,
                'completedCount' => $completedCount,
            ],
            'doctors' => $doctors,
            'todayAppointments' => $todayAppointments,
        ]);
    }

    public function issueWalkInTicket(Request $request, Facility $facility): RedirectResponse
    {
        $user = $request->user();
        $resolver = new ScopeResolver();
        if (!$resolver->canManageFacility($user, $facility->id) && !$user->isReceptionist($facility->id)) {
            abort(403, 'غير مصرح لك بقطع تذاكر لهذه المنشأة.');
        }

        $validated = $request->validate([
            'doctor_profile_id' => 'required|exists:doctor_profiles,id',
            'patient_name' => 'required|string|max:255',
            'patient_phone' => 'required|string|max:30',
            'patient_national_id' => 'nullable|string|max:20',
        ]);

        $doctor = DoctorProfile::findOrFail($validated['doctor_profile_id']);

        // Find or create patient user
        $patient = User::firstOrCreate(
            ['phone' => $validated['patient_phone']],
            [
                'name' => $validated['patient_name'],
                'email' => 'walkin.' . time() . '.' . rand(100, 999) . '@tebiby.local',
                'password' => Hash::make(Str::random(16)),
                'role' => 'patient',
                'national_id' => $validated['patient_national_id'] ?? null,
            ]
        );

        $today = Carbon::today();
        $now = Carbon::now();

        // Calculate next ticket number for this doctor at this facility today
        $lastTicketNumber = QueueTicket::whereHas('appointment', function ($q) use ($doctor, $facility, $today) {
            $q->where('doctor_id', $doctor->id)
              ->where('facility_id', $facility->id)
              ->whereDate('appointment_date', $today);
        })->max('ticket_number') ?? 0;

        $nextTicketNumber = $lastTicketNumber + 1;

        $appointment = Appointment::create([
            'booking_reference' => 'TB-W-' . rand(10000, 99999),
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $facility->id,
            'appointment_date' => $today,
            'appointment_time' => $now->format('H:i:s'),
            'status' => 'waiting',
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'consultation_fee' => $doctor->consultation_fee ?? 200,
            'discount' => 0,
            'tax' => 0,
            'total_amount' => $doctor->consultation_fee ?? 200,
            'patient_notes' => 'تسجيل حضور مباشر (Walk-in)',
        ]);

        QueueTicket::create([
            'appointment_id' => $appointment->id,
            'ticket_number' => $nextTicketNumber,
            'current_serving_number' => 1,
            'estimated_wait_minutes' => $nextTicketNumber * 15,
            'status' => 'waiting',
        ]);

        return back()->with('success', "تم تسجيل المريض بنجاح وإصدار التذكرة رقم #{$nextTicketNumber}");
    }
}
