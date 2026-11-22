<?php

namespace Tests\Feature\Connect;

use App\Models\ConnectCredential;
use App\Models\DoctorFacility;
use App\Models\DoctorProfile;
use App\Models\DoctorService;
use App\Models\Facility;
use App\Models\Group;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    private function createGroupAndCredential(array $scopes = ['*' => ['*']]): array
    {
        $group = Group::factory()->create(['name_ar' => 'مجموعة النخبة الطبية']);
        $keys = ConnectCredential::generateKeyPair('sandbox');

        $credential = ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $group->id,
            'integration_name' => 'Catalog Test Partner',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => $scopes,
            'status' => 'active',
            'expires_at' => now()->addMonth(),
        ]);

        return [$group, $credential, $keys];
    }

    public function test_branches_endpoint_returns_only_authorized_facilities_for_credential(): void
    {
        [$groupA, $credA, $keysA] = $this->createGroupAndCredential();
        $groupB = Group::factory()->create();

        $facilityA1 = Facility::factory()->create(['group_id' => $groupA->id, 'name' => 'فرع النخيل']);
        $facilityA2 = Facility::factory()->create(['group_id' => $groupA->id, 'name' => 'فرع العليا']);
        $facilityB1 = Facility::factory()->create(['group_id' => $groupB->id, 'name' => 'فرع خارج المجموعة']);

        // Test with Bearer SK
        $response = $this->withHeader('Authorization', 'Bearer ' . $keysA['sk'])
            ->getJson(route('connect.branches.index'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name_ar', 'city', 'district', 'phone', 'is_active'],
            ],
        ]);

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertContains($facilityA1->id, $ids);
        $this->assertContains($facilityA2->id, $ids);
        $this->assertNotContains($facilityB1->id, $ids);

        // Test alias /facilities
        $aliasResponse = $this->withHeader('Authorization', 'Bearer ' . $keysA['sk'])
            ->getJson(route('connect.facilities.index'));
        $aliasResponse->assertStatus(200);
        $this->assertEquals($response->json(), $aliasResponse->json());
    }

    public function test_branches_endpoint_accessible_via_publishable_key(): void
    {
        [$group, $cred, $keys] = $this->createGroupAndCredential();
        $facility = Facility::factory()->create(['group_id' => $group->id]);

        $response = $this->withHeader('X-Publishable-Key', $keys['pk'])
            ->getJson(route('connect.branches.index'));

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_specialties_endpoint_returns_active_specialties_for_facility(): void
    {
        [$group, $cred, $keys] = $this->createGroupAndCredential();
        $facility = Facility::factory()->create(['group_id' => $group->id]);

        $specialtyDentistry = Specialty::factory()->create(['name_ar' => 'طب الأسنان']);
        $specialtyCardio = Specialty::factory()->create(['name_ar' => 'أمراض القلب']);
        $specialtyEmpty = Specialty::factory()->create(['name_ar' => 'تخصص بدون أطباء']);

        $doctorUser = User::factory()->create(['name' => 'د. حسام الأسنان', 'role' => 'doctor']);
        $doctor = DoctorProfile::factory()->create([
            'user_id' => $doctorUser->id,
            'specialty_id' => $specialtyDentistry->id,
            'clinic_id' => $facility->id,
            'approval_status' => 'approved',
            'is_available_today' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->getJson(route('connect.specialties.index', ['facility_id' => $facility->id]));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name_ar'],
            ],
        ]);

        $data = $response->json('data');
        $specialtyNames = collect($data)->pluck('name_ar');
        $this->assertContains('طب الأسنان', $specialtyNames);
        $this->assertNotContains('تخصص بدون أطباء', $specialtyNames);
    }

    public function test_specialties_returns_404_if_facility_outside_group_scope(): void
    {
        [$groupA, $credA, $keysA] = $this->createGroupAndCredential();
        $groupB = Group::factory()->create();
        $facilityB = Facility::factory()->create(['group_id' => $groupB->id]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $keysA['sk'])
            ->getJson(route('connect.specialties.index', ['facility_id' => $facilityB->id]));

        $response->assertStatus(404);
        $response->assertJson(['code' => 'ERR_RESOURCE_NOT_FOUND']);
    }

    public function test_doctors_endpoint_returns_doctors_and_supports_specialty_filter(): void
    {
        [$group, $cred, $keys] = $this->createGroupAndCredential();
        $facility = Facility::factory()->create(['group_id' => $group->id]);

        $specA = Specialty::factory()->create(['name_ar' => 'الجلدية']);
        $specB = Specialty::factory()->create(['name_ar' => 'العيون']);

        $user1 = User::factory()->create(['name' => 'د. سارة الجلدية', 'role' => 'doctor']);
        $doc1 = DoctorProfile::factory()->create([
            'user_id' => $user1->id,
            'specialty_id' => $specA->id,
            'clinic_id' => $facility->id,
            'title_ar' => 'استشارية جلدية',
            'approval_status' => 'approved',
            'is_available_today' => true,
        ]);

        $user2 = User::factory()->create(['name' => 'د. خالد العيون', 'role' => 'doctor']);
        $doc2 = DoctorProfile::factory()->create([
            'user_id' => $user2->id,
            'specialty_id' => $specB->id,
            'clinic_id' => $facility->id,
            'title_ar' => 'أخصائي عيون',
            'approval_status' => 'approved',
            'is_available_today' => true,
        ]);

        // Query all doctors at facility
        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->getJson(route('connect.doctors.list', ['facility_id' => $facility->id]));

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));

        // Filter by specialty A
        $filteredResponse = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->getJson(route('connect.doctors.list', ['facility_id' => $facility->id, 'specialty_id' => $specA->id]));

        $filteredResponse->assertStatus(200);
        $filteredData = $filteredResponse->json('data');
        $this->assertCount(1, $filteredData);
        $this->assertEquals('د. سارة الجلدية', $filteredData[0]['name_ar']);
        $this->assertEquals('استشارية جلدية', $filteredData[0]['title']);
        $this->assertEquals('الجلدية', $filteredData[0]['specialty_name']);
    }

    public function test_doctor_show_endpoint_returns_single_doctor_profile_and_validates_facility_scope(): void
    {
        [$group, $cred, $keys] = $this->createGroupAndCredential();
        $facility = Facility::factory()->create(['group_id' => $group->id]);

        $specialty = Specialty::factory()->create(['name_ar' => 'طب الأطفال']);
        $user = User::factory()->create(['name' => 'د. محمد علي', 'role' => 'doctor']);
        $doctor = DoctorProfile::factory()->create([
            'user_id' => $user->id,
            'specialty_id' => $specialty->id,
            'clinic_id' => $facility->id,
            'title_ar' => 'استشاري أول أطفال',
            'subspecialty' => 'حديثي الولادة',
            'bio' => 'خبرة 15 عاماً',
            'experience_years' => 15,
            'consultation_fee' => 250.00,
            'waiting_time_minutes' => 20,
            'approval_status' => 'approved',
            'is_available_today' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->getJson(route('connect.doctors.show', ['doctor_id' => $doctor->id, 'facility_id' => $facility->id]));

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals($doctor->id, $data['id']);
        $this->assertEquals('د. محمد علي', $data['name_ar']);
        $this->assertEquals('استشاري أول أطفال', $data['title']);
        $this->assertEquals('حديثي الولادة', $data['subspecialty']);
        $this->assertEquals('طب الأطفال', $data['specialty_name']);
        $this->assertEquals(20, $data['waiting_time_minutes']);
    }

    public function test_doctor_services_returns_services_and_accurate_vat_calculation(): void
    {
        [$group, $cred, $keys] = $this->createGroupAndCredential();
        $facility = Facility::factory()->create(['group_id' => $group->id]);

        $doctor = DoctorProfile::factory()->create([
            'clinic_id' => $facility->id,
            'consultation_fee' => 200.00,
        ]);

        // Service 1: 300 SAR
        DoctorService::create([
            'doctor_profile_id' => $doctor->id,
            'name' => 'كشف استشاري متقدم',
            'price' => 300.00,
            'duration_minutes' => 30,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Service 2: 100 SAR
        DoctorService::create([
            'doctor_profile_id' => $doctor->id,
            'name' => 'استشارة متابعة',
            'price' => 100.00,
            'duration_minutes' => 15,
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->getJson(route('connect.doctors.services', ['doctor_id' => $doctor->id, 'facility_id' => $facility->id]));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name_ar', 'base_fee', 'vat_rate', 'vat_amount', 'total_fee'],
            ],
        ]);

        $services = $response->json('data');
        $this->assertCount(2, $services);

        $first = $services[0];
        $this->assertEquals('كشف استشاري متقدم', $first['name_ar']);
        $this->assertEquals(300.00, $first['base_fee']);
        $this->assertEquals(0.15, $first['vat_rate']);
        $this->assertEquals(45.00, $first['vat_amount']);
        $this->assertEquals(345.00, $first['total_fee']);
    }

    public function test_doctor_services_returns_empty_list_when_no_active_services_defined(): void
    {
        [$group, $cred, $keys] = $this->createGroupAndCredential();
        $facility = Facility::factory()->create(['group_id' => $group->id]);

        $doctor = DoctorProfile::factory()->create([
            'clinic_id' => $facility->id,
            'consultation_fee' => 240.00,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->getJson(route('connect.doctors.services', ['doctor_id' => $doctor->id, 'facility_id' => $facility->id]));

        $response->assertStatus(200);
        $this->assertEquals([], $response->json('data'));
    }

    public function test_catalog_endpoints_strict_allowlist_contract_and_zero_tier3_leakage(): void
    {
        [$group, $cred, $keys] = $this->createGroupAndCredential();
        $facility = Facility::factory()->create(['group_id' => $group->id]);
        $specialty = Specialty::factory()->create(['name_ar' => 'طب الأطفال']);

        $user = User::factory()->create(['name' => 'د. محمد علي', 'role' => 'doctor']);
        $doctor = DoctorProfile::factory()->create([
            'user_id' => $user->id,
            'specialty_id' => $specialty->id,
            'clinic_id' => $facility->id,
            'title_ar' => 'استشاري أول أطفال',
            'subspecialty' => 'حديثي الولادة',
            'bio' => 'طبيب استشاري أطفال',
            'experience_years' => 12,
            'consultation_fee' => 200.00,
            'waiting_time_minutes' => 15,
            'approval_status' => 'approved',
            'is_available_today' => true,
        ]);

        DoctorService::create([
            'doctor_profile_id' => $doctor->id,
            'name' => 'كشف أطفال',
            'price' => 200.00,
            'is_active' => true,
        ]);

        $headers = ['Authorization' => 'Bearer ' . $keys['sk']];

        // 1. Branches Allowlist Contract
        $resBranches = $this->withHeaders($headers)->getJson(route('connect.branches.index'));
        $resBranches->assertStatus(200);
        $branchesItem = $resBranches->json('data.0');
        $this->assertEqualsCanonicalizing(
            ['id', 'name_ar', 'city', 'district', 'phone', 'is_active'],
            array_keys($branchesItem)
        );

        // 2. Specialties Allowlist Contract
        $resSpecialties = $this->withHeaders($headers)->getJson(route('connect.specialties.index', ['facility_id' => $facility->id]));
        $resSpecialties->assertStatus(200);
        $specialtiesItem = $resSpecialties->json('data.0');
        $this->assertEqualsCanonicalizing(
            ['id', 'name_ar'],
            array_keys($specialtiesItem)
        );

        // 3. Doctors List Allowlist Contract
        $resDoctors = $this->withHeaders($headers)->getJson(route('connect.doctors.list', ['facility_id' => $facility->id]));
        $resDoctors->assertStatus(200);
        $doctorsItem = $resDoctors->json('data.0');
        $this->assertEqualsCanonicalizing(
            ['id', 'name_ar', 'title', 'specialty_id', 'specialty_name', 'photo_url'],
            array_keys($doctorsItem)
        );

        // 4. Doctor Show Allowlist Contract
        $resDocShow = $this->withHeaders($headers)->getJson(route('connect.doctors.show', ['doctor_id' => $doctor->id, 'facility_id' => $facility->id]));
        $resDocShow->assertStatus(200);
        $docShowData = $resDocShow->json('data');
        $this->assertEqualsCanonicalizing(
            ['id', 'name_ar', 'title', 'subspecialty', 'bio', 'experience_years', 'specialty_id', 'specialty_name', 'waiting_time_minutes', 'photo_url'],
            array_keys($docShowData)
        );

        // 5. Doctor Services Allowlist Contract
        $resServices = $this->withHeaders($headers)->getJson(route('connect.doctors.services', ['doctor_id' => $doctor->id, 'facility_id' => $facility->id]));
        $resServices->assertStatus(200);
        $servicesItem = $resServices->json('data.0');
        $this->assertEqualsCanonicalizing(
            ['id', 'name_ar', 'base_fee', 'vat_rate', 'vat_amount', 'total_fee'],
            array_keys($servicesItem)
        );

        // Strict verification: zero clinical or private fields leaked across all responses
        $allPayloads = json_encode([$resBranches->json(), $resSpecialties->json(), $resDoctors->json(), $resDocShow->json(), $resServices->json()]);
        $this->assertStringNotContainsString('email', $allPayloads);
        $this->assertStringNotContainsString('password', $allPayloads);
        $this->assertStringNotContainsString('medical_records', $allPayloads);
        $this->assertStringNotContainsString('prescriptions', $allPayloads);
        $this->assertStringNotContainsString('diagnosis', $allPayloads);
        $this->assertStringNotContainsString('patient_notes', $allPayloads);
    }
}

