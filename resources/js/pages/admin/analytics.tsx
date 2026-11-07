import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import { 
    TrendingUp, 
    Users, 
    Building2, 
    CreditCard, 
    ShieldCheck, 
    Clock, 
    CheckCircle2, 
    Activity, 
    BarChart3, 
    Plus,
    Search,
    Stethoscope,
    Calendar,
    Settings2,
    ToggleLeft,
    ToggleRight,
    Edit3,
    Trash2,
    X,
    Filter,
    Check,
    AlertCircle
} from 'lucide-react';

interface Clinic {
    id: number;
    name: string;
    branch_name: string;
    city: string;
    district: string;
    address: string;
    phone: string;
    is_active: boolean;
    is_verified: boolean;
    doctor_profiles_count?: number;
}

interface Specialty {
    id: number;
    name_ar: string;
    name_en?: string;
    icon_slug: string;
    badge_text?: string;
    description?: string;
    doctor_profiles_count?: number;
    share_percentage?: number;
}

interface Doctor {
    id: number;
    title_ar: string;
    subspecialty: string;
    consultation_fee: number;
    waiting_time_minutes: number;
    is_available_today: boolean;
    specialty_id: number;
    clinic_id: number;
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    specialty: {
        name_ar: string;
    };
    clinic: {
        name: string;
        branch_name: string;
        city: string;
    };
}

interface Appointment {
    id: number;
    booking_reference: string;
    appointment_date: string;
    appointment_time: string;
    status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
    payment_method: string;
    payment_status: string;
    consultation_fee: number;
    total_amount: number;
    patient: {
        name: string;
        phone: string;
    };
    doctor: {
        title_ar: string;
        user: { name: string };
        clinic: { name: string };
        specialty: { name_ar: string };
    };
    queueTicket?: {
        ticket_number: number;
        status: string;
    };
}

interface AdminDashboardProps {
    metrics: {
        totalBookings: number;
        totalRevenue: string;
        activeDoctors: number;
        activeHospitals: number;
        complianceRate: string;
        avgWaitingTime: string;
    };
    chartData: Array<{
        day: string;
        date: string;
        bookings: number;
        revenue: number;
        val1: number;
        val2: number;
    }>;
    specialtyDistribution: Array<{
        id: number;
        name: string;
        doctors_count: number;
        share_percentage: number;
    }>;
    clinics: Clinic[];
    doctors: Doctor[];
    specialties: Specialty[];
    appointments: Appointment[];
}

export default function AdminAnalytics({
    metrics,
    chartData,
    specialtyDistribution,
    clinics,
    doctors,
    specialties,
    appointments,
}: AdminDashboardProps) {
    const [activeTab, setActiveTab] = useState<'analytics' | 'clinics' | 'doctors' | 'specialties' | 'appointments'>('analytics');

    // Modals
    const [clinicModalOpen, setClinicModalOpen] = useState(false);
    const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);

    const [specialtyModalOpen, setSpecialtyModalOpen] = useState(false);
    const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);

    const [doctorModalOpen, setDoctorModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

    // Filter states
    const [clinicSearch, setClinicSearch] = useState('');
    const [doctorSearch, setDoctorSearch] = useState('');
    const [appointmentSearch, setAppointmentSearch] = useState('');
    const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all');

    // Clinic Form
    const clinicForm = useForm({
        name: '',
        branch_name: '',
        city: 'الرياض',
        district: '',
        address: '',
        phone: '',
    });

    // Specialty Form
    const specialtyForm = useForm({
        name_ar: '',
        name_en: '',
        icon_slug: 'dentistry',
        badge_text: '',
        description: '',
    });

    // Doctor Edit Form
    const doctorForm = useForm({
        title_ar: '',
        subspecialty: '',
        consultation_fee: 200,
        waiting_time_minutes: 15,
        specialty_id: specialties[0]?.id || 1,
        clinic_id: clinics[0]?.id || 1,
        is_available_today: true,
    });

    // Open Clinic Modal
    const handleOpenClinicModal = (clinic?: Clinic) => {
        if (clinic) {
            setEditingClinic(clinic);
            clinicForm.setData({
                name: clinic.name,
                branch_name: clinic.branch_name,
                city: clinic.city,
                district: clinic.district,
                address: clinic.address,
                phone: clinic.phone,
            });
        } else {
            setEditingClinic(null);
            clinicForm.reset();
        }
        setClinicModalOpen(true);
    };

    const handleSaveClinic = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingClinic) {
            clinicForm.put(`/admin/clinics/${editingClinic.id}`, {
                onSuccess: () => setClinicModalOpen(false),
            });
        } else {
            clinicForm.post('/admin/clinics', {
                onSuccess: () => setClinicModalOpen(false),
            });
        }
    };

    // Open Specialty Modal
    const handleOpenSpecialtyModal = (spec?: Specialty) => {
        if (spec) {
            setEditingSpecialty(spec);
            specialtyForm.setData({
                name_ar: spec.name_ar,
                name_en: spec.name_en || '',
                icon_slug: spec.icon_slug,
                badge_text: spec.badge_text || '',
                description: spec.description || '',
            });
        } else {
            setEditingSpecialty(null);
            specialtyForm.reset();
        }
        setSpecialtyModalOpen(true);
    };

    const handleSaveSpecialty = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSpecialty) {
            specialtyForm.put(`/admin/specialties/${editingSpecialty.id}`, {
                onSuccess: () => setSpecialtyModalOpen(false),
            });
        } else {
            specialtyForm.post('/admin/specialties', {
                onSuccess: () => setSpecialtyModalOpen(false),
            });
        }
    };

    // Open Doctor Modal
    const handleOpenDoctorModal = (doc: Doctor) => {
        setEditingDoctor(doc);
        doctorForm.setData({
            title_ar: doc.title_ar,
            subspecialty: doc.subspecialty,
            consultation_fee: doc.consultation_fee,
            waiting_time_minutes: doc.waiting_time_minutes,
            specialty_id: doc.specialty_id,
            clinic_id: doc.clinic_id,
            is_available_today: doc.is_available_today,
        });
        setDoctorModalOpen(true);
    };

    const handleSaveDoctor = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDoctor) {
            doctorForm.put(`/admin/doctors/${editingDoctor.id}`, {
                onSuccess: () => setDoctorModalOpen(false),
            });
        }
    };

    // Filtered lists
    const filteredClinics = clinics.filter(c => 
        c.name.toLowerCase().includes(clinicSearch.toLowerCase()) || 
        c.city.toLowerCase().includes(clinicSearch.toLowerCase()) ||
        c.district.toLowerCase().includes(clinicSearch.toLowerCase())
    );

    const filteredDoctors = doctors.filter(d => 
        d.user.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        d.specialty.name_ar.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        d.clinic.name.toLowerCase().includes(doctorSearch.toLowerCase())
    );

    const filteredAppointments = appointments.filter(a => {
        const matchesSearch = a.booking_reference.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
            a.patient.name.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
            a.doctor.user.name.toLowerCase().includes(appointmentSearch.toLowerCase());
        const matchesStatus = appointmentStatusFilter === 'all' || a.status === appointmentStatusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title="طبيبي - لوحة الإدارة المركزية وإدارة المنصة" />

            <TebibyHeader />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Header Title */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-gray-500">نظام الإدارة المتكامل - منصة طبيبي للإنتاج</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-['Cairo']">
                            لوحة التحكم المركزية وإدارة البيانات
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {activeTab === 'clinics' && (
                            <button
                                onClick={() => handleOpenClinicModal()}
                                className="px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>إضافة مجمع طبي جديد</span>
                            </button>
                        )}
                        {activeTab === 'specialties' && (
                            <button
                                onClick={() => handleOpenSpecialtyModal()}
                                className="px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>إضافة تخصص جديد</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar pb-2">
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'analytics'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span>المؤشرات والتحليلات الحية</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('clinics')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'clinics'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        <span>المستشفيات والعيادات ({clinics.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('doctors')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'doctors'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <Stethoscope className="w-4 h-4" />
                        <span>الأطباء والاعتمادات ({doctors.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('specialties')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'specialties'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <Settings2 className="w-4 h-4" />
                        <span>الأقسام والتخصصات ({specialties.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'appointments'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        <span>الحجوزات والطابور ({appointments.length})</span>
                    </button>
                </div>

                {/* ========================================================= */}
                {/* TAB 1: ANALYTICS & KPIS */}
                {/* ========================================================= */}
                {activeTab === 'analytics' && (
                    <div>
                        {/* KPI Metrics Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                            <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-bold">الحجوزات الإجمالية</span>
                                    <Activity className="w-4 h-4 text-[#005ab5]" />
                                </div>
                                <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.totalBookings.toLocaleString()}</div>
                                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                                    <TrendingUp className="w-3 h-3" /> بيانات مباشرة
                                </span>
                            </div>

                            <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-bold">الإيرادات الفعلية</span>
                                    <CreditCard className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="text-xl font-black text-gray-900 font-['Cairo']">{metrics.totalRevenue}</div>
                                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                                    <TrendingUp className="w-3 h-3" /> مدفوعات معتمدة
                                </span>
                            </div>

                            <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-bold">الأطباء النشطون</span>
                                    <Users className="w-4 h-4 text-purple-600" />
                                </div>
                                <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.activeDoctors}</div>
                                <span className="text-[11px] text-gray-400 font-semibold">استشاري مفعل</span>
                            </div>

                            <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-bold">المستشفيات النشطة</span>
                                    <Building2 className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.activeHospitals}</div>
                                <span className="text-[11px] text-gray-400 font-semibold">مجمع معتمد</span>
                            </div>

                            <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-bold">الامتثال الصحي</span>
                                    <ShieldCheck className="w-4 h-4 text-[#006b5c]" />
                                </div>
                                <div className="text-2xl font-black text-[#006b5c] font-['Cairo']">{metrics.complianceRate}</div>
                                <span className="text-[11px] text-gray-400 font-semibold">المراكز الموثقة</span>
                            </div>

                            <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-bold">متوسط الانتظار</span>
                                    <Clock className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="text-2xl font-black text-blue-600 font-['Cairo']">{metrics.avgWaitingTime}</div>
                                <span className="text-[11px] text-emerald-600 font-bold">تتبع حي</span>
                            </div>
                        </div>

                        {/* Visual Analytics Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Growth Chart from Database */}
                            <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-base font-['Cairo']">
                                                حركة الحجوزات والإيرادات خلال آخر ٧ أيام
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">تتبع مباشر للتدفق الفعلي للحالات عبر قاعدة البيانات</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="flex items-center gap-1.5 font-bold text-gray-600">
                                                <span className="w-3 h-3 rounded-full bg-[#005ab5]"></span>
                                                الحجوزات
                                            </span>
                                            <span className="flex items-center gap-1.5 font-bold text-gray-600">
                                                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                                الإيرادات
                                            </span>
                                        </div>
                                    </div>

                                    {/* Real CSS Bar Graph */}
                                    <div className="h-48 flex items-end gap-3 sm:gap-6 pt-8 pb-2 border-b border-gray-100">
                                        {chartData.map((bar) => (
                                            <div key={bar.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                                <div className="w-full flex items-end justify-center gap-1 h-full">
                                                    <div
                                                        style={{ height: `${bar.val1}%` }}
                                                        className="w-full max-w-[20px] bg-[#005ab5] rounded-t-lg group-hover:bg-[#00458e] transition-all relative"
                                                        title={`${bar.bookings} حجز`}
                                                    ></div>
                                                    <div
                                                        style={{ height: `${bar.val2}%` }}
                                                        className="w-full max-w-[20px] bg-emerald-400 rounded-t-lg group-hover:bg-emerald-500 transition-all"
                                                        title={`${bar.revenue} ر.س`}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-bold">{bar.day}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-between text-xs text-gray-500">
                                    <span>تحديث تلقائي من جداول الحجوزات والمدفوعات</span>
                                    <span className="text-[#005ab5] font-bold">ربط مباشر مع قاعدة البيانات</span>
                                </div>
                            </div>

                            {/* Specialty Distribution */}
                            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base mb-1 font-['Cairo']">
                                        توزيع الاستشاريين حسب الأقسام الطبية
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-6">نسبة تمثيل التخصصات الإكلينيكية بالمنصة</p>

                                    <div className="space-y-4">
                                        {specialtyDistribution.slice(0, 5).map((spec) => (
                                            <div key={spec.id} className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-gray-800">{spec.name}</span>
                                                    <span className="font-semibold text-gray-500">{spec.doctors_count} طبيب ({spec.share_percentage}%)</span>
                                                </div>
                                                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                                                    <div
                                                        style={{ width: `${Math.min(100, spec.share_percentage * 2)}%` }}
                                                        className="h-full bg-gradient-to-r from-[#005ab5] to-[#0072e2] rounded-full"
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 text-center">
                                    <button
                                        onClick={() => setActiveTab('specialties')}
                                        className="text-xs text-[#005ab5] font-bold hover:underline"
                                    >
                                        إدارة التخصصات وإضافة أقسام جديدة &larr;
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 2: CLINICS & HOSPITALS MANAGEMENT */}
                {/* ========================================================= */}
                {activeTab === 'clinics' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                                <input
                                    type="text"
                                    placeholder="بحث باسم المستشفى، المدينة، أو الحي..."
                                    value={clinicSearch}
                                    onChange={(e) => setClinicSearch(e.target.value)}
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden"
                                />
                            </div>
                            <span className="text-xs text-gray-500 font-bold">
                                إجمالي المستشفيات: {filteredClinics.length}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                                        <th className="pb-3 pr-2">اسم المجمع الطبي</th>
                                        <th className="pb-3">المدينة والحي</th>
                                        <th className="pb-3">الهاتف</th>
                                        <th className="pb-3">عدد الاستشاريين</th>
                                        <th className="pb-3">حالة النشاط</th>
                                        <th className="pb-3">الاعتماد</th>
                                        <th className="pb-3 pl-2">إجراءات الإدارة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredClinics.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="py-4 pr-2 font-bold text-sm text-gray-900 font-['Cairo'] flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-[#005ab5]" />
                                                <span>{c.name} - {c.branch_name}</span>
                                            </td>
                                            <td className="py-4 text-gray-600 font-medium">
                                                {c.city} - {c.district}
                                            </td>
                                            <td className="py-4 text-gray-600 font-mono" dir="ltr">
                                                {c.phone}
                                            </td>
                                            <td className="py-4 font-bold text-gray-800">
                                                {c.doctor_profiles_count ?? 0} استشاري
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                                    c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                                }`}>
                                                    {c.is_active ? 'نشط ويستقبل حجوزات' : 'معلق وموقوف'}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                                    c.is_verified ? 'bg-blue-50 text-[#005ab5]' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {c.is_verified ? 'معتمد رسمياً' : 'قيد التدقيق'}
                                                </span>
                                            </td>
                                            <td className="py-4 pl-2">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => router.post(`/admin/clinics/${c.id}/toggle`)}
                                                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
                                                    >
                                                        {c.is_active ? 'تعطيل' : 'تفعيل'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenClinicModal(c)}
                                                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#005ab5] font-bold transition-colors"
                                                    >
                                                        تعديل
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 3: DOCTORS & CREDENTIALS MANAGEMENT */}
                {/* ========================================================= */}
                {activeTab === 'doctors' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                                <input
                                    type="text"
                                    placeholder="بحث باسم الطبيب، التخصص، أو المستشفى..."
                                    value={doctorSearch}
                                    onChange={(e) => setDoctorSearch(e.target.value)}
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden"
                                />
                            </div>
                            <span className="text-xs text-gray-500 font-bold">
                                إجمالي الأطباء: {filteredDoctors.length}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                                        <th className="pb-3 pr-2">اسم الاستشاري</th>
                                        <th className="pb-3">القسم الطبي</th>
                                        <th className="pb-3">المستشفى / المجمع</th>
                                        <th className="pb-3">سعر الكشف</th>
                                        <th className="pb-3">وقت الانتظار</th>
                                        <th className="pb-3">حالة الاعتماد</th>
                                        <th className="pb-3 pl-2">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredDoctors.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="py-4 pr-2 font-bold text-sm text-gray-900 font-['Cairo'] flex items-center gap-3">
                                                <img
                                                    src={doc.user.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&h=100&fit=crop&crop=faces'}
                                                    alt={doc.user.name}
                                                    className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100"
                                                />
                                                <div>
                                                    <span className="block">{doc.user.name}</span>
                                                    <span className="block text-[11px] text-gray-400 font-normal">{doc.title_ar}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 font-bold text-gray-700">
                                                {doc.specialty?.name_ar}
                                            </td>
                                            <td className="py-4 text-gray-600">
                                                {doc.clinic?.name} ({doc.clinic?.city})
                                            </td>
                                            <td className="py-4 font-bold text-[#005ab5]">
                                                {doc.consultation_fee} ر.س
                                            </td>
                                            <td className="py-4 text-gray-600">
                                                {doc.waiting_time_minutes} دقيقة
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                                    doc.is_available_today ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {doc.is_available_today ? 'معتمد ومتاح للكشف' : 'قيد المراجعة / موقوف'}
                                                </span>
                                            </td>
                                            <td className="py-4 pl-2">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => router.post(`/admin/doctors/${doc.id}/toggle-approval`)}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                                            doc.is_available_today
                                                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                        }`}
                                                    >
                                                        {doc.is_available_today ? 'تعليق الكشف' : 'اعتماد فوري'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenDoctorModal(doc)}
                                                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#005ab5] font-bold transition-colors"
                                                    >
                                                        تعديل
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 4: SPECIALTIES MANAGEMENT */}
                {/* ========================================================= */}
                {activeTab === 'specialties' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {specialties.map((spec) => (
                                <div key={spec.id} className="p-5 rounded-2xl border border-gray-200/80 hover:border-[#005ab5] transition-all bg-gray-50/50 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-extrabold text-base text-gray-900 font-['Cairo']">
                                                {spec.name_ar}
                                            </span>
                                            {spec.badge_text && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#005ab5]">
                                                    {spec.badge_text}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                                            {spec.description || 'لا يوجد وصف مدخل لهذا القسم'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200/60 text-xs">
                                        <span className="font-bold text-gray-700">
                                            {spec.doctor_profiles_count ?? 0} استشاري مسجل
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenSpecialtyModal(spec)}
                                                className="text-[#005ab5] hover:underline font-bold"
                                            >
                                                تعديل
                                            </button>
                                            {(!spec.doctor_profiles_count || spec.doctor_profiles_count === 0) && (
                                                <button
                                                    onClick={() => router.delete(`/admin/specialties/${spec.id}`)}
                                                    className="text-red-500 hover:underline font-bold"
                                                >
                                                    حذف
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 5: APPOINTMENTS & QUEUE MANAGEMENT */}
                {/* ========================================================= */}
                {activeTab === 'appointments' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-72">
                                    <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                                    <input
                                        type="text"
                                        placeholder="بحث برقم الحجز (TB-XXXX) أو اسم المريض..."
                                        value={appointmentSearch}
                                        onChange={(e) => setAppointmentSearch(e.target.value)}
                                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden"
                                    />
                                </div>

                                <select
                                    value={appointmentStatusFilter}
                                    onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                                    className="py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-[#005ab5]"
                                >
                                    <option value="all">كافة الحالات</option>
                                    <option value="waiting">في الانتظار</option>
                                    <option value="in_consultation">قيد الكشف</option>
                                    <option value="completed">مكتمل</option>
                                    <option value="cancelled">ملغى</option>
                                </select>
                            </div>

                            <span className="text-xs text-gray-500 font-bold">
                                الحجوزات المعروضة: {filteredAppointments.length}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                                        <th className="pb-3 pr-2">رقم الحجز</th>
                                        <th className="pb-3">اسم المريض</th>
                                        <th className="pb-3">الطبيب المعالج</th>
                                        <th className="pb-3">الموعد والتاريخ</th>
                                        <th className="pb-3">الإجمالي والدفع</th>
                                        <th className="pb-3">حالة الحجز</th>
                                        <th className="pb-3 pl-2">تحديث الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredAppointments.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="py-4 pr-2 font-mono font-bold text-xs text-[#005ab5]">
                                                {app.booking_reference}
                                                {app.queueTicket && (
                                                    <span className="block text-[10px] text-gray-400 font-sans">
                                                        تذكرة دور #{app.queueTicket.ticket_number}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 font-bold text-gray-900">
                                                {app.patient?.name}
                                                <span className="block text-[10px] text-gray-400 font-mono" dir="ltr">
                                                    {app.patient?.phone}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <span className="font-bold text-gray-800 block">{app.doctor?.user?.name}</span>
                                                <span className="text-[10px] text-gray-500">{app.doctor?.clinic?.name}</span>
                                            </td>
                                            <td className="py-4 text-gray-600">
                                                <span className="font-bold block">{app.appointment_date}</span>
                                                <span className="text-[10px] text-gray-400">{app.appointment_time}</span>
                                            </td>
                                            <td className="py-4">
                                                <span className="font-bold text-gray-900 block">{app.total_amount} ر.س</span>
                                                <span className={`text-[10px] font-bold ${
                                                    app.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                                                }`}>
                                                    {app.payment_status === 'paid' ? 'مدفوع' : 'معلق'} ({app.payment_method})
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    app.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                                    app.status === 'in_consultation' ? 'bg-purple-50 text-purple-700' :
                                                    app.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                                    'bg-blue-50 text-[#005ab5]'
                                                }`}>
                                                    {app.status === 'completed' ? 'مكتمل' :
                                                     app.status === 'in_consultation' ? 'قيد الكشف' :
                                                     app.status === 'cancelled' ? 'ملغى' : 'في الانتظار'}
                                                </span>
                                            </td>
                                            <td className="py-4 pl-2">
                                                <div className="flex items-center gap-1">
                                                    {app.status !== 'completed' && (
                                                        <button
                                                            onClick={() => router.put(`/admin/appointments/${app.id}/status`, {
                                                                status: 'completed',
                                                                payment_status: 'paid',
                                                            })}
                                                            className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px]"
                                                        >
                                                            إتمام
                                                        </button>
                                                    )}
                                                    {app.status !== 'cancelled' && (
                                                        <button
                                                            onClick={() => router.put(`/admin/appointments/${app.id}/status`, {
                                                                status: 'cancelled',
                                                                payment_status: app.payment_status,
                                                            })}
                                                            className="px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px]"
                                                        >
                                                            إلغاء
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* ========================================================= */}
            {/* MODAL: ADD / EDIT CLINIC */}
            {/* ========================================================= */}
            {clinicModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
                        <button
                            onClick={() => setClinicModalOpen(false)}
                            className="absolute left-6 top-6 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-black text-gray-900 font-['Cairo'] mb-4">
                            {editingClinic ? 'تعديل بيانات المستشفى / المجمع' : 'إضافة مجمع طبي جديد'}
                        </h3>

                        <form onSubmit={handleSaveClinic} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">اسم المجمع أو المستشفى</label>
                                <input
                                    type="text"
                                    required
                                    value={clinicForm.data.name}
                                    onChange={(e) => clinicForm.setData('name', e.target.value)}
                                    placeholder="مثال: مستشفى الملك فيصل التخصصي"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">اسم الفرع</label>
                                    <input
                                        type="text"
                                        value={clinicForm.data.branch_name}
                                        onChange={(e) => clinicForm.setData('branch_name', e.target.value)}
                                        placeholder="الفرع الرئيسي"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">المدينة</label>
                                    <input
                                        type="text"
                                        required
                                        value={clinicForm.data.city}
                                        onChange={(e) => clinicForm.setData('city', e.target.value)}
                                        placeholder="الرياض"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">الحي</label>
                                    <input
                                        type="text"
                                        required
                                        value={clinicForm.data.district}
                                        onChange={(e) => clinicForm.setData('district', e.target.value)}
                                        placeholder="حي الصحافة"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">رقم الهاتف</label>
                                    <input
                                        type="text"
                                        value={clinicForm.data.phone}
                                        onChange={(e) => clinicForm.setData('phone', e.target.value)}
                                        placeholder="+966110000000"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">العنوان التفصيلي</label>
                                <input
                                    type="text"
                                    required
                                    value={clinicForm.data.address}
                                    onChange={(e) => clinicForm.setData('address', e.target.value)}
                                    placeholder="طريق الملك فهد، مقابل برج المملكة"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setClinicModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={clinicForm.processing}
                                    className="px-5 py-2 rounded-xl bg-[#005ab5] text-white font-bold hover:bg-[#00458e]"
                                >
                                    حفظ البيانات
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: ADD / EDIT SPECIALTY */}
            {/* ========================================================= */}
            {specialtyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
                        <button
                            onClick={() => setSpecialtyModalOpen(false)}
                            className="absolute left-6 top-6 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-black text-gray-900 font-['Cairo'] mb-4">
                            {editingSpecialty ? 'تعديل التخصص الطبي' : 'إضافة تخصص طبي جديد'}
                        </h3>

                        <form onSubmit={handleSaveSpecialty} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">الاسم بالعربية</label>
                                    <input
                                        type="text"
                                        required
                                        value={specialtyForm.data.name_ar}
                                        onChange={(e) => specialtyForm.setData('name_ar', e.target.value)}
                                        placeholder="طب القلب والأوعية الدموية"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">الاسم بالإنجليزية</label>
                                    <input
                                        type="text"
                                        value={specialtyForm.data.name_en}
                                        onChange={(e) => specialtyForm.setData('name_en', e.target.value)}
                                        placeholder="Cardiology"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">رمز الأيقونة (Slug)</label>
                                    <select
                                        value={specialtyForm.data.icon_slug}
                                        onChange={(e) => specialtyForm.setData('icon_slug', e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    >
                                        <option value="dentistry">طب الأسنان (dentistry)</option>
                                        <option value="dermatology">الجلدية (dermatology)</option>
                                        <option value="pediatrics">الأطفال (pediatrics)</option>
                                        <option value="internal_medicine">الباطنة (internal_medicine)</option>
                                        <option value="orthopedics">العظام (orthopedics)</option>
                                        <option value="ophthalmology">العيون (ophthalmology)</option>
                                        <option value="cardiology">القلب (cardiology)</option>
                                        <option value="neurology">المخ والأعصاب (neurology)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">شارة مميزة (اختياري)</label>
                                    <input
                                        type="text"
                                        value={specialtyForm.data.badge_text}
                                        onChange={(e) => specialtyForm.setData('badge_text', e.target.value)}
                                        placeholder="مثال: أكثر طلباً"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">الوصف العام للقسم</label>
                                <textarea
                                    rows={2}
                                    value={specialtyForm.data.description}
                                    onChange={(e) => specialtyForm.setData('description', e.target.value)}
                                    placeholder="تشخيص وعلاج أمراض القلب وقسطرة الشرايين..."
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setSpecialtyModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={specialtyForm.processing}
                                    className="px-5 py-2 rounded-xl bg-[#005ab5] text-white font-bold hover:bg-[#00458e]"
                                >
                                    حفظ التخصص
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: EDIT DOCTOR */}
            {/* ========================================================= */}
            {doctorModalOpen && editingDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
                        <button
                            onClick={() => setDoctorModalOpen(false)}
                            className="absolute left-6 top-6 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-black text-gray-900 font-['Cairo'] mb-4">
                            تعديل ملف الطبيب: {editingDoctor.user.name}
                        </h3>

                        <form onSubmit={handleSaveDoctor} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">اللقب المهني</label>
                                <input
                                    type="text"
                                    required
                                    value={doctorForm.data.title_ar}
                                    onChange={(e) => doctorForm.setData('title_ar', e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">التخصص الدقيق</label>
                                <input
                                    type="text"
                                    value={doctorForm.data.subspecialty}
                                    onChange={(e) => doctorForm.setData('subspecialty', e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">سعر الكشف (ر.س)</label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={doctorForm.data.consultation_fee}
                                        onChange={(e) => doctorForm.setData('consultation_fee', parseFloat(e.target.value))}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">وقت الكشف المتوقع (دقيقة)</label>
                                    <input
                                        type="number"
                                        required
                                        min={5}
                                        max={120}
                                        value={doctorForm.data.waiting_time_minutes}
                                        onChange={(e) => doctorForm.setData('waiting_time_minutes', parseInt(e.target.value))}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">القسم الطبي</label>
                                    <select
                                        value={doctorForm.data.specialty_id}
                                        onChange={(e) => doctorForm.setData('specialty_id', parseInt(e.target.value))}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    >
                                        {specialties.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name_ar}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">المستشفى / المجمع</label>
                                    <select
                                        value={doctorForm.data.clinic_id}
                                        onChange={(e) => doctorForm.setData('clinic_id', parseInt(e.target.value))}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    >
                                        {clinics.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name} - {c.city}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setDoctorModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={doctorForm.processing}
                                    className="px-5 py-2 rounded-xl bg-[#005ab5] text-white font-bold hover:bg-[#00458e]"
                                >
                                    حفظ التعديلات
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <TebibyFooter />
        </div>
    );
}
