<?php

namespace Tests\Feature\Connect;

use App\Models\ConnectCredential;
use App\Models\Facility;
use App\Models\Group;
use App\Models\RoleAssignment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Tests\TestCase;

class CredentialManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private User $facilityAdmin;
    private Facility $facility;
    private Group $group;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'role' => 'admin',
            'email' => 'admin@tebiby.test',
        ]);

        $this->group = Group::create([
            'name' => 'Al-Habib Group',
            'name_ar' => 'مجموعة الحبيب',
            'slug' => 'habeeb-group',
        ]);

        $this->facility = Facility::create([
            'name' => 'Olaya Medical Complex',
            'name_ar' => 'مستشفى العليا',
            'branch_name' => 'العليا',
            'city' => 'الرياض',
            'type' => 'hospital',
            'group_id' => $this->group->id,
            'is_verified' => true,
            'is_active' => true,
        ]);

        $this->facilityAdmin = User::factory()->create([
            'role' => 'patient',
            'email' => 'olaya.admin@tebiby.test',
        ]);

        RoleAssignment::create([
            'user_id' => $this->facilityAdmin->id,
            'role' => 'facility_admin',
            'scope_type' => 'facility',
            'scope_id' => $this->facility->id,
        ]);
    }

    public function test_facility_admin_can_view_api_keys_page(): void
    {
        $response = $this->actingAs($this->facilityAdmin)
            ->get('/facility/api-keys');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('facility/api-keys')
            ->has('facility')
            ->has('credentials')
        );
    }

    public function test_facility_admin_can_view_api_docs_page(): void
    {
        $response = $this->actingAs($this->facilityAdmin)
            ->get('/facility/api-docs');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('facility/api-docs')
            ->has('facility')
        );
    }

    public function test_facility_admin_generates_strictly_live_api_key_with_selected_lifespan(): void
    {
        $response = $this->actingAs($this->facilityAdmin)
            ->post('/facility/api-keys', [
                'facility_id' => $this->facility->id,
                'integration_name' => 'Olaya HIS System',
                'lifespan' => '90_days',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('flash_credential');

        $flash = session('flash_credential');
        $this->assertStringStartsWith('pk_live_', $flash['pk']);
        $this->assertStringStartsWith('sk_live_', $flash['sk']);
        $this->assertEquals('live', $flash['environment']);

        $cred = ConnectCredential::first();
        $this->assertNotNull($cred);
        $this->assertEquals('live', $cred->environment);
        $this->assertEquals('Olaya HIS System', $cred->integration_name);
        $this->assertEquals($this->facility->id, $cred->owner_id);
        $this->assertNotNull($cred->expires_at);
        $this->assertTrue(Carbon::parse($cred->expires_at)->isFuture());

        // Decrypted secret matches
        $this->assertEquals($flash['sk'], $cred->getDecryptedSecret());
    }

    public function test_super_admin_can_view_api_integrations_page(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get('/admin/api-integrations');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/api-integrations')
            ->has('facilities')
            ->has('metrics')
        );
    }

    public function test_super_admin_can_generate_sandbox_and_live_credentials_with_different_lifespans(): void
    {
        // 1. Generate Sandbox Key
        $responseSandbox = $this->actingAs($this->superAdmin)
            ->post('/admin/api-credentials', [
                'facility_id' => $this->facility->id,
                'environment' => 'sandbox',
                'integration_name' => 'Test Sandbox Integration',
                'lifespan' => '30_days',
            ]);

        $responseSandbox->assertRedirect();
        $sandboxCred = ConnectCredential::where('environment', 'sandbox')->first();
        $this->assertNotNull($sandboxCred);
        $this->assertEquals('sandbox', $sandboxCred->environment);
        $this->assertStringStartsWith('pk_test_', $sandboxCred->pk_display);

        // 2. Generate Live Key
        $responseLive = $this->actingAs($this->superAdmin)
            ->post('/admin/api-credentials', [
                'facility_id' => $this->facility->id,
                'environment' => 'live',
                'integration_name' => 'Hospital Live Production',
                'lifespan' => '365_days',
            ]);

        $responseLive->assertRedirect();
        $liveCred = ConnectCredential::where('environment', 'live')->first();
        $this->assertNotNull($liveCred);
        $this->assertEquals('live', $liveCred->environment);
        $this->assertStringStartsWith('pk_live_', $liveCred->pk_display);
    }

    public function test_credential_can_be_revoked_and_deleted(): void
    {
        $keys = ConnectCredential::generateKeyPair('live');
        $cred = ConnectCredential::create([
            'owner_type' => Facility::class,
            'owner_id' => $this->facility->id,
            'integration_name' => 'To Be Revoked',
            'environment' => 'live',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_display' => $keys['pk'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_encrypted' => Crypt::encryptString($keys['sk']),
            'sk_hash' => $keys['sk_hash'],
            'scopes' => [(string) $this->facility->id => ['read', 'book', 'cancel']],
            'status' => 'active',
        ]);

        $this->assertTrue($cred->isActive());

        // Revoke
        $this->actingAs($this->facilityAdmin)
            ->post("/facility/api-keys/{$cred->id}/revoke");

        $cred->refresh();
        $this->assertEquals('revoked', $cred->status);
        $this->assertFalse($cred->isActive());

        // Delete
        $this->actingAs($this->facilityAdmin)
            ->delete("/facility/api-keys/{$cred->id}");

        $this->assertDatabaseMissing('connect_credentials', ['id' => $cred->id]);
    }
}
