<?php

namespace Tests\Feature\Connect;

use App\Models\ConnectAuditLog;
use App\Models\ConnectCredential;
use App\Models\Group;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuditLogsTest extends TestCase
{
    use RefreshDatabase;

    public function test_audit_logs_record_hashed_ip_without_raw_ip(): void
    {
        $group = Group::factory()->create();
        $keys = ConnectCredential::generateKeyPair('sandbox');
        $credential = ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $group->id,
            'integration_name' => 'Audit Partner',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => ['*' => ['*']],
            'status' => 'active',
        ]);

        $clientIp = '197.55.120.44';
        $hashedIp = ConnectAuditLog::hashIp($clientIp);

        $log = ConnectAuditLog::create([
            'credential_id' => $credential->id,
            'action' => 'facility_wide.query',
            'scope' => 'facility_wide',
            'records_count' => 25,
            'ip_hash' => $hashedIp,
            'request_id' => (string) Str::uuid(),
            'created_at' => now(),
        ]);

        $this->assertDatabaseHas('connect_audit_logs', [
            'id' => $log->id,
            'credential_id' => $credential->id,
            'action' => 'facility_wide.query',
            'records_count' => 25,
            'ip_hash' => $hashedIp,
        ]);

        // Prove raw IP is NEVER stored
        $this->assertDatabaseMissing('connect_audit_logs', [
            'ip_hash' => $clientIp,
        ]);
        $this->assertEquals(64, strlen($log->ip_hash));
    }

    public function test_purge_command_deletes_records_older_than_retention_window(): void
    {
        $group = Group::factory()->create();
        $keys = ConnectCredential::generateKeyPair('sandbox');
        $credential = ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $group->id,
            'integration_name' => 'Purge Test Partner',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => ['*' => ['*']],
            'status' => 'active',
        ]);

        // Old log: 95 days ago
        $oldLog = ConnectAuditLog::create([
            'credential_id' => $credential->id,
            'action' => 'old.action',
            'records_count' => 1,
            'ip_hash' => hash('sha256', 'ip1'),
            'request_id' => (string) Str::uuid(),
            'created_at' => now()->subDays(95),
        ]);

        // Recent log: 30 days ago
        $recentLog = ConnectAuditLog::create([
            'credential_id' => $credential->id,
            'action' => 'recent.action',
            'records_count' => 1,
            'ip_hash' => hash('sha256', 'ip2'),
            'request_id' => (string) Str::uuid(),
            'created_at' => now()->subDays(30),
        ]);

        $this->artisan('connect:purge-audit-logs', ['--days' => 90])
            ->assertExitCode(0);

        $this->assertDatabaseMissing('connect_audit_logs', ['id' => $oldLog->id]);
        $this->assertDatabaseHas('connect_audit_logs', ['id' => $recentLog->id]);
    }
}
