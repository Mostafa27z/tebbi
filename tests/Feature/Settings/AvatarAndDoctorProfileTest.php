<?php

namespace Tests\Feature\Settings;

use App\Models\DoctorProfile;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AvatarAndDoctorProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_upload_and_delete_avatar(): void
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'role' => 'patient',
            'avatar' => null,
        ]);

        $file = UploadedFile::fake()->image('my-avatar.jpg', 400, 400);

        $response = $this
            ->actingAs($user)
            ->post('/settings/avatar', [
                'avatar' => $file,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/settings/profile');

        $user->refresh();
        $this->assertNotNull($user->avatar);
        $this->assertStringStartsWith('/storage/avatars/', $user->avatar);

        $storedPath = str_replace('/storage/', '', $user->avatar);
        Storage::disk('public')->assertExists($storedPath);

        // Now test delete avatar
        $deleteResponse = $this
            ->actingAs($user)
            ->delete('/settings/avatar');

        $deleteResponse
            ->assertSessionHasNoErrors()
            ->assertRedirect('/settings/profile');

        $user->refresh();
        $this->assertNull($user->avatar);
        Storage::disk('public')->assertMissing($storedPath);
    }

    public function test_doctor_can_update_professional_profile(): void
    {
        $specialty = Specialty::create([
            'name_ar' => 'طب الأطفال',
            'name_en' => 'Pediatrics',
            'icon_slug' => 'baby',
            'is_active' => true,
        ]);

        $doctorUser = User::factory()->create([
            'role' => 'doctor',
            'phone' => '0511111111',
            'national_id' => '1020304050',
        ]);

        $facility = \App\Models\Facility::create([
            'name' => 'مستشفى الشفاء',
            'type' => 'hospital',
            'city' => 'الرياض',
            'address' => 'طريق الملك فهد',
            'is_active' => true,
        ]);

        DoctorProfile::create([
            'user_id' => $doctorUser->id,
            'specialty_id' => $specialty->id,
            'clinic_id' => $facility->id,
            'title_ar' => 'أخصائي',
            'subspecialty' => 'أطفال حديثي الولادة',
            'consultation_fee' => 150,
            'waiting_time_minutes' => 20,
            'experience_years' => 3,
            'license_no' => 'DOC-1234',
            'bio' => 'نبذة أولية',
        ]);

        $response = $this
            ->actingAs($doctorUser)
            ->patch('/settings/profile', [
                'name' => 'د. أحمد محمود',
                'email' => $doctorUser->email,
                'phone' => '0599999999',
                'national_id' => '1099999999',
                'gender' => 'male',
                'title_ar' => 'استشاري أول',
                'subspecialty' => 'عناية مركزة للأطفال',
                'consultation_fee' => 300,
                'waiting_time_minutes' => 30,
                'experience_years' => 12,
                'license_no' => 'DOC-9999',
                'slot_auto_confirm_limit' => 2,
                'slot_waitlist_limit' => 3,
                'bio' => 'استشاري حاصل على البورد وممارس لأكثر من 12 عاماً.',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/settings/profile');

        $doctorUser->refresh();
        $this->assertSame('د. أحمد محمود', $doctorUser->name);
        $this->assertSame('0599999999', $doctorUser->phone);
        $this->assertSame('1099999999', $doctorUser->national_id);

        $docProfile = $doctorUser->doctorProfile;
        $this->assertSame('استشاري أول', $docProfile->title_ar);
        $this->assertSame('عناية مركزة للأطفال', $docProfile->subspecialty);
        $this->assertEquals(300, (float) $docProfile->consultation_fee);
        $this->assertEquals(30, $docProfile->waiting_time_minutes);
        $this->assertEquals(12, $docProfile->experience_years);
        $this->assertSame('DOC-9999', $docProfile->license_no);
        $this->assertEquals(2, $docProfile->slot_auto_confirm_limit);
        $this->assertEquals(3, $docProfile->slot_waitlist_limit);
        $this->assertSame('استشاري حاصل على البورد وممارس لأكثر من 12 عاماً.', $docProfile->bio);
    }
}
