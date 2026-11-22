<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\Group;
use App\Models\RoleAssignment;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\TebibySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardLiveSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TebibySeeder::class);
    }

    public function test_doctor_dashboard_live_sync_reflects_new_bookings_and_checkins_without_history_overhead(): void
    {
        $doctorUser = User::where('role', 'doctor')->firstOrFail();
        $doctor = $doctorUser->doctorProfile;
        $patient = User::where('role', 'patient')->firstOrFail();
        $today = Carbon::today()->toDateString();

        // Ensure there is at least one completed historical consultation for /doctor/history check
        Appointment::create([
            'booking_reference' => 'HST-' . strtoupper(Str::random(6)),
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $doctor->clinic_id,
            'appointment_date' => Carbon::yesterday()->toDateString(),
            'appointment_time' => '10:00:00',
            'duration_minutes' => 20,
            'service_name' => 'كشف سابق',
            'status' => 'completed',
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'consultation_fee' => 200,
            'total_amount' => 200,
        ]);

        // 1. Initial dashboard load keeps historyAppointments empty and reflects current waiting count
        $initialWaiting = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $today)
            ->where('status', 'waiting')
            ->count();

        $this->actingAs($doctorUser)
            ->get('/doctor/dashboard')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('doctor/dashboard')
                ->where('stats.waitingCount', $initialWaiting)
                ->has('historyAppointments', 0)
            );

        // 2. A new patient books today and receptionist checks them in (status transitions to waiting)
        $newAppt = Appointment::create([
            'booking_reference' => 'LIV-' . strtoupper(Str::random(6)),
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $doctor->clinic_id,
            'appointment_date' => $today,
            'appointment_time' => '16:30:00',
            'duration_minutes' => 30,
            'service_name' => 'كشف مباشر جديد',
            'status' => 'confirmed',
            'payment_method' => 'cash',
            'payment_status' => 'pending',
            'consultation_fee' => 250,
            'total_amount' => 250,
        ]);

        $newAppt->confirmArrival($doctorUser->id);

        // 3. Subsequent live-sync request reflects new waiting patient immediately
        $this->actingAs($doctorUser)
            ->get('/doctor/dashboard', ['X-Live-Sync' => '1'])
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('doctor/dashboard')
                ->where('stats.waitingCount', $initialWaiting + 1)
                ->has('historyAppointments', 0)
                ->where('todayAppointments', function ($appts) use ($newAppt) {
                    return collect($appts)->contains('id', $newAppt->id);
                })
            );

        // 4. Doctor history endpoint still loads completed consultations
        $this->actingAs($doctorUser)
            ->get('/doctor/history')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('doctor/history')
                ->where('historyAppointments', function ($items) {
                    return count($items) >= 1;
                })
            );
    }

    public function test_super_admin_analytics_and_appointments_reflect_live_updates(): void
    {
        $admin = User::where('role', 'admin')->firstOrFail();
        $doctor = DoctorProfile::firstOrFail();
        $patient = User::where('role', 'patient')->firstOrFail();

        $initialTotalBookings = Appointment::count();

        // Create a brand new booking on the platform
        $freshAppt = Appointment::create([
            'booking_reference' => 'ADM-' . strtoupper(Str::random(6)),
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $doctor->clinic_id,
            'appointment_date' => Carbon::today()->addDays(1)->toDateString(),
            'appointment_time' => '18:00:00',
            'duration_minutes' => 45,
            'service_name' => 'حجز مباشر للأدمن',
            'status' => 'confirmed',
            'payment_method' => 'cash',
            'payment_status' => 'pending',
            'consultation_fee' => 300,
            'total_amount' => 300,
        ]);

        // Analytics live-sync reload shows updated booking metric & shared adminCounts
        $this->actingAs($admin)
            ->get('/admin/analytics', ['X-Live-Sync' => '1'])
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/analytics')
                ->where('metrics.totalBookings', $initialTotalBookings + 1)
                ->where('adminCounts.appointments', $initialTotalBookings + 1)
            );

        // Appointments live-sync reload includes the new appointment first in list
        $this->actingAs($admin)
            ->get('/admin/appointments', ['X-Live-Sync' => '1'])
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/appointments')
                ->where('metrics.total', $initialTotalBookings + 1)
                ->where('appointments', function ($items) use ($freshAppt) {
                    return collect($items)->contains('id', $freshAppt->id);
                })
            );
    }

    public function test_facility_and_group_dashboards_reflect_live_updates(): void
    {
        $facilityAssignment = RoleAssignment::where('role', 'facility_admin')->firstOrFail();
        $facilityUser = User::findOrFail($facilityAssignment->user_id);
        $facilityId = $facilityAssignment->scope_id;

        $doctor = DoctorProfile::where('clinic_id', $facilityId)->first()
            ?? DoctorProfile::firstOrFail();
        $patient = User::where('role', 'patient')->firstOrFail();

        $todayAppt = Appointment::create([
            'booking_reference' => 'FAC-' . strtoupper(Str::random(6)),
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $facilityId,
            'appointment_date' => Carbon::today()->toDateString(),
            'appointment_time' => '19:15:00',
            'duration_minutes' => 25,
            'service_name' => 'كشف استقبال مباشر',
            'status' => 'waiting',
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'consultation_fee' => 200,
            'total_amount' => 200,
        ]);

        $this->actingAs($facilityUser)
            ->getJson("/api/facility/live-sync?facility_id={$facilityId}&date=today")
            ->assertStatus(200)
            ->assertJsonStructure(['metrics', 'todayAppointments', 'events', 'serverTime']);

        $this->actingAs($facilityUser)
            ->get('/facility/appointments', ['X-Live-Sync' => '1'])
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('facility/appointments')
                ->where('allAppointments', function ($items) use ($todayAppt) {
                    return collect($items)->contains('id', $todayAppt->id);
                })
            );

        // Group Admin dashboard live reload shows newly added facility
        $groupAssignment = RoleAssignment::where('role', 'group_admin')->firstOrFail();
        $groupAdmin = User::findOrFail($groupAssignment->user_id);
        $group = Group::findOrFail($groupAssignment->scope_id);

        $beforeFacilities = Facility::where('group_id', $group->id)->count();

        Facility::create([
            'group_id' => $group->id,
            'name' => 'فرع مباشر جديد للاختبار',
            'branch_name' => 'فرع التحقق',
            'type' => 'clinic',
            'city' => 'الرياض',
            'district' => 'العليا',
            'address' => 'طريق الملك فهد',
            'phone' => '0112233445',
            'is_active' => true,
            'is_verified' => true,
        ]);

        $this->actingAs($groupAdmin)
            ->get('/group/dashboard', ['X-Live-Sync' => '1'])
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('group/dashboard')
                ->has('facilities', $beforeFacilities + 1)
            );
    }

    public function test_role_scoping_blocks_unauthorized_live_sync_access(): void
    {
        $patient = User::where('role', 'patient')->firstOrFail();
        $doctorUser = User::where('role', 'doctor')->firstOrFail();

        $this->actingAs($patient)->getJson('/doctor/dashboard')->assertStatus(403);
        $this->actingAs($patient)->getJson('/admin/appointments')->assertStatus(403);
        $this->actingAs($doctorUser)->getJson('/admin/analytics')->assertStatus(403);
    }
}
