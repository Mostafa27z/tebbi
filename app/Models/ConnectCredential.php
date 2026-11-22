<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;

class ConnectCredential extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_type',
        'owner_id',
        'integration_name',
        'environment',
        'pk_prefix',
        'pk_display',
        'pk_hash',
        'sk_prefix',
        'sk_encrypted',
        'sk_hash',
        'scopes',
        'allowed_domains',
        'status',
        'expires_at',
        'last_used_at',
    ];

    protected function casts(): array
    {
        return [
            'scopes' => 'array',
            'allowed_domains' => 'array',
            'expires_at' => 'datetime',
            'last_used_at' => 'datetime',
        ];
    }

    public function owner(): MorphTo
    {
        return $this->morphTo();
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(ConnectAuditLog::class, 'credential_id');
    }

    public function apiLogs(): HasMany
    {
        return $this->hasMany(ConnectApiLog::class, 'credential_id');
    }

    public function dailyUsages(): HasMany
    {
        return $this->hasMany(ConnectUsageDaily::class, 'credential_id');
    }

    public function isActive(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->expires_at && now()->greaterThan($this->expires_at)) {
            return false;
        }

        return true;
    }

    public function isSandbox(): bool
    {
        return $this->environment === 'sandbox';
    }

    public function isLive(): bool
    {
        return $this->environment === 'live';
    }

    /**
     * Check if credential has the requested scope for a specific facility.
     * Scopes JSON schema:
     * {
     *    "10": ["read", "book", "cancel", "facility_wide"],
     *    "12": ["read"],
     *    "*": ["*"]
     * }
     */
    public function hasScope(int|string|null $facilityId, string $action): bool
    {
        if (! $this->isActive()) {
            return false;
        }

        $scopes = $this->scopes ?? [];

        // Universal wildcard
        if (isset($scopes['*']) && (in_array('*', $scopes['*'], true) || in_array($action, $scopes['*'], true))) {
            return true;
        }

        if ($facilityId === null) {
            return false;
        }

        $facilityKey = (string) $facilityId;
        if (! isset($scopes[$facilityKey]) || ! is_array($scopes[$facilityKey])) {
            return false;
        }

        $facilityScopes = $scopes[$facilityKey];
        return in_array('*', $facilityScopes, true) || in_array($action, $facilityScopes, true);
    }

    /**
     * Returns true if the credential owns or is permitted for the facility.
     */
    public function canAccessFacility(int|string $facilityId): bool
    {
        $scopes = $this->scopes ?? [];
        if (isset($scopes['*'])) {
            return true;
        }

        return isset($scopes[(string) $facilityId]);
    }

    public static function hashKey(string $plainKey): string
    {
        return hash('sha256', $plainKey);
    }

    /**
     * Helper to generate a test or live key pair.
     * Returns ['pk' => '...', 'sk' => '...', 'credential' => model attributes]
     */
    public static function generateKeyPair(string $environment = 'sandbox'): array
    {
        $envPrefix = ($environment === 'live') ? 'live' : 'test';
        $pkRaw = 'pk_' . $envPrefix . '_' . Str::random(32);
        $skRaw = 'sk_' . $envPrefix . '_' . Str::random(48);

        return [
            'pk' => $pkRaw,
            'sk' => $skRaw,
            'pk_prefix' => substr($pkRaw, 0, 8),
            'pk_hash' => static::hashKey($pkRaw),
            'sk_prefix' => substr($skRaw, 0, 8),
            'sk_hash' => static::hashKey($skRaw),
        ];
    }

    public function getDecryptedSecret(): ?string
    {
        if (! $this->sk_encrypted) {
            return null;
        }

        try {
            return \Illuminate\Support\Facades\Crypt::decryptString($this->sk_encrypted);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public static function generate(string $environment = 'sandbox'): array
    {
        return static::generateKeyPair($environment);
    }
}
