<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConnectAuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'credential_id',
        'action',
        'scope',
        'records_count',
        'ip_hash',
        'request_id',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'records_count' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function credential(): BelongsTo
    {
        return $this->belongsTo(ConnectCredential::class, 'credential_id');
    }

    public static function hashIp(string $ip): string
    {
        $salt = config('connect.audit_salt', 'tebiby-connect-salt-fixed');
        return hash('sha256', $ip . $salt);
    }
}
