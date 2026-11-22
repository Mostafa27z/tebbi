<?php

namespace Tests\Feature\Connect;

use App\Models\Appointment;
use App\Models\ConnectAppointmentLink;
use App\Models\ConnectBookingIntent;
use App\Models\ConnectCredential;
use App\Models\ConnectIdempotencyKey;
use App\Models\DoctorFacility;
use App\Models\DoctorProfile;
use App\Models\DoctorSchedule;
use App\Models\DoctorService;
use App\Models\Facility;
use App\Models\Group;
use App\Models\Specialty;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    protected Group $group;
    protected Facility $facility;
    protected Specialty $specialty;
    protected User $doctorUser;
    protected DoctorProfile $doctor;
    protected DoctorFacility $doctorFacility;
    protected DoctorService $service;
    protected DoctorSchedule $schedule;
    protected ConnectCredential $credential;
    protected string $secretKey;
    protected string $futureDate;

    protected function setUp(): void
    {
        parent::setUp();

        $this->group = Group::factory()->create();
        $this->facility = Facility::factory()->create([
            'group_id' => $this->group->id,
            'is_active' => true,
        ]);
        $this->specialty = Specialty::factory()->create(['name_ar' => 'طب وجراحة الأسنان']);

        $this->doctorUser = User::factory()->create([
            'name' => 'د. أحمد الشمري',
            'role' => 'doctor',
        ]);

        $this->doctor = DoctorProfile::factory()->create([
            'user_id' => $this->doctorUser->id,
            'specialty_id' => $this->specialty->id,
            'clinic_id' => $this->facility->id,
            'approval_status' => 'approved',
            'is_available_today' => true,
            'slot_auto_confirm_limit' => 1,
            'slot_waitlist_limit' => 1,
            'waiting_time_minutes' => 15,
        ]);

        $this->doctorFacility = DoctorFacility::firstOrCreate([
            'doctor_profile_id' => $this->doctor->id,
            'facility_id' => $this->facility->id,
        ], [
            'consultation_fee' => 200,
            'default_slot_minutes' => 20,
            'accepts_insurance' => false,
            'is_active' => true,
        ]);

        $this->service = DoctorService::create([
            'doctor_profile_id' => $this->doctor->id,
            'name' => 'كشف استشاري تقويم أسنان',
            'price' => 200.00,
            'duration_minutes' => 30,
            'is_active' => true,
        ]);

        // Target next Wednesday to ensure fixed weekday
        $target = Carbon::now('Asia/Riyadh')->next(Carbon::WEDNESDAY);
        $this->futureDate = $target->toDateString();

        $this->schedule = DoctorSchedule::create([
            'doctor_profile_id' => $this->doctor->id,
            'doctor_facility_id' => $this->doctorFacility->id,
            'day_of_week' => $target->dayOfWeek,
            'start_time' => '16:00:00',
            'end_time' => '20:00:00',
            'slot_duration_minutes' => 30,
            'max_daily_patients' => 10,
            'is_active' => true,
        ]);

        $keys = ConnectCredential::generateKeyPair('sandbox');
        $this->secretKey = $keys['sk'];

        $this->credential = ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $this->group->id,
            'integration_name' => 'Test HIS Partner',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => [
                (string) $this->facility->id => ['read', 'book', 'cancel'],
            ],
            'status' => 'active',
        ]);
    }

    public function test_availability_endpoint_returns_slots_and_capacity_limits(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->secretKey)
            ->getJson("/connect/v1/doctors/{$this->doctor->id}/availability?facility_id={$this->facility->id}&date={$this->futureDate}&service_id={$this->service->id}");

        $response->assertStatus(200);
        $response->assertJson([
            'date' => $this->futureDate,
            'doctor_id' => $this->doctor->id,
            'facility_id' => $this->facility->id,
            'slot_auto_confirm_limit' => 1,
            'slot_waitlist_limit' => 1,
        ]);

        $slots = $response->json('slots');
        $this->assertNotEmpty($slots);
        $this->assertEquals('16:00', $slots[0]['time']);
        $this->assertEquals('available_instant', $slots[0]['status']);
        $this->assertTrue($slots[0]['is_available']);
        $this->assertEquals(2, $slots[0]['remaining_capacity']);

        // Also test the facility-prefixed route alias
        $response2 = $this->withHeader('Authorization', 'Bearer ' . $this->secretKey)
            ->getJson("/connect/v1/facilities/{$this->facility->id}/doctors/{$this->doctor->id}/availability?date={$this->futureDate}&service_id={$this->service->id}");
        $response2->assertStatus(200);
        $this->assertEquals($this->facility->id, $response2->json('facility_id'));
    }

    public function test_availability_returns_empty_slots_for_past_date(): void
    {
        $pastDate = Carbon::now('Asia/Riyadh')->subDays(2)->toDateString();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->secretKey)
            ->getJson("/connect/v1/doctors/{$this->doctor->id}/availability?facility_id={$this->facility->id}&date={$pastDate}");

        $response->assertStatus(200);
        $this->assertEmpty($response->json('slots'));
        $this->assertEquals('Requested date is in the past.', $response->json('message'));
    }

    public function test_booking_intent_generation_with_strict_pricing_breakdown(): void
    {
        $payload = [
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'doctor_service_id' => $this->service->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '16:00',
            'expected_fee' => 230.00, // 200 + 15% VAT = 230.00
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->secretKey)
            ->postJson('/connect/v1/booking-intents', $payload);

        $response->assertStatus(201);
        $response->assertJson([
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '16:00',
            'base_fee' => 200.00,
            'vat_amount' => 30.00,
            'expected_fee' => 230.00,
        ]);

        $token = $response->json('intent_token');
        $this->assertStringStartsWith('bit_test_', $token);

        $intent = ConnectBookingIntent::where('intent_token', $token)->first();
        $this->assertNotNull($intent);
        $this->assertEquals('pending', $intent->status);
        $this->assertTrue($intent->expires_at->isFuture());
    }

    public function test_booking_intent_rejects_price_mismatch(): void
    {
        $payload = [
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'doctor_service_id' => $this->service->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '16:00',
            'expected_fee' => 200.00, // Mismatch: requires 230.00 VAT-inclusive
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->secretKey)
            ->postJson('/connect/v1/booking-intents', $payload);

        $response->assertStatus(422);
        $response->assertJson([
            'code' => 'ERR_PRICE_MISMATCH',
            'status' => 422,
        ]);
    }

    public function test_appointment_booking_requires_idempotency_key_header(): void
    {
        $payload = [
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'doctor_service_id' => $this->service->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '16:00',
            'patient_name' => 'سارة محمد أحمد',
            'patient_phone' => '+966501234567',
            'external_patient_id' => 'PAT-1001',
        ];

        // Without Idempotency-Key header
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->secretKey)
            ->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", $payload);

        $response->assertStatus(400);
        $response->assertJson([
            'code' => 'ERR_IDEMPOTENCY_KEY_REQUIRED',
            'status' => 400,
        ]);
    }

    public function test_successful_appointment_booking_within_instant_capacity(): void
    {
        $idempotencyKey = (string) Str::uuid();

        $payload = [
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'doctor_service_id' => $this->service->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '16:00',
            'patient_name' => 'سارة محمد أحمد',
            'patient_phone' => '0501234567',
            'external_patient_id' => 'PAT-1001',
            'external_appointment_id' => 'HOSP-5001',
            'payment_method' => 'at_clinic',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => $idempotencyKey,
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", $payload);

        $response->assertStatus(201);
        $response->assertJson([
            'external_appointment_id' => 'HOSP-5001',
            'status' => 'confirmed',
            'ticket' => [
                'ticket_number' => 1,
            ],
            'schedule' => [
                'date' => $this->futureDate,
                'time' => '16:00',
            ],
            'payment' => [
                'amount' => 230.00,
            ],
        ]);

        $bookingRef = $response->json('booking_reference');
        $this->assertStringStartsWith('TB-', $bookingRef);

        $publicToken = $response->json('public_token');
        $this->assertStringStartsWith('ptk_', $publicToken);

        // Verify database link and isolated patient identity
        $appt = Appointment::where('booking_reference', $bookingRef)->first();
        $this->assertNotNull($appt);
        $this->assertEquals('confirmed', $appt->status);
        $this->assertEquals('+966501234567', $appt->patient->phone);

        $link = ConnectAppointmentLink::where('appointment_id', $appt->id)->first();
        $this->assertNotNull($link);
        $this->assertEquals($this->credential->id, $link->credential_id);
        $this->assertEquals(hash('sha256', $publicToken), $link->public_token_hash);
        $this->assertEquals('PAT-1001', $link->external_patient_id);
        $this->assertEquals('+966501234567', $link->patient_phone_snapshot);
    }

    public function test_booking_reaches_waitlist_when_instant_capacity_full(): void
    {
        // 1st booking: fills slot_auto_confirm_limit (1)
        $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => (string) Str::uuid(),
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", [
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'doctor_service_id' => $this->service->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '16:30',
            'patient_name' => 'المريض الأول',
            'patient_phone' => '0501111111',
            'external_patient_id' => 'PAT-1',
        ])->assertStatus(201)->assertJson(['status' => 'confirmed']);

        // 2nd booking: goes to waitlist (pending_confirmation)
        $response2 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => (string) Str::uuid(),
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", [
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'doctor_service_id' => $this->service->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '16:30',
            'patient_name' => 'المريض الثاني',
            'patient_phone' => '0502222222',
            'external_patient_id' => 'PAT-2',
        ]);

        $response2->assertStatus(201);
        $response2->assertJson(['status' => 'pending_confirmation']);

        // 3rd booking: slot total capacity (1 + 1 = 2) is exceeded -> 422 ERR_SLOT_NOT_AVAILABLE
        $response3 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => (string) Str::uuid(),
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", [
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'doctor_service_id' => $this->service->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '16:30',
            'patient_name' => 'المريض الثالث',
            'patient_phone' => '0503333333',
            'external_patient_id' => 'PAT-3',
        ]);

        $response3->assertStatus(422);
        $response3->assertJson(['code' => 'ERR_SLOT_NOT_AVAILABLE']);
    }

    public function test_booking_intent_flow_and_single_use_consumption(): void
    {
        // 1. Create booking intent
        $intentRes = $this->withHeader('Authorization', 'Bearer ' . $this->secretKey)
            ->postJson('/connect/v1/booking-intents', [
                'facility_id' => $this->facility->id,
                'doctor_id' => $this->doctor->id,
                'doctor_service_id' => $this->service->id,
                'appointment_date' => $this->futureDate,
                'appointment_time' => '17:00',
                'expected_fee' => 230.00,
            ]);

        $intentRes->assertStatus(201);
        $token = $intentRes->json('intent_token');

        // 2. Consume intent in booking via Bearer <intent_token>
        $bookRes = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Idempotency-Key' => (string) Str::uuid(),
        ])->postJson('/connect/v1/appointments', [
            'patient_name' => 'عبدالله المنصور',
            'patient_phone' => '+966555555555',
            'external_patient_id' => 'PAT-700',
        ]);

        $bookRes->assertStatus(201);
        $bookRes->assertJson(['status' => 'confirmed']);

        // 3. Re-using the consumed intent must return 410 ERR_INTENT_EXPIRED_OR_USED
        $bookRes2 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Idempotency-Key' => (string) Str::uuid(),
        ])->postJson('/connect/v1/appointments', [
            'patient_name' => 'عبدالله المنصور',
            'patient_phone' => '+966555555555',
            'external_patient_id' => 'PAT-700',
        ]);

        $bookRes2->assertStatus(410);
        $bookRes2->assertJson(['code' => 'ERR_INTENT_EXPIRED_OR_USED']);
    }

    public function test_idempotency_replay_and_payload_mismatch_detection(): void
    {
        $idempotencyKey = (string) Str::uuid();

        $payload = [
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'doctor_service_id' => $this->service->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '17:30',
            'patient_name' => 'نورة العتيبي',
            'patient_phone' => '+966544444444',
            'external_patient_id' => 'PAT-888',
        ];

        // 1st attempt: 201 Created
        $res1 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => $idempotencyKey,
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", $payload);

        $res1->assertStatus(201);
        $ref1 = $res1->json('booking_reference');

        // 2nd identical attempt: returns replay 201 with Idempotent-Replay header
        $res2 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => $idempotencyKey,
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", $payload);

        $res2->assertStatus(201);
        $res2->assertHeader('Idempotent-Replay', 'true');
        $res2->assertHeader('X-Cache-Lookup', 'HIT');
        $this->assertEquals($ref1, $res2->json('booking_reference'));

        // 3rd attempt with altered payload: returns 422 ERR_PAYLOAD_MISMATCH
        $altered = $payload;
        $altered['patient_name'] = 'اسم مختلف تماماً';

        $res3 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => $idempotencyKey,
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", $altered);

        $res3->assertStatus(422);
        $res3->assertJson(['code' => 'ERR_PAYLOAD_MISMATCH']);
    }

    public function test_patient_identity_conflict_when_external_patient_id_phone_differs(): void
    {
        // 1. Create first appointment for PAT-999 with phone 0511111111
        $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => (string) Str::uuid(),
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", [
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'doctor_service_id' => $this->service->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '18:00',
            'patient_name' => 'فهد القحطاني',
            'patient_phone' => '0511111111',
            'external_patient_id' => 'PAT-999',
        ])->assertStatus(201);

        // 2. Attempt booking same PAT-999 with phone 0522222222 -> 409 ERR_PATIENT_IDENTITY_CONFLICT
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => (string) Str::uuid(),
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", [
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'doctor_service_id' => $this->service->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '18:30',
            'patient_name' => 'فهد القحطاني',
            'patient_phone' => '0522222222',
            'external_patient_id' => 'PAT-999',
        ]);

        $response->assertStatus(409);
        $response->assertJson(['code' => 'ERR_PATIENT_IDENTITY_CONFLICT']);
    }

    public function test_daily_phone_limit_enforced_at_five_active_bookings(): void
    {
        $testPhone = '0599999999';
        $normalizedTestPhone = '+966' . substr($testPhone, 1);
        $patient = User::factory()->create([
            'phone' => $normalizedTestPhone,
            'role' => 'patient',
        ]);

        // Create 5 active appointments across distinct slots
        for ($i = 0; $i < 5; $i++) {
            $scheduleHour = 16;
            Appointment::create([
                'booking_reference' => 'TB-TST' . $i,
                'patient_id' => $patient->id,
                'doctor_id' => $this->doctor->id,
                'facility_id' => $this->facility->id,
                'doctor_facility_id' => $this->doctorFacility->id,
                'doctor_service_id' => $this->service->id,
                'service_name' => $this->service->name,
                'appointment_date' => $this->futureDate,
                'appointment_time' => sprintf('%02d:%02d:00', $scheduleHour, $i * 10),
                'duration_minutes' => 10,
                'status' => 'confirmed',
                'consultation_fee' => 200.00,
                'total_amount' => 230.00,
            ]);
        }

        // 6th booking attempt for same phone and date must fail with 422 ERR_DAILY_PHONE_LIMIT
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => (string) Str::uuid(),
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", [
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'doctor_service_id' => $this->service->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '19:00',
            'patient_name' => 'مريض متكرر',
            'patient_phone' => $testPhone,
            'external_patient_id' => 'PAT-DAILY-TEST',
        ]);

        $response->assertStatus(422);
        $response->assertJson(['code' => 'ERR_DAILY_PHONE_LIMIT']);
    }

    public function test_cancellation_state_machine_and_idempotent_cancellation(): void
    {
        // 1. Create appointment
        $bookRes = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => (string) Str::uuid(),
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", [
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'doctor_service_id' => $this->service->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '19:00',
            'patient_name' => 'ياسر الحربي',
            'patient_phone' => '0533333333',
            'external_patient_id' => 'PAT-CANCEL-1',
            'external_appointment_id' => 'EXT-CANCEL-1',
        ]);

        $bookRes->assertStatus(201);
        $ref = $bookRes->json('booking_reference');

        // 2. Cancel appointment
        $cancelKey = (string) Str::uuid();
        $cancelRes1 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => $cancelKey,
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments/{$ref}/cancel", [
            'cancellation_reason' => 'ظروف سفر طارئة',
        ]);

        $cancelRes1->assertStatus(200);
        $cancelRes1->assertJson([
            'booking_reference' => $ref,
            'external_appointment_id' => 'EXT-CANCEL-1',
            'status' => 'cancelled',
            'cancellation_reason' => 'ظروف سفر طارئة',
        ]);

        // 3. Idempotent cancellation: repeating cancellation returns 200 OK
        $cancelRes2 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => (string) Str::uuid(),
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments/{$ref}/cancel");

        $cancelRes2->assertStatus(200);
        $cancelRes2->assertJson(['status' => 'cancelled']);
    }

    public function test_cancellation_forbidden_when_in_consultation_or_completed(): void
    {
        $bookRes = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => (string) Str::uuid(),
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", [
            'facility_id' => $this->facility->id,
            'doctor_id' => $this->doctor->id,
            'doctor_service_id' => $this->service->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '19:30',
            'patient_name' => 'منى الدوسري',
            'patient_phone' => '0544444444',
            'external_patient_id' => 'PAT-CLINICAL-1',
        ]);

        $ref = $bookRes->json('booking_reference');

        // Move to in_consultation
        Appointment::where('booking_reference', $ref)->update(['status' => 'in_consultation']);

        $cancelRes = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => (string) Str::uuid(),
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments/{$ref}/cancel");

        $cancelRes->assertStatus(409);
        $cancelRes->assertJson(['code' => 'ERR_INVALID_STATE']);
    }

    public function test_reschedule_endpoint_returns_501_not_implemented(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->secretKey)
            ->patchJson("/connect/v1/facilities/{$this->facility->id}/appointments/TB-XX1234/reschedule");

        $response->assertStatus(501);
        $response->assertJson([
            'code' => 'ERR_NOT_IMPLEMENTED',
            'status' => 501,
        ]);
    }

    public function test_booking_with_national_id_and_phone_without_email(): void
    {
        $idempotencyKey = (string) Str::uuid();

        // 1st booking: Patient not in Tebiby, enters national_id + phone + name (no email)
        $payload = [
            'doctor_id' => $this->doctor->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '16:00',
            'patient_name' => 'خالد العتيبي',
            'national_id' => '1088776655',
            'patient_phone' => '0567788990',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => $idempotencyKey,
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", $payload);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'confirmed',
            'patient' => [
                'name' => 'خالد العتيبي',
                'national_id' => '1088776655',
                'phone' => '+966567788990',
            ],
            'ticket' => [
                'ticket_number' => 1,
            ],
        ]);

        $createdPatient = User::where('national_id', '1088776655')->first();
        $this->assertNotNull($createdPatient);
        $this->assertEquals('خالد العتيبي', $createdPatient->name);
        $this->assertEquals('+966567788990', $createdPatient->phone);

        // 2nd booking: Same patient books again for a different slot
        $idempotencyKey2 = (string) Str::uuid();
        $payload2 = [
            'doctor_id' => $this->doctor->id,
            'appointment_date' => $this->futureDate,
            'appointment_time' => '16:30',
            'patient_name' => 'خالد العتيبي',
            'national_id' => '1088776655',
            'patient_phone' => '0567788990',
        ];

        $response2 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Idempotency-Key' => $idempotencyKey2,
        ])->postJson("/connect/v1/facilities/{$this->facility->id}/appointments", $payload2);

        $response2->assertStatus(201);
        $this->assertEquals($createdPatient->id, $response2->json('patient.id'));
    }
}
