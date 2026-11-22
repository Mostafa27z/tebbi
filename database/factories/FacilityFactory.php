<?php

namespace Database\Factories;

use App\Models\Facility;
use App\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Facility>
 */
class FacilityFactory extends Factory
{
    protected $model = Facility::class;

    public function definition(): array
    {
        return [
            'group_id' => Group::factory(),
            'name' => fake()->company() . ' الطبي',
            'branch_name' => 'الفرع الرئيسي',
            'type' => fake()->randomElement(['hospital', 'clinic']),
            'status' => 'active',
            'moh_license_no' => 'MOH-' . fake()->numerify('######'),
            'city' => 'الرياض',
            'district' => 'العليا',
            'address' => fake()->address(),
            'phone' => '+9665' . fake()->numerify('########'),
            'map_url' => 'https://maps.google.com',
            'latitude' => 24.7136,
            'longitude' => 46.6753,
            'is_active' => true,
            'is_verified' => true,
            'settings' => [],
        ];
    }
}
