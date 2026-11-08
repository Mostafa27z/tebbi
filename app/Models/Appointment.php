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
        'doctor_facility_id',
        'facility_id',
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

    protected static function booted(): void
    {
        static::creating(function (Appointment $appointment) {
            if ($appointment->doctor_id) {
                $doctor = DoctorProfile::find($appointment->doctor_id);
                if ($doctor) {
                    if (empty($appointment->facility_id)) {
                        $appointment->facility_id = $doctor->clinic_id;
                    }
                    if (empty($appointment->doctor_facility_id) && $appointment->facility_id) {
                        $pivot = DoctorFacility::firstOrCreate([
                            'doctor_profile_id' => $doctor->id,
                            'facility_id' => $appointment->facility_id,
                        ], [
                            'consultation_fee' => $doctor->consultation_fee ?? 200,
                            'default_slot_minutes' => 20,
                            'accepts_insurance' => (bool) $doctor->accepts_insurance,
                            'is_active' => true,
                        ]);
                        $appointment->doctor_facility_id = $pivot->id;
                    }
                }
            }
        });
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(DoctorProfile::class, 'doctor_id');
    }

    public function doctorFacility(): BelongsTo
    {
        return $this->belongsTo(DoctorFacility::class);
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'facility_id');
    }

    public function queueTicket(): HasOne
    {
        return $this->hasOne(QueueTicket::class);
    }

    public function medicalRecord(): HasOne
    {
        return $this->hasOne(MedicalRecord::class);
    }

    public function prescription(): HasOne
    {
        return $this->hasOne(Prescription::class);
    }
}
