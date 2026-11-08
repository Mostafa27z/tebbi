<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DoctorSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_profile_id',
        'doctor_facility_id',
        'day_of_week',
        'start_time',
        'end_time',
        'slot_duration_minutes',
        'max_daily_patients',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (DoctorSchedule $schedule) {
            if (empty($schedule->doctor_facility_id) && !empty($schedule->doctor_profile_id)) {
                $doctor = DoctorProfile::find($schedule->doctor_profile_id);
                if ($doctor && $doctor->clinic_id) {
                    $pivot = DoctorFacility::firstOrCreate([
                        'doctor_profile_id' => $doctor->id,
                        'facility_id' => $doctor->clinic_id,
                    ], [
                        'consultation_fee' => $doctor->consultation_fee ?? 200,
                        'default_slot_minutes' => 20,
                        'accepts_insurance' => (bool) $doctor->accepts_insurance,
                        'is_active' => true,
                    ]);
                    $schedule->doctor_facility_id = $pivot->id;
                }
            }
        });
    }

    public function doctorProfile(): BelongsTo
    {
        return $this->belongsTo(DoctorProfile::class);
    }

    public function doctorFacility(): BelongsTo
    {
        return $this->belongsTo(DoctorFacility::class);
    }
}
