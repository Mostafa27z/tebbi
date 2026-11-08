<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use App\Models\User;
use Database\Seeders\TebibySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TebibyAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TebibySeeder::class);
    }

    public function test_login_screen_renders(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
        $page = $response->viewData('page');
        $this->assertArrayNotHasKey('demoAccounts', $page['props']);
    }

    public function test_register_screen_renders(): void
    {
        $response = $this->get('/register');
        $response->assertStatus(200);
    }

    public function test_doctor_can_login_and_redirects_to_doctor_dashboard(): void
    {
        $response = $this->post('/login', [
            'email' => 'dr.shammary@tebiby.com',
            'password' => 'password123',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/doctor/dashboard');
    }

    public function test_patient_can_login_and_redirects_to_dashboard(): void
    {
        $response = $this->post('/login', [
            'email' => 'patient@tebiby.com',
            'password' => 'password123',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_admin_can_login_and_redirects_to_admin_analytics(): void
    {
        $response = $this->post('/login', [
            'email' => 'admin@tebiby.com',
            'password' => 'password123',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/admin/analytics');
    }

    public function test_patient_cannot_access_doctor_dashboard(): void
    {
        $patient = User::where('email', 'patient@tebiby.com')->first();
        $response = $this->actingAs($patient)->get('/doctor/dashboard');
        $response->assertRedirect(route('patient.portal'));

        // API / JSON request receives explicit 403 Forbidden
        $jsonResponse = $this->actingAs($patient)->getJson('/doctor/dashboard');
        $jsonResponse->assertStatus(403);
    }

    public function test_doctor_cannot_access_admin_analytics(): void
    {
        $doctor = User::where('email', 'dr.shammary@tebiby.com')->first();
        $response = $this->actingAs($doctor)->get('/admin/analytics');
        $response->assertRedirect(route('doctor.dashboard'));

        // API / JSON request receives explicit 403 Forbidden
        $jsonResponse = $this->actingAs($doctor)->getJson('/admin/analytics');
        $jsonResponse->assertStatus(403);
    }

    public function test_guest_is_redirected_to_login_for_protected_routes(): void
    {
        $response = $this->get('/patient/portal');
        $response->assertRedirect('/login');

        $response = $this->get('/doctor/dashboard');
        $response->assertRedirect('/login');

        $response = $this->get('/admin/analytics');
        $response->assertRedirect('/login');
    }

    public function test_new_patient_registration(): void
    {
        $response = $this->post('/register', [
            'name' => 'سارة عبدالعزيز',
            'email' => 'sara.patient@example.com',
            'phone' => '0555123456',
            'role' => 'patient',
            'national_id' => '1029384756',
            'password' => 'Secret123!',
            'password_confirmation' => 'Secret123!',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'sara.patient@example.com',
            'role' => 'patient',
        ]);
    }

    public function test_new_doctor_registration_creates_doctor_profile(): void
    {
        $specialty = Specialty::first();
        $clinic = Clinic::first();

        $response = $this->post('/register', [
            'name' => 'د. فهد المحمدي',
            'email' => 'dr.fahad@example.com',
            'phone' => '0555987654',
            'role' => 'doctor',
            'specialty_id' => $specialty->id,
            'clinic_id' => $clinic->id,
            'title_ar' => 'أخصائي جراحة أطفال',
            'password' => 'Secret123!',
            'password_confirmation' => 'Secret123!',
        ]);

        $this->assertAuthenticated();
        $user = User::where('email', 'dr.fahad@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('doctor', $user->role);

        $this->assertDatabaseHas('doctor_profiles', [
            'user_id' => $user->id,
            'specialty_id' => $specialty->id,
            'clinic_id' => $clinic->id,
        ]);
    }

    public function test_doctor_cannot_complete_another_doctors_consultation(): void
    {
        // Doctor 2 (Dr. Sara) attempts to complete Doctor 1's (Dr. Abdelmohsen) appointment #1
        $doctorUser2 = User::where('email', 'dr.sara@tebiby.com')->first();
        $appointmentDoctor1 = Appointment::where('doctor_id', 1)->first();

        $response = $this->actingAs($doctorUser2)->post("/doctor/appointments/{$appointmentDoctor1->id}/consultation", [
            'diagnosis' => 'اختراق تشخيص غير مصرح',
            'notes' => 'تعديل غير مسموح',
        ]);

        $response->assertStatus(403);
    }

    public function test_assigned_doctor_can_complete_consultation(): void
    {
        $doctorUser1 = User::where('email', 'dr.shammary@tebiby.com')->first();
        $appointmentDoctor1 = Appointment::where('doctor_id', 1)->first();

        $response = $this->actingAs($doctorUser1)->post("/doctor/appointments/{$appointmentDoctor1->id}/consultation", [
            'diagnosis' => 'تشخيص معتمد من الطبيب المعالج',
            'notes' => 'المريض بحالة ممتازة',
        ]);

        $response->assertStatus(302);
        $this->assertEquals('completed', $appointmentDoctor1->fresh()->status);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::first();
        
        $response = $this->actingAs($user)->post('/logout');
        
        $this->assertGuest();
        $response->assertRedirect('/');
    }

    public function test_standard_credential_login_works_for_roles(): void
    {
        $response = $this->post('/login', [
            'email' => 'dr.shammary@tebiby.com',
            'password' => 'password123',
        ]);
        $this->assertAuthenticated();
        $response->assertRedirect('/doctor/dashboard');

        $this->post('/logout');

        $response = $this->post('/login', [
            'email' => 'admin@tebiby.com',
            'password' => 'password123',
        ]);
        $this->assertAuthenticated();
        $response->assertRedirect('/admin/analytics');
    }

    public function test_guest_cannot_takeover_existing_user_via_booking(): void
    {
        $existingPatient = User::where('email', 'patient@tebiby.com')->first();
        $doctor = DoctorProfile::first();

        // An unauthenticated attacker attempts to book using the existing patient's phone
        $response = $this->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'clinic_id' => $doctor->clinic_id,
            'patient_name' => 'Attacker Identity',
            'patient_phone' => $existingPatient->phone,
            'patient_national_id' => '1099999999',
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '11:00',
            'payment_method' => 'at_clinic',
        ]);

        // Must NOT log in the attacker into the existing patient's session
        $this->assertGuest();
        $response->assertRedirect(route('login'));
    }

    public function test_insurance_booking_sets_pending_verification_payment_status(): void
    {
        $doctor = DoctorProfile::first();

        $response = $this->post('/appointments/book', [
            'doctor_id' => $doctor->id,
            'clinic_id' => $doctor->clinic_id,
            'patient_name' => 'مريض تأمين تجريبي',
            'patient_phone' => '0599112233',
            'patient_national_id' => '1088776655',
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '11:30',
            'payment_method' => 'insurance',
            'insurance_company' => 'bupa',
            'insurance_policy_number' => 'BUPA-999-VERIF',
        ]);

        $appointment = Appointment::latest('id')->first();
        $this->assertEquals('pending_verification', $appointment->payment_status);
        $this->assertEquals('insurance', $appointment->payment_method);
    }
}
