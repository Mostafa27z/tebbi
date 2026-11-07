<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\DoctorSchedule;
use App\Models\MedicalRecord;
use App\Models\Prescription;
use App\Models\QueueTicket;
use App\Models\Specialty;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TebibySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Specialties
        $specialties = [
            [
                'name_ar' => 'طب وجراحة الأسنان',
                'name_en' => 'Dentistry & Oral Surgery',
                'icon_slug' => 'dentistry',
                'badge_text' => 'أكثر طلباً',
                'description' => 'زراعة الأسنان، التقويم، تبييض وتنظيف، جراحة الفكين',
            ],
            [
                'name_ar' => 'الجلدية والتجميل والليزر',
                'name_en' => 'Dermatology & Cosmetics',
                'icon_slug' => 'dermatology',
                'badge_text' => 'شائع جداً',
                'description' => 'علاج حب الشباب، إزالة الشعر بالليزر، الفيلر والبوتوكس',
            ],
            [
                'name_ar' => 'الأطفال وحديثي الولادة',
                'name_en' => 'Pediatrics & Neonatology',
                'icon_slug' => 'pediatrics',
                'badge_text' => 'عناية خاصة',
                'description' => 'متابعة النمو، التطعيمات الدورية، أمراض الأطفال الشائعة',
            ],
            [
                'name_ar' => 'الباطنة والجهاز الهضمي',
                'name_en' => 'Internal Medicine & Gastroenterology',
                'icon_slug' => 'internal_medicine',
                'badge_text' => 'أطباء معتمدون',
                'description' => 'علاج القولون، السكري، ضغط الدم، مناظير الجهاز الهضمي',
            ],
            [
                'name_ar' => 'العظام والمفاصل',
                'name_en' => 'Orthopedics & Joint Surgery',
                'icon_slug' => 'orthopedics',
                'badge_text' => 'جراحة متقدمة',
                'description' => 'خشونة الركبة، إصابات الملاعب، تبديل المفاصل والكسور',
            ],
            [
                'name_ar' => 'العيون وجراحة الليزر',
                'name_en' => 'Ophthalmology & Lasik',
                'icon_slug' => 'ophthalmology',
                'badge_text' => 'تقنيات حديثة',
                'description' => 'تصحيح النظر بالفيمتو ليزك، المياه البيضاء، ضغط العين',
            ],
            [
                'name_ar' => 'المخ والأعصاب',
                'name_en' => 'Neurology & Neurosurgery',
                'icon_slug' => 'neurology',
                'badge_text' => 'نخبة الاستشاريين',
                'description' => 'الصداع النصفي، الصرع، آلام الأعصاب والانزلاق الغضروفي',
            ],
            [
                'name_ar' => 'القلب والأوعية الدموية',
                'name_en' => 'Cardiology',
                'icon_slug' => 'cardiology',
                'badge_text' => 'طوارئ وعيادات',
                'description' => 'قسطرة القلب، تخطيط صدى القلب، اضطرابات النبض',
            ],
        ];

        $specModels = [];
        foreach ($specialties as $sp) {
            $specModels[$sp['icon_slug']] = Specialty::create($sp);
        }

        // 2. Clinics & Hospitals
        $clinics = [
            [
                'name' => 'مجموعة د. سليمان الحبيب الطبية',
                'branch_name' => 'مجمع العليا الطبي - طريق الملك فهد',
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
            ],
            [
                'name' => 'مستشفى المواساة الحديث',
                'branch_name' => 'فرع قرطبة',
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
            ],
            [
                'name' => 'المركز الطبي الدولي (IMC)',
                'branch_name' => 'المقر الرئيسي',
                'city' => 'جدة',
                'district' => 'الرويس',
                'address' => 'طريق حائل، حي الرويس، جدة',
                'phone' => '+966126509000',
                'map_url' => 'https://maps.google.com/?q=21.5292,39.1728',
                'latitude' => 21.5292,
                'longitude' => 39.1728,
                'logo_url' => '/images/clinics/imc.png',
                'is_active' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'المستشفى السعودي الألماني',
                'branch_name' => 'فرع حي الصحافة',
                'city' => 'الرياض',
                'district' => 'الصحافة',
                'address' => 'طريق الملك فهد الفرعي، حي الصحافة، الرياض',
                'phone' => '+966920007997',
                'map_url' => 'https://maps.google.com/?q=24.7955,46.6433',
                'latitude' => 24.7955,
                'longitude' => 46.6433,
                'logo_url' => '/images/clinics/sgh.png',
                'is_active' => true,
                'is_verified' => true,
            ],
        ];

        $clinicModels = [];
        foreach ($clinics as $c) {
            $clinicModels[] = Clinic::create($c);
        }

        // 3. Super Admin
        User::create([
            'name' => 'مدير منصة طبيبي',
            'email' => 'admin@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966500000001',
            'role' => 'admin',
            'national_id' => '1000000001',
        ]);

        // 4. Doctor Users & Profiles
        // Doctor 1: د. عبدالمحسن الشمري (Dental Consultant)
        $docUser1 = User::create([
            'name' => 'د. عبدالمحسن الشمري',
            'email' => 'dr.shammary@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966501112233',
            'role' => 'doctor',
            'national_id' => '1029384756',
            'avatar' => 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop&crop=faces',
            'gender' => 'male',
        ]);

        $doc1 = DoctorProfile::create([
            'user_id' => $docUser1->id,
            'specialty_id' => $specModels['dentistry']->id,
            'clinic_id' => $clinicModels[0]->id,
            'title_ar' => 'استشاري جراحة وزراعة الأسنان والتركيبات',
            'subspecialty' => 'زراعة وتجميل الأسنان الفورية، تقويم شفاف، جراحة الفكين المتقدمة',
            'bio' => 'زميل الكلية الملكية للجراحين بإدنبرة، خبرة أكثر من ١٦ عاماً في مستشفيات مرموقة داخل وخارج المملكة.',
            'experience_years' => 16,
            'consultation_fee' => 250.00,
            'rating' => 4.9,
            'review_count' => 382,
            'waiting_time_minutes' => 15,
            'accepts_insurance' => true,
            'accepted_insurances' => ['شركة بوبا العربية للتأمين', 'شركة التعاونية للتأمين', 'ميدغلف', 'تكافل الراجحي'],
            'is_available_today' => true,
        ]);

        // Doctor 2: د. سارة المنصور (Dermatology)
        $docUser2 = User::create([
            'name' => 'د. سارة المنصور',
            'email' => 'dr.sara@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966502223344',
            'role' => 'doctor',
            'national_id' => '1038475692',
            'avatar' => 'https://images.unsplash.com/photo-1594824813583-7c8585e82117?w=300&h=300&fit=crop&crop=faces',
            'gender' => 'female',
        ]);

        $doc2 = DoctorProfile::create([
            'user_id' => $docUser2->id,
            'specialty_id' => $specModels['dermatology']->id,
            'clinic_id' => $clinicModels[0]->id,
            'title_ar' => 'استشارية الأمراض الجلدية وجراحة الليزر والتجميل',
            'subspecialty' => 'علاج التصبغات والندبات، حقن الفيلر والبوتوكس، شد الوجه غير الجراحي',
            'bio' => 'البورد الأمريكي في طب الجلد التجميلي، أكثر من ١٢ عاماً في علاج الأمراض الجلدية المستعصية.',
            'experience_years' => 12,
            'consultation_fee' => 300.00,
            'rating' => 4.9,
            'review_count' => 512,
            'waiting_time_minutes' => 10,
            'accepts_insurance' => true,
            'accepted_insurances' => ['بوبا العربية', 'التعاونية', 'ولاء للتأمين'],
            'is_available_today' => true,
        ]);

        // Doctor 3: د. خالد باطنة (Internal Medicine)
        $docUser3 = User::create([
            'name' => 'د. خالد باطنة',
            'email' => 'dr.khaled@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966503334455',
            'role' => 'doctor',
            'national_id' => '1047586932',
            'avatar' => 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=faces',
            'gender' => 'male',
        ]);

        DoctorProfile::create([
            'user_id' => $docUser3->id,
            'specialty_id' => $specModels['internal_medicine']->id,
            'clinic_id' => $clinicModels[1]->id,
            'title_ar' => 'استشاري الأمراض الباطنية والجهاز الهضمي والمناظير',
            'subspecialty' => 'علاج القولون العصبي، ارتجاع المريء، دهون الكبد، السكري والضغط',
            'bio' => 'البورد الكندي في الأمراض الباطنية ومناظير الجهاز الهضمي المتقدمة.',
            'experience_years' => 18,
            'consultation_fee' => 280.00,
            'rating' => 4.8,
            'review_count' => 290,
            'waiting_time_minutes' => 20,
            'accepts_insurance' => true,
            'accepted_insurances' => ['بوبا العربية', 'التعاونية', 'ميدغلف', 'سلامة'],
            'is_available_today' => true,
        ]);

        // Doctor 4: د. فهد العتيبي (Orthopedics)
        $docUser4 = User::create([
            'name' => 'د. فهد العتيبي',
            'email' => 'dr.fahad@tebiby.com',
            'password' => Hash::make('password123'),
            'phone' => '+966504445566',
            'role' => 'doctor',
            'national_id' => '1058473921',
            'avatar' => 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=faces',
            'gender' => 'male',
        ]);

        DoctorProfile::create([
            'user_id' => $docUser4->id,
            'specialty_id' => $specModels['orthopedics']->id,
            'clinic_id' => $clinicModels[3]->id,
            'title_ar' => 'استشاري جراحة العظام والمفاصل والعمود الفقري',
            'subspecialty' => 'تبديل مفاصل الركبة والحوض، مناظير الكتف وإصابات الملاعب',
            'bio' => 'البورد الفرنسي لجراحة العظام، استشاري سابق في مستشفيات باريس الجامعية.',
            'experience_years' => 15,
            'consultation_fee' => 320.00,
            'rating' => 4.9,
            'review_count' => 420,
            'waiting_time_minutes' => 15,
            'accepts_insurance' => true,
            'accepted_insurances' => ['بوبا العربية', 'التعاونية', 'ميدغلف', 'الدرع العربي'],
            'is_available_today' => true,
        ]);

        // 5. Patients
        // Patient 1: محمد فهد الدوسري (Main User from Screen 3 & 5)
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

        // Patient 2: فهد سلطان الدوسري (Current examining patient from Screen 2)
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

        // 6. Doctor 1 Schedules
        for ($day = 0; $day <= 4; $day++) { // Sunday to Thursday
            DoctorSchedule::create([
                'doctor_profile_id' => $doc1->id,
                'day_of_week' => $day,
                'start_time' => '16:00:00',
                'end_time' => '22:00:00',
                'slot_duration_minutes' => 20,
                'max_daily_patients' => 18,
                'is_active' => true,
            ]);
        }

        // 7. Today's Appointments & Queue Tickets
        $today = Carbon::today();

        // Appointment 1: In examination right now (Patient 2 with Doctor 1)
        $appt1 = Appointment::create([
            'booking_reference' => 'TB-78210',
            'patient_id' => $patient2->id,
            'doctor_id' => $doc1->id,
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

        // Appointment 2: Waiting in queue (Ticket #4 for Patient 1 - Screen 5!)
        $appt2 = Appointment::create([
            'booking_reference' => 'TB-92841',
            'patient_id' => $patient1->id,
            'doctor_id' => $doc1->id,
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
            'patient_notes' => 'كشف دوري ومتابعة تقويم الأسنان',
            'notify_whatsapp' => true,
            'notify_sms' => true,
        ]);

        QueueTicket::create([
            'appointment_id' => $appt2->id,
            'ticket_number' => 4,
            'current_serving_number' => 2,
            'estimated_wait_minutes' => 25,
            'status' => 'waiting',
        ]);

        // Appointment 3 (Past visit with Dr. Khaled)
        $pastDate1 = Carbon::today()->subMonths(1)->subDays(4);
        $apptPast1 = Appointment::create([
            'booking_reference' => 'TB-55102',
            'patient_id' => $patient1->id,
            'doctor_id' => 3, // Dr. Khaled
            'appointment_date' => $pastDate1,
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
            'doctor_id' => 3,
            'prescription_code' => 'RX-448102',
            'diagnosis' => 'التهاب المعدة المزمن وعسر الهضم الوظيفي',
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
            ],
            'doctor_notes' => 'الالتزام بنظام غذائي قليل الدهون وتجنب التوابل الحارة والمشروبات الغازية، وإجراء فحص دوري بعد شهرين.',
            'is_dispensed' => true,
        ]);

        // Appointment 4 (Past visit with Dr. Sara Mansour)
        $pastDate2 = Carbon::today()->subMonths(2)->subDays(10);
        $apptPast2 = Appointment::create([
            'booking_reference' => 'TB-41908',
            'patient_id' => $patient1->id,
            'doctor_id' => $doc2->id,
            'appointment_date' => $pastDate2,
            'appointment_time' => '19:15:00',
            'status' => 'completed',
            'payment_method' => 'at_clinic',
            'payment_status' => 'paid',
            'consultation_fee' => 300.00,
            'discount' => 0.00,
            'tax' => 45.00,
            'total_amount' => 345.00,
            'patient_notes' => 'جلسة ليزر كربوني للوجه وتنظيف بشرة',
        ]);

        Prescription::create([
            'appointment_id' => $apptPast2->id,
            'patient_id' => $patient1->id,
            'doctor_id' => $doc2->id,
            'prescription_code' => 'RX-319984',
            'diagnosis' => 'فرط تصبغ ما بعد الالتهاب وجفاف البشرة',
            'medications' => [
                [
                    'name' => 'La Roche-Posay Anthelios SPF 50+',
                    'dose' => 'دهان موضعي',
                    'frequency' => 'كل 3 ساعات عند التعرض للشمس',
                    'duration' => 'مستمر',
                    'instructions' => 'وضع كمية سخية قبل الخروج بربع ساعة',
                ],
                [
                    'name' => 'Biafine Emulsion 100g',
                    'dose' => 'طبقة رقيقة',
                    'frequency' => 'مساءً قبل النوم',
                    'duration' => 'لمدة 7 أيام',
                    'instructions' => 'ترطيب وتهدئة البشرة بعد الليزر',
                ],
            ],
            'doctor_notes' => 'تجنب الفرك القاسي أو التعرض المباشر للحرارة والبخار خلال الـ 48 ساعة الأولى.',
            'is_dispensed' => true,
        ]);

        // 8. Medical Records for Patient 1 (Screen 3)
        MedicalRecord::create([
            'patient_id' => $patient1->id,
            'doctor_id' => $doc1->id,
            'title' => 'أشعة بانوراما رقمية ثلاثية الأبعاد للفكين (OPG)',
            'record_type' => 'radiology',
            'issuer' => 'مستشفى د. سليمان الحبيب - قسم الأشعة',
            'record_date' => Carbon::today()->subDays(5),
            'status' => 'جاهز للتحميل',
            'file_path' => '/storage/records/opg_scan_patient_1.pdf',
            'summary_data' => [
                'كثافة العظم' => 'ممتازة ومناسبة لزراعة الضرس السفلي',
                'وضعية جذور الأسنان' => 'سليمة ولا يوجد تداخل مع الجيوب الأنفية',
                'مفصل الفك الصدغي' => 'طبيعي دون علامات انزلاق غضروفي',
            ],
        ]);

        MedicalRecord::create([
            'patient_id' => $patient1->id,
            'doctor_id' => 3,
            'title' => 'تحليل صورة الدم الشاملة والفيتامينات (CBC & Vit D)',
            'record_type' => 'lab',
            'issuer' => 'مختبرات البرج الطبية - فرع العليا',
            'record_date' => Carbon::today()->subDays(20),
            'status' => 'جاهز للتحميل',
            'file_path' => '/storage/records/blood_test_patient_1.pdf',
            'summary_data' => [
                'الهيموجلوبين (Hb)' => '14.8 g/dL (طبيعي)',
                'كريات الدم البيضاء (WBC)' => '6.4 x10^3/uL (طبيعي)',
                'فيتامين د (Vitamin D)' => '32.5 ng/mL (كافٍ ومستقر)',
                'سكر الدم الصائم (FBS)' => '94 mg/dL (طبيعي)',
            ],
        ]);

        // 9. Additional Historical & Recent Appointments for Analytics & Management
        $extraPatients = [$patient1, $patient2];
        $allDoctors = DoctorProfile::all();

        for ($d = 1; $d <= 6; $d++) {
            $pastDay = Carbon::today()->subDays($d);
            $numAppts = rand(3, 7);

            for ($k = 0; $k < $numAppts; $k++) {
                $doc = $allDoctors->random();
                $pat = $extraPatients[array_rand($extraPatients)];
                $fee = $doc->consultation_fee;
                $isPaid = (rand(1, 10) > 2); // 80% paid
                $method = ['online', 'at_clinic', 'insurance'][rand(0, 2)];
                $status = ($pastDay->isPast()) ? 'completed' : 'waiting';

                $discount = ($method === 'insurance') ? $fee : 0.00;
                $tax = ($fee - $discount) * 0.15;
                $total = ($fee - $discount) + $tax;

                $appt = Appointment::create([
                    'booking_reference' => 'TB-' . $d . $k . rand(1000, 9999),
                    'patient_id' => $pat->id,
                    'doctor_id' => $doc->id,
                    'appointment_date' => $pastDay,
                    'appointment_time' => sprintf('%02d:%02d:00', rand(16, 21), rand(0, 3) * 15),
                    'status' => $status,
                    'payment_method' => $method,
                    'payment_status' => $isPaid ? 'paid' : 'pending',
                    'consultation_fee' => $fee,
                    'discount' => $discount,
                    'tax' => $tax,
                    'total_amount' => $total,
                    'insurance_provider' => $method === 'insurance' ? 'شركة بوبا العربية للتأمين' : null,
                    'insurance_policy_number' => $method === 'insurance' ? 'BUP-' . rand(100000, 999999) : null,
                    'patient_notes' => 'متابعة وفحص دوري منتظم',
                    'notify_whatsapp' => true,
                    'notify_sms' => true,
                ]);

                QueueTicket::create([
                    'appointment_id' => $appt->id,
                    'ticket_number' => $k + 1,
                    'current_serving_number' => $k + 1,
                    'estimated_wait_minutes' => 0,
                    'status' => 'completed',
                ]);
            }
        }
    }
}

