<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\User;
use Database\Seeders\TebibySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TebibyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TebibySeeder::class);
    }

    public function test_home_page_loads_successfully(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
    }

    public function test_guest_is_redirected_to_login_for_live_queue(): void
    {
        $response = $this->get('/queue/TB-92841');
        $response->assertRedirect('/login');
    }

    public function test_owner_patient_can_view_live_queue(): void
    {
        $patient = User::where('email', 'patient@tebiby.com')->first();
        $response = $this->actingAs($patient)->get('/queue/TB-92841');
        $response->assertStatus(200);
    }

    public function test_other_patient_cannot_view_someone_elses_live_queue(): void
    {
        $otherPatient = User::where('email', 'fahad.s@gmail.com')->first();
        $response = $this->actingAs($otherPatient)->get('/queue/TB-92841');
        $response->assertStatus(403);
    }

    public function test_doctor_can_view_patient_live_queue(): void
    {
        $doctorUser = User::where('role', 'doctor')->first();
        $response = $this->actingAs($doctorUser)->get('/queue/TB-92841');
        $response->assertStatus(200);
    }

    public function test_patient_portal_loads_for_patient(): void
    {
        $patient = User::where('role', 'patient')->first();
        $response = $this->actingAs($patient)->get('/patient/portal');
        $response->assertStatus(200);
    }

    public function test_doctor_dashboard_loads_for_doctor(): void
    {
        $doctorUser = User::where('role', 'doctor')->first();
        $response = $this->actingAs($doctorUser)->get('/doctor/dashboard');
        $response->assertStatus(200);
    }

    public function test_admin_analytics_loads_for_admin(): void
    {
        $adminUser = User::where('role', 'admin')->first();
        $response = $this->actingAs($adminUser)->get('/admin/analytics');
        $response->assertStatus(200);
    }

    public function test_booking_creates_ticket_and_redirects_to_live_queue(): void
    {
        $doctor = DoctorProfile::first();
        
        $response = $this->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'patient_name' => 'سعد بن عبدالعزيز التميمي',
            'patient_phone' => '0509988776',
            'patient_national_id' => '1029384751',
            'appointment_date' => '2026-11-06',
            'appointment_time' => '18:00:00',
            'payment_method' => 'insurance',
            'insurance_provider' => 'شركة بوبا العربية للتأمين',
            'insurance_policy_number' => 'BUP-772211',
            'notify_whatsapp' => true,
        ]);

        $response->assertStatus(302);
        
        $appt = Appointment::where('patient_notes', null)
            ->latest('id')
            ->first();
            
        $this->assertNotNull($appt);
        $this->assertNotNull($appt->queueTicket);
        $response->assertRedirect('/queue/' . $appt->booking_reference);
    }
}
