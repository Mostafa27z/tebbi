<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConnectApiLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'credential_id',
        'request_id',
        'method',
        'path',
        'status_code',
        'duration_ms',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'status_code' => 'integer',
            'duration_ms' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function credential(): BelongsTo
    {
        return $this->belongsTo(ConnectCredential::class, 'credential_id');
    }
}
