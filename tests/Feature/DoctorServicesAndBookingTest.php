<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\DoctorService;
use App\Models\Group;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\TebibySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DoctorServicesAndBookingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TebibySeeder::class);
    }

    public function test_doctor_can_manage_custom_services_crud_and_300_minute_procedure(): void
    {
        $doctorUser = User::where('role', 'doctor')->firstOrFail();
        $doctor = $doctorUser->doctorProfile;

        $this->actingAs($doctorUser)
            ->get('/doctor/services')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('doctor/services')
                ->has('services')
            );

        // Create a 300-minute (5 hours) service
        $this->actingAs($doctorUser)
            ->post('/doctor/services', [
                'name' => 'خلع ضرس جراحي معقد',
                'description' => 'إجراء جراحي شامل يستغرق 5 ساعات',
                'price' => 1250,
                'duration_minutes' => 300,
                'is_active' => true,
            ])
            ->assertRedirect();

        $service = DoctorService::where('doctor_profile_id', $doctor->id)
            ->where('name', 'خلع ضرس جراحي معقد')
            ->first();

        $this->assertNotNull($service);
        $this->assertEquals(1250.00, (float) $service->price);
        $this->assertEquals(300, $service->duration_minutes);
        $this->assertTrue($service->is_active);

        // Update service
        $this->actingAs($doctorUser)
            ->put("/doctor/services/{$service->id}", [
                'name' => 'خلع ضرس جراحي مطول',
                'description' => 'تحديث المدة والسعر',
                'price' => 1400,
                'duration_minutes' => 360,
                'is_active' => true,
            ])
            ->assertRedirect();

        $service->refresh();
        $this->assertEquals('خلع ضرس جراحي مطول', $service->name);
        $this->assertEquals(1400.00, (float) $service->price);
        $this->assertEquals(360, $service->duration_minutes);

        // Toggle active status
        $this->actingAs($doctorUser)
            ->post("/doctor/services/{$service->id}/toggle")
            ->assertRedirect();

        $service->refresh();
        $this->assertFalse($service->is_active);

        // Delete service
        $this->actingAs($doctorUser)
            ->delete("/doctor/services/{$service->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('doctor_services', ['id' => $service->id]);
    }

    public function test_authorization_blocks_other_doctors_and_patients_from_managing_services(): void
    {
        $doctorUsers = User::where('role', 'doctor')->take(2)->get();
        $this->assertCount(2, $doctorUsers);

        $ownerUser = $doctorUsers[0];
        $otherDoctorUser = $doctorUsers[1];
        $patientUser = User::where('role', 'patient')->firstOrFail();

        $service = $ownerUser->doctorProfile->services()->firstOrFail();

        // Patient cannot access /doctor/services or create services
        $this->actingAs($patientUser)->get('/doctor/services')->assertRedirect('/patient/portal');
        $this->actingAs($patientUser)->getJson('/doctor/services')->assertStatus(403);
        $this->actingAs($patientUser)->post('/doctor/services', [
            'name' => 'محاولة غير مصرح بها',
            'price' => 100,
            'duration_minutes' => 30,
        ])->assertRedirect('/patient/portal');
        $this->assertDatabaseMissing('doctor_services', ['name' => 'محاولة غير مصرح بها']);

        // Another doctor cannot update, toggle, or delete owner's service
        $this->actingAs($otherDoctorUser)
            ->put("/doctor/services/{$service->id}", [
                'name' => 'تعديل غير مصرح',
                'price' => 999,
                'duration_minutes' => 45,
            ])
            ->assertStatus(403);

        $this->actingAs($otherDoctorUser)
            ->post("/doctor/services/{$service->id}/toggle")
            ->assertStatus(403);

        $this->actingAs($otherDoctorUser)
            ->delete("/doctor/services/{$service->id}")
            ->assertStatus(403);
    }

    public function test_public_pages_expose_only_active_services_and_search_matches_service_name(): void
    {
        $doctor = DoctorProfile::firstOrFail();

        $activeService = DoctorService::create([
            'doctor_profile_id' => $doctor->id,
            'name' => 'إجراء زرع نادر مخصص',
            'price' => 2500,
            'duration_minutes' => 180,
            'is_active' => true,
            'sort_order' => 99,
        ]);

        $inactiveService = DoctorService::create([
            'doctor_profile_id' => $doctor->id,
            'name' => 'خدمة مخفية تماماً',
            'price' => 900,
            'duration_minutes' => 60,
            'is_active' => false,
            'sort_order' => 100,
        ]);

        // Home page exposes active_services and excludes inactive ones
        $this->get('/')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('home')
                ->has('doctors.0.active_services')
            );

        // Doctors search matches service name and excludes inactive services from payload
        $this->get('/doctors?search=' . urlencode('إجراء زرع نادر مخصص'))
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('doctors')
                ->has('doctors', 1)
                ->where('doctors.0.id', $doctor->id)
                ->where('doctors.0.active_services', function ($services) use ($activeService, $inactiveService) {
                    $ids = collect($services)->pluck('id')->all();
                    return in_array($activeService->id, $ids, true)
                        && ! in_array($inactiveService->id, $ids, true);
                })
            );

        // Group landing page also exposes active_services
        $group = Group::firstOrFail();
        $this->get("/group/{$group->slug}")
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('group/public-landing')
                ->has('doctors.0.active_services')
            );
    }

    public function test_booking_with_service_saves_snapshot_calculates_price_and_blocks_overlaps(): void
    {
        $doctor = DoctorProfile::firstOrFail();
        $doctor->update([
            'slot_auto_confirm_limit' => 1,
            'slot_waitlist_limit' => 0,
        ]);
        $futureDate = Carbon::today()->addDays(10)->toDateString();

        $longService = DoctorService::create([
            'doctor_profile_id' => $doctor->id,
            'name' => 'خلع ضرس جراحي 5 ساعات',
            'price' => 1000,
            'duration_minutes' => 300,
            'is_active' => true,
            'sort_order' => 10,
        ]);

        $shortService = DoctorService::create([
            'doctor_profile_id' => $doctor->id,
            'name' => 'كشف متابعة سريع',
            'price' => 150,
            'duration_minutes' => 30,
            'is_active' => true,
            'sort_order' => 11,
        ]);

        // 1. Book the 300-minute service at 16:00 (16:00 -> 21:00)
        $response = $this->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'doctor_service_id' => $longService->id,
            'patient_name' => 'خالد منصور السبيعي',
            'patient_phone' => '0551122334',
            'patient_national_id' => '1088776655',
            'appointment_date' => $futureDate,
            'appointment_time' => '16:00:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ]);

        $response->assertStatus(302);

        $appt = Appointment::latest('id')->firstOrFail();
        $this->assertEquals($longService->id, $appt->doctor_service_id);
        $this->assertEquals('خلع ضرس جراحي 5 ساعات', $appt->service_name);
        $this->assertEquals(300, $appt->duration_minutes);
        $this->assertEquals(1000.00, (float) $appt->consultation_fee);
        $this->assertEquals(150.00, (float) $appt->tax);
        $this->assertEquals(1150.00, (float) $appt->total_amount);

        // 2. Booked slots endpoint returns 16:00 -> 21:00 interval (960 -> 1260)
        $this->getJson("/api/doctors/{$doctor->id}/booked-slots?date={$futureDate}")
            ->assertStatus(200)
            ->assertJsonPath('date', $futureDate)
            ->assertJsonCount(1, 'booked_intervals')
            ->assertJsonPath('booked_intervals.0.start_minutes', 960)
            ->assertJsonPath('booked_intervals.0.end_minutes', 1260)
            ->assertJsonPath('booked_intervals.0.duration_minutes', 300);

        // 3. Overlapping booking at 18:00 must be rejected with validation error on appointment_time
        $patient2 = User::where('role', 'patient')->firstOrFail();
        $this->actingAs($patient2)
            ->post('/appointments/book', [
                'doctor_id' => $doctor->id,
                'doctor_service_id' => $shortService->id,
                'patient_name' => 'فهد القحطاني',
                'patient_phone' => '0554433221',
                'patient_national_id' => '1077665544',
                'appointment_date' => $futureDate,
                'appointment_time' => '18:00:00',
                'payment_method' => 'at_clinic',
                'notify_whatsapp' => false,
            ])
            ->assertSessionHasErrors('appointment_time');

        // 4. Non-overlapping booking at 09:00 must succeed
        $this->actingAs($patient2)
            ->post('/appointments/book', [
                'doctor_id' => $doctor->id,
                'doctor_service_id' => $shortService->id,
                'patient_name' => 'فهد القحطاني',
                'patient_phone' => '0554433221',
                'patient_national_id' => '1077665544',
                'appointment_date' => $futureDate,
                'appointment_time' => '09:00:00',
                'payment_method' => 'at_clinic',
                'notify_whatsapp' => false,
            ])
            ->assertStatus(302)
            ->assertSessionHasNoErrors();

        // 5. Cancelled appointment must be ignored by booked-slots endpoint
        $appt->update(['status' => 'cancelled']);

        $this->getJson("/api/doctors/{$doctor->id}/booked-slots?date={$futureDate}")
            ->assertStatus(200)
            ->assertJsonCount(1, 'booked_intervals')
            ->assertJsonPath('booked_intervals.0.start_minutes', 540);
    }

    public function test_booking_rejects_inactive_or_other_doctors_service_and_supports_legacy_booking(): void
    {
        $doctors = DoctorProfile::take(2)->get();
        $this->assertCount(2, $doctors);

        $doctorA = $doctors[0];
        $doctorB = $doctors[1];

        $otherDoctorService = $doctorB->services()->firstOrFail();

        $inactiveService = DoctorService::create([
            'doctor_profile_id' => $doctorA->id,
            'name' => 'خدمة غير مفعلة',
            'price' => 300,
            'duration_minutes' => 30,
            'is_active' => false,
        ]);

        $futureDate = Carbon::today()->addDays(12)->toDateString();

        // Reject service belonging to another doctor
        $this->post('/appointments/book', [
            'doctor_id' => $doctorA->id,
            'doctor_service_id' => $otherDoctorService->id,
            'patient_name' => 'ناصر العتيبي',
            'patient_phone' => '0559900112',
            'appointment_date' => $futureDate,
            'appointment_time' => '10:00:00',
            'payment_method' => 'at_clinic',
        ])->assertSessionHasErrors('doctor_service_id');

        // Reject inactive service
        $this->post('/appointments/book', [
            'doctor_id' => $doctorA->id,
            'doctor_service_id' => $inactiveService->id,
            'patient_name' => 'ناصر العتيبي',
            'patient_phone' => '0559900112',
            'appointment_date' => $futureDate,
            'appointment_time' => '10:30:00',
            'payment_method' => 'at_clinic',
        ])->assertSessionHasErrors('doctor_service_id');

        // Legacy booking without doctor_service_id still succeeds cleanly
        $this->post('/appointments/book', [
            'doctor_id' => $doctorA->id,
            'patient_name' => 'ناصر العتيبي',
            'patient_phone' => '0559900112',
            'appointment_date' => $futureDate,
            'appointment_time' => '11:00:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertStatus(302)->assertSessionHasNoErrors();

        $legacyAppt = Appointment::latest('id')->firstOrFail();
        $this->assertNull($legacyAppt->doctor_service_id);
        $this->assertEquals('كشف استشاري', $legacyAppt->service_name);
        $this->assertEquals((float) $doctorA->consultation_fee, (float) $legacyAppt->consultation_fee);
    }
}
