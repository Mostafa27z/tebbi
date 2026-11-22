<?php

namespace Tests\Feature\Connect;

use App\Models\ConnectCredential;
use App\Models\Facility;
use App\Models\Group;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScopeAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_accessing_facility_outside_group_returns_404_anti_enumeration(): void
    {
        $groupA = Group::factory()->create();
        $groupB = Group::factory()->create();

        $facilityA = Facility::factory()->create(['group_id' => $groupA->id]);
        $facilityB = Facility::factory()->create(['group_id' => $groupB->id]);

        $keys = ConnectCredential::generateKeyPair('sandbox');
        $credential = ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $groupA->id,
            'integration_name' => 'Group A HIS System',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => [
                (string) $facilityA->id => ['read', 'book'],
            ],
            'status' => 'active',
        ]);

        // Attempting to query doctors for facilityB (belongs to groupB) returns 404, not 403!
        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->getJson(route('connect.doctors.index', ['facility_id' => $facilityB->id]));

        $response->assertStatus(404);
        $response->assertHeader('Content-Type', 'application/problem+json; charset=utf-8');
        $response->assertJson([
            'code' => 'ERR_RESOURCE_NOT_FOUND',
            'status' => 404,
        ]);
    }

    public function test_accessing_owned_facility_without_specific_action_scope_returns_403(): void
    {
        $group = Group::factory()->create();
        $facility = Facility::factory()->create(['group_id' => $group->id]);

        $keys = ConnectCredential::generateKeyPair('sandbox');
        // Scope only includes 'read', does NOT include 'book'
        $credential = ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $group->id,
            'integration_name' => 'Catalog Read Only Key',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => [
                (string) $facility->id => ['read'],
            ],
            'status' => 'active',
        ]);

        // Attempting to post an appointment requires 'book' scope
        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->postJson(route('connect.appointments.create', ['facility_id' => $facility->id]), [
                'patient_name' => 'مريض تجريبي',
                'appointment_date' => now()->addDay()->format('Y-m-d'),
            ]);

        $response->assertStatus(403);
        $response->assertHeader('Content-Type', 'application/problem+json; charset=utf-8');
        $response->assertJson([
            'code' => 'ERR_FORBIDDEN_SCOPE',
            'status' => 403,
        ]);
    }

    public function test_accessing_owned_facility_with_required_scope_succeeds(): void
    {
        $group = Group::factory()->create();
        $facility = Facility::factory()->create(['group_id' => $group->id]);

        $keys = ConnectCredential::generateKeyPair('sandbox');
        $credential = ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $group->id,
            'integration_name' => 'Read Permitted Key',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => [
                (string) $facility->id => ['read'],
            ],
            'status' => 'active',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $keys['sk'])
            ->getJson(route('connect.doctors.index', ['facility_id' => $facility->id]));

        $response->assertStatus(200);
        $response->assertJson([
            'facility_id' => $facility->id,
            'message' => 'Doctors list retrieved successfully.',
        ]);
    }
}
