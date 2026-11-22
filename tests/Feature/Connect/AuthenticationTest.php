<?php

namespace Tests\Feature\Connect;

use App\Models\ConnectApiLog;
use App\Models\ConnectCredential;
use App\Models\ConnectUsageDaily;
use App\Models\Group;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private function createCredential(array $overrides = []): array
    {
        $group = Group::factory()->create();
        $keys = ConnectCredential::generateKeyPair('sandbox');

        $credential = ConnectCredential::create(array_merge([
            'owner_type' => Group::class,
            'owner_id' => $group->id,
            'integration_name' => 'Test Partner App',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => ['*' => ['*']],
            'allowed_domains' => ['https://partner.com'],
            'status' => 'active',
            'expires_at' => now()->addMonth(),
        ], $overrides));

        return [$credential, $keys];
    }

    public function test_missing_key_returns_401_unauthorized(): void
    {
        $response = $this->getJson(route('connect.ping'));

        $response->assertStatus(401);
        $response->assertHeader('Content-Type', 'application/problem+json; charset=utf-8');
        $response->assertJson([
            'code' => 'ERR_UNAUTHORIZED',
            'status' => 401,
        ]);
    }

    public function test_invalid_key_returns_401_unauthorized(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer sk_test_invalid_fake_key_12345678')
            ->getJson(route('connect.ping'));

        $response->assertStatus(401);
        $response->assertHeader('Content-Type', 'application/problem+json; charset=utf-8');
        $response->assertJson([
            'code' => 'ERR_UNAUTHORIZED',
            'status' => 401,
        ]);
    }

    public function test_revoked_or_expired_key_returns_401_unauthorized(): void
    {
        [$revokedCred, $revokedKeys] = $this->createCredential(['status' => 'revoked']);
        [$expiredCred, $expiredKeys] = $this->createCredential(['expires_at' => now()->subDay()]);

        // Revoked test
        $this->withHeader('Authorization', 'Bearer ' . $revokedKeys['sk'])
            ->getJson(route('connect.ping'))
            ->assertStatus(401)
            ->assertJson(['code' => 'ERR_UNAUTHORIZED']);

        // Expired test
        $this->withHeader('Authorization', 'Bearer ' . $expiredKeys['sk'])
            ->getJson(route('connect.ping'))
            ->assertStatus(401)
            ->assertJson(['code' => 'ERR_UNAUTHORIZED']);
    }

    public function test_valid_bearer_sk_authenticates_and_logs_api_usage(): void
    {
        [$credential, $keys] = $this->createCredential();

        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->getJson(route('connect.ping'));

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'healthy',
            'environment' => 'sandbox',
        ]);
        $this->assertTrue($response->headers->has('X-Request-Id'));

        // Verify last_used_at updated
        $credential->refresh();
        $this->assertNotNull($credential->last_used_at);

        // Verify daily usage tracked
        $today = now()->format('Y-m-d');
        $usage = ConnectUsageDaily::where('credential_id', $credential->id)->first();
        $this->assertNotNull($usage);
        $this->assertEquals(1, $usage->request_count);
        $this->assertEquals($today, $usage->usage_date->format('Y-m-d'));

        // Verify API log recorded
        $this->assertDatabaseHas('connect_api_logs', [
            'credential_id' => $credential->id,
            'status_code' => 200,
            'method' => 'GET',
        ]);
    }

    public function test_publishable_key_allows_read_operations(): void
    {
        [$credential, $keys] = $this->createCredential();

        $response = $this->withHeader('X-Publishable-Key', $keys['pk'])
            ->getJson(route('connect.ping'));

        $response->assertStatus(200);
        $response->assertJson(['status' => 'healthy']);
    }

    public function test_publishable_key_rejects_write_operations_with_403(): void
    {
        [$credential, $keys] = $this->createCredential();

        $response = $this->withHeader('X-Publishable-Key', $keys['pk'])
            ->postJson(route('connect.appointments.create', ['facility_id' => 1]), [
                'patient_name' => 'مريض تجريبي',
                'appointment_date' => now()->addDay()->format('Y-m-d'),
            ]);

        $response->assertStatus(403);
        $response->assertHeader('Content-Type', 'application/problem+json; charset=utf-8');
        $response->assertJson([
            'code' => 'ERR_FORBIDDEN',
            'status' => 403,
        ]);
    }
}
