<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role', // admin (platform), doctor, patient
        'national_id',
        'avatar',
        'gender',
        'dob',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'dob' => 'date',
        ];
    }

    public function doctorProfile(): HasOne
    {
        return $this->hasOne(DoctorProfile::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class, 'patient_id');
    }

    public function medicalRecords(): HasMany
    {
        return $this->hasMany(MedicalRecord::class, 'patient_id');
    }

    public function roleAssignments(): HasMany
    {
        return $this->hasMany(RoleAssignment::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isGroupAdmin(?int $groupId = null): bool
    {
        $query = $this->roleAssignments()
            ->where('role', 'group_admin')
            ->where('scope_type', 'group');

        if ($groupId !== null) {
            $query->where('scope_id', $groupId);
        }

        return $query->exists();
    }

    public function isFacilityAdmin(?int $facilityId = null): bool
    {
        if ($facilityId !== null) {
            $facility = Facility::find($facilityId);
            if ($facility && $this->isGroupAdmin($facility->group_id)) {
                return true;
            }

            return $this->roleAssignments()
                ->where('role', 'facility_admin')
                ->where('scope_type', 'facility')
                ->where('scope_id', $facilityId)
                ->exists();
        }

        return $this->roleAssignments()
            ->where('role', 'facility_admin')
            ->where('scope_type', 'facility')
            ->exists() || $this->isGroupAdmin();
    }

    public function isReceptionist(?int $facilityId = null): bool
    {
        $query = $this->roleAssignments()
            ->where('role', 'receptionist')
            ->where('scope_type', 'facility');

        if ($facilityId !== null) {
            $query->where('scope_id', $facilityId);
        }

        return $query->exists();
    }

    public function accessibleFacilityIds(): Collection
    {
        if ($this->isSuperAdmin()) {
            return Facility::pluck('id');
        }

        $groupAdminGroupIds = $this->roleAssignments()
            ->where('role', 'group_admin')
            ->where('scope_type', 'group')
            ->pluck('scope_id');

        $facilitiesFromGroups = Facility::whereIn('group_id', $groupAdminGroupIds)->pluck('id');

        $directFacilities = $this->roleAssignments()
            ->whereIn('role', ['facility_admin', 'receptionist'])
            ->where('scope_type', 'facility')
            ->pluck('scope_id');

        return $facilitiesFromGroups->concat($directFacilities)->unique()->values();
    }
}
