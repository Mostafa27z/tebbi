<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\RoleAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class FacilityReceptionistManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_facility_admin_can_view_receptionists_page(): void
    {
        $facilityAdmin = User::where('email', 'olaya.admin@tebiby.com')->firstOrFail();

        $response = $this->actingAs($facilityAdmin)
            ->get('/facility/receptionists');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('facility/receptionists')
            ->has('facility')
            ->has('receptionists')
            ->has('metrics')
        );
    }

    public function test_pure_receptionist_cannot_access_receptionists_management(): void
    {
        $receptionist = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();

        $response = $this->actingAs($receptionist)
            ->get('/facility/receptionists');

        $response->assertForbidden();
    }

    public function test_facility_admin_can_create_new_receptionist(): void
    {
        $facilityAdmin = User::where('email', 'olaya.admin@tebiby.com')->firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();

        $response = $this->actingAs($facilityAdmin)
            ->post('/facility/receptionists', [
                'mode' => 'new',
                'facility_id' => $facility->id,
                'name' => 'سارة الشمري',
                'email' => 'sara.reception@tebiby.com',
                'phone' => '+966551234567',
                'national_id' => '1099887766',
                'password' => 'secret123',
            ]);

        $response->assertSessionHas('success');

        $createdUser = User::where('email', 'sara.reception@tebiby.com')->first();
        $this->assertNotNull($createdUser);
        $this->assertEquals('سارة الشمري', $createdUser->name);
        $this->assertTrue(Hash::check('secret123', $createdUser->password));

        $this->assertDatabaseHas('role_assignments', [
            'user_id' => $createdUser->id,
            'role' => 'receptionist',
            'scope_type' => 'facility',
            'scope_id' => $facility->id,
        ]);
    }

    public function test_facility_admin_can_assign_existing_user_as_receptionist(): void
    {
        $facilityAdmin = User::where('email', 'olaya.admin@tebiby.com')->firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();

        $existingUser = User::create([
            'name' => 'محمد القحطاني',
            'email' => 'mohammed.existing@example.com',
            'phone' => '+966550001122',
            'password' => Hash::make('password123'),
            'role' => 'patient',
        ]);

        $response = $this->actingAs($facilityAdmin)
            ->post('/facility/receptionists', [
                'mode' => 'existing',
                'facility_id' => $facility->id,
                'user_id' => $existingUser->id,
            ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('role_assignments', [
            'user_id' => $existingUser->id,
            'role' => 'receptionist',
            'scope_type' => 'facility',
            'scope_id' => $facility->id,
        ]);
    }

    public function test_facility_admin_can_update_receptionist(): void
    {
        $facilityAdmin = User::where('email', 'olaya.admin@tebiby.com')->firstOrFail();
        $receptionistUser = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();
        $assignment = RoleAssignment::where('user_id', $receptionistUser->id)
            ->where('role', 'receptionist')
            ->firstOrFail();

        $response = $this->actingAs($facilityAdmin)
            ->put("/facility/receptionists/{$assignment->id}", [
                'name' => 'خالد الدوسري (معدل)',
                'email' => 'reception.olaya.updated@tebiby.com',
                'phone' => '+966559998888',
                'national_id' => '1099887766',
                'password' => 'newpassword123',
            ]);

        $response->assertSessionHas('success');

        $receptionistUser->refresh();
        $this->assertEquals('خالد الدوسري (معدل)', $receptionistUser->name);
        $this->assertEquals('reception.olaya.updated@tebiby.com', $receptionistUser->email);
        $this->assertTrue(Hash::check('newpassword123', $receptionistUser->password));
    }

    public function test_facility_admin_can_destroy_receptionist(): void
    {
        $facilityAdmin = User::where('email', 'olaya.admin@tebiby.com')->firstOrFail();
        $receptionistUser = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();
        $assignment = RoleAssignment::where('user_id', $receptionistUser->id)
            ->where('role', 'receptionist')
            ->firstOrFail();

        $assignmentId = $assignment->id;

        $response = $this->actingAs($facilityAdmin)
            ->delete("/facility/receptionists/{$assignmentId}");

        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('role_assignments', [
            'id' => $assignmentId,
        ]);
    }

    public function test_facility_admin_cannot_manage_receptionist_of_another_facility(): void
    {
        // Admin of Olaya facility
        $olayaAdmin = User::where('email', 'olaya.admin@tebiby.com')->firstOrFail();

        // Receptionist belonging to Qurtubah facility (Mouwasat)
        $qurtubahReceptionist = User::where('email', 'reception.qurtubah@tebiby.com')->firstOrFail();
        $qurtubahAssignment = RoleAssignment::where('user_id', $qurtubahReceptionist->id)
            ->where('role', 'receptionist')
            ->firstOrFail();

        // Attempting to update or delete Qurtubah receptionist by Olaya admin must fail
        $response = $this->actingAs($olayaAdmin)
            ->delete("/facility/receptionists/{$qurtubahAssignment->id}");

        $response->assertForbidden();
    }

    public function test_receptionist_cannot_add_doctors(): void
    {
        $receptionist = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();

        $response = $this->actingAs($receptionist)
            ->post('/facility/doctors', [
                'mode' => 'new',
                'facility_id' => $facility->id,
                'name' => 'د. حسام العمري',
                'email' => 'dr.hossam@example.com',
                'password' => 'secret123',
                'specialty_id' => 1,
                'title_ar' => 'استشاري',
                'consultation_fee' => 200,
            ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('users', ['email' => 'dr.hossam@example.com']);
    }

    public function test_receptionist_cannot_update_doctors(): void
    {
        $receptionist = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();
        $doctor = \App\Models\DoctorProfile::firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();

        $response = $this->actingAs($receptionist)
            ->put("/facility/doctors/{$doctor->id}", [
                'facility_id' => $facility->id,
                'name' => 'اسم معدل',
                'email' => $doctor->user->email,
                'specialty_id' => $doctor->specialty_id,
                'title_ar' => 'استشاري أول',
                'consultation_fee' => 500,
            ]);

        $response->assertForbidden();
    }

    public function test_receptionist_cannot_destroy_doctors(): void
    {
        $receptionist = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();
        $doctor = \App\Models\DoctorProfile::firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();

        $response = $this->actingAs($receptionist)
            ->delete("/facility/doctors/{$doctor->id}", [
                'facility_id' => $facility->id,
            ]);

        $response->assertForbidden();
    }

    public function test_receptionist_cannot_access_specialties(): void
    {
        $receptionist = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();

        $response = $this->actingAs($receptionist)
            ->get('/facility/specialties');

        $response->assertForbidden();
    }

    public function test_receptionist_can_manage_patient_queue_and_confirm_arrival(): void
    {
        $receptionist = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();
        $doctor = \App\Models\DoctorProfile::where('clinic_id', $facility->id)->firstOrFail();

        // 1. Receptionist can issue walk-in ticket (patient دور)
        $walkinResponse = $this->actingAs($receptionist)
            ->post("/facility/{$facility->id}/walkin-ticket", [
                'doctor_profile_id' => $doctor->id,
                'patient_name' => 'مريض مباشر بالاستقبال',
                'patient_phone' => '+966555112233',
            ]);

        $walkinResponse->assertSessionHas('success');

        $appointment = \App\Models\Appointment::latest('id')->firstOrFail();
        $this->assertEquals('waiting', $appointment->status);

        // 2. Receptionist can confirm arrival (check-in)
        $appointment->update(['status' => 'confirmed']);
        $checkInResponse = $this->actingAs($receptionist)
            ->post("/facility/appointments/{$appointment->id}/check-in");

        $checkInResponse->assertSessionHas('success');
        $appointment->refresh();
        $this->assertEquals('waiting', $appointment->status);

        // 3. Receptionist can manage status (calling, in_consultation, etc.)
        $statusResponse = $this->actingAs($receptionist)
            ->post("/facility/appointments/{$appointment->id}/status", [
                'status' => 'in_consultation',
            ]);

        $statusResponse->assertSessionHas('success');
        $appointment->refresh();
        $this->assertEquals('in_consultation', $appointment->status);
    }

    public function test_receptionist_can_toggle_doctor_available_slots_presence(): void
    {
        $receptionist = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();
        $doctor = \App\Models\DoctorProfile::where('clinic_id', $facility->id)->firstOrFail();

        $originalState = $doctor->is_available_today;

        $response = $this->actingAs($receptionist)
            ->post("/facility/doctors/{$doctor->id}/toggle-presence");

        $response->assertSessionHas('success');
        $doctor->refresh();
        $this->assertEquals(! $originalState, $doctor->is_available_today);
    }
}

