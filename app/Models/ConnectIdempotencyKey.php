<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConnectIdempotencyKey extends Model
{
    use HasFactory;

    protected $table = 'connect_idempotency_keys';

    protected $fillable = [
        'credential_id',
        'idempotency_key',
        'request_path',
        'request_hash',
        'response_status',
        'response_headers',
        'response_body',
        'status',
        'locked_at',
        'expires_at',
    ];

    protected $casts = [
        'response_status' => 'integer',
        'response_headers' => 'array',
        'response_body' => 'array',
        'locked_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function credential(): BelongsTo
    {
        return $this->belongsTo(ConnectCredential::class, 'credential_id');
    }
}

