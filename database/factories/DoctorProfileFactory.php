<?php

namespace Database\Factories;

use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DoctorProfile>
 */
class DoctorProfileFactory extends Factory
{
    protected $model = DoctorProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(['role' => 'doctor']),
            'specialty_id' => Specialty::factory(),
            'clinic_id' => Facility::factory(),
            'title_ar' => fake()->randomElement(['استشاري', 'أخصائي أول', 'طبيب عام']),
            'subspecialty' => fake()->jobTitle(),
            'bio' => fake()->paragraph(),
            'experience_years' => fake()->numberBetween(5, 25),
            'consultation_fee' => fake()->randomElement([150.00, 200.00, 250.00, 300.00]),
            'rating' => 4.8,
            'review_count' => fake()->numberBetween(10, 200),
            'waiting_time_minutes' => 15,
            'slot_auto_confirm_limit' => 5,
            'slot_waitlist_limit' => 3,
            'accepts_insurance' => true,
            'accepted_insurances' => ['Bupa', 'Tawuniya'],
            'is_available_today' => true,
            'approval_status' => 'approved',
            'license_no' => 'SCFHS-' . fake()->numerify('########'),
            'license_expires_at' => now()->addYear(),
        ];
    }
}
