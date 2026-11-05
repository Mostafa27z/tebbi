<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Specialty extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_ar',
        'name_en',
        'icon_slug',
        'badge_text',
        'description',
    ];

    public function doctorProfiles(): HasMany
    {
        return $this->hasMany(DoctorProfile::class);
    }
}

