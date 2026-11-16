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

    protected function getCachedRoleAssignments(): Collection
    {
        $this->loadMissing('roleAssignments');
        return $this->getRelation('roleAssignments');
    }

    public function isGroupAdmin(?int $groupId = null): bool
    {
        $assignments = $this->getCachedRoleAssignments()
            ->where('role', 'group_admin')
            ->where('scope_type', 'group');

        if ($groupId !== null) {
            $assignments = $assignments->where('scope_id', $groupId);
        }

        return $assignments->isNotEmpty();
    }

    public function isFacilityAdmin(?int $facilityId = null): bool
    {
        $assignments = $this->getCachedRoleAssignments();

        if ($facilityId !== null) {
            if ($assignments->where('role', 'facility_admin')->where('scope_type', 'facility')->where('scope_id', $facilityId)->isNotEmpty()) {
                return true;
            }
            $facility = Facility::select('id', 'group_id')->find($facilityId);
            if ($facility && $this->isGroupAdmin($facility->group_id)) {
                return true;
            }
            return false;
        }

        return $assignments
            ->where('role', 'facility_admin')
            ->where('scope_type', 'facility')
            ->isNotEmpty() || $this->isGroupAdmin();
    }

    public function isReceptionist(?int $facilityId = null): bool
    {
        if ($this->role === 'receptionist') {
            return true;
        }

        $assignments = $this->getCachedRoleAssignments()
            ->where('role', 'receptionist')
            ->where('scope_type', 'facility');

        if ($facilityId !== null) {
            $assignments = $assignments->where('scope_id', $facilityId);
        }

        return $assignments->isNotEmpty();
    }

    public function accessibleFacilityIds(): Collection
    {
        if ($this->isSuperAdmin()) {
            return Facility::pluck('id');
        }

        $assignments = $this->getCachedRoleAssignments();

        $groupAdminGroupIds = $assignments
            ->where('role', 'group_admin')
            ->where('scope_type', 'group')
            ->pluck('scope_id');

        $facilitiesFromGroups = $groupAdminGroupIds->isNotEmpty()
            ? Facility::whereIn('group_id', $groupAdminGroupIds)->pluck('id')
            : collect();

        $directFacilities = $assignments
            ->whereIn('role', ['facility_admin', 'receptionist'])
            ->where('scope_type', 'facility')
            ->pluck('scope_id');

        return $facilitiesFromGroups->concat($directFacilities)->unique()->values();
    }
}
