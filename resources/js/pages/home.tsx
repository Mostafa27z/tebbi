import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import BookingModal from '@/components/tebiby/booking-modal';
import { 
    Search, 
    Star, 
    MapPin, 
    Calendar, 
    Clock, 
    ShieldCheck, 
    ChevronLeft, 
    Filter,
    Stethoscope, 
    Building2,
    Users,
    CheckCircle,
    ArrowLeft
} from 'lucide-react';

interface Specialty {
    id: number;
    name_ar: string;
    icon_slug: string;
    badge_text: string | null;
    doctor_profiles_count: number;
}

interface Clinic {
    id: number;
    name: string;
    city: string;
    district: string;
}

interface Doctor {
    id: number;
    title_ar: string;
    subspecialty: string;
    consultation_fee: number;
    rating: number;
    review_count: number;
    waiting_time_minutes: number;
    accepts_insurance: boolean;
    accepted_insurances: string[] | null;
    user: {
        name: string;
        avatar: string;
    };
    clinic: Clinic;
    specialty: Specialty;
}

interface HomeProps {
    specialties: Specialty[];
    clinics: Clinic[];
    doctors: Doctor[];
    filters: {
        specialty_id?: string | number;
        city?: string;
        search?: string;
        insurance_only?: boolean;
    };
    stats: {
        totalDoctors: number;
        totalClinics: number;
        satisfactionRate: string;
        avgWaitMinutes: number;
    };
}

export default function Home({ specialties, clinics, doctors, filters, stats }: HomeProps) {
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedSpecialty, setSelectedSpecialty] = useState<string | number>(filters.specialty_id || '');
    const [selectedCity, setSelectedCity] = useState(filters.city || '');
    const [insuranceOnly, setInsuranceOnly] = useState(filters.insurance_only || false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/', {
            search: searchTerm || undefined,
            specialty_id: selectedSpecialty || undefined,
            city: selectedCity || undefined,
            insurance_only: insuranceOnly ? true : undefined,
        }, { preserveState: true });
    };

    const handleOpenBooking = (doctor: Doctor, slot?: { date: string; time: string }) => {
        setSelectedDoctor(doctor);
        setSelectedSlot(slot || { date: 'اليوم - الجمعة 6 نوفمبر', time: '05:40 م' });
        setBookingModalOpen(true);
    };

    // Specialty icons mapping
    const getSpecialtyIcon = (slug: string) => {
        switch (slug) {
            case 'dentistry': return 'dentistry';
            case 'dermatology': return 'dermatology';
            case 'pediatrics': return 'child_care';
            case 'internal_medicine': return 'gastroenterology';
            case 'orthopedics': return 'orthopedics';
            case 'ophthalmology': return 'visibility';
            case 'neurology': return 'neurology';
            case 'cardiology': return 'cardiology';
            default: return 'medical_services';
        }
    };

    return (
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title="طبيبي - احجز موعدك الطبي وتتبع دورك لحظياً" />

            {/* Top Navigation */}
            <TebibyHeader />

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-blue-50/70 via-white to-[#f7f9fb]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/80 text-[#005ab5] text-xs font-bold mb-4 border border-blue-200">
                            <span className="w-2 h-2 rounded-full bg-[#005ab5] animate-pulse"></span>
                            <span>المنصة الطبية الذكية الأولى المزودة بتتبع الدور المباشر</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight font-['Cairo'] tracking-tight mb-4">
                            احجز طبيبك المفضل بكل سهولة <br className="hidden sm:inline" />
                            <span className="text-[#005ab5]">وتتبع موعدك ودورك لحظة بلحظة</span>
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 font-medium max-w-2xl mx-auto">
                            اختر من بين نخبة استشاريي كبرى المستشفيات والمراكز المعتمدة في المملكة مع قبول فوري لكافة وثائق التأمين المعتمدة.
                        </p>
                    </div>

                    {/* Smart Search Bar */}
                    <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-white p-3.5 sm:p-5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col lg:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="w-5 h-5 text-gray-400 absolute right-4 top-3.5" />
                            <input
                                type="text"
                                placeholder="ابحث باسم الطبيب، المستشفى أو الإجراء الطبي..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pr-12 pl-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#005ab5] focus:bg-white"
                            />
                        </div>

                        <div className="w-full lg:w-48">
                            <select
                                value={selectedSpecialty}
                                onChange={(e) => setSelectedSpecialty(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#005ab5]"
                            >
                                <option value="">كل التخصصات الطبية</option>
                                {specialties.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name_ar}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full lg:w-40">
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#005ab5]"
                            >
                                <option value="">كافة المدن</option>
                                <option value="الرياض">الرياض</option>
                                <option value="جدة">جدة</option>
                                <option value="الدمام">الدمام</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full lg:w-auto px-8 py-3 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-102 active:scale-98"
                        >
                            <Search className="w-4 h-4" />
                            <span>بحث</span>
                        </button>
                    </form>

                    {/* Platform Highlights */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/70 border border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-blue-100/60 flex items-center justify-center text-[#005ab5]">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">متوسط وقت الانتظار</span>
                                <span className="font-bold text-sm text-gray-900 font-['Cairo']">{stats.avgWaitMinutes} دقيقة فقط</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/70 border border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100/60 flex items-center justify-center text-[#006b5c]">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">موافقة تأمين فورية</span>
                                <span className="font-bold text-sm text-gray-900 font-['Cairo']">بوبا والتعاونية</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/70 border border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-purple-100/60 flex items-center justify-center text-purple-700">
                                <Stethoscope className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">أطباء واستشاريون</span>
                                <span className="font-bold text-sm text-gray-900 font-['Cairo']">{stats.totalDoctors}+ استشاري</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/70 border border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-amber-100/60 flex items-center justify-center text-amber-700">
                                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">معدل رضا المرضى</span>
                                <span className="font-bold text-sm text-gray-900 font-['Cairo']">{stats.satisfactionRate}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Medical Specialties Section */}
            <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 font-['Cairo']">الأقسام الطبية الأكثر طلباً</h2>
                        <p className="text-sm text-gray-500 mt-1">تصفح نخبة العيادات المجهزة بأحدث التقنيات السريرية</p>
                    </div>
                    <Link href="/" className="text-xs font-bold text-[#005ab5] hover:underline flex items-center gap-1">
                        <span>عرض كافة الأقسام</span>
                        <ChevronLeft className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {specialties.map((spec) => {
                        const isSelected = selectedSpecialty == spec.id;
                        return (
                            <button
                                key={spec.id}
                                onClick={() => {
                                    setSelectedSpecialty(isSelected ? '' : spec.id);
                                    router.get('/', { specialty_id: isSelected ? undefined : spec.id }, { preserveState: true });
                                }}
                                className={`text-right p-5 rounded-3xl border transition-all flex flex-col justify-between group ${
                                    isSelected
                                        ? 'bg-[#005ab5] text-white border-[#005ab5] shadow-lg shadow-blue-500/20'
                                        : 'bg-white text-gray-800 border-gray-200/80 hover:border-[#005ab5] hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#005ab5] group-hover:bg-[#005ab5] group-hover:text-white'
                                    }`}>
                                        <span className="material-symbols-outlined text-[26px]">
                                            {getSpecialtyIcon(spec.icon_slug)}
                                        </span>
                                    </div>
                                    {spec.badge_text && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            isSelected ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'
                                        }`}>
                                            {spec.badge_text}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-base mb-1 font-['Cairo']">{spec.name_ar}</h3>
                                    <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                        متاح الحجز الفوري
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Doctors Listing Section */}
            <section className="py-12 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 font-['Cairo']">نخبة الأطباء والاستشاريين المتاحين اليوم</h2>
                            <p className="text-sm text-gray-500 mt-1">حجز مباشر وتذكرة فورية لنظام الانتظار الحي</p>
                        </div>

                        {/* Quick filter pills */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setInsuranceOnly(!insuranceOnly);
                                    router.get('/', { insurance_only: !insuranceOnly ? true : undefined }, { preserveState: true });
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                                    insuranceOnly
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                <span>يقبل التأمين الطبي فقط</span>
                            </button>
                        </div>
                    </div>

                    {/* Doctors Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {doctors.map((doctor) => (
                            <div
                                key={doctor.id}
                                className="p-6 rounded-3xl border border-gray-200/90 bg-white hover:shadow-xl hover:border-blue-200 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    {/* Card Header: Avatar & Info */}
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="relative">
                                            <img
                                                src={doctor.user.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=faces'}
                                                alt={doctor.user.name}
                                                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-blue-100"
                                            />
                                            <span className="absolute -bottom-2 -left-2 bg-emerald-500 border-2 border-white text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                                متاح
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-extrabold text-lg text-gray-900 font-['Cairo'] truncate">
                                                    {doctor.user.name}
                                                </h3>
                                                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80">
                                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                    <span className="text-xs font-bold text-amber-900">{doctor.rating}</span>
                                                    <span className="text-[10px] text-gray-500">({doctor.review_count})</span>
                                                </div>
                                            </div>

                                            <p className="text-xs font-bold text-[#005ab5] mb-1">{doctor.title_ar}</p>
                                            <p className="text-xs text-gray-500 line-clamp-1 mb-2">{doctor.subspecialty}</p>

                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="truncate">{doctor.clinic.name} - {doctor.clinic.district}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Features Badges */}
                                    <div className="flex flex-wrap gap-2 py-3 border-y border-gray-100 mb-4 text-xs">
                                        <span className="bg-blue-50 text-[#005ab5] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            وقت انتظار تقريبي: {doctor.waiting_time_minutes} دقيقة
                                        </span>
                                        {doctor.accepts_insurance && (
                                            <span className="bg-emerald-50 text-[#006b5c] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                تأمين بوبا والتعاونية
                                            </span>
                                        )}
                                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-semibold">
                                            كشفية: {Number(doctor.consultation_fee)} ر.س
                                        </span>
                                    </div>

                                    {/* Slots selection */}
                                    <div className="mb-4">
                                        <span className="block text-xs font-bold text-gray-700 mb-2">المواعيد المتاحة اليوم:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {['05:00 م', '05:20 م', '05:40 م', '06:00 م'].map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => handleOpenBooking(doctor, { date: 'اليوم - الجمعة 6 نوفمبر', time })}
                                                    className="px-3 py-1.5 rounded-xl border border-gray-200 hover:border-[#005ab5] hover:bg-blue-50/50 text-xs font-bold text-gray-700 hover:text-[#005ab5] transition-colors"
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Button */}
                                <button
                                    onClick={() => handleOpenBooking(doctor)}
                                    className="w-full py-3 px-4 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-transform active:scale-98"
                                >
                                    <span>حجز فوري وإصدار تذكرة الدور</span>
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <TebibyFooter />

            {/* Booking Modal */}
            <BookingModal
                doctor={selectedDoctor}
                selectedSlot={selectedSlot}
                isOpen={bookingModalOpen}
                onClose={() => setBookingModalOpen(false)}
            />
        </div>
    );
}

