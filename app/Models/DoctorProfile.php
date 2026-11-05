<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DoctorProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'specialty_id',
        'clinic_id',
        'title_ar',
        'subspecialty',
        'bio',
        'experience_years',
        'consultation_fee',
        'rating',
        'review_count',
        'waiting_time_minutes',
        'accepts_insurance',
        'accepted_insurances',
        'is_available_today',
    ];

    protected function casts(): array
    {
        return [
            'accepted_insurances' => 'array',
            'accepts_insurance' => 'boolean',
            'is_available_today' => 'boolean',
            'consultation_fee' => 'decimal:2',
            'rating' => 'decimal:1',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function specialty(): BelongsTo
    {
        return $this->belongsTo(Specialty::class);
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(DoctorSchedule::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class, 'doctor_id');
    }
}

