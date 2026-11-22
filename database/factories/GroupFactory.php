<?php

namespace Database\Factories;

use App\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Group>
 */
class GroupFactory extends Factory
{
    protected $model = Group::class;

    public function definition(): array
    {
        $name = fake()->company();
        return [
            'name_ar' => 'مجموعة ' . $name . ' الطبية',
            'name_en' => $name . ' Medical Group',
            'slug' => 'grp-' . Str::slug($name) . '-' . Str::lower(Str::random(6)),
            'cr_number' => fake()->numerify('1010######'),
            'status' => 'active',
            'settings' => [],
        ];
    }
}
