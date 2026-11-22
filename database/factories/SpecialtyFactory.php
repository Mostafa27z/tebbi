<?php

namespace Database\Factories;

use App\Models\Specialty;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Specialty>
 */
class SpecialtyFactory extends Factory
{
    protected $model = Specialty::class;

    public function definition(): array
    {
        return [
            'name_ar' => fake()->randomElement(['طب الأسرة', 'طب الأطفال', 'القلب والأوعية', 'الجلدية والتجميل', 'الأنف والأذن والحنجرة']),
            'name_en' => fake()->randomElement(['Family Medicine', 'Pediatrics', 'Cardiology', 'Dermatology', 'ENT']),
            'icon_slug' => 'stethoscope',
            'badge_text' => 'شائع',
            'description' => fake()->sentence(),
        ];
    }
}
