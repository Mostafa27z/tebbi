<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\DoctorService;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\TebibySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SlotCapacityAndAutoConfirmTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TebibySeeder::class);
    }

    public function test_doctor_can_update_slot_capacity_limits_and_validation_enforces_rules(): void
    {
        $doctorUser = User::where('role', 'doctor')->firstOrFail();
        $doctor = $doctorUser->doctorProfile;
        $patientUser = User::where('role', 'patient')->firstOrFail();

        // Valid update: 2 auto-confirm + 1 waitlist
        $this->actingAs($doctorUser)
            ->put('/doctor/slot-capacity', [
                'slot_auto_confirm_limit' => 2,
                'slot_waitlist_limit' => 1,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $doctor->refresh();
        $this->assertEquals(2, $doctor->slot_auto_confirm_limit);
        $this->assertEquals(1, $doctor->slot_waitlist_limit);

        // Total capacity 0 + 0 must fail validation
        $this->actingAs($doctorUser)
            ->put('/doctor/slot-capacity', [
                'slot_auto_confirm_limit' => 0,
                'slot_waitlist_limit' => 0,
            ])
            ->assertSessionHasErrors('slot_auto_confirm_limit');

        // Patient cannot update doctor slot capacity
        $this->actingAs($patientUser)
            ->putJson('/doctor/slot-capacity', [
                'slot_auto_confirm_limit' => 5,
                'slot_waitlist_limit' => 5,
            ])
            ->assertStatus(403);
    }

    public function test_one_auto_confirm_then_one_waitlist_then_red_full_rejection(): void
    {
        Config::set('gupshup.enabled', true);
        Http::fake([
            'api.gupshup.io/*' => Http::response(['status' => 'submitted', 'messageId' => 'msg-cap-1'], 202),
        ]);

        $doctor = DoctorProfile::firstOrFail();
        $doctor->update([
            'slot_auto_confirm_limit' => 1,
            'slot_waitlist_limit' => 1,
        ]);

        $date = Carbon::today()->addDays(15)->toDateString();

        // 1st booking (Green): immediately confirmed
        $this->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'patient_name' => 'مريض أول فوري',
            'patient_phone' => '0550001111',
            'appointment_date' => $date,
            'appointment_time' => '17:30:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => true,
        ])->assertStatus(302)->assertSessionHasNoErrors();

        $firstAppt = Appointment::latest('id')->firstOrFail();
        $this->assertEquals('confirmed', $firstAppt->status);
        $this->assertNotNull($firstAppt->booking_confirmed_at);
        $this->assertTrue($firstAppt->confirmation_stages['stage1_booking']['is_confirmed']);

        // Template 2 (booking_confirmed) was sent for auto-confirmed booking
        Http::assertSent(function ($request) {
            $data = $request->data();
            $tpl = json_decode($data['template'] ?? '{}', true);
            return ($tpl['id'] ?? '') === config('gupshup.templates.booking_confirmed.id');
        });

        // 2nd booking (Yellow): placed on waitlist ('booked'), unconfirmed
        $patient2 = User::where('role', 'patient')->firstOrFail();
        $this->actingAs($patient2)->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'patient_name' => 'مريض ثاني انتظار',
            'patient_phone' => '0550002222',
            'appointment_date' => $date,
            'appointment_time' => '17:30:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => true,
        ])->assertStatus(302)->assertSessionHasNoErrors();

        $secondAppt = Appointment::latest('id')->firstOrFail();
        $this->assertEquals('booked', $secondAppt->status);
        $this->assertNull($secondAppt->booking_confirmed_at);
        $this->assertFalse($secondAppt->confirmation_stages['stage1_booking']['is_confirmed']);

        // Template 1 (booking_received) was sent for waitlist booking
        Http::assertSent(function ($request) {
            $data = $request->data();
            $tpl = json_decode($data['template'] ?? '{}', true);
            return ($tpl['id'] ?? '') === config('gupshup.templates.booking_received.id');
        });

        // 3rd booking (Red / full): must be rejected
        $this->actingAs($patient2)->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'patient_name' => 'مريض ثالث مرفوض',
            'patient_phone' => '0550003333',
            'appointment_date' => $date,
            'appointment_time' => '17:30:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertSessionHasErrors('appointment_time');
    }

    public function test_two_auto_confirm_plus_one_waitlist_then_red_full(): void
    {
        $doctor = DoctorProfile::firstOrFail();
        $doctor->update([
            'slot_auto_confirm_limit' => 2,
            'slot_waitlist_limit' => 1,
        ]);

        $date = Carbon::today()->addDays(16)->toDateString();
        $patient = User::where('role', 'patient')->firstOrFail();

        // 1st booking -> confirmed
        $this->actingAs($patient)->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'patient_name' => 'الأول',
            'patient_phone' => '0551110001',
            'appointment_date' => $date,
            'appointment_time' => '17:30:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertSessionHasNoErrors();
        $this->assertEquals('confirmed', Appointment::latest('id')->firstOrFail()->status);

        // 2nd booking -> also confirmed immediately!
        $this->actingAs($patient)->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'patient_name' => 'الثاني',
            'patient_phone' => '0551110002',
            'appointment_date' => $date,
            'appointment_time' => '17:30:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertSessionHasNoErrors();
        $this->assertEquals('confirmed', Appointment::latest('id')->firstOrFail()->status);

        // 3rd booking -> waitlist ('booked')
        $this->actingAs($patient)->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'patient_name' => 'الثالث انتظار',
            'patient_phone' => '0551110003',
            'appointment_date' => $date,
            'appointment_time' => '17:30:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertSessionHasNoErrors();
        $this->assertEquals('booked', Appointment::latest('id')->firstOrFail()->status);

        // 4th booking -> Red / rejected
        $this->actingAs($patient)->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'patient_name' => 'الرابع مرفوض',
            'patient_phone' => '0551110004',
            'appointment_date' => $date,
            'appointment_time' => '17:30:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertSessionHasErrors('appointment_time');
    }

    public function test_zero_waitlist_rejects_immediately_after_auto_confirm_limit(): void
    {
        $doctor = DoctorProfile::firstOrFail();
        $doctor->update([
            'slot_auto_confirm_limit' => 1,
            'slot_waitlist_limit' => 0,
        ]);

        $date = Carbon::today()->addDays(17)->toDateString();
        $patient = User::where('role', 'patient')->firstOrFail();

        $this->actingAs($patient)->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'patient_name' => 'حجز وحيد',
            'patient_phone' => '0552220001',
            'appointment_date' => $date,
            'appointment_time' => '17:30:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertSessionHasNoErrors();

        $this->assertEquals('confirmed', Appointment::latest('id')->firstOrFail()->status);

        // 2nd overlapping booking must be rejected right away
        $this->actingAs($patient)->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'patient_name' => 'حجز مرفوض',
            'patient_phone' => '0552220002',
            'appointment_date' => $date,
            'appointment_time' => '17:30:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertSessionHasErrors('appointment_time');
    }

    public function test_variable_duration_sweep_line_and_cancellation_frees_capacity(): void
    {
        $doctor = DoctorProfile::firstOrFail();
        $doctor->update([
            'slot_auto_confirm_limit' => 1,
            'slot_waitlist_limit' => 1,
        ]);

        $longService = DoctorService::create([
            'doctor_profile_id' => $doctor->id,
            'name' => 'خلع جراحي 5 ساعات',
            'price' => 1100,
            'duration_minutes' => 300,
            'is_active' => true,
        ]);

        $shortService = DoctorService::create([
            'doctor_profile_id' => $doctor->id,
            'name' => 'كشف قصير',
            'price' => 150,
            'duration_minutes' => 30,
            'is_active' => true,
        ]);

        $date = Carbon::today()->addDays(18)->toDateString();
        $patient = User::where('role', 'patient')->firstOrFail();

        // Booked slots API exposes capacity limits
        $this->getJson("/api/doctors/{$doctor->id}/booked-slots?date={$date}")
            ->assertStatus(200)
            ->assertJsonPath('slot_auto_confirm_limit', 1)
            ->assertJsonPath('slot_waitlist_limit', 1)
            ->assertJsonPath('total_slot_capacity', 2);

        // 1st booking: 16:00 for 300 min (16:00 -> 21:00) => confirmed
        $this->actingAs($patient)->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'doctor_service_id' => $longService->id,
            'patient_name' => 'المريض الأول',
            'patient_phone' => '0553330001',
            'appointment_date' => $date,
            'appointment_time' => '16:00:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertSessionHasNoErrors();

        $first = Appointment::latest('id')->firstOrFail();
        $this->assertEquals('confirmed', $first->status);

        // 2nd booking: 18:00 for 30 min (overlaps 16:00 -> 21:00) => waitlist ('booked')
        $this->actingAs($patient)->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'doctor_service_id' => $shortService->id,
            'patient_name' => 'المريض الثاني',
            'patient_phone' => '0553330002',
            'appointment_date' => $date,
            'appointment_time' => '18:00:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertSessionHasNoErrors();

        $second = Appointment::latest('id')->firstOrFail();
        $this->assertEquals('booked', $second->status);

        // 3rd booking at 18:00 overlaps both => rejected (peak 2 >= 2)
        $this->actingAs($patient)->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'doctor_service_id' => $shortService->id,
            'patient_name' => 'المريض الثالث',
            'patient_phone' => '0553330003',
            'appointment_date' => $date,
            'appointment_time' => '18:00:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertSessionHasErrors('appointment_time');

        // Back-to-back booking at 21:00 (when 16:00+300m ends) has peak 0 => confirmed!
        $this->actingAs($patient)->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'doctor_service_id' => $shortService->id,
            'patient_name' => 'المريض التالي بعد الجراحة',
            'patient_phone' => '0553330004',
            'appointment_date' => $date,
            'appointment_time' => '21:00:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertSessionHasNoErrors();
        $this->assertEquals('confirmed', Appointment::latest('id')->firstOrFail()->status);

        // Cancelling the 1st booking frees capacity at 18:00 so a new booking succeeds
        $first->update(['status' => 'cancelled']);

        $this->actingAs($patient)->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'doctor_service_id' => $shortService->id,
            'patient_name' => 'مريض بديل بعد الإلغاء',
            'patient_phone' => '0553330005',
            'appointment_date' => $date,
            'appointment_time' => '18:00:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => false,
        ])->assertSessionHasNoErrors();
    }
}
