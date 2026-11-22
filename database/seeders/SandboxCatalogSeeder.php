<?php

namespace Database\Seeders;

use App\Models\ConnectCredential;
use App\Models\DoctorFacility;
use App\Models\DoctorProfile;
use App\Models\DoctorSchedule;
use App\Models\DoctorService;
use App\Models\Facility;
use App\Models\Group;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SandboxCatalogSeeder extends Seeder
{
    public function run(): array
    {
        // 1. Test Group
        $group = Group::firstOrCreate(
            ['slug' => 'sandbox-group'],
            [
                'name_ar' => 'مجموعة طبيبي التجريبية',
                'name_en' => 'Tebiby Sandbox Healthcare Group',
                'status' => 'active',
            ]
        );

        // 2. Test Facility
        $facility = Facility::firstOrCreate(
            ['moh_license_no' => 'MOH-SANDBOX-001'],
            [
                'group_id' => $group->id,
                'name' => 'مستشفى طبيبي التجريبي',
                'branch_name' => 'الفرع الرئيسي',
                'type' => 'hospital',
                'status' => 'active',
                'city' => 'الرياض',
                'district' => 'العليا',
                'address' => 'طريق الملك فهد، العليا، الرياض',
                'phone' => '+966500000001',
                'map_url' => 'https://maps.google.com',
                'latitude' => 24.7136,
                'longitude' => 46.6753,
                'is_active' => true,
                'is_verified' => true,
                'settings' => [],
            ]
        );

        // 3. Specialties
        $specialtyGeneral = Specialty::firstOrCreate(
            ['name_ar' => 'طب الأسرة'],
            [
                'name_en' => 'Family Medicine',
                'icon_slug' => 'stethoscope',
                'badge_text' => 'شائع',
                'description' => 'الرعاية الصحية الأولية والشاملة لكافة أفراد العائلة',
            ]
        );

        $specialtyDental = Specialty::firstOrCreate(
            ['name_ar' => 'طب وجراحة الأسنان'],
            [
                'name_en' => 'Dentistry',
                'icon_slug' => 'dentistry',
                'badge_text' => 'استشاريون معتمدون',
                'description' => 'علاج وجراحة وتجميل الأسنان',
            ]
        );

        // 4. Doctor 1: Family Medicine
        $userDoc1 = User::firstOrCreate(
            ['email' => 'sandbox.doctor1@tebiby.test'],
            [
                'name' => 'د. فهد التميمي',
                'phone' => '+966500000002',
                'role' => 'doctor',
                'password' => Hash::make('SandboxPass123!'),
            ]
        );

        $doctor1 = DoctorProfile::firstOrCreate(
            ['user_id' => $userDoc1->id],
            [
                'specialty_id' => $specialtyGeneral->id,
                'clinic_id' => $facility->id,
                'title_ar' => 'استشاري أول طب الأسرة',
                'subspecialty' => 'الرعاية الوقائية والمزمنة',
                'bio' => 'طبيب استشاري بخبرة تفوق 15 عاماً في المستشفيات المعتمدة',
                'experience_years' => 15,
                'consultation_fee' => 200.00,
                'waiting_time_minutes' => 15,
                'slot_auto_confirm_limit' => 20,
                'slot_waitlist_limit' => 5,
                'accepts_insurance' => true,
                'is_available_today' => true,
                'approval_status' => 'approved',
                'license_no' => 'MOH-DOC-SB-01',
            ]
        );

        // Doctor 1 Services
        DoctorService::firstOrCreate(
            ['doctor_profile_id' => $doctor1->id, 'name' => 'كشف استشاري عام'],
            [
                'price' => 200.00,
                'duration_minutes' => 20,
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        DoctorService::firstOrCreate(
            ['doctor_profile_id' => $doctor1->id, 'name' => 'فحص وقائي شامل'],
            [
                'price' => 350.00,
                'duration_minutes' => 40,
                'is_active' => true,
                'sort_order' => 2,
            ]
        );

        // Doctor 1 Schedule (Sunday to Thursday, 09:00 - 17:00)
        for ($day = 0; $day <= 4; $day++) {
            DoctorSchedule::firstOrCreate(
                [
                    'doctor_profile_id' => $doctor1->id,
                    'day_of_week' => $day,
                ],
                [
                    'start_time' => '09:00:00',
                    'end_time' => '17:00:00',
                    'slot_duration_minutes' => 20,
                    'max_daily_patients' => 20,
                    'is_active' => true,
                ]
            );
        }

        // 5. Test Credential for Sandbox Partners
        $keys = ConnectCredential::generate('sandbox');
        $credential = ConnectCredential::create([
            'owner_type' => Group::class,
            'owner_id' => $group->id,
            'integration_name' => 'مفتاح الشريك التجريبي (Default Sandbox Partner)',
            'environment' => 'sandbox',
            'pk_prefix' => $keys['pk_prefix'],
            'pk_hash' => $keys['pk_hash'],
            'sk_prefix' => $keys['sk_prefix'],
            'sk_hash' => $keys['sk_hash'],
            'scopes' => ['*' => ['*']],
            'status' => 'active',
            'expires_at' => now()->addYear(),
        ]);

        return [
            'group' => $group,
            'facility' => $facility,
            'doctor' => $doctor1,
            'credential' => $credential,
            'keys' => $keys,
        ];
    }
}
