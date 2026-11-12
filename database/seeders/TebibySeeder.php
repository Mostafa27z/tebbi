<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\DoctorFacility;
use App\Models\DoctorProfile;
use App\Models\DoctorSchedule;
use App\Models\Facility;
use App\Models\Group;
use App\Models\MedicalRecord;
use App\Models\Prescription;
use App\Models\QueueTicket;
use App\Models\RoleAssignment;
use App\Models\Specialty;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TebibySeeder extends Seeder
{
    public function run(): void
    {
        // ==========================================
        // 1. Medical Specialties (8 Specialties)
        // ==========================================
        $specialties = [
            [
                'name_ar' => 'طب وجراحة الأسنان',
                'name_en' => 'Dentistry & Oral Surgery',
                'icon_slug' => 'dentistry',
                'badge_text' => 'أكثر طلباً',
                'description' => 'زراعة الأسنان، التقويم الشفاف، تبييض وتنظيف، جراحة الفكين والتركيبات',
            ],
            [
                'name_ar' => 'الجلدية والتجميل والليزر',
                'name_en' => 'Dermatology & Cosmetics',
                'icon_slug' => 'dermatology',
                'badge_text' => 'شائع جداً',
                'description' => 'علاج حب الشباب، إزالة الشعر بالليزر، الفيلر والبوتوكس، نضارة البشرة',
            ],
            [
                'name_ar' => 'الأطفال وحديثي الولادة',
                'name_en' => 'Pediatrics & Neonatology',
                'icon_slug' => 'pediatrics',
                'badge_text' => 'عناية خاصة',
                'description' => 'متابعة النمو، التطعيمات الدورية، حساسية الصدر وأمراض الأطفال الشائعة',
            ],
            [
                'name_ar' => 'الباطنة والجهاز الهضمي',
                'name_en' => 'Internal Medicine & Gastroenterology',
                'icon_slug' => 'internal_medicine',
                'badge_text' => 'أطباء معتمدون',
                'description' => 'علاج القولون، السكري، ضغط الدم، الغدد الصماء ومناظير الجهاز الهضمي',
            ],
            [
                'name_ar' => 'العظام والمفاصل',
                'name_en' => 'Orthopedics & Joint Surgery',
                'icon_slug' => 'orthopedics',
                'badge_text' => 'جراحة متقدمة',
                'description' => 'خشونة الركبة، إصابات الملاعب والرباط الصليبي، تبديل المفاصل والعمود الفقري',
            ],
            [
                'name_ar' => 'العيون وجراحة الليزر',
                'name_en' => 'Ophthalmology & Lasik',
                'icon_slug' => 'ophthalmology',
                'badge_text' => 'تقنيات حديثة',
                'description' => 'تصحيح النظر بالفيمتو ليزك، المياه البيضاء والزرقاء، شبكية العين',
            ],
            [
                'name_ar' => 'المخ والأعصاب',
                'name_en' => 'Neurology & Neurosurgery',
                'icon_slug' => 'neurology',
                'badge_text' => 'نخبة الاستشاريين',
                'description' => 'الصداع النصفي، الصرع، التصلب اللويحي، آلام الأعصاب والانزلاق الغضروفي',
            ],
            [
                'name_ar' => 'القلب والأوعية الدموية',
                'name_en' => 'Cardiology & Vascular',
                'icon_slug' => 'cardiology',
                'badge_text' => 'طوارئ وعيادات',
                'description' => 'قسطرة القلب التشخيصية، تخطيط صدى القلب (الإيكو)، اضطرابات النبض والضغط',
            ],
        ];

        $specModels = [];
        foreach ($specialties as $sp) {
            $specModels[$sp['icon_slug']] = Specialty::create($sp);
        }

        // ==========================================
        // 2. Medical Groups (المجمعات والمنظومات الطبية)
        // ==========================================
        $habeebGroup = Group::create([
            'name_ar' => 'مجموعة د. سليمان الحبيب الطبية',
            'name_en' => 'Dr. Sulaiman Al Habib Medical Group',
            'slug' => 'habeeb-medical-group',
            'logo_url' => '/images/clinics/habeeb.png',
            'cr_number' => '1010187423',
            'status' => 'active',
        ]);

        $mouwasatGroup = Group::create([
            'name_ar' => 'مجموعة المواساة للخدمات الطبية',
            'name_en' => 'Mouwasat Medical Services',
            'slug' => 'mouwasat-medical-group',
            'logo_url' => '/images/clinics/mouwasat.png',
            'cr_number' => '1010245678',
            'status' => 'active',
        ]);

        $sghGroup = Group::create([
            'name_ar' => 'مجموعة المستشفى السعودي الألماني الصحية',
            'name_en' => 'Saudi German Health Group',
            'slug' => 'sgh-medical-group',
            'logo_url' => '/images/clinics/sgh.png',
            'cr_number' => '4030119845',
            'status' => 'active',
        ]);

        // ==========================================
        // 2.1 Facilities across Riyadh, Jeddah, Dammam
        // ==========================================
        $facility1 = Facility::create([
            'group_id' => $habeebGroup->id,
            'name' => 'مستشفى د. سليمان الحبيب - العليا',
            'branch_name' => 'مجمع العليا الطبي - طريق الملك فهد',
            'type' => 'hospital',
            'moh_license_no' => 'MOH-RYD-9941',
            'city' => 'الرياض',
            'district' => 'العليا',
            'address' => 'طريق الملك فهد، حي العليا، الرياض 12214',
            'phone' => '+966112833333',
            'map_url' => 'https://maps.google.com/?q=24.6978,46.6841',
            'latitude' => 24.6978,
            'longitude' => 46.6841,
            'logo_url' => '/images/clinics/habeeb.png',
            'is_active' => true,
            'is_verified' => true,
        ]);

        $facility2 = Facility::create([
            'group_id' => $habeebGroup->id,
            'name' => 'عيادات د. سليمان الحبيب التخصصية - الصحافة',
            'branch_name' => 'مركز الرعاية النهارية والعيادات الخارجية',
            'type' => 'clinic',
            'moh_license_no' => 'MOH-RYD-9942',
            'city' => 'الرياض',
            'district' => 'الصحافة',
            'address' => 'طريق الملك فهد الفرعي، حي الصحافة، الرياض',
            'phone' => '+966112833334',
            'map_url' => 'https://maps.google.com/?q=24.7955,46.6433',
            'latitude' => 24.7955,
            'longitude' => 46.6433,
            'logo_url' => '/images/clinics/habeeb.png',
            'is_active' => true,
            'is_verified' => true,
        ]);

        $facility3 = Facility::create([
            'group_id' => $mouwasatGroup->id,
            'name' => 'مستشفى المواساة الحديث - قرطبة',
            'branch_name' => 'المقر الإقليمي بشرق الرياض',
            'type' => 'hospital',
            'moh_license_no' => 'MOH-RYD-8821',
            'city' => 'الرياض',
            'district' => 'قرطبة',
            'address' => 'طريق الثمامة، حي قرطبة، الرياض',
            'phone' => '+966114888888',
            'map_url' => 'https://maps.google.com/?q=24.8122,46.7410',
            'latitude' => 24.8122,
            'longitude' => 46.7410,
            'logo_url' => '/images/clinics/mouwasat.png',
            'is_active' => true,
            'is_verified' => true,
        ]);

        $facility4 = Facility::create([
            'group_id' => $mouwasatGroup->id,
            'name' => 'عيادات المواساة اليومية - السليمانية',
            'branch_name' => 'مجمع العيادات التخصصية - وسط الرياض',
            'type' => 'clinic',
            'moh_license_no' => 'MOH-RYD-8822',
            'city' => 'الرياض',
            'district' => 'السليمانية',
            'address' => 'شارع التحلية، حي السليمانية، الرياض',
            'phone' => '+966114888889',
            'map_url' => 'https://maps.google.com/?q=24.7000,46.7000',
            'latitude' => 24.7000,
            'longitude' => 46.7000,
            'logo_url' => '/images/clinics/mouwasat.png',
            'is_active' => true,
            'is_verified' => true,
        ]);

        $facility5 = Facility::create([
            'group_id' => $habeebGroup->id,
            'name' => 'مستشفى د. سليمان الحبيب - الفيحاء',
            'branch_name' => 'فرع جدة الإقليمي',
            'type' => 'hospital',
            'moh_license_no' => 'MOH-JED-7710',
            'city' => 'جدة',
            'district' => 'الفيحاء',
            'address' => 'طريق الملك عبدالله، حي الفيحاء، جدة',
            'phone' => '+966126100000',
            'map_url' => 'https://maps.google.com/?q=21.5030,39.2150',
            'latitude' => 21.5030,
            'longitude' => 39.2150,
            'logo_url' => '/images/clinics/habeeb.png',
            'is_active' => true,
            'is_verified' => true,
        ]);

        $facility6 = Facility::create([
            'group_id' => $sghGroup->id,
            'name' => 'المستشفى السعودي الألماني - الزهراء',
            'branch_name' => 'المدينة الطبية بجدة',
            'type' => 'hospital',
            'moh_license_no' => 'MOH-JED-6401',
            'city' => 'جدة',
            'district' => 'الزهراء',
            'address' => 'طريق البترجي، حي الزهراء، جدة',
            'phone' => '+966126829000',
            'map_url' => 'https://maps.google.com/?q=21.5844,39.1432',
            'latitude' => 21.5844,
            'longitude' => 39.1432,
            'logo_url' => '/images/clinics/sgh.png',
            'is_active' => true,
            'is_verified' => true,
        ]);

        $facility7 = Facility::create([
            'group_id' => $mouwasatGroup->id,
            'name' => 'مستشفى المواساة التخصصي - الفيصلية',
            'branch_name' => 'المقر الرئيسي بالمنطقة الشرقية',
            'type' => 'hospital',
            'moh_license_no' => 'MOH-DMM-5120',
            'city' => 'الدمام',
            'district' => 'الفيصلية',
            'address' => 'طريق الإمام محمد بن سعود، حي الفيصلية، الدمام',
            'phone' => '+966138200000',
            'map_url' => 'https://maps.google.com/?q=26.3927,50.0445',
            'latitude' => 26.3927,
            'longitude' => 50.0445,
            'logo_url' => '/images/clinics/mouwasat.png',
            'is_active' => true,
            'is_verified' => true,
        ]);

        $facility8 = Facility::create([
            'group_id' => $sghGroup->id,
            'name' => 'عيادات السعودي الألماني التخصصية - الشاطئ',
            'branch_name' => 'مركز العيادات الاستشارية بالشرقية',
            'type' => 'clinic',
            'moh_license_no' => 'MOH-DMM-5199',
            'city' => 'الدمام',
            'district' => 'الشاطئ الغربي',
            'address' => 'طريق الخليج، حي الشاطئ الغربي، الدمام',
            'phone' => '+966138090000',
            'map_url' => 'https://maps.google.com/?q=26.4620,50.1120',
            'latitude' => 26.4620,
            'longitude' => 50.1120,
            'logo_url' => '/images/clinics/sgh.png',
            'is_active' => true,
            'is_verified' => false, // Pending verification to showcase review badge in Admin UI
        ]);

        // ==========================================
        // 3. Platform & Hierarchy Admins
        // ==========================================
        // 3.1 Platform Super Admin
        User::create([
            'name' => 'مدير منصة طبيبي (مشرف المنصة العام)',
            'email' => 'admin@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966500000001',
            'role' => 'admin',
            'national_id' => '1000000001',
            'avatar' => 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=faces',
        ]);

        // 3.2 Group Admins
        $habeebAdmin = User::create([
            'name' => 'أحمد العلي (مدير مجمع الحبيب)',
            'email' => 'habeeb.admin@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966500000002',
            'role' => 'patient',
            'national_id' => '1000000002',
            'avatar' => 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=faces',
        ]);
        RoleAssignment::create([
            'user_id' => $habeebAdmin->id,
            'role' => 'group_admin',
            'scope_type' => 'group',
            'scope_id' => $habeebGroup->id,
        ]);

        $mouwasatAdmin = User::create([
            'name' => 'فيصل الحربي (مدير مجمع المواساة)',
            'email' => 'mouwasat.admin@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966500000005',
            'role' => 'patient',
            'national_id' => '1000000005',
        ]);
        RoleAssignment::create([
            'user_id' => $mouwasatAdmin->id,
            'role' => 'group_admin',
            'scope_type' => 'group',
            'scope_id' => $mouwasatGroup->id,
        ]);

        $sghAdmin = User::create([
            'name' => 'ماجد الغامدي (مدير السعودي الألماني)',
            'email' => 'sgh.admin@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966500000008',
            'role' => 'patient',
            'national_id' => '1000000008',
        ]);
        RoleAssignment::create([
            'user_id' => $sghAdmin->id,
            'role' => 'group_admin',
            'scope_type' => 'group',
            'scope_id' => $sghGroup->id,
        ]);

        // 3.3 Facility Admins & Receptionists
        $olayaAdmin = User::create([
            'name' => 'سلمان الرشيد (مدير مستشفى العليا)',
            'email' => 'olaya.admin@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966500000003',
            'role' => 'patient',
            'national_id' => '1000000003',
        ]);
        RoleAssignment::create([
            'user_id' => $olayaAdmin->id,
            'role' => 'facility_admin',
            'scope_type' => 'facility',
            'scope_id' => $facility1->id,
        ]);

        $olayaReception = User::create([
            'name' => 'خالد الدوسري (استقبال العليا)',
            'email' => 'reception.olaya@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966500000004',
            'role' => 'patient',
            'national_id' => '1000000004',
        ]);
        RoleAssignment::create([
            'user_id' => $olayaReception->id,
            'role' => 'receptionist',
            'scope_type' => 'facility',
            'scope_id' => $facility1->id,
        ]);

        $sahafaAdmin = User::create([
            'name' => 'وليد السديري (مدير عيادات الصحافة)',
            'email' => 'sahafa.admin@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966500000009',
            'role' => 'patient',
            'national_id' => '1000000009',
        ]);
        RoleAssignment::create([
            'user_id' => $sahafaAdmin->id,
            'role' => 'facility_admin',
            'scope_type' => 'facility',
            'scope_id' => $facility2->id,
        ]);

        $qurtubahAdmin = User::create([
            'name' => 'بندر القحطاني (مدير مستشفى المواساة - قرطبة)',
            'email' => 'qurtubah.admin@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966500000006',
            'role' => 'patient',
            'national_id' => '1000000006',
        ]);
        RoleAssignment::create([
            'user_id' => $qurtubahAdmin->id,
            'role' => 'facility_admin',
            'scope_type' => 'facility',
            'scope_id' => $facility3->id,
        ]);

        $qurtubahReception = User::create([
            'name' => 'ناصر السبيعي (استقبال المواساة - قرطبة)',
            'email' => 'reception.qurtubah@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966500000007',
            'role' => 'patient',
            'national_id' => '1000000007',
        ]);
        RoleAssignment::create([
            'user_id' => $qurtubahReception->id,
            'role' => 'receptionist',
            'scope_type' => 'facility',
            'scope_id' => $facility3->id,
        ]);

        $jeddahAdmin = User::create([
            'name' => 'عمر باخشب (مدير مستشفى الحبيب - جدة)',
            'email' => 'jeddah.admin@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966500000010',
            'role' => 'patient',
            'national_id' => '1000000010',
        ]);
        RoleAssignment::create([
            'user_id' => $jeddahAdmin->id,
            'role' => 'facility_admin',
            'scope_type' => 'facility',
            'scope_id' => $facility5->id,
        ]);

        // ==========================================
        // 4. Doctors across ALL 8 Specialties & Cities
        // ==========================================
        $doctorsData = [
            // 1. Dentistry (Riyadh - Facility 1 & 2)
            [
                'name' => 'د. عبدالمحسن الشمري',
                'email' => 'dr.shammary@tebiby.com',
                'phone' => '+966501112233',
                'national_id' => '1029384756',
                'gender' => 'male',
                'avatar' => 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop&crop=faces',
                'specialty' => 'dentistry',
                'facility_id' => $facility1->id,
                'extra_facilities' => [
                    ['facility_id' => $facility2->id, 'fee' => 200.00, 'slot' => 15],
                ],
                'title_ar' => 'استشاري جراحة وزراعة الأسنان والتركيبات',
                'subspecialty' => 'زراعة وتجميل الأسنان الفورية، تقويم شفاف، جراحة الفكين المتقدمة',
                'bio' => 'زميل الكلية الملكية للجراحين بإدنبرة، خبرة أكثر من ١٦ عاماً في مستشفيات مرموقة داخل وخارج المملكة.',
                'experience_years' => 16,
                'consultation_fee' => 250.00,
                'rating' => 4.9,
                'review_count' => 382,
                'waiting_time_minutes' => 15,
                'insurances' => ['شركة بوبا العربية للتأمين', 'شركة التعاونية للتأمين', 'ميدغلف', 'تكافل الراجحي'],
                'is_available_today' => true,
            ],
            // 2. Dermatology (Riyadh - Facility 1 & 4)
            [
                'name' => 'د. سارة المنصور',
                'email' => 'dr.sara@tebiby.com',
                'phone' => '+966502223344',
                'national_id' => '1038475692',
                'gender' => 'female',
                'avatar' => 'https://images.unsplash.com/photo-1594824813583-7c8585e82117?w=300&h=300&fit=crop&crop=faces',
                'specialty' => 'dermatology',
                'facility_id' => $facility1->id,
                'extra_facilities' => [
                    ['facility_id' => $facility4->id, 'fee' => 280.00, 'slot' => 15],
                ],
                'title_ar' => 'استشارية الأمراض الجلدية وجراحة الليزر والتجميل',
                'subspecialty' => 'علاج التصبغات والندبات، حقن الفيلر والبوتوكس، شد الوجه غير الجراحي',
                'bio' => 'البورد الأمريكي في طب الجلد التجميلي، أكثر من ١٢ عاماً في علاج الأمراض الجلدية المستعصية.',
                'experience_years' => 12,
                'consultation_fee' => 300.00,
                'rating' => 4.9,
                'review_count' => 512,
                'waiting_time_minutes' => 10,
                'insurances' => ['بوبا العربية', 'التعاونية', 'ولاء للتأمين'],
                'is_available_today' => true,
            ],
            // 3. Internal Medicine (Riyadh - Facility 2)
            [
                'name' => 'د. خالد العوهلي',
                'email' => 'dr.khaled@tebiby.com',
                'phone' => '+966503334455',
                'national_id' => '1047586932',
                'gender' => 'male',
                'avatar' => 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=faces',
                'specialty' => 'internal_medicine',
                'facility_id' => $facility2->id,
                'extra_facilities' => [],
                'title_ar' => 'استشاري الأمراض الباطنية والجهاز الهضمي والمناظير',
                'subspecialty' => 'علاج القولون العصبي، ارتجاع المريء، دهون الكبد، السكري والضغط',
                'bio' => 'البورد الكندي في الأمراض الباطنية ومناظير الجهاز الهضمي المتقدمة.',
                'experience_years' => 18,
                'consultation_fee' => 280.00,
                'rating' => 4.8,
                'review_count' => 290,
                'waiting_time_minutes' => 20,
                'insurances' => ['بوبا العربية', 'التعاونية', 'ميدغلف', 'سلامة'],
                'is_available_today' => true,
            ],
            // 4. Orthopedics (Riyadh - Facility 3 & 4)
            [
                'name' => 'د. فهد العتيبي',
                'email' => 'dr.fahad@tebiby.com',
                'phone' => '+966504445566',
                'national_id' => '1058473921',
                'gender' => 'male',
                'avatar' => 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=faces',
                'specialty' => 'orthopedics',
                'facility_id' => $facility3->id,
                'extra_facilities' => [
                    ['facility_id' => $facility4->id, 'fee' => 300.00, 'slot' => 20],
                ],
                'title_ar' => 'استشاري جراحة العظام والمفاصل والعمود الفقري',
                'subspecialty' => 'تبديل مفاصل الركبة والحوض، مناظير الكتف وإصابات الملاعب',
                'bio' => 'البورد الفرنسي لجراحة العظام، استشاري سابق في مستشفيات باريس الجامعية.',
                'experience_years' => 15,
                'consultation_fee' => 320.00,
                'rating' => 4.9,
                'review_count' => 420,
                'waiting_time_minutes' => 15,
                'insurances' => ['بوبا العربية', 'التعاونية', 'ميدغلف', 'الدرع العربي'],
                'is_available_today' => true,
            ],
            // 5. Pediatrics (Riyadh - Facility 1)
            [
                'name' => 'د. منى السبيعي',
                'email' => 'dr.mona@tebiby.com',
                'phone' => '+966505556677',
                'national_id' => '1069584731',
                'gender' => 'female',
                'avatar' => 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=faces',
                'specialty' => 'pediatrics',
                'facility_id' => $facility1->id,
                'extra_facilities' => [],
                'title_ar' => 'استشارية طب الأطفال وحديثي الولادة والحساسية',
                'subspecialty' => 'متابعة النمو والتطور، حساسية الصدر والربو لدى الأطفال، التطعيمات',
                'bio' => 'الزمالة السعودية والبورد العربي في طب الأطفال وحديثي الولادة، خبرة ١٤ عاماً.',
                'experience_years' => 14,
                'consultation_fee' => 220.00,
                'rating' => 4.9,
                'review_count' => 345,
                'waiting_time_minutes' => 12,
                'insurances' => ['بوبا العربية', 'التعاونية', 'ميدغلف', 'تكافل الراجحي'],
                'is_available_today' => true,
            ],
            // 6. Cardiology (Riyadh - Facility 3)
            [
                'name' => 'د. طارق التويجري',
                'email' => 'dr.tareq@tebiby.com',
                'phone' => '+966506667788',
                'national_id' => '1071829345',
                'gender' => 'male',
                'avatar' => 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=300&h=300&fit=crop&crop=faces',
                'specialty' => 'cardiology',
                'facility_id' => $facility3->id,
                'extra_facilities' => [
                    ['facility_id' => $facility1->id, 'fee' => 400.00, 'slot' => 25],
                ],
                'title_ar' => 'استشاري أمراض القلب والقسطرة التداخلية',
                'subspecialty' => 'قسطرة الشرايين التاجية، علاج اضطرابات نبض القلب، ضغط الدم المقاوم',
                'bio' => 'زميل جمعية القلب الأمريكية (FACC)، خبرة ٢٠ عاماً في قسطرة القلب التداخلية.',
                'experience_years' => 20,
                'consultation_fee' => 350.00,
                'rating' => 5.0,
                'review_count' => 610,
                'waiting_time_minutes' => 15,
                'insurances' => ['بوبا العربية', 'التعاونية', 'ميدغلف'],
                'is_available_today' => true,
            ],
            // 7. Ophthalmology (Jeddah - Facility 5)
            [
                'name' => 'د. ياسر باوزير',
                'email' => 'dr.yasser@tebiby.com',
                'phone' => '+966507778899',
                'national_id' => '1082938471',
                'gender' => 'male',
                'avatar' => 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=faces',
                'specialty' => 'ophthalmology',
                'facility_id' => $facility5->id,
                'extra_facilities' => [
                    ['facility_id' => $facility6->id, 'fee' => 270.00, 'slot' => 15],
                ],
                'title_ar' => 'استشاري طب وجراحة العيون وتصحيح النظر بالليزر',
                'subspecialty' => 'الفيمتو ليزك، إزالة المياه البيضاء بالفاكو، علاج اعتلال الشبكية السكري',
                'bio' => 'زمالة مستشفى الملك خالد التخصصي للعيون، أجرى أكثر من ٥٠٠٠ عملية تصحيح نظر ناجحة.',
                'experience_years' => 15,
                'consultation_fee' => 260.00,
                'rating' => 4.8,
                'review_count' => 275,
                'waiting_time_minutes' => 15,
                'insurances' => ['بوبا العربية', 'التعاونية', 'ولاء للتأمين', 'ملاذ'],
                'is_available_today' => true,
            ],
            // 8. Neurology (Jeddah - Facility 6)
            [
                'name' => 'د. ريم المهيدب',
                'email' => 'dr.reem@tebiby.com',
                'phone' => '+966508889900',
                'national_id' => '1093847561',
                'gender' => 'female',
                'avatar' => 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&h=300&fit=crop&crop=faces',
                'specialty' => 'neurology',
                'facility_id' => $facility6->id,
                'extra_facilities' => [],
                'title_ar' => 'استشارية المخ والأعصاب والعمود الفقري',
                'subspecialty' => 'الصداع النصفي المزمن، التصلب اللويحي، تخطيط الأعصاب والعضلات',
                'bio' => 'البورد الألماني في طب المخ والأعصاب من جامعة هايدلبرغ، خبرة ١٣ عاماً.',
                'experience_years' => 13,
                'consultation_fee' => 330.00,
                'rating' => 4.9,
                'review_count' => 198,
                'waiting_time_minutes' => 20,
                'insurances' => ['بوبا العربية', 'التعاونية', 'ميدغلف'],
                'is_available_today' => true,
            ],
            // 9. Dentistry (Dammam - Facility 7)
            [
                'name' => 'د. سلطان القحطاني',
                'email' => 'dr.sultan@tebiby.com',
                'phone' => '+966509991122',
                'national_id' => '1019283746',
                'gender' => 'male',
                'avatar' => 'https://images.unsplash.com/photo-1618498082410-b4aa22193b38?w=300&h=300&fit=crop&crop=faces',
                'specialty' => 'dentistry',
                'facility_id' => $facility7->id,
                'extra_facilities' => [],
                'title_ar' => 'استشاري تقويم الأسنان والفكين وتجميل الابتسامة',
                'subspecialty' => 'التقويم الشفاف (Invisalign)، ابتسامة هوليود الرقمية، تقويم الأطفال',
                'bio' => 'ماجستير وزمالة تقويم الأسنان من جامعة الملك سعود وجامعة بوسطن الأمريكية.',
                'experience_years' => 11,
                'consultation_fee' => 240.00,
                'rating' => 4.7,
                'review_count' => 215,
                'waiting_time_minutes' => 15,
                'insurances' => ['بوبا العربية', 'التعاونية', 'تكافل الراجحي'],
                'is_available_today' => true,
            ],
            // 10. Dermatology (Jeddah - Facility 5)
            [
                'name' => 'د. لينا بخش',
                'email' => 'dr.lina@tebiby.com',
                'phone' => '+966501234567',
                'national_id' => '1023456789',
                'gender' => 'female',
                'avatar' => 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=300&h=300&fit=crop&crop=faces',
                'specialty' => 'dermatology',
                'facility_id' => $facility5->id,
                'extra_facilities' => [],
                'title_ar' => 'أخصائية أولى جلدية وتجميل وليزر',
                'subspecialty' => 'البلازما والخلايا الجذعية للشعر، التقشير البارد، علاج الأكزيما والصدفية',
                'bio' => 'خبرة ١٠ سنوات في كبرى مراكز الجلدية والتجميل بجدة والرياض.',
                'experience_years' => 10,
                'consultation_fee' => 250.00,
                'rating' => 4.8,
                'review_count' => 310,
                'waiting_time_minutes' => 10,
                'insurances' => ['بوبا العربية', 'التعاونية'],
                'is_available_today' => true,
            ],
            // 11. Pediatrics (Dammam - Facility 7)
            [
                'name' => 'د. عبدالله الدوسري',
                'email' => 'dr.abdullah@tebiby.com',
                'phone' => '+966507654321',
                'national_id' => '1034567891',
                'gender' => 'male',
                'avatar' => 'https://images.unsplash.com/photo-1612349316228-5942a9b489c2?w=300&h=300&fit=crop&crop=faces',
                'specialty' => 'pediatrics',
                'facility_id' => $facility7->id,
                'extra_facilities' => [
                    ['facility_id' => $facility8->id, 'fee' => 200.00, 'slot' => 15],
                ],
                'title_ar' => 'استشاري طب الأطفال وأمراض الجهاز التنفسي',
                'subspecialty' => 'العناية بحديثي الولادة والخدج، التغذية العلاجية للأطفال',
                'bio' => 'الزمالة البريطانية لطب الأطفال (MRCPCH)، خبرة ١٧ عاماً.',
                'experience_years' => 17,
                'consultation_fee' => 230.00,
                'rating' => 4.9,
                'review_count' => 189,
                'waiting_time_minutes' => 15,
                'insurances' => ['بوبا العربية', 'التعاونية', 'ميدغلف'],
                'is_available_today' => true,
            ],
            // 12. Ophthalmology (Riyadh - Facility 2 - Pending approval / suspended demo)
            [
                'name' => 'د. نايف الشهري',
                'email' => 'dr.nayef@tebiby.com',
                'phone' => '+966509876543',
                'national_id' => '1045678912',
                'gender' => 'male',
                'avatar' => 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=faces',
                'specialty' => 'ophthalmology',
                'facility_id' => $facility2->id,
                'extra_facilities' => [],
                'title_ar' => 'استشاري جراحة القرنية وتصحيح الإبصار',
                'subspecialty' => 'زراعة القرنية، الفيمتو سمايل، علاج جفاف العين المزمن',
                'bio' => 'البورد السعودي والزمالة الكندية في جراحات القرنية ومقدمة العين.',
                'experience_years' => 9,
                'consultation_fee' => 290.00,
                'rating' => 4.7,
                'review_count' => 94,
                'waiting_time_minutes' => 15,
                'insurances' => ['بوبا العربية', 'التعاونية'],
                'is_available_today' => false, // Shows pending/suspended toggle state in Admin UI
            ],
        ];

        $doctorModels = [];
        foreach ($doctorsData as $idx => $d) {
            $docUser = User::create([
                'name' => $d['name'],
                'email' => $d['email'],
                'password' => Hash::make('password123'),
                'phone' => $d['phone'],
                'role' => 'doctor',
                'national_id' => $d['national_id'],
                'avatar' => $d['avatar'],
                'gender' => $d['gender'],
            ]);

            $docProfile = DoctorProfile::create([
                'user_id' => $docUser->id,
                'specialty_id' => $specModels[$d['specialty']]->id,
                'clinic_id' => $d['facility_id'],
                'title_ar' => $d['title_ar'],
                'subspecialty' => $d['subspecialty'],
                'bio' => $d['bio'],
                'experience_years' => $d['experience_years'],
                'consultation_fee' => $d['consultation_fee'],
                'rating' => $d['rating'],
                'review_count' => $d['review_count'],
                'waiting_time_minutes' => $d['waiting_time_minutes'],
                'accepts_insurance' => true,
                'accepted_insurances' => $d['insurances'],
                'is_available_today' => $d['is_available_today'],
                'approval_status' => $d['is_available_today'] ? 'approved' : 'pending',
                'license_no' => 'SCFHS-' . (202400 + $idx + 1),
                'license_expires_at' => Carbon::today()->addYears(2),
            ]);

            $primaryPivot = DoctorFacility::where('doctor_profile_id', $docProfile->id)
                ->where('facility_id', $d['facility_id'])
                ->first();

            foreach ([0, 1, 2, 3, 4] as $day) {
                DoctorSchedule::create([
                    'doctor_profile_id' => $docProfile->id,
                    'doctor_facility_id' => $primaryPivot?->id,
                    'day_of_week' => $day,
                    'start_time' => '16:00:00',
                    'end_time' => '22:00:00',
                    'slot_duration_minutes' => $d['waiting_time_minutes'],
                    'max_daily_patients' => 20,
                    'is_active' => true,
                ]);
            }

            foreach ($d['extra_facilities'] as $ef) {
                $extraPivot = DoctorFacility::firstOrCreate([
                    'doctor_profile_id' => $docProfile->id,
                    'facility_id' => $ef['facility_id'],
                ], [
                    'consultation_fee' => $ef['fee'],
                    'default_slot_minutes' => $ef['slot'],
                    'accepts_insurance' => true,
                    'is_active' => true,
                ]);

                foreach ([1, 3] as $day) {
                    DoctorSchedule::create([
                        'doctor_profile_id' => $docProfile->id,
                        'doctor_facility_id' => $extraPivot->id,
                        'day_of_week' => $day,
                        'start_time' => '17:00:00',
                        'end_time' => '21:00:00',
                        'slot_duration_minutes' => $ef['slot'],
                        'max_daily_patients' => 15,
                        'is_active' => true,
                    ]);
                }
            }

            $doctorModels[] = $docProfile;
        }

        $doc1 = $doctorModels[0]; // د. عبدالمحسن الشمري (Dentistry - Facility 1)
        $doc2 = $doctorModels[1]; // د. سارة المنصور (Dermatology - Facility 1)
        $doc3 = $doctorModels[2]; // د. خالد العوهلي (Internal Medicine - Facility 2)
        $doc4 = $doctorModels[3]; // د. فهد العتيبي (Orthopedics - Facility 3)
        $doc5 = $doctorModels[4]; // د. منى السبيعي (Pediatrics - Facility 1)
        $doc6 = $doctorModels[5]; // د. طارق التويجري (Cardiology - Facility 3)
        $doc7 = $doctorModels[6]; // د. ياسر باوزير (Ophthalmology - Facility 5)
        $doc8 = $doctorModels[7]; // د. ريم المهيدب (Neurology - Facility 6)

        // ==========================================
        // 5. Patients (10 Realistic Patients)
        // ==========================================
        $patient1 = User::create([
            'name' => 'محمد فهد الدوسري',
            'email' => 'patient@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966555123456',
            'role' => 'patient',
            'national_id' => '1098765432',
            'gender' => 'male',
            'dob' => '1992-05-14',
            'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
        ]);

        $patient2 = User::create([
            'name' => 'فهد سلطان الدوسري',
            'email' => 'fahad.s@gmail.com',
            'password' => Hash::make('password123'),
            'phone' => '+966555654321',
            'role' => 'patient',
            'national_id' => '1087654321',
            'gender' => 'male',
            'dob' => '1985-11-20',
        ]);

        $otherPatientsData = [
            ['name' => 'نورة عبدالله القحطاني', 'email' => 'noura.q@tebiby.com', 'phone' => '+966551112201', 'nid' => '1076543211', 'gender' => 'female', 'dob' => '1995-03-10'],
            ['name' => 'تركي عبدالعزيز السديري', 'email' => 'turki.s@tebiby.com', 'phone' => '+966551112202', 'nid' => '1076543212', 'gender' => 'male', 'dob' => '1988-07-22'],
            ['name' => 'ريم محمد الغامدي', 'email' => 'reem.g@tebiby.com', 'phone' => '+966551112203', 'nid' => '1076543213', 'gender' => 'female', 'dob' => '1998-01-19'],
            ['name' => 'طلال سعود الشمري', 'email' => 'talal.sh@tebiby.com', 'phone' => '+966551112204', 'nid' => '1076543214', 'gender' => 'male', 'dob' => '1990-09-05'],
            ['name' => 'لمى خالد العتيبي', 'email' => 'lama.o@tebiby.com', 'phone' => '+966551112205', 'nid' => '1076543215', 'gender' => 'female', 'dob' => '2001-12-11'],
            ['name' => 'عبدالرحمن صالح الزهراني', 'email' => 'abdulrahman.z@tebiby.com', 'phone' => '+966551112206', 'nid' => '1076543216', 'gender' => 'male', 'dob' => '1982-04-28'],
            ['name' => 'هند فيصل المطيري', 'email' => 'hind.m@tebiby.com', 'phone' => '+966551112207', 'nid' => '1076543217', 'gender' => 'female', 'dob' => '1993-08-15'],
            ['name' => 'ماجد فهد الحربي', 'email' => 'majed.h@tebiby.com', 'phone' => '+966551112208', 'nid' => '1076543218', 'gender' => 'male', 'dob' => '1979-06-30'],
        ];

        $allPatients = [$patient1, $patient2];
        foreach ($otherPatientsData as $pData) {
            $allPatients[] = User::create([
                'name' => $pData['name'],
                'email' => $pData['email'],
                'password' => Hash::make('password123'),
                'phone' => $pData['phone'],
                'role' => 'patient',
                'national_id' => $pData['nid'],
                'gender' => $pData['gender'],
                'dob' => $pData['dob'],
            ]);
        }

        // ==========================================
        // 6. Today's Active Queue & Appointments
        // ==========================================
        $today = Carbon::today();

        // --- Doctor 1 (د. عبدالمحسن الشمري at Facility 1 - مستشفى الحبيب العليا) ---
        // Ticket #1: Completed today
        $apptDoc1T1 = Appointment::create([
            'booking_reference' => 'TB-78105',
            'patient_id' => $allPatients[5]->id, // طلال سعود الشمري
            'doctor_id' => $doc1->id,
            'facility_id' => $facility1->id,
            'appointment_date' => $today,
            'appointment_time' => '16:30:00',
            'status' => 'completed',
            'payment_method' => 'online',
            'payment_status' => 'paid',
            'consultation_fee' => 250.00,
            'discount' => 0.00,
            'tax' => 37.50,
            'total_amount' => 287.50,
            'patient_notes' => 'تنظيف جير وتلميع الأسنان الدوري',
            'notify_whatsapp' => true,
            'notify_sms' => true,
        ]);
        QueueTicket::create([
            'appointment_id' => $apptDoc1T1->id,
            'ticket_number' => 1,
            'current_serving_number' => 2,
            'estimated_wait_minutes' => 0,
            'status' => 'completed',
            'called_at' => Carbon::now()->subMinutes(45),
            'started_at' => Carbon::now()->subMinutes(40),
            'completed_at' => Carbon::now()->subMinutes(15),
        ]);

        // Ticket #2: Examining right now (Patient 2 - فهد سلطان الدوسري)
        $appt1 = Appointment::create([
            'booking_reference' => 'TB-78210',
            'patient_id' => $patient2->id,
            'doctor_id' => $doc1->id,
            'facility_id' => $facility1->id,
            'appointment_date' => $today,
            'appointment_time' => '17:00:00',
            'status' => 'in_consultation',
            'payment_method' => 'insurance',
            'payment_status' => 'paid',
            'consultation_fee' => 250.00,
            'discount' => 250.00,
            'tax' => 0.00,
            'total_amount' => 0.00,
            'insurance_provider' => 'شركة بوبا العربية للتأمين',
            'insurance_policy_number' => 'BUP-9948201',
            'patient_notes' => 'ألم حاد في الضرس العلوي الأيسر منذ 3 أيام مع تورم بسيط',
            'notify_whatsapp' => true,
            'notify_sms' => true,
        ]);
        QueueTicket::create([
            'appointment_id' => $appt1->id,
            'ticket_number' => 2,
            'current_serving_number' => 2,
            'estimated_wait_minutes' => 0,
            'status' => 'examining',
            'called_at' => Carbon::now()->subMinutes(12),
            'started_at' => Carbon::now()->subMinutes(10),
        ]);

        // Ticket #3: Waiting (نورة عبدالله القحطاني)
        $apptDoc1T3 = Appointment::create([
            'booking_reference' => 'TB-88412',
            'patient_id' => $allPatients[2]->id,
            'doctor_id' => $doc1->id,
            'facility_id' => $facility1->id,
            'appointment_date' => $today,
            'appointment_time' => '17:20:00',
            'status' => 'waiting',
            'payment_method' => 'at_clinic',
            'payment_status' => 'paid',
            'consultation_fee' => 250.00,
            'discount' => 0.00,
            'tax' => 37.50,
            'total_amount' => 287.50,
            'patient_notes' => 'استشارة تركيب عدسات الفينير التجميلية',
            'notify_whatsapp' => true,
            'notify_sms' => true,
        ]);
        QueueTicket::create([
            'appointment_id' => $apptDoc1T3->id,
            'ticket_number' => 3,
            'current_serving_number' => 2,
            'estimated_wait_minutes' => 15,
            'status' => 'waiting',
        ]);

        // Ticket #4: Waiting (Main Demo Patient 1 - محمد فهد الدوسري - Screen 5!)
        $appt2 = Appointment::create([
            'booking_reference' => 'TB-92841',
            'patient_id' => $patient1->id,
            'doctor_id' => $doc1->id,
            'facility_id' => $facility1->id,
            'appointment_date' => $today,
            'appointment_time' => '17:40:00',
            'status' => 'waiting',
            'payment_method' => 'insurance',
            'payment_status' => 'paid',
            'consultation_fee' => 250.00,
            'discount' => 250.00,
            'tax' => 0.00,
            'total_amount' => 0.00,
            'insurance_provider' => 'شركة بوبا العربية للتأمين',
            'insurance_policy_number' => 'BUP-8491023',
            'patient_notes' => 'كشف دوري ومتابعة تقويم الأسنان الشفاف',
            'notify_whatsapp' => true,
            'notify_sms' => true,
        ]);
        QueueTicket::create([
            'appointment_id' => $appt2->id,
            'ticket_number' => 4,
            'current_serving_number' => 2,
            'estimated_wait_minutes' => 30,
            'status' => 'waiting',
        ]);

        // Ticket #5: Waiting (تركي عبدالعزيز السديري)
        $apptDoc1T5 = Appointment::create([
            'booking_reference' => 'TB-95104',
            'patient_id' => $allPatients[3]->id,
            'doctor_id' => $doc1->id,
            'facility_id' => $facility1->id,
            'appointment_date' => $today,
            'appointment_time' => '18:00:00',
            'status' => 'waiting',
            'payment_method' => 'insurance',
            'payment_status' => 'paid',
            'consultation_fee' => 250.00,
            'discount' => 250.00,
            'tax' => 0.00,
            'total_amount' => 0.00,
            'insurance_provider' => 'شركة التعاونية للتأمين',
            'insurance_policy_number' => 'TAW-339182',
            'patient_notes' => 'متابعة زراعة الضرس السفلي الأيمن',
            'notify_whatsapp' => true,
            'notify_sms' => true,
        ]);
        QueueTicket::create([
            'appointment_id' => $apptDoc1T5->id,
            'ticket_number' => 5,
            'current_serving_number' => 2,
            'estimated_wait_minutes' => 45,
            'status' => 'waiting',
        ]);

        // --- Doctor 2 (د. سارة المنصور at Facility 1) Today's Queue ---
        $apptDoc2T1 = Appointment::create([
            'booking_reference' => 'TB-64101',
            'patient_id' => $allPatients[4]->id, // ريم محمد الغامدي
            'doctor_id' => $doc2->id,
            'facility_id' => $facility1->id,
            'appointment_date' => $today,
            'appointment_time' => '17:15:00',
            'status' => 'in_consultation',
            'payment_method' => 'online',
            'payment_status' => 'paid',
            'consultation_fee' => 300.00,
            'discount' => 0.00,
            'tax' => 45.00,
            'total_amount' => 345.00,
            'patient_notes' => 'جلسة نضارة البشرة وحقن الميزوثيرابي',
        ]);
        QueueTicket::create([
            'appointment_id' => $apptDoc2T1->id,
            'ticket_number' => 1,
            'current_serving_number' => 1,
            'estimated_wait_minutes' => 0,
            'status' => 'examining',
            'called_at' => Carbon::now()->subMinutes(8),
            'started_at' => Carbon::now()->subMinutes(5),
        ]);

        $apptDoc2T2 = Appointment::create([
            'booking_reference' => 'TB-64102',
            'patient_id' => $allPatients[6]->id, // لمى خالد العتيبي
            'doctor_id' => $doc2->id,
            'facility_id' => $facility1->id,
            'appointment_date' => $today,
            'appointment_time' => '17:30:00',
            'status' => 'waiting',
            'payment_method' => 'insurance',
            'payment_status' => 'paid',
            'consultation_fee' => 300.00,
            'discount' => 300.00,
            'tax' => 0.00,
            'total_amount' => 0.00,
            'insurance_provider' => 'شركة بوبا العربية للتأمين',
            'insurance_policy_number' => 'BUP-771230',
            'patient_notes' => 'استشارة علاج آثار حب الشباب بالليزر',
        ]);
        QueueTicket::create([
            'appointment_id' => $apptDoc2T2->id,
            'ticket_number' => 2,
            'current_serving_number' => 1,
            'estimated_wait_minutes' => 10,
            'status' => 'waiting',
        ]);

        // --- Doctor 4 (د. فهد العتيبي at Facility 3 - مستشفى المواساة قرطبة) Today's Queue ---
        $apptDoc4T1 = Appointment::create([
            'booking_reference' => 'TB-51001',
            'patient_id' => $allPatients[7]->id, // عبدالرحمن صالح الزهراني
            'doctor_id' => $doc4->id,
            'facility_id' => $facility3->id,
            'appointment_date' => $today,
            'appointment_time' => '16:30:00',
            'status' => 'completed',
            'payment_method' => 'online',
            'payment_status' => 'paid',
            'consultation_fee' => 320.00,
            'discount' => 0.00,
            'tax' => 48.00,
            'total_amount' => 368.00,
            'patient_notes' => 'متابعة علاج طبيعي للركبة بعد المنظار',
        ]);
        QueueTicket::create([
            'appointment_id' => $apptDoc4T1->id,
            'ticket_number' => 1,
            'current_serving_number' => 2,
            'estimated_wait_minutes' => 0,
            'status' => 'completed',
        ]);

        $apptDoc4T2 = Appointment::create([
            'booking_reference' => 'TB-51002',
            'patient_id' => $allPatients[9]->id, // ماجد فهد الحربي
            'doctor_id' => $doc4->id,
            'facility_id' => $facility3->id,
            'appointment_date' => $today,
            'appointment_time' => '17:00:00',
            'status' => 'in_consultation',
            'payment_method' => 'insurance',
            'payment_status' => 'paid',
            'consultation_fee' => 320.00,
            'discount' => 320.00,
            'tax' => 0.00,
            'total_amount' => 0.00,
            'insurance_provider' => 'شركة التعاونية للتأمين',
            'patient_notes' => 'آلام أسفل الظهر والعمود الفقري',
        ]);
        QueueTicket::create([
            'appointment_id' => $apptDoc4T2->id,
            'ticket_number' => 2,
            'current_serving_number' => 2,
            'estimated_wait_minutes' => 0,
            'status' => 'examining',
        ]);

        $apptDoc4T3 = Appointment::create([
            'booking_reference' => 'TB-51003',
            'patient_id' => $allPatients[8]->id, // هند فيصل المطيري
            'doctor_id' => $doc4->id,
            'facility_id' => $facility3->id,
            'appointment_date' => $today,
            'appointment_time' => '17:30:00',
            'status' => 'waiting',
            'payment_method' => 'at_clinic',
            'payment_status' => 'pending',
            'consultation_fee' => 320.00,
            'discount' => 0.00,
            'tax' => 48.00,
            'total_amount' => 368.00,
            'patient_notes' => 'خشونة مفصل الكتف الأيمن',
        ]);
        QueueTicket::create([
            'appointment_id' => $apptDoc4T3->id,
            'ticket_number' => 3,
            'current_serving_number' => 2,
            'estimated_wait_minutes' => 15,
            'status' => 'waiting',
        ]);

        // ==========================================
        // 7. Main Patient (محمد فهد الدوسري) Rich Portal Data
        // ==========================================

        // Upcoming appointment in 3 days with Cardiology (د. طارق التويجري)
        $futureAppt = Appointment::create([
            'booking_reference' => 'TB-99301',
            'patient_id' => $patient1->id,
            'doctor_id' => $doc6->id,
            'facility_id' => $facility3->id,
            'appointment_date' => Carbon::today()->addDays(3),
            'appointment_time' => '19:00:00',
            'status' => 'waiting',
            'payment_method' => 'insurance',
            'payment_status' => 'paid',
            'consultation_fee' => 350.00,
            'discount' => 350.00,
            'tax' => 0.00,
            'total_amount' => 0.00,
            'insurance_provider' => 'شركة بوبا العربية للتأمين',
            'insurance_policy_number' => 'BUP-8491023',
            'patient_notes' => 'فحص دوري للقلب وتخطيط الإيكو السنوي',
        ]);
        QueueTicket::create([
            'appointment_id' => $futureAppt->id,
            'ticket_number' => 1,
            'current_serving_number' => 1,
            'estimated_wait_minutes' => 15,
            'status' => 'waiting',
        ]);

        // Past Visit 1: Internal Medicine (د. خالد العوهلي) + Prescription
        $apptPast1 = Appointment::create([
            'booking_reference' => 'TB-55102',
            'patient_id' => $patient1->id,
            'doctor_id' => $doc3->id,
            'facility_id' => $facility2->id,
            'appointment_date' => Carbon::today()->subDays(18),
            'appointment_time' => '18:30:00',
            'status' => 'completed',
            'payment_method' => 'insurance',
            'payment_status' => 'paid',
            'consultation_fee' => 280.00,
            'discount' => 280.00,
            'tax' => 0.00,
            'total_amount' => 0.00,
            'insurance_provider' => 'شركة بوبا العربية للتأمين',
            'patient_notes' => 'فحص روتيني للجهاز الهضمي وتجديد أدوية المعدة',
        ]);

        Prescription::create([
            'appointment_id' => $apptPast1->id,
            'patient_id' => $patient1->id,
            'doctor_id' => $doc3->id,
            'prescription_code' => 'RX-448102',
            'diagnosis' => 'التهاب المعدة المزمن وعسر الهضم الوظيفي وارتجاع المريء',
            'medications' => [
                [
                    'name' => 'Nexium (Esomeprazole) 40mg',
                    'dose' => 'قرص واحد يومياً',
                    'frequency' => 'صباحاً قبل الإفطار بنصف ساعة',
                    'duration' => 'لمدة 30 يوماً',
                    'instructions' => 'يبلع القرص كاملاً دون مضغ مع كوب ماء وفير',
                ],
                [
                    'name' => 'Duspatalin Retard 200mg',
                    'dose' => 'كبسولة مرتين يومياً',
                    'frequency' => 'قبل الوجبات الرئيسية بـ 20 دقيقة',
                    'duration' => 'لمدة 14 يوماً',
                    'instructions' => 'مهدئ لتقلصات القولون والجهاز الهضمي',
                ],
                [
                    'name' => 'Gaviscon Advance Syrup',
                    'dose' => 'ملعقة كبيرة (10 مل)',
                    'frequency' => 'بعد الوجبات وعند النوم',
                    'duration' => 'عند اللزوم لمدة أسبوعين',
                    'instructions' => 'يرج جيداً قبل الاستخدام لتهدئة الحموضة',
                ],
            ],
            'doctor_notes' => 'الالتزام بنظام غذائي قليل الدهون وتجنب التوابل الحارة والمشروبات الغازية والقهوة على معدة فارغة، وإجراء فحص دوري بعد شهرين.',
            'is_dispensed' => true,
        ]);

        // Past Visit 2: Dermatology (د. سارة المنصور) + Prescription
        $apptPast2 = Appointment::create([
            'booking_reference' => 'TB-41908',
            'patient_id' => $patient1->id,
            'doctor_id' => $doc2->id,
            'facility_id' => $facility1->id,
            'appointment_date' => Carbon::today()->subDays(42),
            'appointment_time' => '19:15:00',
            'status' => 'completed',
            'payment_method' => 'at_clinic',
            'payment_status' => 'paid',
            'consultation_fee' => 300.00,
            'discount' => 0.00,
            'tax' => 45.00,
            'total_amount' => 345.00,
            'patient_notes' => 'جلسة ليزر كربوني للوجه وعلاج جفاف البشرة',
        ]);

        Prescription::create([
            'appointment_id' => $apptPast2->id,
            'patient_id' => $patient1->id,
            'doctor_id' => $doc2->id,
            'prescription_code' => 'RX-319984',
            'diagnosis' => 'فرط تصبغ ما بعد الالتهاب وجفاف البشرة الموسمي',
            'medications' => [
                [
                    'name' => 'La Roche-Posay Anthelios UVMune 400 SPF 50+',
                    'dose' => 'دهان موضعي',
                    'frequency' => 'كل 3 ساعات عند التعرض للشمس',
                    'duration' => 'استخدام يومي مستمر',
                    'instructions' => 'وضع كمية مناسبة قبل الخروج بربع ساعة',
                ],
                [
                    'name' => 'Biafine Emulsion 100g',
                    'dose' => 'طبقة رقيقة على الوجه',
                    'frequency' => 'مساءً قبل النوم',
                    'duration' => 'لمدة 7 أيام',
                    'instructions' => 'ترطيب وتهدئة البشرة بعد جلسة الليزر',
                ],
            ],
            'doctor_notes' => 'تجنب الفرك القاسي أو التعرض المباشر للحرارة والبخار خلال الـ 48 ساعة الأولى بعد الجلسة.',
            'is_dispensed' => true,
        ]);

        // Past Visit 3: Orthopedics (د. فهد العتيبي) + Prescription
        $apptPast3 = Appointment::create([
            'booking_reference' => 'TB-30915',
            'patient_id' => $patient1->id,
            'doctor_id' => $doc4->id,
            'facility_id' => $facility3->id,
            'appointment_date' => Carbon::today()->subDays(65),
            'appointment_time' => '20:00:00',
            'status' => 'completed',
            'payment_method' => 'online',
            'payment_status' => 'paid',
            'consultation_fee' => 320.00,
            'discount' => 0.00,
            'tax' => 48.00,
            'total_amount' => 368.00,
            'patient_notes' => 'شد عضلي وإجهاد في مفصل الركبة اليمنى بعد التمارين',
        ]);

        Prescription::create([
            'appointment_id' => $apptPast3->id,
            'patient_id' => $patient1->id,
            'doctor_id' => $doc4->id,
            'prescription_code' => 'RX-289410',
            'diagnosis' => 'إجهاد أربطة الركبة السطحية ونقص فيتامين د',
            'medications' => [
                [
                    'name' => 'Celebrex (Celecoxib) 200mg',
                    'dose' => 'كبسولة واحدة يومياً',
                    'frequency' => 'بعد وجبة الغداء',
                    'duration' => 'لمدة 10 أيام',
                    'instructions' => 'مضاد للالتهاب ومسكن لآلام المفاصل',
                ],
                [
                    'name' => 'Biodal (Vitamin D3) 50,000 IU',
                    'dose' => 'قرص واحد أسبوعياً',
                    'frequency' => 'بعد وجبة رئيسية كل يوم جمعة',
                    'duration' => 'لمدة 8 أسابيع',
                    'instructions' => 'لتعويض نقص فيتامين د ودعم صحة العظام',
                ],
                [
                    'name' => 'Voltaren Emulgel 1%',
                    'dose' => 'دهان موضعي للركبة',
                    'frequency' => '3 مرات يومياً',
                    'duration' => 'لمدة أسبوعين',
                    'instructions' => 'يدلك بلطف حول مفصل الركبة',
                ],
            ],
            'doctor_notes' => 'الراحة من تمارين الجري العنيفة لمدة أسبوعين مع ممارسة تمارين تقوية العضلة الرباعية.',
            'is_dispensed' => true,
        ]);

        // Past Visit 4: Dentistry (د. عبدالمحسن الشمري) + Prescription
        $apptPast4 = Appointment::create([
            'booking_reference' => 'TB-21840',
            'patient_id' => $patient1->id,
            'doctor_id' => $doc1->id,
            'facility_id' => $facility1->id,
            'appointment_date' => Carbon::today()->subDays(90),
            'appointment_time' => '17:00:00',
            'status' => 'completed',
            'payment_method' => 'insurance',
            'payment_status' => 'paid',
            'consultation_fee' => 250.00,
            'discount' => 250.00,
            'tax' => 0.00,
            'total_amount' => 0.00,
            'insurance_provider' => 'شركة بوبا العربية للتأمين',
            'patient_notes' => 'تركيب القالب الأول لتقويم الأسنان الشفاف وفحص اللثة',
        ]);

        Prescription::create([
            'appointment_id' => $apptPast4->id,
            'patient_id' => $patient1->id,
            'doctor_id' => $doc1->id,
            'prescription_code' => 'RX-194022',
            'diagnosis' => 'بداية خطة تقويم الأسنان الشفاف والتهاب لثة بسيط',
            'medications' => [
                [
                    'name' => 'Curasept ADS 220 Mouthwash',
                    'dose' => 'مضمضة فموية 10 مل',
                    'frequency' => 'مرتين يومياً (صباحاً ومساءً)',
                    'duration' => 'لمدة 14 يوماً',
                    'instructions' => 'المضمضة لمدة دقيقة كاملة وعدم الأكل بعدها لنصف ساعة',
                ],
                [
                    'name' => 'Panadol Extra 500mg',
                    'dose' => 'قرصان عند اللزوم',
                    'frequency' => 'كل 6-8 ساعات عند الشعور بضغط القالب',
                    'duration' => 'أول 3 أيام',
                    'instructions' => 'مسكن للألم الناتج عن شد القالب الأول',
                ],
            ],
            'doctor_notes' => 'يجب ارتداء القالب الشفاف لمدة لا تقل عن 22 ساعة يومياً ونزعه فقط أثناء تناول الطعام وتفريش الأسنان.',
            'is_dispensed' => true,
        ]);

        // ==========================================
        // 8. Medical Records (Lab & Radiology) for Patient 1
        // ==========================================
        MedicalRecord::create([
            'patient_id' => $patient1->id,
            'doctor_id' => $doc1->id,
            'title' => 'أشعة بانوراما رقمية ثلاثية الأبعاد للفكين (3D CBCT & OPG)',
            'record_type' => 'radiology',
            'issuer' => 'مستشفى د. سليمان الحبيب (العليا) - قسم الأشعة التشخيصية',
            'record_date' => Carbon::today()->subDays(5),
            'status' => 'جاهز للتحميل',
            'file_path' => '/storage/records/opg_scan_patient_1.pdf',
            'summary_data' => [
                'كثافة العظم الفكي' => 'ممتازة (D2) ومناسبة لخطة التقويم والزراعة',
                'وضعية جذور الأسنان' => 'سليمة ومستقيمة ولا يوجد تداخل مع الجيوب الأنفية',
                'مفصل الفك الصدغي (TMJ)' => 'طبيعي بالجانبين دون علامات انزلاق غضروفي',
                'توصية الاستشاري' => 'الاستمرار على القالب رقم (4) وفق الجدول الزمني',
            ],
        ]);

        MedicalRecord::create([
            'patient_id' => $patient1->id,
            'doctor_id' => $doc3->id,
            'title' => 'تحليل صورة الدم الشاملة والفيتامينات والمعادن (CBC, Vit D & Ferritin)',
            'record_type' => 'lab',
            'issuer' => 'مختبرات د. سليمان الحبيب الطبية - فرع الصحافة',
            'record_date' => Carbon::today()->subDays(18),
            'status' => 'جاهز للتحميل',
            'file_path' => '/storage/records/blood_test_patient_1.pdf',
            'summary_data' => [
                'الهيموجلوبين (Hb)' => '14.8 g/dL (المعدل الطبيعي: 13.5 - 17.5)',
                'كريات الدم البيضاء (WBC)' => '6.4 x10^3/uL (طبيعي)',
                'فيتامين د (25-OH Vitamin D)' => '38.5 ng/mL (مستوى مثالي)',
                'مخزون الحديد (Ferritin)' => '84 ng/mL (طبيعي ومستقر)',
                'سكر الدم الصائم (FBS)' => '92 mg/dL (طبيعي)',
            ],
        ]);

        MedicalRecord::create([
            'patient_id' => $patient1->id,
            'doctor_id' => $doc4->id,
            'title' => 'تصوير الرنين المغناطيسي لمفصل الركبة اليمنى (Knee MRI)',
            'record_type' => 'radiology',
            'issuer' => 'مستشفى المواساة الحديث (قرطبة) - مركز التصوير المغناطيسي',
            'record_date' => Carbon::today()->subDays(65),
            'status' => 'جاهز للتحميل',
            'file_path' => '/storage/records/knee_mri_patient_1.pdf',
            'summary_data' => [
                'الرباط الصليبي الأمامي والخلفي' => 'سليم تماماً ومتصل دون تمزق (Intact ACL/PCL)',
                'الغضروف الهلالي الداخلي والخارجي' => 'سليم ولا توجد شروخ غضروفية',
                'الأوتار والأربطة الجانبية' => 'إجهاد بسيط من الدرجة الأولى قابل للتعافي بالراحة',
                'السائل المفصلي' => 'ضمن الحدود الفسيولوجية الطبيعية',
            ],
        ]);

        MedicalRecord::create([
            'patient_id' => $patient1->id,
            'doctor_id' => $doc3->id,
            'title' => 'تحليل الدهون الثلاثية والكوليسترول ووظائف الكبد (Lipid & Liver Panel)',
            'record_type' => 'lab',
            'issuer' => 'مختبرات البرج الطبية - الرياض',
            'record_date' => Carbon::today()->subDays(50),
            'status' => 'جاهز للتحميل',
            'file_path' => '/storage/records/lipid_profile_patient_1.pdf',
            'summary_data' => [
                'الكوليسترول الكلي (Total Cholesterol)' => '178 mg/dL (مثالي أقل من 200)',
                'الكوليسترول الضار (LDL)' => '104 mg/dL (طبيعي)',
                'الكوليسترول النافع (HDL)' => '56 mg/dL (جيد جداً)',
                'الدهون الثلاثية (Triglycerides)' => '118 mg/dL (طبيعي)',
                'إنزيمات الكبد (ALT / AST)' => '22 U/L / 19 U/L (سليمة تماماً)',
            ],
        ]);

        // ==========================================
        // 9. Last 7 Days Bookings & Revenue for Analytics Charts
        // ==========================================
        $dailyTargets = [
            6 => 8,  // 6 days ago
            5 => 11, // 5 days ago
            4 => 9,  // 4 days ago
            3 => 14, // 3 days ago
            2 => 12, // 2 days ago
            1 => 15, // yesterday
        ];

        $sampleComplaints = [
            'متابعة وفحص دوري منتظم',
            'استشارة طبية ومراجعة نتائج التحاليل المخبرية',
            'فحص سريري شامل وتجديد الوصفة العلاجية',
            'كشف أولي وتشخيص الأعراض الحالية',
            'مراجعة ما بعد الإجراء العلاجي للاطمئنان',
        ];

        foreach ($dailyTargets as $daysAgo => $numAppts) {
            $pastDay = Carbon::today()->subDays($daysAgo);

            for ($k = 0; $k < $numAppts; $k++) {
                $doc = $doctorModels[($daysAgo + $k) % count($doctorModels)];
                $pat = $allPatients[($daysAgo * 3 + $k) % count($allPatients)];
                $fee = (float) $doc->consultation_fee;

                // Mix of online, at_clinic, and insurance so revenue charts have rich numbers
                $methods = ['online', 'at_clinic', 'insurance'];
                $method = $methods[($daysAgo + $k) % 3];
                $isCancelled = ($k === $numAppts - 1 && $daysAgo % 2 === 0);
                $status = $isCancelled ? 'cancelled' : 'completed';

                // For paid revenue, makeonline and at_clinic paid, and insurance partially co-paid or covered
                if ($method === 'insurance') {
                    $discount = round($fee * 0.80, 2); // 20% co-pay + 80% covered
                    $tax = 0.00;
                    $total = round($fee - $discount, 2);
                } else {
                    $discount = 0.00;
                    $tax = round($fee * 0.15, 2);
                    $total = round($fee + $tax, 2);
                }

                $paymentStatus = $isCancelled ? 'refunded' : 'paid';

                $appt = Appointment::create([
                    'booking_reference' => sprintf('TB-%d%02d%02d', $daysAgo, $k + 1, rand(10, 99)),
                    'patient_id' => $pat->id,
                    'doctor_id' => $doc->id,
                    'facility_id' => $doc->clinic_id,
                    'appointment_date' => $pastDay,
                    'appointment_time' => sprintf('%02d:%02d:00', 16 + ($k % 6), ($k % 4) * 15),
                    'status' => $status,
                    'payment_method' => $method,
                    'payment_status' => $paymentStatus,
                    'consultation_fee' => $fee,
                    'discount' => $discount,
                    'tax' => $tax,
                    'total_amount' => $total,
                    'insurance_provider' => $method === 'insurance' ? 'شركة بوبا العربية للتأمين' : null,
                    'insurance_policy_number' => $method === 'insurance' ? 'BUP-' . (400000 + $daysAgo * 100 + $k) : null,
                    'patient_notes' => $sampleComplaints[$k % count($sampleComplaints)],
                    'notify_whatsapp' => true,
                    'notify_sms' => true,
                ]);

                QueueTicket::create([
                    'appointment_id' => $appt->id,
                    'ticket_number' => $k + 1,
                    'current_serving_number' => $k + 1,
                    'estimated_wait_minutes' => 0,
                    'status' => $isCancelled ? 'cancelled' : 'completed',
                ]);
            }
        }
    }
}
