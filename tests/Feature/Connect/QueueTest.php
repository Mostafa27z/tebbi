<?php

namespace Tests\Feature\Connect;

use App\Models\Appointment;
use App\Models\ConnectAppointmentLink;
use App\Models\ConnectCredential;
use App\Models\DoctorFacility;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\Group;
use App\Models\QueueTicket;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QueueTest extends TestCase
{
    use RefreshDatabase;

    protected function createAppointmentWithQueueTicket(int $ticketNum = 5, int $currentServing = 2, int $delayMinutes = 0): array
    {
        $group = Group::factory()->create();
        $facility = Facility::factory()->create(['group_id' => $group->id]);
        $specialty = Specialty::factory()->create(['name_ar' => 'طب الأطفال']);

        $doctorUser = User::factory()->create(['name' => 'د. خالد الصالح', 'role' => 'doctor']);
        $doctor = DoctorProfile::factory()->create([
            'user_id' => $doctorUser->id,
            'specialty_id' => $specialty->id,
            'clinic_id' => $facility->id,
            'waiting_time_minutes' => 15,
            'approval_status' => 'approved',
            'is_available_today' => true,
        ]);

        $patientUser = User::factory()->create(['name' => 'محمد السالم', 'role' => 'patient']);
        $appointment = Appointment::factory()->create([
            'patient_id' => $patientUser->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $facility->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '10:00:00',
            'status' => 'confirmed',
            'delay_minutes' => $delayMinutes,
            'delay_reason' => $delayMinutes > 0 ? 'حالة طارئة في العيادة' : null,
        ]);

        $ticket = QueueTicket::create([
            'appointment_id' => $appointment->id,
            'queue_date' => now()->toDateString(),
            'ticket_number' => $ticketNum,
            'current_serving_number' => $currentServing,
            'status' => 'waiting',
            'estimated_wait_minutes' => 15,
        ]);

        $keys = ConnectCredential::generate('sandbox');
        $credential = ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $group->id,
            'integration_name' => 'Test Partner',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => ['*' => ['*']],
            'status' => 'active',
            'expires_at' => now()->addMonth(),
        ]);

        $tokenData = ConnectAppointmentLink::generatePublicToken();
        $link = ConnectAppointmentLink::create([
            'appointment_id' => $appointment->id,
            'credential_id' => $credential->id,
            'patient_name_snapshot' => 'محمد السالم',
            'patient_phone_snapshot' => '+966501234567',
            'public_token_hash' => $tokenData['hash'],
            'public_token_expires_at' => now()->addDay(),
        ]);

        return [$appointment, $ticket, $link, $tokenData['token']];
    }

    public function test_queue_public_token_returns_ticket_and_serving_status(): void
    {
        [$appointment, $ticket, $link, $token] = $this->createAppointmentWithQueueTicket(5, 2, 0);

        // Public request without secret key
        $response = $this->getJson(route('connect.queue.show', ['public_token' => $token]));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'ticket_number',
            'current_serving_number',
            'patients_ahead',
            'estimated_wait_minutes',
            'delay_minutes',
            'delay_reason_code',
            'status',
        ]);

        $this->assertEquals(5, $response->json('ticket_number'));
        $this->assertEquals(0, $response->json('delay_minutes'));
        $this->assertNull($response->json('delay_reason_code'));
        $this->assertEquals('waiting', $response->json('status'));
    }

    public function test_queue_public_token_cannot_be_enumerated_and_non_existent_token_returns_404(): void
    {
        $fakeToken = 'ptk_' . str_repeat('a', 40);

        $response = $this->getJson(route('connect.queue.show', ['public_token' => $fakeToken]));

        $response->assertStatus(404);
        $this->assertStringStartsWith('application/problem+json', (string) $response->headers->get('content-type'));
        $response->assertJson([
            'status' => 404,
            'code' => 'ERR_RESOURCE_NOT_FOUND',
        ]);
    }

    public function test_expired_queue_public_token_returns_404(): void
    {
        [$appointment, $ticket, $link, $token] = $this->createAppointmentWithQueueTicket(3, 1, 0);

        // Expire the token
        $link->update(['public_token_expires_at' => now()->subHour()]);

        $response = $this->getJson(route('connect.queue.show', ['public_token' => $token]));

        $response->assertStatus(404);
        $this->assertStringStartsWith('application/problem+json', (string) $response->headers->get('content-type'));
        $response->assertJson([
            'status' => 404,
            'code' => 'ERR_RESOURCE_NOT_FOUND',
        ]);
    }

    public function test_queue_reflects_doctor_delay_dynamically(): void
    {
        [$appointment, $ticket, $link, $token] = $this->createAppointmentWithQueueTicket(4, 2, 30);

        $response = $this->getJson(route('connect.queue.show', ['public_token' => $token]));

        $response->assertStatus(200);
        $this->assertEquals(30, $response->json('delay_minutes'));
        $this->assertEquals('DOCTOR_DELAY', $response->json('delay_reason_code'));
    }

    public function test_queue_endpoint_rate_limit_throttles_excessive_requests_per_ip(): void
    {
        [$appointment, $ticket, $link, $token] = $this->createAppointmentWithQueueTicket(1, 1, 0);

        for ($i = 0; $i < 60; $i++) {
            $res = $this->getJson(route('connect.queue.show', ['public_token' => $token]));
            $res->assertStatus(200);
        }

        $throttledResponse = $this->getJson(route('connect.queue.show', ['public_token' => $token]));
        $throttledResponse->assertStatus(429);
        $this->assertStringStartsWith('application/problem+json', (string) $throttledResponse->headers->get('content-type'));
        $throttledResponse->assertJson([
            'status' => 429,
            'code' => 'ERR_RATE_LIMIT_EXCEEDED',
        ]);
    }
}
