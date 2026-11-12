import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FacilityDashboardLayout } from '@/layouts/facility-dashboard-layout';
import { 
    Users, 
    CheckCircle2, 
    AlertCircle, 
    Stethoscope, 
    ToggleRight, 
    ToggleLeft, 
    Search, 
    ShieldCheck, 
    Clock, 
    Sparkles, 
    Phone, 
    Mail 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomSelect } from '@/components/common/custom-select';

interface Doctor {
    id: number;
    title_ar: string;
    consultation_fee: number;
    waiting_time_minutes: number;
    is_available_today: boolean;
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    specialty: {
        id: number;
        name_ar: string;
    };
    doctor_facilities?: Array<{
        facility: { id: number; name: string };
        consultation_fee: number;
    }>;
}

interface Props {
    facility: {
        id: number;
        name: string;
        branch_name?: string;
        city: string;
    };
    metrics: {
        doctorsCount: number;
        activeDoctorsCount: number;
        specialtiesCount: number;
        totalToday: number;
        waitingCount: number;
        inConsultationCount: number;
        completedCount: number;
    };
    doctors: Doctor[];
    specialties: Array<{ id: number; name_ar: string; description?: string }>;
}

export default function FacilityDoctorsPage({
    facility,
    metrics,
    doctors,
    specialties,
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
    const [presenceFilter, setPresenceFilter] = useState<'all' | 'available' | 'unavailable'>('all');

    // Doctor Presence Toggle Modal State
    const [presenceModal, setPresenceModal] = useState<{
        isOpen: boolean;
        doctor: Doctor | null;
        loading: boolean;
    }>({
        isOpen: false,
        doctor: null,
        loading: false,
    });

    const handleConfirmTogglePresence = () => {
        if (!presenceModal.doctor) return;
        setPresenceModal((prev) => ({ ...prev, loading: true }));

        router.post(
            `/facility/doctors/${presenceModal.doctor.id}/toggle-presence`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setPresenceModal({ isOpen: false, doctor: null, loading: false });
                },
                onError: () => {
                    setPresenceModal((prev) => ({ ...prev, loading: false }));
                },
            }
        );
    };

    const specialtyOptions = [
        { value: 'all', label: 'جميع التخصصات' },
        ...specialties.map((s) => ({ value: s.id, label: s.name_ar })),
    ];

    const presenceOptions = [
        { value: 'all', label: 'جميع الحالات' },
        { value: 'available', label: 'حاضر ومتاح اليوم' },
        { value: 'unavailable', label: 'غير متواجد / معلّق' },
    ];

    const filteredDoctors = doctors.filter((doc) => {
        const matchesSearch =
            doc.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.specialty.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.title_ar.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSpecialty = specialtyFilter === 'all' || doc.specialty.id === Number(specialtyFilter);

        const matchesPresence =
            presenceFilter === 'all' ||
            (presenceFilter === 'available' ? doc.is_available_today : !doc.is_available_today);

        return matchesSearch && matchesSpecialty && matchesPresence;
    });

    return (
        <FacilityDashboardLayout
            activeTab="doctors"
            facilityName={facility.name}
            branchName={facility.branch_name}
            counts={{
                waiting: metrics.waitingCount,
                doctors: metrics.doctorsCount,
                specialties: specialties?.length || metrics.specialtiesCount,
                appointments: metrics.totalToday,
            }}
        >
            <Head title={`أطباء المنشأة - ${facility.name}`} />

            <div className="space-y-6">
                {/* Doctors Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 block">إجمالي أطباء المنشأة</span>
                            <span className="text-2xl font-black text-gray-900 font-mono mt-1 block">
                                {doctors.length}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5 block">أطباء واستشاريون مقيدون</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 block">الأطباء المتاحون اليوم</span>
                            <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                                {metrics.activeDoctorsCount}
                            </span>
                            <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">حاضرون ويستقبلون المرضى</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 block">أطباء غير حاضرين</span>
                            <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">
                                {doctors.length - metrics.activeDoctorsCount}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5 block">عيادات معلقة مؤقتاً</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 block">التخصصات الطبية</span>
                            <span className="text-2xl font-black text-teal-600 font-mono mt-1 block">
                                {specialties.length}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5 block">أقسام استشارية وعلاجية</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                            <Stethoscope className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Doctors Directory & Presence Controls */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 font-['Cairo'] flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                <span>دليل أطباء المنشأة وضبط التواجد اليومي المباشر</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                يمكنك من هنا تفعيل أو إيقاف استقبال الطبيب للحالات في طابور اليوم بنقرة واحدة
                            </p>
                        </div>

                        <div className="text-xs font-bold text-gray-500 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-100">
                            المعروض: <span className="font-mono text-purple-700 font-black">{filteredDoctors.length}</span> طبيب
                        </div>
                    </div>

                    {/* Filter Toolbar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50/90 rounded-2xl border border-gray-200/80 mb-6">
                        <div className="relative">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="بحث باسم الطبيب، التخصص، اللقب..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pr-10 pl-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                            />
                        </div>

                        <div>
                            <CustomSelect
                                size="sm"
                                value={specialtyFilter}
                                onChange={(val) => setSpecialtyFilter(String(val))}
                                options={specialtyOptions}
                                placeholder="تصفية بالتخصص"
                            />
                        </div>

                        <div>
                            <CustomSelect
                                size="sm"
                                value={presenceFilter}
                                onChange={(val) => setPresenceFilter(val as any)}
                                options={presenceOptions}
                                placeholder="تصفية بحالة التواجد"
                            />
                        </div>
                    </div>

                    {/* Doctors Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredDoctors.length > 0 ? (
                            filteredDoctors.map((doctor) => {
                                const isAvailable = doctor.is_available_today;

                                return (
                                    <div
                                        key={doctor.id}
                                        className="p-5 rounded-3xl border border-gray-200/80 bg-white hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={
                                                            doctor.user.avatar ||
                                                            'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&h=120&fit=crop&crop=faces'
                                                        }
                                                        alt={doctor.user.name}
                                                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-100"
                                                    />
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-sm font-['Cairo']">
                                                            {doctor.user.name}
                                                        </h4>
                                                        <p className="text-xs text-purple-700 font-bold">
                                                            {doctor.specialty.name_ar}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                                            {doctor.title_ar}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    className={cn(
                                                        'px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0',
                                                        isAvailable
                                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                            : 'bg-gray-100 text-gray-600'
                                                    )}
                                                >
                                                    {isAvailable ? 'حاضر ومتاح' : 'معلّق / غائب'}
                                                </span>
                                            </div>

                                            <div className="p-3 bg-gray-50/80 rounded-2xl text-xs space-y-1.5 mb-4">
                                                <div className="flex justify-between text-gray-600">
                                                    <span>قيمة الكشف:</span>
                                                    <span className="font-bold font-mono text-emerald-700">
                                                        {doctor.consultation_fee} ر.س
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-gray-600">
                                                    <span>متوسط وقت الكشف:</span>
                                                    <span className="font-mono text-gray-700 font-semibold">
                                                        {doctor.waiting_time_minutes || 15} دقيقة
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-gray-600">
                                                    <span>البريد الإلكتروني:</span>
                                                    <span className="font-mono text-gray-500 truncate max-w-[150px]">
                                                        {doctor.user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Toggle Presence Switch Button */}
                                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-700">
                                                حالة التواجد لليوم:
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPresenceModal({
                                                        isOpen: true,
                                                        doctor,
                                                        loading: false,
                                                    })
                                                }
                                                className={cn(
                                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs',
                                                    isAvailable
                                                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                                )}
                                            >
                                                {isAvailable ? (
                                                    <>
                                                        <ToggleRight className="w-5 h-5 text-emerald-600" />
                                                        <span>متاح بالعيادة</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                                                        <span>معلّق / غائب</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-12 text-center text-gray-400 text-xs">
                                لا توجد نتائج مطابقة لخيارات البحث.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Doctor Presence Confirmation Modal */}
            {presenceModal.isOpen && presenceModal.doctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className={cn(
                                    'w-12 h-12 rounded-2xl flex items-center justify-center',
                                    presenceModal.doctor.is_available_today
                                        ? 'bg-amber-50 text-amber-600'
                                        : 'bg-emerald-50 text-emerald-600'
                                )}
                            >
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 font-['Cairo']">
                                    {presenceModal.doctor.is_available_today
                                        ? 'تعليق حضور الطبيب لليوم؟'
                                        : 'تأكيد حضور الطبيب بالعيادة لليوم؟'}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {presenceModal.doctor.user.name} - {presenceModal.doctor.specialty.name_ar}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed mb-6 bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                            {presenceModal.doctor.is_available_today
                                ? 'سيتم تعليق استقبال هذا الطبيب للمرضى الجدد في طابور الحضور اليومي حتى يتم تفعيله مجدداً.'
                                : 'سيصبح الطبيب متاحاً لاستقبال الحالات في طابور الانتظار وتلقي كشوفات اليوم.'}
                        </p>

                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setPresenceModal({ isOpen: false, doctor: null, loading: false })}
                                disabled={presenceModal.loading}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                            >
                                تراجع
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmTogglePresence}
                                disabled={presenceModal.loading}
                                className={cn(
                                    'px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50',
                                    presenceModal.doctor.is_available_today
                                        ? 'bg-amber-600 hover:bg-amber-700'
                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                )}
                            >
                                {presenceModal.loading ? 'جارٍ التحديث...' : 'تأكيد وحفظ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </FacilityDashboardLayout>
    );
}

