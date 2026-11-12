import React from 'react';
import { Head, Link } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import { 
    Activity, 
    ShieldCheck, 
    Clock, 
    HeartHandshake, 
    Users, 
    Hospital, 
    Stethoscope, 
    Award, 
    Sparkles, 
    ArrowLeft,
    CheckCircle2,
    Calendar,
    MapPin
} from 'lucide-react';

interface Props {
    stats?: {
        totalDoctors?: number;
        totalClinics?: number;
        totalFacilities?: number;
        specialtiesCount?: number;
        satisfactionRate?: string;
    };
}

export default function AboutPage({ stats }: Props) {
    const values = [
        {
            title: 'تتبع الدور الحي بالدقيقة',
            desc: 'أول منصة في المملكة تقدم تتبعاً دقيقاً ومباشراً لطابور الانتظار بالعيادة ووقت الكشف التقديري دون الحاجة للانتظار الطويل داخل المستشفى.',
            icon: Clock,
            color: 'text-amber-600 bg-amber-50',
        },
        {
            title: 'ربط مباشر بالمراكز المعتمدة',
            desc: 'منظومة متكاملة تربط المريض مباشرة بالاستقبال وطبيب العيادة لتحديث فوري لحالة الموعد والسداد والحضور.',
            icon: Hospital,
            color: 'text-[#005ab5] bg-blue-50',
        },
        {
            title: 'أعلى معايير الأمان والخصوصية',
            desc: 'حماية كاملة للبيانات الطبية وتشفير متقدم للملف الصحي وفق اللوائح التنظيمية للقطاع الصحي السعودي.',
            icon: ShieldCheck,
            color: 'text-emerald-600 bg-emerald-50',
        },
        {
            title: 'نخبة من الاستشاريين والأطباء',
            desc: 'توفير أفضل الكوادر الطبية في مختلف التخصصات الجراحية والباطنية والجلدية وطب الأطفال مع التقييمات الشفافة.',
            icon: Award,
            color: 'text-purple-600 bg-purple-50',
        },
    ];

    const steps = [
        {
            num: '01',
            title: 'اختر الطبيب والمركز الطبي',
            desc: 'تصفح قائمة الأطباء والمستشفيات، وقارن بين التخصصات والأسعار ومواعيد العمل المتاحة.',
        },
        {
            num: '02',
            title: 'تأكيد الحجز برقم التذكرة',
            desc: 'احصل فوراً على تذكرة حضور إلكترونية مرقمة مع تنبيهات عبر الواتساب ورسائل الجوال.',
        },
        {
            num: '03',
            title: 'تتبع دورك لحظة بلحظة',
            desc: 'تابع شاشة الطابور الحي من هاتفك، وتوجه للعيادة فقط عندما يقترب دورك بالدقيقة.',
        },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-['Cairo'] flex flex-col justify-between">
            <Head title="عن طبيبي - منصة الحجز الذكي والتتبع الحي للعيادات" />
            <TebibyHeader />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-[#f8fafc] pt-16 pb-20 border-b border-gray-100">
                    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[#005ab5] text-xs font-bold border border-blue-100 mb-6 shadow-2xs">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>الرعاية الصحية الذكية والحديثة</span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto mb-6">
                            نُعيد ابتكار تجربة زيارة الطبيب مع{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#005ab5] to-[#0072e2]">
                                التتبع الحي للمواعيد
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
                            طبيبي هي منصة وطنية سعودية رائدة مصممة لإنهاء مشقة الانتظار في غرف العيادات، من خلال حجز ذكي، تذاكر إلكترونية، وتتبع مباشر لمسار طابور الفحص لحظة بلحظة.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <Link
                                href="/doctors"
                                className="px-7 py-3.5 rounded-2xl bg-[#005ab5] hover:bg-[#004791] text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 group"
                            >
                                <span>احجز موعدك الآن</span>
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/specialties"
                                className="px-7 py-3.5 rounded-2xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm border border-gray-200 transition-all shadow-xs"
                            >
                                <span>استعراض الأقسام الطبية</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="text-center p-4 border-l last:border-l-0 border-gray-100">
                            <span className="block text-3xl sm:text-4xl font-black text-[#005ab5] font-mono mb-1">
                                {stats?.totalDoctors || 45}+
                            </span>
                            <span className="text-xs font-bold text-gray-500">طبيب واستشاري معتمد</span>
                        </div>
                        <div className="text-center p-4 border-l last:border-l-0 border-gray-100">
                            <span className="block text-3xl sm:text-4xl font-black text-emerald-600 font-mono mb-1">
                                {stats?.totalFacilities || 12}+
                            </span>
                            <span className="text-xs font-bold text-gray-500">مستشفى ومجمع طبي</span>
                        </div>
                        <div className="text-center p-4 border-l last:border-l-0 border-gray-100">
                            <span className="block text-3xl sm:text-4xl font-black text-purple-600 font-mono mb-1">
                                {stats?.specialtiesCount || 18}+
                            </span>
                            <span className="text-xs font-bold text-gray-500">تخصص وقسم طبي دقيق</span>
                        </div>
                        <div className="text-center p-4">
                            <span className="block text-3xl sm:text-4xl font-black text-amber-500 font-mono mb-1">
                                {stats?.satisfactionRate || '99%'}
                            </span>
                            <span className="text-xs font-bold text-gray-500">نسبة رضا المراجعين</span>
                        </div>
                    </div>
                </section>

                {/* Mission & Vision Values */}
                <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                            لماذا يفضل المراجعون والأطباء منصة طبيبي؟
                        </h2>
                        <p className="text-sm text-gray-500">
                            نظام متكامل يخدم أطراف المنظومة الصحية الثلاثة: المريض، الاستقبال، والطبيب المعالج.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((v, i) => {
                            const Icon = v.icon;
                            return (
                                <div
                                    key={i}
                                    className="p-6 bg-white rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${v.color}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900 mb-2">
                                            {v.title}
                                        </h3>
                                        <p className="text-xs text-gray-600 leading-relaxed font-normal">
                                            {v.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* How It Works Steps */}
                <section className="bg-white py-20 border-y border-gray-100">
                    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-xl mx-auto mb-14">
                            <span className="text-xs font-bold text-[#005ab5] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                خطوات بسيطة وسريعة
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-3 mb-2">
                                كيف يعمل حجز وتتبع المواعيد؟
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500">
                                3 خطوات فقط تفصلك عن كشفك الطبي دون إهدار وقتك في صالات الانتظار المزدحمة
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                            {steps.map((s, idx) => (
                                <div key={idx} className="relative p-6 rounded-3xl bg-gray-50/80 border border-gray-200/70">
                                    <span className="text-4xl font-black font-mono text-[#005ab5]/20 block mb-3">
                                        {s.num}
                                    </span>
                                    <h3 className="text-base font-bold text-gray-900 mb-2 font-['Cairo']">
                                        {s.title}
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed font-normal">
                                        {s.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <TebibyFooter />
        </div>
    );
}

