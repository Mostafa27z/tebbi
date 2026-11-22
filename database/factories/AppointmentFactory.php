<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Appointment>
 */
class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    public function definition(): array
    {
        $fee = 200.00;
        $discount = 0.00;
        $tax = ($fee - $discount) * 0.15;
        $total = ($fee - $discount) + $tax;

        return [
            'booking_reference' => 'TB-' . strtoupper(Str::random(2)) . fake()->numberBetween(1000, 9999),
            'patient_id' => User::factory(['role' => 'patient']),
            'doctor_id' => DoctorProfile::factory(),
            'facility_id' => Facility::factory(),
            'doctor_facility_id' => null,
            'service_name' => 'كشف استشاري',
            'appointment_date' => now()->addDays(2)->format('Y-m-d'),
            'appointment_time' => '10:00:00',
            'duration_minutes' => 20,
            'status' => 'confirmed',
            'booking_confirmed_at' => now(),
            'payment_method' => 'at_clinic',
            'payment_status' => 'pending',
            'consultation_fee' => $fee,
            'discount' => $discount,
            'tax' => $tax,
            'total_amount' => $total,
            'notify_whatsapp' => false,
            'notify_sms' => false,
        ];
    }
}
