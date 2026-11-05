<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Clinic extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'branch_name',
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
    ];

    public function doctorProfiles(): HasMany
    {
        return $this->hasMany(DoctorProfile::class);
    }
}

