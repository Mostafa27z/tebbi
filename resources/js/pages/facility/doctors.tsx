import React, { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
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
    Mail,
    Plus,
    Edit3,
    Trash2,
    Eye,
    X,
    Building2,
    Award,
    FileText,
    Check,
    Lock,
    UserCheck,
    CalendarCheck2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomSelect } from '@/components/common/custom-select';

interface Doctor {
    id: number;
    title_ar: string;
    subspecialty?: string;
    bio?: string;
    license_no?: string;
    experience_years?: number;
    consultation_fee: number;
    facility_consultation_fee?: number;
    waiting_time_minutes: number;
    facility_slot_minutes?: number;
    accepts_insurance?: boolean;
    facility_accepts_insurance?: boolean;
    is_available_today: boolean;
    clinic_id?: number;
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        avatar?: string;
    };
    specialty: {
        id: number;
        name_ar: string;
    };
    doctor_facilities?: Array<{
        facility: { id: number; name: string };
        consultation_fee: number;
        default_slot_minutes?: number;
        accepts_insurance?: boolean;
        is_active?: boolean;
    }>;
}

interface SpecialtyItem {
    id: number;
    name_ar: string;
    name_en?: string;
    description?: string;
}

interface AvailableDoctor {
    id: number;
    title_ar: string;
    consultation_fee: number;
    waiting_time_minutes: number;
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        avatar?: string;
    };
    specialty?: {
        id: number;
        name_ar: string;
    };
    clinic?: {
        id: number;
        name: string;
    };
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
        receptionistsCount?: number;
    };
    doctors: Doctor[];
    specialties: SpecialtyItem[];
    allSpecialties?: SpecialtyItem[];
    availableDoctors?: AvailableDoctor[];
    canManageFacility?: boolean;
}

export default function FacilityDoctorsPage({
    facility,
    metrics,
    doctors,
    specialties,
    allSpecialties = [],
    availableDoctors = [],
    canManageFacility,
}: Props) {
    const { props } = usePage();
    const authUser = (props as any).auth?.user;
    const isManager = canManageFacility ?? (authUser?.role === 'admin' || Boolean(authUser?.is_group_admin) || Boolean(authUser?.is_facility_admin));

    const [searchQuery, setSearchQuery] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
    const [presenceFilter, setPresenceFilter] = useState<'all' | 'available' | 'unavailable'>('all');

    // Add Doctor Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addTab, setAddTab] = useState<'new' | 'existing'>('new');

    // View Details Modal State
    const [viewDoctor, setViewDoctor] = useState<Doctor | null>(null);

    // Edit Doctor Modal State
    const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);

    // Delete Doctor Modal State
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        doctor: Doctor | null;
        loading: boolean;
    }>({
        isOpen: false,
        doctor: null,
        loading: false,
    });

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

    // New Doctor Form Hook
    const newDoctorForm = useForm({
        mode: 'new',
        facility_id: facility.id,
        name: '',
        title_ar: 'استشاري',
        specialty_id: allSpecialties[0]?.id ? String(allSpecialties[0].id) : '',
        subspecialty: '',
        email: '',
        phone: '',
        password: '',
        consultation_fee: 250,
        waiting_time_minutes: 20,
        experience_years: 7,
        license_no: '',
        accepts_insurance: true,
    });

    // Assign Existing Doctor Form Hook
    const assignDoctorForm = useForm({
        mode: 'existing',
        facility_id: facility.id,
        doctor_profile_id: availableDoctors[0]?.id ? String(availableDoctors[0].id) : '',
        consultation_fee: 250,
        waiting_time_minutes: 20,
        accepts_insurance: true,
    });

    // Edit Doctor Form Hook
    const editDoctorForm = useForm({
        facility_id: facility.id,
        name: '',
        email: '',
        phone: '',
        specialty_id: '',
        title_ar: '',
        subspecialty: '',
        consultation_fee: 250,
        waiting_time_minutes: 20,
        experience_years: 5,
        license_no: '',
        accepts_insurance: true,
    });

    // Handle Opening Edit Modal
    const handleOpenEdit = (doc: Doctor) => {
        setEditDoctor(doc);
        const fee = doc.facility_consultation_fee ?? doc.consultation_fee;
        const duration = doc.facility_slot_minutes ?? doc.waiting_time_minutes ?? 20;
        const ins = doc.facility_accepts_insurance !== undefined ? doc.facility_accepts_insurance : (doc.accepts_insurance ?? true);

        editDoctorForm.setData({
            facility_id: facility.id,
            name: doc.user.name,
            email: doc.user.email,
            phone: doc.user.phone || '',
            specialty_id: String(doc.specialty.id),
            title_ar: doc.title_ar,
            subspecialty: doc.subspecialty || '',
            consultation_fee: Number(fee),
            waiting_time_minutes: Number(duration),
            experience_years: doc.experience_years || 5,
            license_no: doc.license_no || '',
            accepts_insurance: ins,
        });
    };

    // Submit New Doctor Form
    const handleCreateDoctor = (e: React.FormEvent) => {
        e.preventDefault();
        newDoctorForm.post('/facility/doctors', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                newDoctorForm.reset();
            },
        });
    };

    // Submit Assign Existing Doctor Form
    const handleAssignDoctor = (e: React.FormEvent) => {
        e.preventDefault();
        assignDoctorForm.post('/facility/doctors', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                assignDoctorForm.reset();
            },
        });
    };

    // Submit Edit Doctor Form
    const handleUpdateDoctor = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editDoctor) return;
        editDoctorForm.put(`/facility/doctors/${editDoctor.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditDoctor(null);
            },
        });
    };

    // Handle Confirm Delete / Detach
    const handleConfirmDelete = () => {
        if (!deleteModal.doctor) return;
        setDeleteModal((prev) => ({ ...prev, loading: true }));
        router.delete(`/facility/doctors/${deleteModal.doctor.id}`, {
            data: { facility_id: facility.id },
            preserveScroll: true,
            onSuccess: () => {
                setDeleteModal({ isOpen: false, doctor: null, loading: false });
            },
            onError: () => {
                setDeleteModal((prev) => ({ ...prev, loading: false }));
            },
        });
    };

    // Handle Confirm Toggle Presence
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
            doc.title_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.subspecialty && doc.subspecialty.toLowerCase().includes(searchQuery.toLowerCase()));

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
                receptionists: metrics.receptionistsCount,
            }}
        >
            <Head title={`إدارة أطباء المنشأة - ${facility.name}`} />

            <div className="space-y-6">
                {/* Doctors Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 block">إجمالي أطباء المنشأة</span>
                            <span className="text-2xl font-black text-gray-900 font-mono mt-1 block">
                                {doctors.length}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5 block">أطباء واستشاريون معتمدون</span>
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

                {/* Doctors Directory Header & Action Toolbar */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 font-['Cairo'] flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                <span>{isManager ? 'إدارة كادر أطباء المنشأة وضبط الخدمات والأسعار' : 'أطباء المنشأة وتفعيل المربعات المتاحة'}</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {isManager
                                    ? 'يمكنك إضافة أطباء جدد، تعيين أطباء مسجلين، تعديل أسعار الكشف بالمنشأة، وضبط الحضور اليومي'
                                    : 'متابعة كادر الأطباء، حالة التواجد اليومي، وتفعيل المربعات المتاحة لاستقبال المرضى وحجز الأدوار'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {isManager ? (
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>+ إضافة واستدعاء طبيب</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>صلاحية الاستقبال: ضبط الحضور والمربعات</span>
                                </div>
                            )}

                            <div className="text-xs font-bold text-gray-500 bg-gray-50 px-3.5 py-2.5 rounded-2xl border border-gray-100">
                                المعروض: <span className="font-mono text-purple-700 font-black">{filteredDoctors.length}</span> طبيب
                            </div>
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
                                const consultationFee = doctor.facility_consultation_fee ?? doctor.consultation_fee;
                                const waitingMinutes = doctor.facility_slot_minutes ?? doctor.waiting_time_minutes ?? 15;
                                const acceptsInsurance = doctor.facility_accepts_insurance !== undefined 
                                    ? doctor.facility_accepts_insurance 
                                    : (doctor.accepts_insurance ?? true);

                                return (
                                    <div
                                        key={doctor.id}
                                        className="p-5 rounded-3xl border border-gray-200/80 bg-white hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Card Top: Avatar, Name & Presence Status */}
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <img
                                                            src={
                                                                doctor.user.avatar ||
                                                                'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&h=120&fit=crop&crop=faces'
                                                            }
                                                            alt={doctor.user.name}
                                                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-100"
                                                        />
                                                        <span
                                                            className={cn(
                                                                'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
                                                                isAvailable ? 'bg-emerald-500' : 'bg-gray-400'
                                                            )}
                                                            title={isAvailable ? 'متاح' : 'معلّق'}
                                                        />
                                                    </div>
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

                                            {/* Card Details Box */}
                                            <div className="p-3 bg-gray-50/80 rounded-2xl text-xs space-y-1.5 mb-4">
                                                <div className="flex justify-between text-gray-600">
                                                    <span>قيمة الكشف بالمنشأة:</span>
                                                    <span className="font-bold font-mono text-emerald-700">
                                                        {consultationFee} ر.س
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-gray-600">
                                                    <span>متوسط وقت الكشف:</span>
                                                    <span className="font-mono text-gray-700 font-semibold">
                                                        {waitingMinutes} دقيقة
                                                    </span>
                                                </div>
                                                {doctor.license_no && (
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>رقم الترخيص الطبي:</span>
                                                        <span className="font-mono text-gray-700 font-semibold">
                                                            {doctor.license_no}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-gray-600">
                                                    <span>قبول التأمين:</span>
                                                    <span className={cn('font-bold', acceptsInsurance ? 'text-emerald-600' : 'text-gray-400')}>
                                                        {acceptsInsurance ? 'معتمد' : 'غير معتمد'}
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

                                        {/* Card Action Controls */}
                                        <div className="space-y-2 pt-3 border-t border-gray-100">
                                            {/* Operational Action Buttons: View, Edit, Delete */}
                                            <div className="flex items-center gap-1.5 justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewDoctor(doctor)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-colors border border-gray-200 cursor-pointer"
                                                        title="عرض كامل التفاصيل"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>تفاصيل</span>
                                                    </button>
                                                    {isManager && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(doctor)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors border border-blue-200 bg-blue-50/50 cursor-pointer"
                                                            title="تعديل بيانات الطبيب"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                                            <span>تعديل</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {isManager && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteModal({ isOpen: true, doctor, loading: false })}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors border border-rose-200 bg-rose-50/40 cursor-pointer"
                                                        title="إلغاء التعيين / حذف من المنشأة"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                                        <span>إلغاء تعيين</span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Toggle Presence Switch Button */}
                                            <div className="pt-2 flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-gray-600">
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
                                                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                                                            <span>متاح بالعيادة</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ToggleLeft className="w-4 h-4 text-gray-400" />
                                                            <span>معلّق / غائب</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-16 text-center text-gray-400 text-xs">
                                <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                لا توجد نتائج مطابقة لخيارات البحث.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ADD DOCTOR MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
                    <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-gray-100 my-8">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 font-['Cairo']">
                                        إضافة واستدعاء طبيب للمنشأة
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        منشأة {facility.name} {facility.branch_name ? `(${facility.branch_name})` : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Dual Tabs: New Doctor vs Assign Existing */}
                        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl mb-5">
                            <button
                                type="button"
                                onClick={() => setAddTab('new')}
                                className={cn(
                                    'flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5',
                                    addTab === 'new'
                                        ? 'bg-white text-purple-700 shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900'
                                )}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>طبيب جديد بالمنظومة</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setAddTab('existing')}
                                className={cn(
                                    'flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5',
                                    addTab === 'existing'
                                        ? 'bg-white text-purple-700 shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900'
                                )}
                            >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>تعيين طبيب مسجل مسبقاً ({availableDoctors.length})</span>
                            </button>
                        </div>

                        {/* TAB 1: NEW DOCTOR REGISTRATION FORM */}
                        {addTab === 'new' ? (
                            <form onSubmit={handleCreateDoctor} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            الاسم الكامل للطبيب *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newDoctorForm.data.name}
                                            onChange={(e) => newDoctorForm.setData('name', e.target.value)}
                                            placeholder="د. أحمد المحمدي"
                                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                        />
                                        {newDoctorForm.errors.name && (
                                            <p className="text-[11px] text-rose-600 mt-1">{newDoctorForm.errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            اللقب المهني / الدرجة *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newDoctorForm.data.title_ar}
                                            onChange={(e) => newDoctorForm.setData('title_ar', e.target.value)}
                                            placeholder="استشاري / أخصائي أول"
                                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                        />
                                        {newDoctorForm.errors.title_ar && (
                                            <p className="text-[11px] text-rose-600 mt-1">{newDoctorForm.errors.title_ar}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            التخصص الطبي *
                                        </label>
                                        <select
                                            required
                                            value={newDoctorForm.data.specialty_id}
                                            onChange={(e) => newDoctorForm.setData('specialty_id', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                        >
                                            <option value="">اختر التخصص الطبي...</option>
                                            {allSpecialties.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name_ar}
                                                </option>
                                            ))}
                                        </select>
                                        {newDoctorForm.errors.specialty_id && (
                                            <p className="text-[11px] text-rose-600 mt-1">{newDoctorForm.errors.specialty_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            التخصص الدقيق (اختياري)
                                        </label>
                                        <input
                                            type="text"
                                            value={newDoctorForm.data.subspecialty}
                                            onChange={(e) => newDoctorForm.setData('subspecialty', e.target.value)}
                                            placeholder="جراحة المناظير وزراعة المفاصل"
                                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            البريد الإلكتروني المهني *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={newDoctorForm.data.email}
                                            onChange={(e) => newDoctorForm.setData('email', e.target.value)}
                                            placeholder="doctor@tebiby.com"
                                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                        />
                                        {newDoctorForm.errors.email && (
                                            <p className="text-[11px] text-rose-600 mt-1">{newDoctorForm.errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            رقم الجوال
                                        </label>
                                        <input
                                            type="tel"
                                            value={newDoctorForm.data.phone}
                                            onChange={(e) => newDoctorForm.setData('phone', e.target.value)}
                                            placeholder="05XXXXXXXX"
                                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            كلمة المرور للحساب *
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={newDoctorForm.data.password}
                                            onChange={(e) => newDoctorForm.setData('password', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                        />
                                        {newDoctorForm.errors.password && (
                                            <p className="text-[11px] text-rose-600 mt-1">{newDoctorForm.errors.password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            رقم ترخيص الهيئة (SCFHS)
                                        </label>
                                        <input
                                            type="text"
                                            value={newDoctorForm.data.license_no}
                                            onChange={(e) => newDoctorForm.setData('license_no', e.target.value)}
                                            placeholder="SCFHS-123456"
                                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            سعر الكشف بالمنشأة (ر.س) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="5"
                                            value={newDoctorForm.data.consultation_fee}
                                            onChange={(e) => newDoctorForm.setData('consultation_fee', Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                        />
                                        {newDoctorForm.errors.consultation_fee && (
                                            <p className="text-[11px] text-rose-600 mt-1">{newDoctorForm.errors.consultation_fee}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            مدة الكشف / الانتظار (دقيقة)
                                        </label>
                                        <input
                                            type="number"
                                            min="5"
                                            max="120"
                                            value={newDoctorForm.data.waiting_time_minutes}
                                            onChange={(e) => newDoctorForm.setData('waiting_time_minutes', Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            سنوات الخبرة الإكلينيكية
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            value={newDoctorForm.data.experience_years}
                                            onChange={(e) => newDoctorForm.setData('experience_years', Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 pt-6">
                                        <input
                                            type="checkbox"
                                            id="new_accepts_insurance"
                                            checked={newDoctorForm.data.accepts_insurance}
                                            onChange={(e) => newDoctorForm.setData('accepts_insurance', e.target.checked)}
                                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                        />
                                        <label htmlFor="new_accepts_insurance" className="text-xs font-bold text-gray-700 cursor-pointer">
                                            يقبل التأمين الطبي المعتمد بالمنشأة
                                        </label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={newDoctorForm.processing}
                                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                                    >
                                        {newDoctorForm.processing ? 'جارٍ الحفظ والاعتماد...' : 'حفظ وإضافة الطبيب'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* TAB 2: ASSIGN EXISTING REGISTERED DOCTOR */
                            <form onSubmit={handleAssignDoctor} className="space-y-4">
                                {availableDoctors.length === 0 ? (
                                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-2">
                                        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                                        <h4 className="text-sm font-bold text-amber-900">
                                            جميع الأطباء المسجلين معينون في هذه المنشأة بالفعل
                                        </h4>
                                        <p className="text-xs text-amber-700">
                                            يمكنك إضافة طبيب جديد بالمنظومة من خلال التبويب الآخر أعلاه.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                اختر الطبيب المراد تعيينه في {facility.name} *
                                            </label>
                                            <select
                                                required
                                                value={assignDoctorForm.data.doctor_profile_id}
                                                onChange={(e) => assignDoctorForm.setData('doctor_profile_id', e.target.value)}
                                                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                            >
                                                {availableDoctors.map((doc) => (
                                                    <option key={doc.id} value={doc.id}>
                                                        {doc.user.name} — {doc.specialty?.name_ar} ({doc.title_ar})
                                                        {doc.clinic ? ` [المقر الحالي: ${doc.clinic.name}]` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                                    سعر الكشف المحدد لهذه المنشأة (ر.س) *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="5"
                                                    value={assignDoctorForm.data.consultation_fee}
                                                    onChange={(e) => assignDoctorForm.setData('consultation_fee', Number(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                                    مدة الكشف (دقيقة)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="5"
                                                    max="120"
                                                    value={assignDoctorForm.data.waiting_time_minutes}
                                                    onChange={(e) => assignDoctorForm.setData('waiting_time_minutes', Number(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2">
                                            <input
                                                type="checkbox"
                                                id="assign_accepts_insurance"
                                                checked={assignDoctorForm.data.accepts_insurance}
                                                onChange={(e) => assignDoctorForm.setData('accepts_insurance', e.target.checked)}
                                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                            />
                                            <label htmlFor="assign_accepts_insurance" className="text-xs font-bold text-gray-700 cursor-pointer">
                                                يقبل التأمين الطبي المعتمد في هذا الفرع
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => setIsAddModalOpen(false)}
                                                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                            >
                                                إلغاء
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={assignDoctorForm.processing}
                                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                                            >
                                                {assignDoctorForm.processing ? 'جارٍ التعيين...' : 'تعيين الطبيب بالمنشأة'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* EDIT DOCTOR MODAL */}
            {editDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
                    <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-gray-100 my-8">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 font-['Cairo']">
                                        تعديل بيانات الطبيب وتسعيرة المنشأة
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {editDoctor.user.name} - {facility.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditDoctor(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateDoctor} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        الاسم الكامل *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editDoctorForm.data.name}
                                        onChange={(e) => editDoctorForm.setData('name', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                    {editDoctorForm.errors.name && (
                                        <p className="text-[11px] text-rose-600 mt-1">{editDoctorForm.errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        اللقب المهني / الدرجة *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editDoctorForm.data.title_ar}
                                        onChange={(e) => editDoctorForm.setData('title_ar', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                    {editDoctorForm.errors.title_ar && (
                                        <p className="text-[11px] text-rose-600 mt-1">{editDoctorForm.errors.title_ar}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        التخصص الطبي *
                                    </label>
                                    <select
                                        required
                                        value={editDoctorForm.data.specialty_id}
                                        onChange={(e) => editDoctorForm.setData('specialty_id', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    >
                                        {allSpecialties.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name_ar}
                                            </option>
                                        ))}
                                    </select>
                                    {editDoctorForm.errors.specialty_id && (
                                        <p className="text-[11px] text-rose-600 mt-1">{editDoctorForm.errors.specialty_id}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        التخصص الدقيق
                                    </label>
                                    <input
                                        type="text"
                                        value={editDoctorForm.data.subspecialty}
                                        onChange={(e) => editDoctorForm.setData('subspecialty', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        البريد الإلكتروني المهني *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={editDoctorForm.data.email}
                                        onChange={(e) => editDoctorForm.setData('email', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                    {editDoctorForm.errors.email && (
                                        <p className="text-[11px] text-rose-600 mt-1">{editDoctorForm.errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        رقم الجوال
                                    </label>
                                    <input
                                        type="tel"
                                        value={editDoctorForm.data.phone}
                                        onChange={(e) => editDoctorForm.setData('phone', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        سعر الكشف المحدد لهذه المنشأة (ر.س) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="5"
                                        value={editDoctorForm.data.consultation_fee}
                                        onChange={(e) => editDoctorForm.setData('consultation_fee', Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        متوسط مدة الكشف (دقيقة)
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="120"
                                        value={editDoctorForm.data.waiting_time_minutes}
                                        onChange={(e) => editDoctorForm.setData('waiting_time_minutes', Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        رقم ترخيص الهيئة (SCFHS)
                                    </label>
                                    <input
                                        type="text"
                                        value={editDoctorForm.data.license_no}
                                        onChange={(e) => editDoctorForm.setData('license_no', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        سنوات الخبرة الإكلينيكية
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={editDoctorForm.data.experience_years}
                                        onChange={(e) => editDoctorForm.setData('experience_years', Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        type="checkbox"
                                        id="edit_accepts_insurance"
                                        checked={editDoctorForm.data.accepts_insurance}
                                        onChange={(e) => editDoctorForm.setData('accepts_insurance', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="edit_accepts_insurance" className="text-xs font-bold text-gray-700 cursor-pointer">
                                        يقبل التأمين الطبي المعتمد بالمنشأة
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setEditDoctor(null)}
                                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={editDoctorForm.processing}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {editDoctorForm.processing ? 'جارٍ حفظ التعديلات...' : 'تأكيد وحفظ التعديلات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW DOCTOR DETAILS MODAL */}
            {viewDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100">
                        <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={
                                        viewDoctor.user.avatar ||
                                        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&h=120&fit=crop&crop=faces'
                                    }
                                    alt={viewDoctor.user.name}
                                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-100"
                                />
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 font-['Cairo'] flex items-center gap-1.5">
                                        <span>{viewDoctor.user.name}</span>
                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    </h3>
                                    <p className="text-xs text-purple-700 font-bold">
                                        {viewDoctor.specialty.name_ar}
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        {viewDoctor.title_ar} {viewDoctor.subspecialty ? `• ${viewDoctor.subspecialty}` : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewDoctor(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                                <div>
                                    <span className="text-gray-400 block text-[11px]">سعر الكشف بالمنشأة</span>
                                    <span className="text-sm font-bold font-mono text-emerald-700">
                                        {viewDoctor.facility_consultation_fee ?? viewDoctor.consultation_fee} ر.س
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[11px]">مدة الكشف المقدرة</span>
                                    <span className="text-sm font-bold font-mono text-gray-800">
                                        {viewDoctor.facility_slot_minutes ?? viewDoctor.waiting_time_minutes ?? 15} دقيقة
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[11px]">سنوات الخبرة</span>
                                    <span className="text-sm font-bold text-gray-800">
                                        {viewDoctor.experience_years || 5} سنوات
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[11px]">رقم ترخيص الهيئة</span>
                                    <span className="text-sm font-bold font-mono text-gray-800">
                                        {viewDoctor.license_no || 'معتمد نظامياً'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-2">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="font-mono">{viewDoctor.user.email}</span>
                                </div>
                                {viewDoctor.user.phone && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="font-mono">{viewDoctor.user.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span>المنشأة الحالية: {facility.name}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 mt-5">
                            <button
                                type="button"
                                onClick={() => {
                                    const doc = viewDoctor;
                                    setViewDoctor(null);
                                    handleOpenEdit(doc);
                                }}
                                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                                تعديل بيانات الطبيب
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewDoctor(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE / DETACH DOCTOR CONFIRMATION MODAL */}
            {deleteModal.isOpen && deleteModal.doctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 font-['Cairo']">
                                    إلغاء تعيين / استبعاد الطبيب
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {deleteModal.doctor.user.name} ({deleteModal.doctor.specialty.name_ar})
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed mb-6 bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200/80">
                            هل أنت متأكد من إلغاء تعيين هذا الطبيب من منشأة <span className="font-bold text-gray-900">{facility.name}</span>؟ 
                            سيتم رفع كشوفاته من جدول المنشأة، وفي حال عدم ارتباطه بأي منشأة طبية أخرى لعدم وجود حجوزات سيتم حذف حسابه بالكامل.
                        </p>

                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setDeleteModal({ isOpen: false, doctor: null, loading: false })}
                                disabled={deleteModal.loading}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                            >
                                تراجع
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleteModal.loading}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                            >
                                {deleteModal.loading ? 'جارٍ التنفيذ...' : 'تأكيد الحذف / إلغاء التعيين'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DOCTOR PRESENCE TOGGLE CONFIRMATION MODAL */}
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
