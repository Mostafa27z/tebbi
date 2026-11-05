<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_reference',
        'patient_id',
        'doctor_id',
        'appointment_date',
        'appointment_time',
        'status',
        'payment_method',
        'payment_status',
        'consultation_fee',
        'discount',
        'tax',
        'total_amount',
        'insurance_provider',
        'insurance_policy_number',
        'patient_notes',
        'notify_whatsapp',
        'notify_sms',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date',
            'consultation_fee' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'notify_whatsapp' => 'boolean',
            'notify_sms' => 'boolean',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(DoctorProfile::class, 'doctor_id');
    }

    public function queueTicket(): HasOne
    {
        return $this->hasOne(QueueTicket::class);
    }

    public function prescription(): HasOne
    {
        return $this->hasOne(Prescription::class);
    }
}

