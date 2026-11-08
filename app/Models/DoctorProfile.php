<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DoctorProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'specialty_id',
        'clinic_id', // primary facility for backward compatibility
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
        'approval_status', // pending, approved, rejected, suspended
        'license_no',
        'license_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'accepted_insurances' => 'array',
            'accepts_insurance' => 'boolean',
            'is_available_today' => 'boolean',
            'consultation_fee' => 'decimal:2',
            'rating' => 'decimal:1',
            'license_expires_at' => 'date',
        ];
    }

    protected static function booted(): void
    {
        // Maintain doctor_facility pivot when doctor profile is saved with clinic_id
        static::saved(function (DoctorProfile $doctor) {
            if ($doctor->clinic_id) {
                DoctorFacility::updateOrCreate(
                    [
                        'doctor_profile_id' => $doctor->id,
                        'facility_id' => $doctor->clinic_id,
                    ],
                    [
                        'consultation_fee' => $doctor->consultation_fee ?? 200.00,
                        'default_slot_minutes' => $doctor->waiting_time_minutes ?: 20,
                        'accepts_insurance' => (bool) $doctor->accepts_insurance,
                        'is_active' => (bool) $doctor->is_available_today,
                    ]
                );
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function specialty(): BelongsTo
    {
        return $this->belongsTo(Specialty::class);
    }

    /**
     * Backward-compatible alias for primary facility
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'clinic_id');
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'clinic_id');
    }

    public function doctorFacilities(): HasMany
    {
        return $this->hasMany(DoctorFacility::class, 'doctor_profile_id');
    }

    public function facilities(): BelongsToMany
    {
        return $this->belongsToMany(Facility::class, 'doctor_facility', 'doctor_profile_id', 'facility_id')
            ->withPivot(['consultation_fee', 'default_slot_minutes', 'accepts_insurance', 'is_active'])
            ->withTimestamps();
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

    public function isVerifiedAndLicensed(): bool
    {
        return $this->approval_status === 'approved' && $this->is_available_today;
    }
}
