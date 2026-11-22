<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ConnectAppointmentLink extends Model
{
    use HasFactory;

    protected $table = 'connect_appointment_links';

    protected $fillable = [
        'appointment_id',
        'credential_id',
        'external_appointment_id',
        'external_patient_id',
        'patient_name_snapshot',
        'patient_phone_snapshot',
        'public_token_hash',
        'public_token_expires_at',
        'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'public_token_expires_at' => 'datetime',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function credential(): BelongsTo
    {
        return $this->belongsTo(ConnectCredential::class);
    }

    /**
     * Generate a cryptographically secure public token and its SHA-256 hash.
     */
    public static function generatePublicToken(): array
    {
        $token = 'ptk_' . Str::random(40);
        $hash = hash('sha256', $token);

        return [
            'token' => $token,
            'hash' => $hash,
        ];
    }
}
