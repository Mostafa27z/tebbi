<?php

namespace Database\Seeders;

use App\Models\DoctorProfile;
use App\Models\DoctorService;
use Illuminate\Database\Seeder;

class DoctorServiceSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            'dentistry' => [
                [
                    'name' => 'كشف وتشخيص عام للأسنان',
                    'description' => 'فحص شامل للأسنان واللثة مع خطة علاجية متكاملة.',
                    'price' => 150,
                    'duration_minutes' => 20,
                ],
                [
                    'name' => 'تنظيف وتلميع وإزالة الجير',
                    'description' => 'جلسة تنظيف عميق بالموجات فوق الصوتية وتلميع الأسنان.',
                    'price' => 250,
                    'duration_minutes' => 45,
                ],
                [
                    'name' => 'خلع ضرس عادي',
                    'description' => 'تخدير موضعي وخلع آمن للضرس مع إرشادات ما بعد الإجراء.',
                    'price' => 350,
                    'duration_minutes' => 60,
                ],
                [
                    'name' => 'خلع ضرس عقل جراحي',
                    'description' => 'إجراء جراحي متكامل لخلع ضروس العقل المطمورة أو المعقدة.',
                    'price' => 750,
                    'duration_minutes' => 120,
                ],
            ],
            'dermatology' => [
                [
                    'name' => 'كشف واستشارة جلدية',
                    'description' => 'تشخيص أمراض البشرة والشعر والأظافر ووضع الخطة العلاجية.',
                    'price' => 220,
                    'duration_minutes' => 20,
                ],
                [
                    'name' => 'جلسة تنظيف ونضارة البشرة',
                    'description' => 'تقشير لطيف وتغذية عميقة للبشرة لإزالة الشوائب.',
                    'price' => 400,
                    'duration_minutes' => 45,
                ],
                [
                    'name' => 'جلسة ليزر علاجي أو تجميلي',
                    'description' => 'علاج التصبغات وآثار الندبات بأحدث أجهزة الليزر الطبية.',
                    'price' => 650,
                    'duration_minutes' => 60,
                ],
            ],
            'pediatrics' => [
                [
                    'name' => 'كشف أطفال عام',
                    'description' => 'فحص شامل للطفل ومتابعة الحرارة والنمو والتغذية.',
                    'price' => 180,
                    'duration_minutes' => 20,
                ],
                [
                    'name' => 'متابعة النمو والتطعيمات الدورية',
                    'description' => 'تقييم مؤشرات النمو وإعطاء اللقاحات المعتمدة.',
                    'price' => 240,
                    'duration_minutes' => 30,
                ],
                [
                    'name' => 'استشارة حساسية الصدر والربو',
                    'description' => 'تقييم وظائف التنفس ووضع خطة وقائية للطفل.',
                    'price' => 280,
                    'duration_minutes' => 40,
                ],
            ],
            'internal_medicine' => [
                [
                    'name' => 'كشف باطنة وجهاز هضمي',
                    'description' => 'فحص سريري شامل ومراجعة الفحوصات المخبرية.',
                    'price' => 220,
                    'duration_minutes' => 25,
                ],
                [
                    'name' => 'متابعة السكري والضغط المزمن',
                    'description' => 'ضبط الجرعات الدوائية وخطة المتابعة الدورية.',
                    'price' => 260,
                    'duration_minutes' => 30,
                ],
                [
                    'name' => 'تقييم شامل ومراجعة تقارير المناظير',
                    'description' => 'جلسة موسعة لمراجعة الفحوصات والتحاليل الدقيقة.',
                    'price' => 380,
                    'duration_minutes' => 45,
                ],
            ],
            'orthopedics' => [
                [
                    'name' => 'كشف عظام ومفاصل',
                    'description' => 'فحص سريري للمفاصل والعمود الفقري وقراءة الأشعة.',
                    'price' => 250,
                    'duration_minutes' => 25,
                ],
                [
                    'name' => 'حقن موضعي للمفصل',
                    'description' => 'حقن علاجي دقيق لتخفيف خشونة والتهابات المفاصل.',
                    'price' => 550,
                    'duration_minutes' => 45,
                ],
                [
                    'name' => 'استشارة وتخطيط جراحة مفاصل',
                    'description' => 'جلسة مطولة لدراسة الرنين المغناطيسي وخطة التأهيل.',
                    'price' => 450,
                    'duration_minutes' => 60,
                ],
            ],
            'ophthalmology' => [
                [
                    'name' => 'كشف عيون وفحص نظر شامل',
                    'description' => 'قياس حدة الإبصار وضغط العين وفحص قاع العين.',
                    'price' => 230,
                    'duration_minutes' => 25,
                ],
                [
                    'name' => 'فحوصات ما قبل تصحيح النظر (الليزك)',
                    'description' => 'تصوير تضاريس القرنية وقياس السماكة وتقييم الملاءمة.',
                    'price' => 450,
                    'duration_minutes' => 60,
                ],
                [
                    'name' => 'متابعة الشبكية وجفاف العين المزمن',
                    'description' => 'فحص متقدم للقرنية والشبكية مع خطة علاجية.',
                    'price' => 320,
                    'duration_minutes' => 35,
                ],
            ],
            'neurology' => [
                [
                    'name' => 'كشف مخ وأعصاب استشاري',
                    'description' => 'تقييم الصداع المزمن واضطرابات الأعصاب الطرفية.',
                    'price' => 300,
                    'duration_minutes' => 30,
                ],
                [
                    'name' => 'جلسة تقييم وتخطيط أعصاب مطولة',
                    'description' => 'فحص عصبي متكامل ومراجعة أشعة الرنين وتخطيط الدماغ.',
                    'price' => 520,
                    'duration_minutes' => 60,
                ],
                [
                    'name' => 'متابعة خطة علاج الشقيقة والصرع',
                    'description' => 'مراجعة الاستجابة الدوائية وتعديل البروتوكول العلاجي.',
                    'price' => 260,
                    'duration_minutes' => 25,
                ],
            ],
            'cardiology' => [
                [
                    'name' => 'كشف قلب وتخطيط كهربائي (ECG)',
                    'description' => 'فحص سريري للقلب مع رسم قلب فوري.',
                    'price' => 300,
                    'duration_minutes' => 30,
                ],
                [
                    'name' => 'فحص القلب بالموجات الصوتية (الإيكو)',
                    'description' => 'تصوير تفصيلي لعضلة القلب والصمامات مع التقرير.',
                    'price' => 600,
                    'duration_minutes' => 45,
                ],
                [
                    'name' => 'استشارة وتقييم قسطرة قلبية',
                    'description' => 'جلسة استشارية دقيقة لمراجعة القسطرة ووضع الخطة.',
                    'price' => 450,
                    'duration_minutes' => 60,
                ],
            ],
        ];

        $doctors = DoctorProfile::with('specialty')->get();

        foreach ($doctors as $doctor) {
            if ($doctor->services()->exists()) {
                continue;
            }

            $slug = $doctor->specialty?->icon_slug ?? '';
            $items = $catalog[$slug] ?? [
                [
                    'name' => 'كشف استشاري أول',
                    'description' => 'معاينة سريرية شاملة وتحديد الخطة العلاجية المناسبة.',
                    'price' => (float) ($doctor->consultation_fee ?: 200),
                    'duration_minutes' => (int) ($doctor->waiting_time_minutes ?: 20),
                ],
                [
                    'name' => 'استشارة متابعة وتقييم تقارير',
                    'description' => 'مراجعة نتائج التحاليل والأشعة وتحديث الخطة العلاجية.',
                    'price' => max(100, round((float) ($doctor->consultation_fee ?: 200) * 0.75, 2)),
                    'duration_minutes' => 20,
                ],
                [
                    'name' => 'جلسة فحص وإجراء طبي موسع',
                    'description' => 'جلسة مطولة للحالات التي تتطلب فحصاً وإجراءً دقيقاً.',
                    'price' => round((float) ($doctor->consultation_fee ?: 200) * 1.6, 2),
                    'duration_minutes' => 60,
                ],
            ];

            foreach ($items as $idx => $item) {
                DoctorService::create([
                    'doctor_profile_id' => $doctor->id,
                    'name' => $item['name'],
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'duration_minutes' => $item['duration_minutes'],
                    'is_active' => true,
                    'sort_order' => $idx + 1,
                ]);
            }
        }
    }
}
