<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\DoctorFacility;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\Group;
use App\Models\RoleAssignment;
use App\Models\User;
use App\Services\ScopeResolver;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiTenantHierarchyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_group_contains_multiple_facilities(): void
    {
        $habeebGroup = Group::where('slug', 'habeeb-medical-group')->first();
        $this->assertNotNull($habeebGroup);
        $this->assertGreaterThanOrEqual(2, $habeebGroup->facilities()->count());

        $hospital = $habeebGroup->hospitals()->first();
        $this->assertNotNull($hospital);
        $this->assertEquals('hospital', $hospital->type);

        $clinic = $habeebGroup->clinics()->first();
        $this->assertNotNull($clinic);
        $this->assertEquals('clinic', $clinic->type);
    }

    public function test_scope_resolver_group_admin_access(): void
    {
        $habeebAdmin = User::where('email', 'habeeb.admin@tebiby.com')->first();
        $this->assertNotNull($habeebAdmin);

        $resolver = new ScopeResolver();
        $accessibleFacilities = $resolver->accessibleFacilityIds($habeebAdmin);

        $habeebGroup = Group::where('slug', 'habeeb-medical-group')->first();
        $expectedFacilityIds = $habeebGroup->facilities()->pluck('id');

        foreach ($expectedFacilityIds as $id) {
            $this->assertTrue($accessibleFacilities->contains($id));
            $this->assertTrue($resolver->canManageFacility($habeebAdmin, $id));
        }

        // Mouwasat facilities should NOT be manageable by Habeeb admin
        $mouwasatFacility = Facility::where('name', 'like', '%المواساة%')->first();
        if ($mouwasatFacility) {
            $this->assertFalse($resolver->canManageFacility($habeebAdmin, $mouwasatFacility->id));
        }
    }

    public function test_scope_resolver_facility_admin_access(): void
    {
        $olayaAdmin = User::where('email', 'olaya.admin@tebiby.com')->first();
        $this->assertNotNull($olayaAdmin);

        $resolver = new ScopeResolver();
        $accessibleFacilities = $resolver->accessibleFacilityIds($olayaAdmin);

        $olayaFacility = Facility::where('name', 'like', '%العليا%')->first();
        $this->assertTrue($accessibleFacilities->contains($olayaFacility->id));
        $this->assertTrue($resolver->canManageFacility($olayaAdmin, $olayaFacility->id));

        // Other facility should NOT be manageable
        $otherFacility = Facility::where('name', 'like', '%الصحافة%')->first();
        if ($otherFacility) {
            $this->assertFalse($resolver->canManageFacility($olayaAdmin, $otherFacility->id));
        }
    }

    public function test_doctor_can_work_at_multiple_facilities_with_independent_fees(): void
    {
        $doctorUser = User::where('email', 'dr.shammary@tebiby.com')->first();
        $doctor = $doctorUser->doctorProfile;

        $assignments = $doctor->doctorFacilities()->with('facility')->get();
        $this->assertGreaterThanOrEqual(2, $assignments->count());

        $facility1Assignment = $assignments->firstWhere('facility.type', 'hospital');
        $facility2Assignment = $assignments->firstWhere('facility.type', 'clinic');

        $this->assertNotNull($facility1Assignment);
        $this->assertNotNull($facility2Assignment);
        $this->assertNotEquals($facility1Assignment->facility_id, $facility2Assignment->facility_id);

        // Different consultation fees
        $this->assertEquals(250.00, (float) $facility1Assignment->consultation_fee);
        $this->assertEquals(200.00, (float) $facility2Assignment->consultation_fee);
    }

    public function test_appointment_and_queue_ticket_linked_to_doctor_facility(): void
    {
        $appt = Appointment::where('booking_reference', 'TB-78210')->first();
        $this->assertNotNull($appt);
        $this->assertNotNull($appt->facility_id);
        $this->assertNotNull($appt->doctor_facility_id);

        $ticket = $appt->queueTicket;
        $this->assertNotNull($ticket);
        $this->assertNotNull($ticket->doctor_facility_id);
        $this->assertEquals($appt->doctor_facility_id, $ticket->doctor_facility_id);
    }

    public function test_admin_can_create_group(): void
    {
        $admin = User::where('role', 'admin')->first();

        $response = $this->actingAs($admin)->post('/admin/groups', [
            'name_ar' => 'مجموعة السعودي الألماني الصحية',
            'name_en' => 'Saudi German Health Group',
            'cr_number' => '1010334455',
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('groups', [
            'name_ar' => 'مجموعة السعودي الألماني الصحية',
            'cr_number' => '1010334455',
        ]);
    }

    public function test_admin_can_create_group_with_admin_on_the_fly(): void
    {
        $admin = User::where('role', 'admin')->first();

        $response = $this->actingAs($admin)->post('/admin/groups', [
            'name_ar' => 'مجموعة دله الصحية',
            'name_en' => 'Dallah Healthcare Group',
            'cr_number' => '1010887766',
            'create_admin' => true,
            'admin_name' => 'طارق السديري',
            'admin_email' => 'tariq.dallah@tebiby.com',
            'admin_password' => 'password123',
            'admin_phone' => '+966551122334',
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('groups', ['name_ar' => 'مجموعة دله الصحية']);
        $this->assertDatabaseHas('users', ['email' => 'tariq.dallah@tebiby.com']);

        $group = Group::where('name_ar', 'مجموعة دله الصحية')->first();
        $user = User::where('email', 'tariq.dallah@tebiby.com')->first();

        $this->assertDatabaseHas('role_assignments', [
            'user_id' => $user->id,
            'role' => 'group_admin',
            'scope_type' => 'group',
            'scope_id' => $group->id,
        ]);

        $this->assertTrue($user->isGroupAdmin($group->id));
    }

    public function test_admin_can_assign_facility_admin_and_receptionist(): void
    {
        $admin = User::where('role', 'admin')->first();
        $facility = Facility::first();

        // Assign facility admin
        $response = $this->actingAs($admin)->post('/admin/role-assignments', [
            'role' => 'facility_admin',
            'scope_type' => 'facility',
            'scope_id' => $facility->id,
            'user_mode' => 'new',
            'new_name' => 'مدير الفرع التجريبي',
            'new_email' => 'branch.admin@tebiby.com',
            'new_password' => 'password123',
            'new_phone' => '+966509988776',
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('users', ['email' => 'branch.admin@tebiby.com']);
        $newAdmin = User::where('email', 'branch.admin@tebiby.com')->first();
        $this->assertTrue($newAdmin->isFacilityAdmin($facility->id));

        // Assign receptionist
        $response2 = $this->actingAs($admin)->post('/admin/role-assignments', [
            'role' => 'receptionist',
            'scope_type' => 'facility',
            'scope_id' => $facility->id,
            'user_mode' => 'new',
            'new_name' => 'موظف استقبال تجريبي',
            'new_email' => 'reception.new@tebiby.com',
            'new_password' => 'password123',
            'new_phone' => '+966509988777',
        ]);

        $response2->assertStatus(302);
        $newReception = User::where('email', 'reception.new@tebiby.com')->first();
        $this->assertTrue($newReception->isReceptionist($facility->id));
    }

    public function test_admin_can_assign_doctor_to_facility_with_custom_fee(): void
    {
        $admin = User::where('role', 'admin')->first();
        $doctor = DoctorProfile::first();
        $facility = Facility::where('id', '!=', $doctor->clinic_id)->first();

        $response = $this->actingAs($admin)->post('/admin/doctor-facilities', [
            'doctor_profile_id' => $doctor->id,
            'facility_id' => $facility->id,
            'consultation_fee' => 450.00,
            'default_slot_minutes' => 30,
            'accepts_insurance' => true,
            'is_active' => true,
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('doctor_facility', [
            'doctor_profile_id' => $doctor->id,
            'facility_id' => $facility->id,
            'consultation_fee' => 450.00,
            'default_slot_minutes' => 30,
        ]);
    }

    public function test_group_admin_can_view_group_dashboard(): void
    {
        $groupAdmin = User::where('email', 'habeeb.admin@tebiby.com')->first();
        $response = $this->actingAs($groupAdmin)->get('/group/dashboard');
        $response->assertStatus(200);

        $props = $response->viewData('page')['props'];
        $this->assertNotEmpty($props['group']);
        $this->assertNotEmpty($props['facilities']);
    }

    public function test_facility_admin_can_view_facility_dashboard_and_issue_walk_in(): void
    {
        $facilityAdmin = User::where('email', 'olaya.admin@tebiby.com')->first();
        $response = $this->actingAs($facilityAdmin)->get('/facility/dashboard');
        $response->assertStatus(200);

        $facility = Facility::where('name', 'like', '%العليا%')->first();
        $doctor = DoctorProfile::first();

        // Issue walk in ticket
        $response2 = $this->actingAs($facilityAdmin)->post("/facility/{$facility->id}/walkin-ticket", [
            'doctor_profile_id' => $doctor->id,
            'patient_name' => 'مراجع فحص مستعجل',
            'patient_phone' => '0555998811',
            'patient_national_id' => '1029384751',
        ]);

        $response2->assertStatus(302);
        $this->assertDatabaseHas('appointments', [
            'facility_id' => $facility->id,
            'doctor_id' => $doctor->id,
            'status' => 'waiting',
        ]);
    }

    public function test_group_admin_can_add_doctor_to_group(): void
    {
        $groupAdmin = User::where('email', 'habeeb.admin@tebiby.com')->first();
        $group = Group::where('slug', 'habeeb-medical-group')->first();
        $facility = $group->facilities()->first();
        $specialty = \App\Models\Specialty::first();

        $response = $this->actingAs($groupAdmin)->post("/group/{$group->id}/doctors", [
            'name' => 'د. ماجد السبيعي',
            'email' => 'dr.majed@habeeb.com',
            'phone' => '0555112233',
            'password' => 'password123',
            'facility_id' => $facility->id,
            'specialty_id' => $specialty->id,
            'title_ar' => 'استشاري جراحة المخ والأعصاب',
            'subspecialty' => 'جراحة أورام المخ والعمود الفقري',
            'consultation_fee' => 350.00,
            'waiting_time_minutes' => 20,
            'experience_years' => 12,
            'accepts_insurance' => true,
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('users', ['email' => 'dr.majed@habeeb.com', 'role' => 'doctor']);
        $newDoctorUser = User::where('email', 'dr.majed@habeeb.com')->first();
        $this->assertNotNull($newDoctorUser->doctorProfile);
        $this->assertEquals(350.00, (float) $newDoctorUser->doctorProfile->consultation_fee);
        $this->assertEquals($facility->id, $newDoctorUser->doctorProfile->clinic_id);
    }

    public function test_admin_can_add_doctor_centrally(): void
    {
        $admin = User::where('role', 'admin')->first();
        $facility = Facility::first();
        $specialty = \App\Models\Specialty::first();

        $response = $this->actingAs($admin)->post('/admin/doctors', [
            'name' => 'د. نورة الشهري',
            'email' => 'dr.noura@tebiby.com',
            'phone' => '0555990011',
            'password' => 'password123',
            'facility_id' => $facility->id,
            'specialty_id' => $specialty->id,
            'title_ar' => 'استشارية طب وجراحة العيون',
            'subspecialty' => 'تصحيح الإبصار بالليزك',
            'consultation_fee' => 280.00,
            'waiting_time_minutes' => 15,
            'experience_years' => 8,
            'accepts_insurance' => true,
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('users', ['email' => 'dr.noura@tebiby.com', 'role' => 'doctor']);
        $newDoctorUser = User::where('email', 'dr.noura@tebiby.com')->first();
        $this->assertNotNull($newDoctorUser->doctorProfile);
        $this->assertEquals(280.00, (float) $newDoctorUser->doctorProfile->consultation_fee);
    }
}

