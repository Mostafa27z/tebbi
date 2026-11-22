<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\Group;
use App\Models\QueueTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Group as TestGroup;
use Tests\TestCase;

#[TestGroup('mysql')]
class BookingCharacterizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('gupshup.enabled', true);
        Http::fake([
            'api.gupshup.io/*' => Http::response(['status' => 'submitted', 'messageId' => 'msg-test-1'], 202),
        ]);
    }

    public function test_confirms_database_connection_driver(): void
    {
        $driver = \Illuminate\Support\Facades\DB::connection()->getDriverName();
        $database = \Illuminate\Support\Facades\DB::connection()->getDatabaseName();
        fwrite(STDOUT, "\n[PROOF] Active DB Connection: Driver=[{$driver}], Database=[{$database}]\n");
        $this->assertNotEmpty($driver);
    }

    public function test_web_booking_creates_confirmed_appointment_and_queue_ticket_within_capacity(): void
    {
        $group = Group::factory()->create();
        $facility = Facility::factory()->create(['group_id' => $group->id]);
        $doctor = DoctorProfile::factory()->create([
            'clinic_id' => $facility->id,
            'consultation_fee' => 200.00,
            'slot_auto_confirm_limit' => 1,
            'slot_waitlist_limit' => 1,
            'waiting_time_minutes' => 15,
        ]);

        $payload = [
            'doctor_id' => $doctor->id,
            'patient_name' => 'أحمد العتيبي',
            'patient_phone' => '+966501234567',
            'appointment_date' => now()->addDays(2)->format('Y-m-d'),
            'appointment_time' => '10:00 ص',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => true,
        ];

        $response = $this->post(route('appointments.book'), $payload);
        $response->assertSessionHasNoErrors();
        $response->assertStatus(302);

        $this->assertDatabaseHas('appointments', [
            'doctor_id' => $doctor->id,
            'status' => 'confirmed',
            'consultation_fee' => 200.00,
            'tax' => 30.00,
            'total_amount' => 230.00,
        ]);

        $appointment = Appointment::where('doctor_id', $doctor->id)->first();
        $this->assertNotNull($appointment);
        $this->assertNotNull($appointment->booking_reference);
        $this->assertStringStartsWith('TB-', $appointment->booking_reference);

        $this->assertDatabaseHas('queue_tickets', [
            'appointment_id' => $appointment->id,
            'ticket_number' => 1,
            'status' => 'waiting',
        ]);
    }

    public function test_web_booking_enters_waitlist_when_auto_confirm_limit_is_exceeded(): void
    {
        $group = Group::factory()->create();
        $facility = Facility::factory()->create(['group_id' => $group->id]);
        $doctor = DoctorProfile::factory()->create([
            'clinic_id' => $facility->id,
            'slot_auto_confirm_limit' => 1,
            'slot_waitlist_limit' => 1,
            'waiting_time_minutes' => 15,
        ]);

        $date = now()->addDays(2)->format('Y-m-d');

        // First booking: auto-confirmed
        $this->post(route('appointments.book'), [
            'doctor_id' => $doctor->id,
            'patient_name' => 'مريض أول',
            'patient_phone' => '+966501111111',
            'appointment_date' => $date,
            'appointment_time' => '10:00:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => true,
        ])->assertSessionHasNoErrors();

        // Second booking: waitlisted (status = booked)
        $this->post(route('appointments.book'), [
            'doctor_id' => $doctor->id,
            'patient_name' => 'مريض ثاني',
            'patient_phone' => '+966502222222',
            'appointment_date' => $date,
            'appointment_time' => '10:00:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => true,
        ])->assertSessionHasNoErrors();

        $this->assertEquals(2, Appointment::where('doctor_id', $doctor->id)->count());
        $this->assertEquals(1, Appointment::where('doctor_id', $doctor->id)->where('status', 'confirmed')->count());
        $this->assertEquals(1, Appointment::where('doctor_id', $doctor->id)->where('status', 'booked')->count());
        $this->assertEquals(2, QueueTicket::count());
    }

    public function test_web_booking_rejects_when_total_capacity_is_exhausted(): void
    {
        $group = Group::factory()->create();
        $facility = Facility::factory()->create(['group_id' => $group->id]);
        $doctor = DoctorProfile::factory()->create([
            'clinic_id' => $facility->id,
            'slot_auto_confirm_limit' => 1,
            'slot_waitlist_limit' => 1,
            'waiting_time_minutes' => 15,
        ]);

        $date = now()->addDays(2)->format('Y-m-d');

        // Slot capacity is 1 + 1 = 2
        $this->post(route('appointments.book'), [
            'doctor_id' => $doctor->id,
            'patient_name' => 'مريض أول',
            'patient_phone' => '+966501111111',
            'appointment_date' => $date,
            'appointment_time' => '10:00:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => true,
        ])->assertSessionHasNoErrors();

        $this->post(route('appointments.book'), [
            'doctor_id' => $doctor->id,
            'patient_name' => 'مريض ثاني',
            'patient_phone' => '+966502222222',
            'appointment_date' => $date,
            'appointment_time' => '10:00:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => true,
        ])->assertSessionHasNoErrors();

        // Third booking: capacity exceeded -> 302 with session errors
        $response = $this->post(route('appointments.book'), [
            'doctor_id' => $doctor->id,
            'patient_name' => 'مريض ثالث',
            'patient_phone' => '+966503333333',
            'appointment_date' => $date,
            'appointment_time' => '10:00:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => true,
        ]);

        $response->assertSessionHasErrors('appointment_time');
        $this->assertEquals(2, Appointment::where('doctor_id', $doctor->id)->count());
    }

    public function test_web_booking_skips_whatsapp_when_notify_whatsapp_is_false(): void
    {
        $group = Group::factory()->create();
        $facility = Facility::factory()->create(['group_id' => $group->id]);
        $doctor = DoctorProfile::factory()->create([
            'clinic_id' => $facility->id,
        ]);

        Http::fake();

        $this->post(route('appointments.book'), [
            'doctor_id' => $doctor->id,
            'patient_name' => 'مريض بدون إشعار',
            'patient_phone' => '+966509999999',
            'appointment_date' => now()->addDays(2)->format('Y-m-d'),
            'appointment_time' => '10:00:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('appointments', [
            'doctor_id' => $doctor->id,
            'notify_whatsapp' => false,
        ]);

        // No HTTP requests were dispatched
        Http::assertNothingSent();
    }
}
