<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThreeStageConfirmationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_online_booking_creates_appointment_in_booked_status_awaiting_stage1(): void
    {
        $doctor = DoctorProfile::firstOrFail();
        $doctor->update([
            'slot_auto_confirm_limit' => 0,
            'slot_waitlist_limit' => 2,
        ]);

        $response = $this->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'patient_name' => 'عبدالله بن محمد',
            'patient_phone' => '0551122334',
            'appointment_date' => Carbon::today()->addDay()->toDateString(),
            'appointment_time' => '17:00:00',
            'payment_method' => 'at_clinic',
        ]);

        $response->assertStatus(302);

        $appointment = Appointment::latest('id')->firstOrFail();
        $this->assertEquals('booked', $appointment->status);
        $this->assertNull($appointment->booking_confirmed_at);
        $this->assertNull($appointment->arrival_confirmed_at);
        $this->assertNull($appointment->consultation_finished_at);

        $stages = $appointment->confirmation_stages;
        $this->assertFalse($stages['stage1_booking']['is_confirmed']);
        $this->assertFalse($stages['stage2_arrival']['is_confirmed']);
        $this->assertFalse($stages['stage3_kashf']['is_confirmed']);
    }

    public function test_facility_admin_can_confirm_booking_stage1(): void
    {
        $facilityAdmin = User::where('email', 'olaya.admin@tebiby.com')->firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();
        $doctor = DoctorProfile::where('clinic_id', $facility->id)->firstOrFail();

        $appointment = Appointment::create([
            'booking_reference' => 'TB-STAGE1',
            'patient_id' => User::where('role', 'patient')->firstOrFail()->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $facility->id,
            'appointment_date' => Carbon::today()->toDateString(),
            'appointment_time' => '16:00:00',
            'status' => 'booked',
            'payment_status' => 'pending',
            'payment_method' => 'cash',
            'consultation_fee' => 200,
            'total_amount' => 200,
        ]);

        $response = $this->actingAs($facilityAdmin)
            ->post("/facility/appointments/{$appointment->id}/confirm-booking");

        $response->assertSessionHas('success');

        $appointment->refresh();
        $this->assertEquals('confirmed', $appointment->status);
        $this->assertNotNull($appointment->booking_confirmed_at);
        $this->assertEquals($facilityAdmin->id, $appointment->booking_confirmed_by);

        $stages = $appointment->confirmation_stages;
        $this->assertTrue($stages['stage1_booking']['is_confirmed']);
        $this->assertFalse($stages['stage2_arrival']['is_confirmed']);
        $this->assertFalse($stages['stage3_kashf']['is_confirmed']);
    }

    public function test_receptionist_can_confirm_booking_stage1(): void
    {
        $receptionist = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();
        $doctor = DoctorProfile::where('clinic_id', $facility->id)->firstOrFail();

        $appointment = Appointment::create([
            'booking_reference' => 'TB-STAGE1-REC',
            'patient_id' => User::where('role', 'patient')->firstOrFail()->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $facility->id,
            'appointment_date' => Carbon::today()->toDateString(),
            'appointment_time' => '16:00:00',
            'status' => 'booked',
            'payment_status' => 'pending',
            'payment_method' => 'cash',
            'consultation_fee' => 200,
            'total_amount' => 200,
        ]);

        // Receptionist can confirm booking stage 1
        $response = $this->actingAs($receptionist)
            ->post("/facility/appointments/{$appointment->id}/confirm-booking");

        $response->assertRedirect();

        $appointment->refresh();
        $this->assertEquals('confirmed', $appointment->status);
        $this->assertNotNull($appointment->booking_confirmed_at);
        $this->assertEquals($receptionist->id, $appointment->booking_confirmed_by);
    }

    public function test_receptionist_can_confirm_arrival_stage2(): void
    {
        $receptionist = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();
        $doctor = DoctorProfile::where('clinic_id', $facility->id)->firstOrFail();

        $appointment = Appointment::create([
            'booking_reference' => 'TB-STAGE2',
            'patient_id' => User::where('role', 'patient')->firstOrFail()->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $facility->id,
            'appointment_date' => Carbon::today()->toDateString(),
            'appointment_time' => '17:00:00',
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'payment_method' => 'cash',
            'consultation_fee' => 200,
            'total_amount' => 200,
            'booking_confirmed_at' => Carbon::now()->subHour(),
        ]);

        $response = $this->actingAs($receptionist)
            ->post("/facility/appointments/{$appointment->id}/check-in");

        $response->assertSessionHas('success');

        $appointment->refresh();
        $this->assertEquals('waiting', $appointment->status);
        $this->assertNotNull($appointment->arrival_confirmed_at);
        $this->assertEquals($receptionist->id, $appointment->arrival_confirmed_by);

        $stages = $appointment->confirmation_stages;
        $this->assertTrue($stages['stage1_booking']['is_confirmed']);
        $this->assertTrue($stages['stage2_arrival']['is_confirmed']);
        $this->assertFalse($stages['stage3_kashf']['is_confirmed']);
    }

    public function test_receptionist_cannot_confirm_finish_consultation_stage3(): void
    {
        $receptionist = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();
        $doctor = DoctorProfile::where('clinic_id', $facility->id)->firstOrFail();

        $appointment = Appointment::create([
            'booking_reference' => 'TB-STAGE3-DENIED',
            'patient_id' => User::where('role', 'patient')->firstOrFail()->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $facility->id,
            'appointment_date' => Carbon::today()->toDateString(),
            'appointment_time' => '17:00:00',
            'status' => 'in_consultation',
            'payment_status' => 'paid',
            'payment_method' => 'cash',
            'consultation_fee' => 200,
            'total_amount' => 200,
            'booking_confirmed_at' => Carbon::now()->subHours(2),
            'arrival_confirmed_at' => Carbon::now()->subHour(),
        ]);

        // Receptionist attempts to set status completed
        $response = $this->actingAs($receptionist)
            ->post("/facility/appointments/{$appointment->id}/status", [
                'status' => 'completed',
            ]);

        $response->assertForbidden();

        $appointment->refresh();
        $this->assertEquals('in_consultation', $appointment->status);
        $this->assertNull($appointment->consultation_finished_at);
    }

    public function test_doctor_can_confirm_finish_consultation_stage3(): void
    {
        $doctorProfile = DoctorProfile::whereHas('user')->firstOrFail();
        $doctorUser = $doctorProfile->user;

        $appointment = Appointment::create([
            'booking_reference' => 'TB-STAGE3-DOCTOR',
            'patient_id' => User::where('role', 'patient')->firstOrFail()->id,
            'doctor_id' => $doctorProfile->id,
            'facility_id' => $doctorProfile->clinic_id,
            'appointment_date' => Carbon::today()->toDateString(),
            'appointment_time' => '18:00:00',
            'status' => 'in_consultation',
            'payment_status' => 'paid',
            'payment_method' => 'cash',
            'consultation_fee' => 200,
            'total_amount' => 200,
            'booking_confirmed_at' => Carbon::now()->subHours(2),
            'arrival_confirmed_at' => Carbon::now()->subHour(),
        ]);

        $response = $this->actingAs($doctorUser)
            ->post("/doctor/appointments/{$appointment->id}/complete", [
                'diagnosis' => 'نزلة معوية حادة مع جفاف بسيط',
                'notes' => 'ينصح بشرب السوائل وأخذ قسط من الراحة',
            ]);

        $response->assertSessionHas('success');

        $appointment->refresh();
        $this->assertEquals('completed', $appointment->status);
        $this->assertNotNull($appointment->consultation_finished_at);
        $this->assertEquals($doctorUser->id, $appointment->consultation_finished_by);

        $stages = $appointment->confirmation_stages;
        $this->assertTrue($stages['stage1_booking']['is_confirmed']);
        $this->assertTrue($stages['stage2_arrival']['is_confirmed']);
        $this->assertTrue($stages['stage3_kashf']['is_confirmed']);
    }

    public function test_walk_in_ticket_confirms_both_booking_and_arrival_immediately(): void
    {
        $receptionist = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();
        $doctor = DoctorProfile::where('clinic_id', $facility->id)->firstOrFail();

        $response = $this->actingAs($receptionist)
            ->post("/facility/{$facility->id}/walkin-ticket", [
                'doctor_profile_id' => $doctor->id,
                'patient_name' => 'مريض مباشر حضر الآن',
                'patient_phone' => '+966551144778',
            ]);

        $response->assertSessionHas('success');

        $appointment = Appointment::latest('id')->firstOrFail();
        $this->assertEquals('waiting', $appointment->status);
        $this->assertNotNull($appointment->booking_confirmed_at);
        $this->assertNotNull($appointment->arrival_confirmed_at);
        $this->assertNull($appointment->consultation_finished_at);

        $stages = $appointment->confirmation_stages;
        $this->assertTrue($stages['stage1_booking']['is_confirmed']);
        $this->assertTrue($stages['stage2_arrival']['is_confirmed']);
        $this->assertFalse($stages['stage3_kashf']['is_confirmed']);
    }

    public function test_platform_admin_can_confirm_booking_via_admin_route(): void
    {
        $admin = User::where('role', 'admin')->firstOrFail();
        $doctor = DoctorProfile::firstOrFail();

        $appointment = Appointment::create([
            'booking_reference' => 'TB-STAGE1-ADMIN',
            'patient_id' => User::where('role', 'patient')->firstOrFail()->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $doctor->clinic_id,
            'appointment_date' => Carbon::today()->toDateString(),
            'appointment_time' => '19:00:00',
            'status' => 'booked',
            'payment_status' => 'pending',
            'payment_method' => 'card',
            'consultation_fee' => 200,
            'total_amount' => 200,
        ]);

        $response = $this->actingAs($admin)
            ->post("/admin/appointments/{$appointment->id}/confirm-booking");

        $response->assertSessionHas('success');

        $appointment->refresh();
        $this->assertEquals('confirmed', $appointment->status);
        $this->assertNotNull($appointment->booking_confirmed_at);
        $this->assertEquals($admin->id, $appointment->booking_confirmed_by);
    }
}
