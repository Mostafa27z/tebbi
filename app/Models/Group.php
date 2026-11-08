<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Group extends Model
{
    use HasFactory;

    protected $table = 'groups';

    protected $fillable = [
        'name_ar',
        'name_en',
        'slug',
        'logo_url',
        'cr_number',
        'status',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }

    public function facilities(): HasMany
    {
        return $this->hasMany(Facility::class, 'group_id');
    }

    public function hospitals(): HasMany
    {
        return $this->hasMany(Facility::class, 'group_id')->where('type', 'hospital');
    }

    public function clinics(): HasMany
    {
        return $this->hasMany(Facility::class, 'group_id')->where('type', 'clinic');
    }

    public function roleAssignments(): HasMany
    {
        return $this->hasMany(RoleAssignment::class, 'scope_id')->where('scope_type', 'group');
    }

    public function admins(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'role_assignments', 'scope_id', 'user_id')
            ->wherePivot('scope_type', 'group')
            ->wherePivot('role', 'group_admin')
            ->withTimestamps();
    }

    public function doctorFacilities(): HasManyThrough
    {
        return $this->hasManyThrough(DoctorFacility::class, Facility::class, 'group_id', 'facility_id');
    }
}

