<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DoctorFacility extends Model
{
    use HasFactory;

    protected $table = 'doctor_facility';

    protected $fillable = [
        'doctor_profile_id',
        'facility_id',
        'consultation_fee',
        'default_slot_minutes',
        'accepts_insurance',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'consultation_fee' => 'decimal:2',
            'default_slot_minutes' => 'integer',
            'accepts_insurance' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function doctorProfile(): BelongsTo
    {
        return $this->belongsTo(DoctorProfile::class, 'doctor_profile_id');
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'facility_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(DoctorSchedule::class, 'doctor_facility_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'doctor_facility_id');
    }

    public function queueTickets(): HasMany
    {
        return $this->hasMany(QueueTicket::class, 'doctor_facility_id');
    }
}

