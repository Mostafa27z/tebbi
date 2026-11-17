<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\Facility;
use App\Models\QueueTicket;
use App\Models\User;
use App\Services\GupshupWhatsAppService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpClientRequest;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GupshupWhatsAppNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        Config::set('gupshup.enabled', true);
    }

    public function test_phone_number_normalization_handles_saudi_and_arabic_formats(): void
    {
        $service = app(GupshupWhatsAppService::class);

        $this->assertEquals('966501234567', $service->normalizePhoneNumber('0501234567'));
        $this->assertEquals('966501234567', $service->normalizePhoneNumber('+966501234567'));
        $this->assertEquals('966501234567', $service->normalizePhoneNumber('00966501234567'));
        $this->assertEquals('966501234567', $service->normalizePhoneNumber('501234567'));
        $this->assertEquals('966501234567', $service->normalizePhoneNumber('٠٥٠١٢٣٤٥٦٧'));
        $this->assertNull($service->normalizePhoneNumber(''));
    }

    public function test_online_booking_sends_template_1_booking_received(): void
    {
        Http::fake([
            'api.gupshup.io/*' => Http::response([
                'status' => 'submitted',
                'messageId' => 'msg-tpl-1',
            ], 202),
        ]);

        $doctor = DoctorProfile::firstOrFail();

        $response = $this->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'patient_name' => 'نواف العتيبي',
            'patient_phone' => '0559988776',
            'appointment_date' => Carbon::today()->addDay()->toDateString(),
            'appointment_time' => '17:30:00',
            'payment_method' => 'at_clinic',
            'notify_whatsapp' => true,
        ]);

        $response->assertStatus(302);

        Http::assertSent(function (HttpClientRequest $request) {
            $data = $request->data();
            $template = json_decode($data['template'] ?? '{}', true);

            return str_contains($request->url(), '/api/v1/template/msg')
                && $request->hasHeader('apikey', config('gupshup.api_key'))
                && ($data['destination'] ?? '') === '966559988776'
                && ($data['source'] ?? '') === '966537678660'
                && ($data['src.name'] ?? '') === 'miraah'
                && ($template['id'] ?? '') === config('gupshup.templates.booking_received.id')
                && ($template['params'][0] ?? '') === 'نواف العتيبي';
        });
    }

    public function test_confirming_booking_sends_template_2_booking_confirmed(): void
    {
        Http::fake([
            'api.gupshup.io/*' => Http::response(['status' => 'submitted', 'messageId' => 'msg-tpl-2'], 202),
        ]);

        $facilityAdmin = User::where('email', 'olaya.admin@tebiby.com')->firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();
        $doctor = DoctorProfile::where('clinic_id', $facility->id)->firstOrFail();
        $patient = User::where('role', 'patient')->firstOrFail();
        $patient->update(['phone' => '0501112233']);

        $appointment = Appointment::create([
            'booking_reference' => 'TB-GUP2',
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $facility->id,
            'appointment_date' => Carbon::today()->toDateString(),
            'appointment_time' => '18:00:00',
            'status' => 'booked',
            'payment_status' => 'pending',
            'payment_method' => 'cash',
            'consultation_fee' => 200,
            'total_amount' => 200,
            'notify_whatsapp' => true,
        ]);

        $this->actingAs($facilityAdmin)
            ->post("/facility/appointments/{$appointment->id}/confirm-booking")
            ->assertSessionHas('success');

        Http::assertSent(function (HttpClientRequest $request) {
            $data = $request->data();
            $template = json_decode($data['template'] ?? '{}', true);

            return ($data['destination'] ?? '') === '966501112233'
                && ($template['id'] ?? '') === config('gupshup.templates.booking_confirmed.id')
                && ($template['params'][1] ?? '') === 'TB-GUP2';
        });
    }

    public function test_receptionist_check_in_sends_template_3_arrival_confirmed(): void
    {
        Http::fake([
            'api.gupshup.io/*' => Http::response(['status' => 'submitted', 'messageId' => 'msg-tpl-3'], 202),
        ]);

        $receptionist = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();
        $doctor = DoctorProfile::where('clinic_id', $facility->id)->firstOrFail();
        $patient = User::where('role', 'patient')->firstOrFail();
        $patient->update(['phone' => '0502223344']);

        $appointment = Appointment::create([
            'booking_reference' => 'TB-GUP3',
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $facility->id,
            'appointment_date' => Carbon::today()->toDateString(),
            'appointment_time' => '18:30:00',
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'payment_method' => 'cash',
            'consultation_fee' => 200,
            'total_amount' => 200,
            'notify_whatsapp' => true,
        ]);

        $this->actingAs($receptionist)
            ->post("/facility/appointments/{$appointment->id}/check-in")
            ->assertSessionHas('success');

        Http::assertSent(function (HttpClientRequest $request) {
            $data = $request->data();
            $template = json_decode($data['template'] ?? '{}', true);

            return ($data['destination'] ?? '') === '966502223344'
                && ($template['id'] ?? '') === config('gupshup.templates.arrival_confirmed.id')
                && str_contains($template['params'][4] ?? '', '/queue/TB-GUP3');
        });
    }

    public function test_doctor_call_next_sends_template_5_to_called_patient_and_template_4_to_next_in_line(): void
    {
        Http::fake([
            'api.gupshup.io/*' => Http::response(['status' => 'submitted', 'messageId' => 'msg-tpl-45'], 202),
        ]);

        $doctor = DoctorProfile::whereHas('user')->firstOrFail();
        $doctorUser = $doctor->user;
        $today = Carbon::today()->toDateString();

        // Clear today's appointments for this doctor to have a deterministic queue
        Appointment::where('doctor_id', $doctor->id)->whereDate('appointment_date', $today)->delete();

        $patient1 = User::factory()->create(['name' => 'مريض الدور الحالي', 'phone' => '0503334455', 'role' => 'patient']);
        $patient2 = User::factory()->create(['name' => 'مريض الدور القادم', 'phone' => '0506667788', 'role' => 'patient']);

        $appt1 = Appointment::create([
            'booking_reference' => 'TB-CALL1',
            'patient_id' => $patient1->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $doctor->clinic_id,
            'appointment_date' => $today,
            'appointment_time' => '16:00:00',
            'status' => 'waiting',
            'payment_status' => 'paid',
            'payment_method' => 'cash',
            'consultation_fee' => 200,
            'total_amount' => 200,
            'notify_whatsapp' => true,
        ]);
        QueueTicket::create([
            'appointment_id' => $appt1->id,
            'ticket_number' => 10,
            'status' => 'waiting',
            'queue_date' => $today,
            'estimated_wait_minutes' => 0,
        ]);

        $appt2 = Appointment::create([
            'booking_reference' => 'TB-CALL2',
            'patient_id' => $patient2->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $doctor->clinic_id,
            'appointment_date' => $today,
            'appointment_time' => '16:20:00',
            'status' => 'waiting',
            'payment_status' => 'paid',
            'payment_method' => 'cash',
            'consultation_fee' => 200,
            'total_amount' => 200,
            'notify_whatsapp' => true,
        ]);
        QueueTicket::create([
            'appointment_id' => $appt2->id,
            'ticket_number' => 11,
            'status' => 'waiting',
            'queue_date' => $today,
            'estimated_wait_minutes' => 15,
        ]);

        $this->actingAs($doctorUser)
            ->post('/doctor/queue/call-next')
            ->assertSessionHas('success');

        // Assert Template 5 (patient_called) sent to Patient 1
        Http::assertSent(function (HttpClientRequest $request) {
            $data = $request->data();
            $template = json_decode($data['template'] ?? '{}', true);

            return ($data['destination'] ?? '') === '966503334455'
                && ($template['id'] ?? '') === config('gupshup.templates.patient_called.id')
                && ($template['params'][0] ?? '') === 'مريض الدور الحالي'
                && ($template['params'][3] ?? '') === '10';
        });

        // Assert Template 4 (turn_approaching) sent to Patient 2 (1 patient ahead)
        Http::assertSent(function (HttpClientRequest $request) {
            $data = $request->data();
            $template = json_decode($data['template'] ?? '{}', true);

            return ($data['destination'] ?? '') === '966506667788'
                && ($template['id'] ?? '') === config('gupshup.templates.turn_approaching.id')
                && ($template['params'][0] ?? '') === 'مريض الدور القادم'
                && ($template['params'][1] ?? '') === '11';
        });
    }

    public function test_doctor_completing_consultation_sends_template_6_consultation_completed(): void
    {
        Http::fake([
            'api.gupshup.io/*' => Http::response(['status' => 'submitted', 'messageId' => 'msg-tpl-6'], 202),
        ]);

        $doctor = DoctorProfile::whereHas('user')->firstOrFail();
        $doctorUser = $doctor->user;
        $patient = User::where('role', 'patient')->firstOrFail();
        $patient->update(['phone' => '0507778899']);

        $appointment = Appointment::create([
            'booking_reference' => 'TB-GUP6',
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $doctor->clinic_id,
            'appointment_date' => Carbon::today()->toDateString(),
            'appointment_time' => '19:00:00',
            'status' => 'in_consultation',
            'payment_status' => 'paid',
            'payment_method' => 'cash',
            'consultation_fee' => 200,
            'total_amount' => 200,
            'notify_whatsapp' => true,
        ]);

        $this->actingAs($doctorUser)
            ->post("/doctor/appointments/{$appointment->id}/complete", [
                'diagnosis' => 'التهاب جيوب أنفية حاد',
                'notes' => 'راحة تامة لمدة يومين',
            ])
            ->assertSessionHas('success');

        Http::assertSent(function (HttpClientRequest $request) {
            $data = $request->data();
            $template = json_decode($data['template'] ?? '{}', true);

            return ($data['destination'] ?? '') === '966507778899'
                && ($template['id'] ?? '') === config('gupshup.templates.consultation_completed.id')
                && str_starts_with($template['params'][2] ?? '', 'RX-');
        });
    }

    public function test_marking_no_show_sends_template_7_appointment_cancelled(): void
    {
        Http::fake([
            'api.gupshup.io/*' => Http::response(['status' => 'submitted', 'messageId' => 'msg-tpl-7'], 202),
        ]);

        $receptionist = User::where('email', 'reception.olaya@tebiby.com')->firstOrFail();
        $facility = Facility::where('name', 'like', '%العليا%')->firstOrFail();
        $doctor = DoctorProfile::where('clinic_id', $facility->id)->firstOrFail();
        $patient = User::where('role', 'patient')->firstOrFail();
        $patient->update(['phone' => '0509990000']);

        $appointment = Appointment::create([
            'booking_reference' => 'TB-GUP7',
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'facility_id' => $facility->id,
            'appointment_date' => Carbon::today()->toDateString(),
            'appointment_time' => '20:00:00',
            'status' => 'confirmed',
            'payment_status' => 'pending',
            'payment_method' => 'cash',
            'consultation_fee' => 200,
            'total_amount' => 200,
            'notify_whatsapp' => true,
        ]);

        $this->actingAs($receptionist)
            ->post("/facility/appointments/{$appointment->id}/no-show")
            ->assertSessionHas('success');

        Http::assertSent(function (HttpClientRequest $request) {
            $data = $request->data();
            $template = json_decode($data['template'] ?? '{}', true);

            return ($data['destination'] ?? '') === '966509990000'
                && ($template['id'] ?? '') === config('gupshup.templates.appointment_cancelled.id')
                && ($template['params'][1] ?? '') === 'TB-GUP7';
        });
    }
}
