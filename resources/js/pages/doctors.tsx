import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import BookingModal from '@/components/tebiby/booking-modal';
import { DoctorCard } from '@/components/tebiby/doctor-card';
import { CustomSelect } from '@/components/common/custom-select';
import { LoadingButton } from '@/components/common/loading-button';
import { 
    Search, 
    ShieldCheck, 
    Users, 
    Filter,
    Stethoscope,
    Building2,
    Sparkles
} from 'lucide-react';

interface Specialty {
    id: number;
    name_ar: string;
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
    user: {
        name: string;
        avatar: string;
    };
    clinic: {
        name: string;
        city: string;
        district: string;
    };
    specialty?: {
        name_ar: string;
    };
}

interface Props {
    doctors: Doctor[];
    specialties: Specialty[];
    cities: string[];
    filters: {
        specialty_id?: string | number;
        city?: string;
        search?: string;
        insurance_only?: boolean;
    };
    totalDoctors: number;
}

export default function DoctorsPage({
    doctors,
    specialties,
    cities,
    filters,
    totalDoctors,
}: Props) {
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
        router.get('/doctors', {
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
        ...cities.map((c) => ({ value: c, label: c })),
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title="طبيبي - نخبة الأطباء والاستشاريين المتاحين" />
            <TebibyHeader />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
                {/* Header Banner */}
                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#005ab5] mb-2">
                            <Sparkles className="w-4 h-4" />
                            <span>دليل الأطباء والاستشاريين المعتمدين</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-gray-900 font-['Cairo'] tracking-tight">
                            احجز مع نخبة الاستشاريين
                        </h1>
                        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
                            اختر طبيبك المناسب واحصل على تذكرة حضور فورية وتتبع دورك لحظة بلحظة دون عناء الانتظار.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#005ab5] rounded-2xl border border-blue-100 text-xs font-bold">
                        <Users className="w-4 h-4" />
                        <span>{doctors.length} طبيب متاح في هذا البحث</span>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <form
                    onSubmit={handleSearch}
                    className="bg-white p-3 sm:p-4 rounded-3xl border border-gray-100 shadow-sm mb-8 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center relative z-30"
                >
                    <div className="flex-1 w-full relative">
                        <Search className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="ابحث باسم الطبيب، المستشفى أو الإجراء..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pr-11 pl-4 rounded-2xl bg-gray-50/80 border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#005ab5]/20 focus:border-[#005ab5] focus:bg-white transition-all box-border"
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

                    <button
                        type="button"
                        onClick={() => setInsuranceOnly(!insuranceOnly)}
                        className={`w-full lg:w-auto h-12 px-5 rounded-2xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                            insuranceOnly
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>تأمين فقط</span>
                    </button>

                    <LoadingButton
                        type="submit"
                        loading={searching}
                        loadingText="جارٍ البحث..."
                        variant="primary"
                        icon={<Search className="w-4 h-4" />}
                        className="w-full lg:w-auto h-12 px-7 rounded-2xl text-sm font-bold shrink-0"
                    >
                        تطبيق البحث
                    </LoadingButton>
                </form>

                {/* Doctors Cards Grid */}
                {doctors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map((doctor) => (
                            <DoctorCard
                                key={doctor.id}
                                doctor={doctor as any}
                                onBookSlot={(doc, slot) => handleOpenBooking(doc, slot)}
                                onBookDirect={(doc) => handleOpenBooking(doc)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
                        <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-900 font-['Cairo']">لا توجد نتائج مطابقة لبحثك</h3>
                        <p className="text-xs text-gray-500 mt-1">جرب تغيير التخصص أو المدينة أو إزالة الفلاتر المحددة.</p>
                    </div>
                )}
            </main>

            {/* Booking Modal */}
            <BookingModal
                doctor={selectedDoctor}
                selectedSlot={selectedSlot}
                isOpen={bookingModalOpen}
                onClose={() => setBookingModalOpen(false)}
            />

            <TebibyFooter />
        </div>
    );
}

