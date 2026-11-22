<?php

namespace Tests\Feature\Connect;

use App\Models\ConnectCredential;
use App\Models\Group;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BootGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_sandbox_credential_is_rejected_in_production_environment(): void
    {
        $group = Group::factory()->create();
        $keys = ConnectCredential::generateKeyPair('sandbox');
        $credential = ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $group->id,
            'integration_name' => 'Sandbox App',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => ['*' => ['*']],
            'status' => 'active',
        ]);

        // Simulate production environment
        $this->app['env'] = 'production';

        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->getJson(route('connect.ping'));

        $response->assertStatus(500);
        $response->assertHeader('Content-Type', 'application/problem+json; charset=utf-8');
        $response->assertJson([
            'code' => 'ERR_INTERNAL_SERVER',
            'status' => 500,
        ]);
    }

    public function test_sandbox_credential_is_accepted_in_testing_or_sandbox_environment(): void
    {
        $group = Group::factory()->create();
        $keys = ConnectCredential::generateKeyPair('sandbox');
        $credential = ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $group->id,
            'integration_name' => 'Sandbox App Allowed',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => ['*' => ['*']],
            'status' => 'active',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->getJson(route('connect.ping'));

        $response->assertStatus(200);
        $response->assertJson(['status' => 'healthy']);
    }

    public function test_appointment_stub_returns_501_not_implemented_in_production(): void
    {
        $group = Group::factory()->create();
        $facility = \App\Models\Facility::factory()->create(['group_id' => $group->id]);
        $keys = ConnectCredential::generateKeyPair('live');
        $credential = ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $group->id,
            'integration_name' => 'Live App',
            'environment' => 'live',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => [(string) $facility->id => ['book']],
            'status' => 'active',
        ]);

        $this->app['env'] = 'production';

        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->postJson(route('connect.appointments.create', ['facility_id' => $facility->id]), [
                'patient_name' => 'مريض تجريبي',
                'appointment_date' => now()->addDay()->format('Y-m-d'),
            ]);

        $response->assertStatus(501);
        $response->assertHeader('Content-Type', 'application/problem+json; charset=utf-8');
        $response->assertJson([
            'code' => 'ERR_NOT_IMPLEMENTED',
            'status' => 501,
        ]);
    }
}
