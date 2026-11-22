<?php

namespace Tests\Feature\Connect;

use App\Models\Appointment;
use App\Models\ConnectCredential;
use App\Models\Facility;
use App\Models\Group;
use App\Services\GupshupWhatsAppService;
use Database\Seeders\SandboxCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SandboxResetTest extends TestCase
{
    use RefreshDatabase;

    protected function createSandboxCredential(): array
    {
        $group = Group::factory()->create();
        $keys = ConnectCredential::generate('sandbox');
        $credential = ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $group->id,
            'integration_name' => 'Sandbox Partner Credential',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => ['*' => ['*']],
            'status' => 'active',
            'expires_at' => now()->addMonth(),
        ]);

        return [$group, $credential, $keys];
    }

    public function test_sandbox_reset_endpoint_rejected_with_404_in_production_or_non_sandbox_env(): void
    {
        [$group, $credential, $keys] = $this->createSandboxCredential();

        // In test/testing env (not 'sandbox')
        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->postJson(route('connect.sandbox.reset'));

        $response->assertStatus(404);
    }

    public function test_sandbox_reset_endpoint_rejected_when_database_is_dev_db_not_ending_with_sandbox(): void
    {
        [$group, $credential, $keys] = $this->createSandboxCredential();

        $appointment = Appointment::factory()->create();
        $initialApptCount = Appointment::count();
        $this->assertGreaterThan(0, $initialApptCount);

        // Force sandbox environment BUT point to dev database name 'tabbi'
        Config::set('app.env', 'sandbox');
        $conn = config('database.default');
        Config::set("database.connections.{$conn}.database", 'tabbi');

        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->postJson(route('connect.sandbox.reset'));

        // Strictly rejected, never 200
        $this->assertContains($response->status(), [403, 500]);

        // Assert zero rows deleted before and after
        $this->assertEquals($initialApptCount, Appointment::count());
    }

    public function test_sandbox_reset_endpoint_clears_data_and_reseeds_in_sandbox(): void
    {
        [$group, $credential, $keys] = $this->createSandboxCredential();

        // Force sandbox environment and sandbox test DB name
        Config::set('app.env', 'sandbox');
        $conn = config('database.default');
        Config::set("database.connections.{$conn}.database", 'test_db_sandbox');

        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->postJson(route('connect.sandbox.reset'));

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'sandbox_reset_completed',
        ]);

        $this->assertDatabaseHas('groups', ['slug' => 'sandbox-group']);
        $this->assertDatabaseHas('facilities', ['moh_license_no' => 'MOH-SANDBOX-001']);
        $this->assertDatabaseHas('specialties', ['name_ar' => 'طب الأسرة']);
    }

    public function test_whatsapp_notification_suppression_when_notify_whatsapp_false(): void
    {
        Http::fake();
        Config::set('gupshup.enabled', true);
        Config::set('gupshup.api_key', 'test_key');

        $service = app(GupshupWhatsAppService::class);

        $appointment = Appointment::factory()->make([
            'patient_name' => 'مريض تجريبي',
            'patient_phone' => '+966500000000',
            'notify_whatsapp' => false,
        ]);

        // Attempting to send any WhatsApp notification must return skipped immediately
        $resBookingReceived = $service->notifyBookingReceived($appointment);
        $resBookingConfirmed = $service->notifyBookingConfirmed($appointment);
        $resArrivalConfirmed = $service->notifyArrivalConfirmed($appointment);
        $resTurnApproaching = $service->notifyTurnApproaching($appointment);
        $resPatientCalled = $service->notifyPatientCalled($appointment);
        $resCompleted = $service->notifyConsultationCompleted($appointment);
        $resCancelled = $service->notifyAppointmentCancelled($appointment);
        $resDelayed = $service->notifyAppointmentDelayed($appointment, 15);

        $expectedSkipped = ['status' => 'skipped', 'reason' => 'patient_opted_out'];
        $this->assertEquals($expectedSkipped, $resBookingReceived);
        $this->assertEquals($expectedSkipped, $resBookingConfirmed);
        $this->assertEquals($expectedSkipped, $resArrivalConfirmed);
        $this->assertEquals($expectedSkipped, $resTurnApproaching);
        $this->assertEquals($expectedSkipped, $resPatientCalled);
        $this->assertEquals($expectedSkipped, $resCompleted);
        $this->assertEquals($expectedSkipped, $resCancelled);
        $this->assertEquals($expectedSkipped, $resDelayed);

        // Verify Gupshup API was never called
        Http::assertNothingSent();
    }
}
