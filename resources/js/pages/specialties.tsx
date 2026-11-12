import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import { 
    Stethoscope, 
    Users, 
    Building2, 
    Search,
    ChevronLeft,
    Sparkles,
    Eye,
    HeartPulse,
    Activity,
    Pill,
    Smile,
    Baby,
    Zap,
    Home,
    Filter,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpecialtyItem {
    id: number;
    name_ar: string;
    name_en?: string;
    icon_slug: string;
    badge_text?: string;
    description?: string;
    doctors_count: number;
    facilities_count: number;
}

interface Props {
    specialties: SpecialtyItem[];
    totalDoctors: number;
    totalFacilities: number;
}

// Visual themes for each specialty with distinct colors, icons, and services
interface SpecialtyTheme {
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    badgeBg: string;
    badgeText: string;
    services: string;
    category: 'popular' | 'surgical' | 'general';
}

const getSpecialtyTheme = (nameAr: string): SpecialtyTheme => {
    if (nameAr.includes('أسنان') || nameAr.includes('Dentist')) {
        return {
            icon: <Smile className="w-6 h-6" />,
            colorClass: 'text-cyan-600',
            bgClass: 'bg-cyan-50/80 group-hover:bg-cyan-600 group-hover:text-white',
            borderClass: 'border-cyan-100 hover:border-cyan-300',
            badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
            badgeText: 'الأكثر طلباً',
            services: 'زراعة الأسنان • تقويم • تبييض وهوليود سمايل',
            category: 'popular',
        };
    }
    if (nameAr.includes('جلدية') || nameAr.includes('تجميل')) {
        return {
            icon: <Sparkles className="w-6 h-6" />,
            colorClass: 'text-pink-600',
            bgClass: 'bg-pink-50/80 group-hover:bg-pink-600 group-hover:text-white',
            borderClass: 'border-pink-100 hover:border-pink-300',
            badgeBg: 'bg-pink-50 text-pink-700 border-pink-200/80',
            badgeText: 'شائع جداً',
            services: 'علاج حب الشباب • ليزر • حقن فيلر وبوتوكس',
            category: 'popular',
        };
    }
    if (nameAr.includes('أطفال') || nameAr.includes('ولادة')) {
        return {
            icon: <Baby className="w-6 h-6" />,
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-50/80 group-hover:bg-amber-600 group-hover:text-white',
            borderClass: 'border-amber-100 hover:border-amber-300',
            badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
            badgeText: 'رعاية خاصة',
            services: 'متابعة النمو • تطعيمات دورية • حساسية الأطفال',
            category: 'general',
        };
    }
    if (nameAr.includes('باطنة') || nameAr.includes('هضمي')) {
        return {
            icon: <Pill className="w-6 h-6" />,
            colorClass: 'text-emerald-600',
            bgClass: 'bg-emerald-50/80 group-hover:bg-emerald-600 group-hover:text-white',
            borderClass: 'border-emerald-100 hover:border-emerald-300',
            badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            badgeText: 'أطباء معتمدون',
            services: 'القولون العصبي • السكري وضغط الدم • مناظير الجهاز الهضمي',
            category: 'general',
        };
    }
    if (nameAr.includes('عظام') || nameAr.includes('مفاصل')) {
        return {
            icon: <Activity className="w-6 h-6" />,
            colorClass: 'text-indigo-600',
            bgClass: 'bg-indigo-50/80 group-hover:bg-indigo-600 group-hover:text-white',
            borderClass: 'border-indigo-100 hover:border-indigo-300',
            badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
            badgeText: 'جراحة متقدمة',
            services: 'خشونة الركبة • إصابات الملاعب • استبدال المفاصل',
            category: 'surgical',
        };
    }
    if (nameAr.includes('عيون') || nameAr.includes('ليزر')) {
        return {
            icon: <Eye className="w-6 h-6" />,
            colorClass: 'text-[#005ab5]',
            bgClass: 'bg-blue-50/80 group-hover:bg-[#005ab5] group-hover:text-white',
            borderClass: 'border-blue-100 hover:border-blue-300',
            badgeBg: 'bg-blue-50 text-[#005ab5] border-blue-200/80',
            badgeText: 'تقنيات حديثة',
            services: 'تصحيح النظر بالفيمتو ليزك • علاج المياه البيضاء والقرنية',
            category: 'surgical',
        };
    }
    if (nameAr.includes('مخ') || nameAr.includes('أعصاب')) {
        return {
            icon: <Zap className="w-6 h-6" />,
            colorClass: 'text-purple-600',
            bgClass: 'bg-purple-50/80 group-hover:bg-purple-600 group-hover:text-white',
            borderClass: 'border-purple-100 hover:border-purple-300',
            badgeBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
            badgeText: 'نخبة الاستشاريين',
            services: 'الصداع النصفي • التصلب اللويحي • آلام العمود الفقري',
            category: 'surgical',
        };
    }
    if (nameAr.includes('قلب') || nameAr.includes('أوعية')) {
        return {
            icon: <HeartPulse className="w-6 h-6" />,
            colorClass: 'text-rose-600',
            bgClass: 'bg-rose-50/80 group-hover:bg-rose-600 group-hover:text-white',
            borderClass: 'border-rose-100 hover:border-rose-300',
            badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/80',
            badgeText: 'طوارئ وعيادات',
            services: 'قسطرة القلب • تخطيط صدى القلب (إيكو) • اضطراب النبض',
            category: 'surgical',
        };
    }

    return {
        icon: <Stethoscope className="w-6 h-6" />,
        colorClass: 'text-[#005ab5]',
        bgClass: 'bg-blue-50 group-hover:bg-[#005ab5] group-hover:text-white',
        borderClass: 'border-gray-200 hover:border-blue-200',
        badgeBg: 'bg-gray-100 text-gray-700 border-gray-200',
        badgeText: 'قسم سريري',
        services: 'استشارات متخصصة وتشخيص دقيق للحالات الطبية',
        category: 'general',
    };
};

export default function SpecialtiesPage({ specialties, totalDoctors, totalFacilities }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'popular' | 'surgical' | 'general'>('all');

    const filtered = specialties.filter((s) => {
        const theme = getSpecialtyTheme(s.name_ar);
        const matchesSearch =
            s.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.name_en && s.name_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            theme.services.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            selectedCategory === 'all' || theme.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title="طبيبي - كافة الأقسام والتخصصات الطبية المعتمدة" />
            <TebibyHeader />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Breadcrumbs Navigation */}
                <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6 font-medium">
                    <Link href="/" className="hover:text-[#005ab5] flex items-center gap-1 transition-colors">
                        <Home className="w-3.5 h-3.5" />
                        <span>الرئيسية</span>
                    </Link>
                    <span>/</span>
                    <span className="text-gray-700 font-bold">كافة الأقسام والعيادات التخصصية</span>
                </nav>

                {/* Hero Banner with Modern Integrated Stats */}
                <div className="bg-gradient-to-r from-white via-blue-50/30 to-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-sm mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#005ab5] text-xs font-bold border border-blue-100 mb-3">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>دليل الأقسام والعيادات المعتمدة</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-gray-900 font-['Cairo'] tracking-tight leading-tight">
                            اختر التخصص الطبي المناسب <br className="hidden sm:inline" />
                            <span className="text-[#005ab5]">واحجز كشفك مع نخبة الاستشاريين</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-2.5 leading-relaxed font-medium">
                            تصفح شبكة الأقسام السريرية المجهزة بأحدث التقنيات الاستشارية، مع حجز تذكرة دور فورية وقبول لكافة وثائق التأمين.
                        </p>
                    </div>

                    {/* Integrated Metric Badges */}
                    <div className="grid grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
                        <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs text-center">
                            <span className="block text-2xl sm:text-3xl font-black text-[#005ab5] font-['Cairo'] leading-none">
                                {specialties.length}
                            </span>
                            <span className="text-[11px] text-gray-500 font-bold mt-1 block">أقسام معتمدة</span>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs text-center">
                            <span className="block text-2xl sm:text-3xl font-black text-purple-700 font-['Cairo'] leading-none">
                                {totalDoctors}
                            </span>
                            <span className="text-[11px] text-gray-500 font-bold mt-1 block">استشاري متاح</span>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs text-center">
                            <span className="block text-2xl sm:text-3xl font-black text-[#006b5c] font-['Cairo'] leading-none">
                                {totalFacilities}
                            </span>
                            <span className="text-[11px] text-gray-500 font-bold mt-1 block">مستشفى ومركز</span>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="ابحث باسم القسم أو الإجراء الطبي..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pr-11 pl-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#005ab5]/20 focus:border-[#005ab5] focus:bg-white transition-all"
                        />
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={cn(
                                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                                selectedCategory === 'all'
                                    ? 'bg-[#005ab5] text-white shadow-xs'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            )}
                        >
                            كل الأقسام ({specialties.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedCategory('popular')}
                            className={cn(
                                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                                selectedCategory === 'popular'
                                    ? 'bg-[#005ab5] text-white shadow-xs'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            )}
                        >
                            الأكثر طلباً
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedCategory('surgical')}
                            className={cn(
                                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                                selectedCategory === 'surgical'
                                    ? 'bg-[#005ab5] text-white shadow-xs'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            )}
                        >
                            تخصصات جراحية
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedCategory('general')}
                            className={cn(
                                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                                selectedCategory === 'general'
                                    ? 'bg-[#005ab5] text-white shadow-xs'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            )}
                        >
                            باطنية وأطفال
                        </button>
                    </div>
                </div>

                {/* Specialties Grid */}
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {filtered.map((spec) => {
                            const theme = getSpecialtyTheme(spec.name_ar);
                            return (
                                <Link
                                    key={spec.id}
                                    href={`/doctors?specialty_id=${spec.id}`}
                                    className={cn(
                                        'group bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 relative',
                                        theme.borderClass
                                    )}
                                >
                                    <div>
                                        {/* Top Row: Thematic Icon & Badge */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div
                                                className={cn(
                                                    'w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xs',
                                                    theme.bgClass,
                                                    theme.colorClass
                                                )}
                                            >
                                                {theme.icon}
                                            </div>

                                            <span
                                                className={cn(
                                                    'text-[10px] font-bold px-2.5 py-1 rounded-full border',
                                                    theme.badgeBg
                                                )}
                                            >
                                                {spec.badge_text || theme.badgeText}
                                            </span>
                                        </div>

                                        {/* Title & English Subtitle */}
                                        <h3 className="font-black text-lg text-gray-900 font-['Cairo'] group-hover:text-[#005ab5] transition-colors leading-snug">
                                            {spec.name_ar}
                                        </h3>
                                        <p className="text-[11px] text-gray-400 font-mono mt-0.5 mb-2.5">
                                            {spec.name_en || 'Clinical Specialty'}
                                        </p>

                                        {/* Key Services Pill */}
                                        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-600 font-medium leading-relaxed mb-3">
                                            <span className="block text-[10px] text-gray-400 font-bold mb-0.5">أبرز الخدمات والإجراءات:</span>
                                            {theme.services}
                                        </div>

                                        {/* Description */}
                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4 font-normal">
                                            {spec.description || 'فحوصات استشارية وتشخيص متقدم للحالات السريرية المعقدة والبسيطة.'}
                                        </p>
                                    </div>

                                    <div>
                                        {/* Meta Counts: Doctors & Facilities */}
                                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 font-bold mb-3">
                                            <span className="flex items-center gap-1.5 bg-blue-50/70 text-[#005ab5] px-2.5 py-1 rounded-lg">
                                                <Users className="w-3.5 h-3.5" />
                                                <span>{spec.doctors_count} استشاري</span>
                                            </span>

                                            <span className="flex items-center gap-1.5 bg-purple-50/70 text-purple-700 px-2.5 py-1 rounded-lg">
                                                <Building2 className="w-3.5 h-3.5" />
                                                <span>{spec.facilities_count} مستشفيات</span>
                                            </span>
                                        </div>

                                        {/* Action Button */}
                                        <div className="w-full py-2.5 px-3 rounded-xl bg-gray-50 group-hover:bg-[#005ab5] text-gray-700 group-hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                                            <span>تصفح الأطباء والمواعيد</span>
                                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-gray-900 font-['Cairo'] text-base">لا توجد أقسام مطابقة للبحث</h3>
                        <p className="text-xs text-gray-500 mt-1">جرب البحث بكلمات أخرى أو تغيير الفلتر المحدد.</p>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('all');
                            }}
                            className="mt-4 px-4 py-2 rounded-xl bg-blue-50 text-[#005ab5] text-xs font-bold hover:bg-blue-100 transition-colors"
                        >
                            إلغاء الفلترة وعرض الكل
                        </button>
                    </div>
                )}
            </main>

            <TebibyFooter />
        </div>
    );
}
