<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ConnectBookingIntent extends Model
{
    use HasFactory;

    protected $table = 'connect_booking_intents';

    protected $fillable = [
        'credential_id',
        'intent_token',
        'facility_id',
        'doctor_id',
        'service_id',
        'appointment_date',
        'appointment_time',
        'expected_fee',
        'status',
        'expires_at',
        'consumed_at',
    ];

    protected $casts = [
        'expected_fee' => 'decimal:2',
        'appointment_date' => 'date:Y-m-d',
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
    ];

    public static function generateToken(string $environment = 'sandbox'): string
    {
        $prefix = $environment === 'production' ? 'bit_live_' : 'bit_test_';
        return $prefix . Str::random(32);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast() || $this->status === 'expired';
    }

    public function isConsumed(): bool
    {
        return $this->status === 'consumed' || ! is_null($this->consumed_at);
    }

    public function credential(): BelongsTo
    {
        return $this->belongsTo(ConnectCredential::class, 'credential_id');
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(DoctorProfile::class, 'doctor_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(DoctorService::class, 'service_id');
    }
}

