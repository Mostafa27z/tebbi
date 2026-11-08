<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Facility extends Model
{
    use HasFactory;

    protected $table = 'facilities';

    protected $fillable = [
        'group_id',
        'name',
        'branch_name',
        'type', // hospital, clinic
        'status', // active, pending, suspended
        'moh_license_no',
        'city',
        'district',
        'address',
        'phone',
        'map_url',
        'latitude',
        'longitude',
        'logo_url',
        'is_active',
        'is_verified',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_verified' => 'boolean',
            'settings' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Facility $facility) {
            if (empty($facility->group_id)) {
                $group = Group::firstOrCreate(
                    ['slug' => 'grp-' . Str::slug($facility->name ?? 'standalone') . '-' . Str::lower(Str::random(6))],
                    [
                        'name_ar' => $facility->name ?? 'مجمع طبي مستقل',
                        'status' => 'active',
                    ]
                );
                $facility->group_id = $group->id;
            }

            if (empty($facility->type)) {
                $facility->type = str_contains($facility->name ?? '', 'مستشفى') ? 'hospital' : 'clinic';
            }
        });
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'group_id');
    }

    public function doctorFacilities(): HasMany
    {
        return $this->hasMany(DoctorFacility::class, 'facility_id');
    }

    public function doctors(): BelongsToMany
    {
        return $this->belongsToMany(DoctorProfile::class, 'doctor_facility', 'facility_id', 'doctor_profile_id')
            ->withPivot(['consultation_fee', 'default_slot_minutes', 'accepts_insurance', 'is_active'])
            ->withTimestamps();
    }

    /**
     * Backward-compatibility: doctorProfiles via legacy clinic_id
     */
    public function doctorProfiles(): HasMany
    {
        return $this->hasMany(DoctorProfile::class, 'clinic_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'facility_id');
    }

    public function roleAssignments(): HasMany
    {
        return $this->hasMany(RoleAssignment::class, 'scope_id')->where('scope_type', 'facility');
    }

    public function admins(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'role_assignments', 'scope_id', 'user_id')
            ->wherePivot('scope_type', 'facility')
            ->wherePivot('role', 'facility_admin')
            ->withTimestamps();
    }

    public function receptionists(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'role_assignments', 'scope_id', 'user_id')
            ->wherePivot('scope_type', 'facility')
            ->wherePivot('role', 'receptionist')
            ->withTimestamps();
    }
}

