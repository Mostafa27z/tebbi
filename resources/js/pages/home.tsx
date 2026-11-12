import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import BookingModal from '@/components/tebiby/booking-modal';
import { DoctorCard } from '@/components/tebiby/doctor-card';
import { CustomSelect } from '@/components/common/custom-select';
import { LoadingButton } from '@/components/common/loading-button';
import { 
    Search, 
    Star, 
    Clock, 
    ShieldCheck, 
    ChevronLeft, 
    Stethoscope, 
    Users,
    Building2,
    Calendar,
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
        avgWaitMinutes: string;
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
    const [searching, setSearching] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearching(true);
        router.get('/', {
            search: searchTerm || undefined,
            specialty_id: selectedSpecialty || undefined,
            city: selectedCity || undefined,
            insurance_only: insuranceOnly ? true : undefined,
        }, {
            preserveState: true,
            onFinish: () => setSearching(false),
        });
    };

    const handleOpenBooking = (doctor: Doctor, slot?: { date: string; time: string }) => {
        setSelectedDoctor(doctor);
        setSelectedSlot(slot || { date: 'اليوم - الجمعة 6 نوفمبر', time: '05:40 م' });
        setBookingModalOpen(true);
    };

    const specialtyOptions = [
        { value: '', label: 'كافة التخصصات الطبية' },
        ...specialties.map((s) => ({ value: s.id, label: s.name_ar })),
    ];

    const cityOptions = [
        { value: '', label: 'كافة المدن' },
        { value: 'الرياض', label: 'الرياض' },
        { value: 'جدة', label: 'جدة' },
        { value: 'الدمام', label: 'الدمام' },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title="طبيبي - احجز موعدك الطبي وتتبع دورك لحظياً" />

            <TebibyHeader />

            {/* Clean & Professional Hero Section (بدون شارات متكلفة) */}
            <section className="relative pt-12 pb-16 bg-white border-b border-gray-100 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30">
                    <div className="text-center max-w-3xl mx-auto mb-8">
                        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight font-['Cairo'] tracking-tight mb-3">
                            احجز طبيبك المفضل بكل سهولة <br className="hidden sm:inline" />
                            <span className="text-[#005ab5]">وتتبع دورك في العيادة لحظة بلحظة</span>
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                            اختر من بين نخبة استشاريي كبرى المستشفيات والمراكز المعتمدة مع قبول فوري لكافة وثائق التأمين.
                        </p>
                    </div>

                    {/* Smart Search Bar */}
                    <form
                        onSubmit={handleSearch}
                        className="max-w-4xl mx-auto bg-white p-2.5 sm:p-3.5 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-200/90 flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch lg:items-center relative z-40"
                    >
                        <div className="flex-1 w-full relative">
                            <Search className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="ابحث باسم الطبيب، المستشفى أو الإجراء..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-12 pr-11 pl-4 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#005ab5]/20 focus:border-[#005ab5] focus:bg-white transition-all box-border"
                            />
                        </div>

                        <div className="w-full lg:w-56 shrink-0">
                            <CustomSelect
                                value={selectedSpecialty}
                                onChange={(val) => setSelectedSpecialty(val)}
                                options={specialtyOptions}
                                placeholder="التخصص الطبي"
                            />
                        </div>

                        <div className="w-full lg:w-44 shrink-0">
                            <CustomSelect
                                value={selectedCity}
                                onChange={(val) => setSelectedCity(String(val))}
                                options={cityOptions}
                                placeholder="المدينة"
                            />
                        </div>

                        <LoadingButton
                            type="submit"
                            loading={searching}
                            loadingText="جارٍ البحث..."
                            variant="primary"
                            icon={<Search className="w-4 h-4" />}
                            className="w-full lg:w-auto h-12 px-8 rounded-2xl text-sm font-bold shrink-0"
                        >
                            بحث
                        </LoadingButton>
                    </form>

                    {/* Quick Stats Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mt-6 relative z-10">
                        <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-[#005ab5] flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block text-[11px] text-gray-400 font-bold">متوسط الانتظار</span>
                                <span className="font-bold text-xs text-gray-900">{stats.avgWaitMinutes}</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-[#006b5c] flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block text-[11px] text-gray-400 font-bold">تغطية التأمين</span>
                                <span className="font-bold text-xs text-gray-900">موافقة فورية</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block text-[11px] text-gray-400 font-bold">استشاريون معتمدون</span>
                                <span className="font-bold text-xs text-gray-900">{stats.totalDoctors}+ استشاري</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            </div>
                            <div>
                                <span className="block text-[11px] text-gray-400 font-bold">نسبة الرضا</span>
                                <span className="font-bold text-xs text-gray-900">{stats.satisfactionRate}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Medical Specialties Section (مع زر ينقل لصفحة الأقسام الكاملة) */}
            <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 font-['Cairo']">الأقسام الطبية الأكثر طلباً</h2>
                        <p className="text-xs text-gray-500 mt-1">تصفح نخبة العيادات المجهزة بأحدث التقنيات السريرية</p>
                    </div>

                    <Link
                        href="/specialties"
                        className="text-xs font-bold text-[#005ab5] hover:text-[#00458e] hover:underline flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 transition-colors"
                    >
                        <span>عرض كافة الأقسام ({specialties.length})</span>
                        <ChevronLeft className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {specialties.slice(0, 8).map((spec) => (
                        <Link
                            key={spec.id}
                            href={`/doctors?specialty_id=${spec.id}`}
                            className="p-5 rounded-3xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#005ab5] group-hover:bg-[#005ab5] group-hover:text-white flex items-center justify-center transition-colors">
                                    <Stethoscope className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold">
                                    {spec.doctor_profiles_count} أطباء
                                </span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-gray-900 font-['Cairo'] group-hover:text-[#005ab5] transition-colors mb-0.5">
                                    {spec.name_ar}
                                </h3>
                                <span className="text-[11px] text-gray-400 font-medium">حجز فوري متاح</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Doctors Listing Section (مع زر ينقل لصفحة الاستشاريين الكاملة) */}
            <section className="py-12 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 font-['Cairo']">
                                نخبة الأطباء والاستشاريين المتاحين اليوم
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">حجز مباشر وتذكرة فورية لنظام الانتظار الحي</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setInsuranceOnly(!insuranceOnly);
                                    router.get('/', { insurance_only: !insuranceOnly ? true : undefined }, { preserveState: true });
                                }}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                                    insuranceOnly
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>تأمين فقط</span>
                            </button>

                            <Link
                                href="/doctors"
                                className="text-xs font-bold text-[#005ab5] hover:text-[#00458e] hover:underline flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 transition-colors"
                            >
                                <span>عرض كافة الأطباء</span>
                                <ChevronLeft className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Doctors Cards Grid with Top Avatar Image Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.slice(0, 6).map((doctor) => (
                            <DoctorCard
                                key={doctor.id}
                                doctor={doctor}
                                onBookSlot={(doc, slot) => handleOpenBooking(doc, slot)}
                                onBookDirect={(doc) => handleOpenBooking(doc)}
                            />
                        ))}
                    </div>
                </div>
            </section>

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
