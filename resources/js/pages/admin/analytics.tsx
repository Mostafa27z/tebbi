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
    AlertCircle,
    UserPlus,
    Hospital,
    MapPin,
    Phone
} from 'lucide-react';

interface Group {
    id: number;
    name_ar: string;
    name_en?: string;
    slug: string;
    cr_number?: string;
    status: string;
    facilities_count?: number;
    admins?: Array<{ id: number; name: string; email: string; phone?: string }>;
    facilities?: Array<{ id: number; name: string; type: string; doctor_profiles_count?: number }>;
}

interface Clinic {
    id: number;
    group_id?: number;
    name: string;
    branch_name: string;
    type?: 'hospital' | 'clinic';
    moh_license_no?: string;
    city: string;
    district: string;
    address: string;
    phone: string;
    is_active: boolean;
    is_verified: boolean;
    doctor_profiles_count?: number;
    group?: { id: number; name_ar: string };
    admins?: Array<{ id: number; name: string }>;
}

interface RoleAssignmentItem {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    user_phone: string;
    role: 'group_admin' | 'facility_admin' | 'receptionist';
    scope_type: 'group' | 'facility';
    scope_id: number;
    scope_name: string;
    created_at: string;
}

interface UserSimple {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string;
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
        phone?: string;
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
    doctor_facilities?: Array<{
        id: number;
        facility_id: number;
        facility: { id: number; name: string; type: string };
        consultation_fee: number;
        default_slot_minutes: number;
        is_active: boolean;
    }>;
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
    facility?: { name: string };
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
    groups: Group[];
    clinics: Clinic[];
    doctors: Doctor[];
    specialties: Specialty[];
    appointments: Appointment[];
    roleAssignments: RoleAssignmentItem[];
    allUsers: UserSimple[];
}

export default function AdminAnalytics({
    metrics,
    chartData,
    specialtyDistribution,
    groups = [],
    clinics = [],
    doctors = [],
    specialties = [],
    appointments = [],
    roleAssignments = [],
    allUsers = [],
}: AdminDashboardProps) {
    const [activeTab, setActiveTab] = useState<'analytics' | 'groups' | 'clinics' | 'admins' | 'doctors' | 'specialties' | 'appointments'>('analytics');

    // Modals
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    const [clinicModalOpen, setClinicModalOpen] = useState(false);
    const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);

    const [roleModalOpen, setRoleModalOpen] = useState(false);

    const [docFacilityModalOpen, setDocFacilityModalOpen] = useState(false);
    const [selectedDoctorForFacility, setSelectedDoctorForFacility] = useState<Doctor | null>(null);

    const [specialtyModalOpen, setSpecialtyModalOpen] = useState(false);
    const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);

    const [doctorModalOpen, setDoctorModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

    // Filter states
    const [groupSearch, setGroupSearch] = useState('');
    const [clinicSearch, setClinicSearch] = useState('');
    const [clinicGroupFilter, setClinicGroupFilter] = useState('all');
    const [doctorSearch, setDoctorSearch] = useState('');
    const [roleSearch, setRoleSearch] = useState('');
    const [appointmentSearch, setAppointmentSearch] = useState('');
    const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all');

    // Group Form
    const groupForm = useForm({
        name_ar: '',
        name_en: '',
        cr_number: '',
        create_admin: false,
        admin_name: '',
        admin_email: '',
        admin_password: '',
        admin_phone: '',
    });

    // Clinic Form
    const clinicForm = useForm({
        name: '',
        branch_name: '',
        group_id: (groups[0]?.id || '') as string | number,
        type: 'hospital' as 'hospital' | 'clinic',
        moh_license_no: '',
        city: 'الرياض',
        district: '',
        address: '',
        phone: '',
    });

    // Role Assignment Form
    const roleForm = useForm({
        role: 'group_admin' as 'group_admin' | 'facility_admin' | 'receptionist',
        scope_type: 'group' as 'group' | 'facility',
        scope_id: (groups[0]?.id || 0) as number,
        user_mode: 'new' as 'existing' | 'new',
        user_id: (allUsers[0]?.id || '') as string | number,
        new_name: '',
        new_email: '',
        new_password: '',
        new_phone: '',
    });

    // Doctor Facility Form
    const docFacilityForm = useForm({
        doctor_profile_id: (doctors[0]?.id || 0) as number,
        facility_id: (clinics[0]?.id || 0) as number,
        consultation_fee: 200,
        default_slot_minutes: 20,
        accepts_insurance: true,
        is_active: true,
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

    // ==========================================
    // MODAL HANDLERS
    // ==========================================

    const handleOpenGroupModal = (group?: Group) => {
        if (group) {
            setEditingGroup(group);
            groupForm.setData({
                name_ar: group.name_ar,
                name_en: group.name_en || '',
                cr_number: group.cr_number || '',
                create_admin: false,
                admin_name: '',
                admin_email: '',
                admin_password: '',
                admin_phone: '',
            });
        } else {
            setEditingGroup(null);
            groupForm.reset();
        }
        setGroupModalOpen(true);
    };

    const handleSaveGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingGroup) {
            groupForm.put(`/admin/groups/${editingGroup.id}`, {
                onSuccess: () => setGroupModalOpen(false),
            });
        } else {
            groupForm.post('/admin/groups', {
                onSuccess: () => {
                    setGroupModalOpen(false);
                    groupForm.reset();
                },
            });
        }
    };

    const handleOpenClinicModal = (clinic?: Clinic, defaultGroupId?: number) => {
        if (clinic) {
            setEditingClinic(clinic);
            clinicForm.setData({
                name: clinic.name,
                branch_name: clinic.branch_name,
                group_id: clinic.group_id || groups[0]?.id || '',
                type: clinic.type || 'hospital',
                moh_license_no: clinic.moh_license_no || '',
                city: clinic.city,
                district: clinic.district,
                address: clinic.address,
                phone: clinic.phone,
            });
        } else {
            setEditingClinic(null);
            clinicForm.reset();
            if (defaultGroupId) {
                clinicForm.setData('group_id', defaultGroupId);
            }
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
                onSuccess: () => {
                    setClinicModalOpen(false);
                    clinicForm.reset();
                },
            });
        }
    };

    const handleOpenRoleModal = (defaultRole?: 'group_admin' | 'facility_admin' | 'receptionist', defaultScopeType?: 'group' | 'facility', defaultScopeId?: number) => {
        roleForm.reset();
        if (defaultRole) roleForm.setData('role', defaultRole);
        if (defaultScopeType) roleForm.setData('scope_type', defaultScopeType);
        if (defaultScopeId) roleForm.setData('scope_id', defaultScopeId);
        setRoleModalOpen(true);
    };

    const handleSaveRole = (e: React.FormEvent) => {
        e.preventDefault();
        roleForm.post('/admin/role-assignments', {
            onSuccess: () => {
                setRoleModalOpen(false);
                roleForm.reset();
            },
        });
    };

    const handleOpenDocFacilityModal = (doctor?: Doctor) => {
        if (doctor) {
            setSelectedDoctorForFacility(doctor);
            docFacilityForm.setData({
                doctor_profile_id: doctor.id,
                facility_id: clinics[0]?.id || 0,
                consultation_fee: doctor.consultation_fee,
                default_slot_minutes: doctor.waiting_time_minutes || 20,
                accepts_insurance: true,
                is_active: true,
            });
        }
        setDocFacilityModalOpen(true);
    };

    const handleSaveDocFacility = (e: React.FormEvent) => {
        e.preventDefault();
        docFacilityForm.post('/admin/doctor-facilities', {
            onSuccess: () => {
                setDocFacilityModalOpen(false);
                docFacilityForm.reset();
            },
        });
    };

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

    const handleOpenDoctorModal = (doc: Doctor) => {
        setEditingDoctor(doc);
        doctorForm.setData({
            title_ar: doc.title_ar,
            subspecialty: doc.subspecialty || '',
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

    // Filters
    const filteredGroups = groups.filter(g =>
        g.name_ar.toLowerCase().includes(groupSearch.toLowerCase()) ||
        (g.cr_number && g.cr_number.includes(groupSearch))
    );

    const filteredClinics = clinics.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(clinicSearch.toLowerCase()) ||
            c.city.toLowerCase().includes(clinicSearch.toLowerCase()) ||
            c.district.toLowerCase().includes(clinicSearch.toLowerCase());
        const matchesGroup = clinicGroupFilter === 'all' || String(c.group_id) === clinicGroupFilter;
        return matchesSearch && matchesGroup;
    });

    const filteredDoctors = doctors.filter(d =>
        d.user.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        d.specialty.name_ar.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        d.clinic.name.toLowerCase().includes(doctorSearch.toLowerCase())
    );

    const filteredRoles = roleAssignments.filter(r =>
        r.user_name.toLowerCase().includes(roleSearch.toLowerCase()) ||
        r.user_email.toLowerCase().includes(roleSearch.toLowerCase()) ||
        r.scope_name.toLowerCase().includes(roleSearch.toLowerCase())
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
            <Head title="طبيبي - لوحة الإدارة المركزية والمنظومة الطبية" />
            <TebibyHeader />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Header Title & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-gray-500">نظام الإدارة الهرمي المتكامل - منصة طبيبي</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-['Cairo']">
                            لوحة التحكم المركزية وإدارة المنظومة
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {activeTab === 'groups' && (
                            <button
                                onClick={() => handleOpenGroupModal()}
                                className="px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>إضافة مجمع طبي جديد</span>
                            </button>
                        )}
                        {activeTab === 'clinics' && (
                            <button
                                onClick={() => handleOpenClinicModal()}
                                className="px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>إضافة مستشفى أو عيادة جديدة</span>
                            </button>
                        )}
                        {activeTab === 'admins' && (
                            <button
                                onClick={() => handleOpenRoleModal()}
                                className="px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>تعيين مشرف جديد (مدير مجمع / فرع / استقبال)</span>
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
                        onClick={() => setActiveTab('groups')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'groups'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        <span>المجمعات الطبية ({groups.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('clinics')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'clinics'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <Hospital className="w-4 h-4" />
                        <span>المستشفيات والعيادات ({clinics.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('admins')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'admins'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>المشرفون والصلاحيات ({roleAssignments.length})</span>
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
                        <span>الأطباء وتوزيع الفروع ({doctors.length})</span>
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
                {/* TAB 1: ANALYTICS */}
                {/* ========================================================= */}
                {activeTab === 'analytics' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                            <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-bold">الحجوزات الإجمالية</span>
                                    <Activity className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.totalBookings}</div>
                                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> بيانات مباشرة
                                </span>
                            </div>

                            <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-bold">الإيرادات الفعلية</span>
                                    <CreditCard className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.totalRevenue}</div>
                                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
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
                                    <span className="text-xs text-gray-500 font-bold">المستشفيات والعيادات</span>
                                    <Building2 className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.activeHospitals}</div>
                                <span className="text-[11px] text-gray-400 font-semibold">منشأة معتمدة</span>
                            </div>

                            <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between min-h-[120px]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-bold">الامتثال الصحي</span>
                                    <ShieldCheck className="w-4 h-4 text-[#006b5c]" />
                                </div>
                                <div className={`font-['Cairo'] ${
                                    metrics.complianceRate.includes('لا توجد')
                                        ? 'text-xs sm:text-sm font-bold text-gray-400 py-1 leading-snug'
                                        : 'text-2xl font-black text-[#006b5c]'
                                }`}>
                                    {metrics.complianceRate}
                                </div>
                                <span className="text-[11px] text-gray-400 font-semibold">
                                    {metrics.complianceRate.includes('لا توجد') ? 'بانتظار تسجيل الكوادر والمراكز' : 'المراكز الموثقة'}
                                </span>
                            </div>

                            <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between min-h-[120px]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-bold">متوسط الانتظار</span>
                                    <Clock className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className={`font-['Cairo'] ${
                                    metrics.avgWaitingTime.includes('لا توجد')
                                        ? 'text-xs sm:text-sm font-bold text-gray-400 py-1 leading-snug'
                                        : 'text-2xl font-black text-blue-600'
                                }`}>
                                    {metrics.avgWaitingTime}
                                </div>
                                <span className="text-[11px] text-gray-400 font-semibold">
                                    {metrics.avgWaitingTime.includes('لا توجد') ? 'بانتظار تسجيل أطباء' : 'تتبع حي'}
                                </span>
                            </div>
                        </div>

                        {/* Chart & Distribution */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 font-['Cairo']">
                                            حركة الحجوزات والإيرادات خلال آخر 7 أيام
                                        </h3>
                                        <p className="text-xs text-gray-500">تتبع مباشر للتدفق الفعلي عبر قاعدة البيانات</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#005ab5]"></span>
                                            <span className="text-gray-600">الحجوزات</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                            <span className="text-gray-600">الإيرادات</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-gray-100">
                                    {chartData.map((d, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                            <div className="w-full flex items-end justify-center gap-1.5 h-full">
                                                <div
                                                    style={{ height: `${d.val1}%` }}
                                                    className="w-full max-w-[16px] bg-[#005ab5] rounded-t-lg transition-all group-hover:bg-[#00458e] relative"
                                                >
                                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-1.5 rounded-md whitespace-nowrap z-10 pointer-events-none">
                                                        {d.bookings} حجز
                                                    </span>
                                                </div>
                                                <div
                                                    style={{ height: `${d.val2}%` }}
                                                    className="w-full max-w-[16px] bg-emerald-400 rounded-t-lg transition-all group-hover:bg-emerald-500 relative"
                                                >
                                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-1.5 rounded-md whitespace-nowrap z-10 pointer-events-none">
                                                        {d.revenue} ر.س
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-500 mt-2">{d.day}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
                                <h3 className="text-lg font-black text-gray-900 font-['Cairo'] mb-1">
                                    توزيع الاستشاريين حسب الأقسام الطبية
                                </h3>
                                <p className="text-xs text-gray-500 mb-6">نسبة تمثيل التخصصات الإكلينيكية بالمنصة</p>

                                <div className="space-y-4">
                                    {specialtyDistribution.map((spec) => (
                                        <div key={spec.id} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-gray-800">{spec.name}</span>
                                                <span className="font-bold text-[#005ab5]">{spec.doctors_count} استشاري ({spec.share_percentage}%)</span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-l from-[#005ab5] to-[#0072e2] rounded-full transition-all duration-500"
                                                    style={{ width: `${spec.share_percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 2: MEDICAL GROUPS (المجمعات الطبية) */}
                {/* ========================================================= */}
                {activeTab === 'groups' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="البحث في المجمعات والسجل التجاري..."
                                    value={groupSearch}
                                    onChange={(e) => setGroupSearch(e.target.value)}
                                    className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredGroups.map(group => (
                                <div key={group.id} className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#005ab5] flex items-center justify-center font-bold font-['Cairo'] text-lg shadow-xs">
                                                    {group.name_ar.slice(0, 2)}
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-black text-gray-900 font-['Cairo']">{group.name_ar}</h3>
                                                    {group.name_en && <p className="text-xs text-gray-400" dir="ltr">{group.name_en}</p>}
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                                نشط
                                            </span>
                                        </div>

                                        {group.cr_number && (
                                            <p className="text-xs text-gray-500 mb-4 font-mono">
                                                السجل التجاري: <span className="font-bold text-gray-700">{group.cr_number}</span>
                                            </p>
                                        )}

                                        <div className="p-3 rounded-2xl bg-gray-50 text-xs space-y-2 mb-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500 font-bold">المنشآت التابعة:</span>
                                                <span className="font-black text-[#005ab5]">{group.facilities_count ?? 0} مستشفى وعيادة</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500 font-bold">مدراء المجمع:</span>
                                                <span className="font-bold text-gray-800">
                                                    {group.admins && group.admins.length > 0
                                                        ? group.admins.map(a => a.name).join('، ')
                                                        : 'لم يتم تعيين مدير بعد'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => handleOpenClinicModal(undefined, group.id)}
                                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#005ab5] font-bold text-xs transition-colors flex items-center gap-1.5"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>إضافة فرع</span>
                                        </button>
                                        <button
                                            onClick={() => handleOpenRoleModal('group_admin', 'group', group.id)}
                                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors flex items-center gap-1.5"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            <span>تعيين مدير</span>
                                        </button>
                                        <button
                                            onClick={() => handleOpenGroupModal(group)}
                                            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
                                        >
                                            تعديل
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 3: CLINICS & HOSPITALS */}
                {/* ========================================================= */}
                {activeTab === 'clinics' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-80">
                                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="البحث باسم المستشفى، المدينة، أو الحي..."
                                        value={clinicSearch}
                                        onChange={(e) => setClinicSearch(e.target.value)}
                                        className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                                    />
                                </div>

                                <select
                                    value={clinicGroupFilter}
                                    onChange={(e) => setClinicGroupFilter(e.target.value)}
                                    className="p-2.5 rounded-2xl bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] font-bold text-gray-700"
                                >
                                    <option value="all">جميع المجمعات الطبية</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={String(g.id)}>{g.name_ar}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                                        <tr>
                                            <th className="py-4 px-4">المنشأة والفرع</th>
                                            <th className="py-4 px-4">المجمع التابع له</th>
                                            <th className="py-4 px-4">النوع</th>
                                            <th className="py-4 px-4">المدينة / الحي</th>
                                            <th className="py-4 px-4">هاتف التواصل</th>
                                            <th className="py-4 px-4">الأطباء</th>
                                            <th className="py-4 px-4">الحالة</th>
                                            <th className="py-4 px-4">الاعتماد</th>
                                            <th className="py-4 px-4 pl-6">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredClinics.map((c) => (
                                            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div className="font-bold text-gray-900 font-['Cairo'] text-sm">{c.name}</div>
                                                    <div className="text-[11px] text-gray-400">{c.branch_name}</div>
                                                </td>
                                                <td className="py-4 px-4 font-bold text-[#005ab5]">
                                                    {c.group?.name_ar || 'مستقل'}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                        c.type === 'hospital' ? 'bg-blue-50 text-[#005ab5]' : 'bg-purple-50 text-purple-700'
                                                    }`}>
                                                        {c.type === 'hospital' ? 'مستشفى' : 'عيادة'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-gray-600">
                                                    {c.city} - {c.district}
                                                </td>
                                                <td className="py-4 px-4 text-gray-600 font-mono" dir="ltr">
                                                    {c.phone}
                                                </td>
                                                <td className="py-4 px-4 font-bold text-gray-800">
                                                    {c.doctor_profiles_count ?? 0} استشاري
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                                        c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                                    }`}>
                                                        {c.is_active ? 'نشط ويستقبل حجوزات' : 'معلق وموقوف'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                                        c.is_verified ? 'bg-blue-50 text-[#005ab5]' : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {c.is_verified ? 'معتمد رسمياً' : 'قيد التدقيق'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 pl-6">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => router.post(`/admin/clinics/${c.id}/toggle`)}
                                                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
                                                        >
                                                            {c.is_active ? 'تعطيل' : 'تفعيل'}
                                                        </button>
                                                        <button
                                                            onClick={() => router.post(`/admin/clinics/${c.id}/toggle-verify`)}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                                                c.is_verified
                                                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                                                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                                                            }`}
                                                        >
                                                            {c.is_verified ? 'إلغاء التوثيق' : 'توثيق المنشأة'}
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
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 4: ADMINS & ROLE ASSIGNMENTS (المشرفون والصلاحيات) */}
                {/* ========================================================= */}
                {activeTab === 'admins' && (
                    <div className="space-y-6">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="البحث باسم المشرف، البريد، أو النطاق..."
                                value={roleSearch}
                                onChange={(e) => setRoleSearch(e.target.value)}
                                className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                            />
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                                        <tr>
                                            <th className="py-4 px-4">اسم المشرف</th>
                                            <th className="py-4 px-4">البريد الإلكتروني</th>
                                            <th className="py-4 px-4">رقم الجوال</th>
                                            <th className="py-4 px-4">الدور والصلاحية</th>
                                            <th className="py-4 px-4">النطاق والجهة المسندة</th>
                                            <th className="py-4 px-4">تاريخ التعيين</th>
                                            <th className="py-4 px-4 pl-6">الإجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredRoles.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50/50">
                                                <td className="py-3.5 px-4 font-bold text-gray-900 font-['Cairo'] text-sm">
                                                    {item.user_name}
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-500 font-mono" dir="ltr">
                                                    {item.user_email}
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-500 font-mono" dir="ltr">
                                                    {item.user_phone || '-'}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                        item.role === 'group_admin'
                                                            ? 'bg-blue-50 text-[#005ab5]'
                                                            : item.role === 'facility_admin'
                                                            ? 'bg-emerald-50 text-emerald-800'
                                                            : 'bg-teal-50 text-teal-800'
                                                    }`}>
                                                        {item.role === 'group_admin'
                                                            ? 'مدير مجمع طبي'
                                                            : item.role === 'facility_admin'
                                                            ? 'مدير مستشفى / عيادة'
                                                            : 'موظف استقبال'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-gray-800">
                                                    {item.scope_name}
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-400 font-mono">
                                                    {item.created_at}
                                                </td>
                                                <td className="py-3.5 px-4 pl-6">
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('هل أنت متأكد من سحب هذه الصلاحية من المشرف؟')) {
                                                                router.delete(`/admin/role-assignments/${item.id}`);
                                                            }
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-colors text-[11px]"
                                                    >
                                                        سحب الصلاحية
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 5: DOCTORS & MULTI-FACILITY */}
                {/* ========================================================= */}
                {activeTab === 'doctors' && (
                    <div className="space-y-6">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="البحث باسم الطبيب، التخصص، أو المجمع..."
                                value={doctorSearch}
                                onChange={(e) => setDoctorSearch(e.target.value)}
                                className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                            />
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                                        <tr>
                                            <th className="py-4 px-4">الطبيب</th>
                                            <th className="py-4 px-4">التخصص الإكلينيكي</th>
                                            <th className="py-4 px-4">المنشآت والفروع المسندة</th>
                                            <th className="py-4 px-4">سعر الكشف الأساسي</th>
                                            <th className="py-4 px-4">وقت الكشف</th>
                                            <th className="py-4 px-4">الحالة اليوم</th>
                                            <th className="py-4 px-4 pl-6">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredDoctors.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div className="font-bold text-gray-900 font-['Cairo'] text-sm">{doc.user.name}</div>
                                                    <div className="text-[11px] text-gray-400">{doc.title_ar}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="font-bold text-[#005ab5]">{doc.specialty.name_ar}</span>
                                                    {doc.subspecialty && (
                                                        <div className="text-[11px] text-gray-400">{doc.subspecialty}</div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {doc.doctor_facilities && doc.doctor_facilities.length > 0 ? (
                                                            doc.doctor_facilities.map(df => (
                                                                <span key={df.id} className="px-2 py-0.5 rounded-lg bg-blue-50 text-[#005ab5] text-[10px] font-bold">
                                                                    {df.facility.name} ({df.consultation_fee} ر.س)
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400">{doc.clinic.name}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 font-bold text-gray-900">
                                                    {doc.consultation_fee} ر.س
                                                </td>
                                                <td className="py-4 px-4 font-bold text-gray-600">
                                                    {doc.waiting_time_minutes} دقيقة
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                                        doc.is_available_today ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                                    }`}>
                                                        {doc.is_available_today ? 'متاح ومفعل' : 'غير متاح'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 pl-6">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenDocFacilityModal(doc)}
                                                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold transition-colors text-[11px]"
                                                        >
                                                            + تعيين بفرع
                                                        </button>
                                                        <button
                                                            onClick={() => router.post(`/admin/doctors/${doc.id}/toggle-approval`)}
                                                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors text-[11px]"
                                                        >
                                                            {doc.is_available_today ? 'تعطيل' : 'تفعيل'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenDoctorModal(doc)}
                                                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#005ab5] font-bold transition-colors text-[11px]"
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
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 6: SPECIALTIES */}
                {/* ========================================================= */}
                {activeTab === 'specialties' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {specialties.map((s) => (
                            <div key={s.id} className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="font-bold text-gray-900 font-['Cairo'] text-base">{s.name_ar}</div>
                                        {s.badge_text && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                {s.badge_text}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{s.description || 'لا يوجد وصف متاح'}</p>
                                </div>
                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-600">{s.doctor_profiles_count ?? 0} استشاري</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenSpecialtyModal(s)}
                                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#005ab5] font-bold text-xs"
                                        >
                                            تعديل
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 7: APPOINTMENTS */}
                {activeTab === 'appointments' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-80">
                                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="بحث برقم الحجز، اسم المريض، أو الطبيب..."
                                        value={appointmentSearch}
                                        onChange={(e) => setAppointmentSearch(e.target.value)}
                                        className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                                    />
                                </div>

                                <select
                                    value={appointmentStatusFilter}
                                    onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                                    className="p-2.5 rounded-2xl bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] font-bold text-gray-700"
                                >
                                    <option value="all">جميع الحالات</option>
                                    <option value="waiting">في الانتظار (waiting)</option>
                                    <option value="in_consultation">في الكشف (in_consultation)</option>
                                    <option value="completed">مكتمل (completed)</option>
                                    <option value="cancelled">ملغي (cancelled)</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                                        <tr>
                                            <th className="py-4 px-4">المرجع</th>
                                            <th className="py-4 px-4">المريض</th>
                                            <th className="py-4 px-4">الطبيب</th>
                                            <th className="py-4 px-4">المنشأة</th>
                                            <th className="py-4 px-4">الموعد</th>
                                            <th className="py-4 px-4">الحالة</th>
                                            <th className="py-4 px-4">الدفع</th>
                                            <th className="py-4 px-4 pl-6">تغيير الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredAppointments.map((a) => (
                                            <tr key={a.id} className="hover:bg-gray-50/50">
                                                <td className="py-4 px-4 font-mono font-bold text-gray-900">{a.booking_reference}</td>
                                                <td className="py-4 px-4">
                                                    <div className="font-bold text-gray-900 font-['Cairo']">{a.patient.name}</div>
                                                    <div className="text-[11px] text-gray-400 font-mono" dir="ltr">{a.patient.phone}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="font-bold text-gray-900 font-['Cairo']">{a.doctor.user.name}</div>
                                                    <div className="text-[11px] text-gray-400">{a.doctor.title_ar}</div>
                                                </td>
                                                <td className="py-4 px-4 text-gray-700 font-bold">
                                                    {a.facility?.name || a.doctor.clinic.name}
                                                </td>
                                                <td className="py-4 px-4 font-mono text-gray-600" dir="ltr">
                                                    {a.appointment_date} {a.appointment_time}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                        a.status === 'completed'
                                                            ? 'bg-blue-50 text-[#005ab5]'
                                                            : a.status === 'in_consultation'
                                                            ? 'bg-emerald-50 text-emerald-700 animate-pulse'
                                                            : a.status === 'waiting'
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-red-50 text-red-600'
                                                    }`}>
                                                        {a.status === 'completed' ? 'مكتمل' : a.status === 'in_consultation' ? 'في الكشف' : a.status === 'waiting' ? 'في الانتظار' : 'ملغي'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                        a.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {a.payment_status === 'paid' ? 'مدفوع' : 'معلق'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 pl-6">
                                                    <div className="flex items-center gap-1.5">
                                                        {a.status !== 'completed' && (
                                                            <button
                                                                onClick={() => router.put(`/admin/appointments/${a.id}/status`, { status: 'completed' })}
                                                                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#005ab5] font-bold text-[10px]"
                                                            >
                                                                إتمام
                                                            </button>
                                                        )}
                                                        {a.status !== 'cancelled' && (
                                                            <button
                                                                onClick={() => router.put(`/admin/appointments/${a.id}/status`, { status: 'cancelled' })}
                                                                className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px]"
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
                    </div>
                )}
            </main>

            {/* ========================================================= */}
            {/* MODAL 1: ADD / EDIT MEDICAL GROUP */}
            {/* ========================================================= */}
            {groupModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
                        <button onClick={() => setGroupModalOpen(false)} className="absolute left-6 top-6 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-black text-gray-900 font-['Cairo'] mb-4">
                            {editingGroup ? 'تعديل بيانات المجمع الطبي' : 'إضافة مجمع طبي جديد'}
                        </h3>
                        <form onSubmit={handleSaveGroup} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">اسم المجمع الطبي (بالعربية)</label>
                                <input
                                    type="text"
                                    required
                                    value={groupForm.data.name_ar}
                                    onChange={e => groupForm.setData('name_ar', e.target.value)}
                                    placeholder="مثال: مجموعة د. سليمان الحبيب الطبية"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">الاسم بالإنجليزية (اختياري)</label>
                                    <input
                                        type="text"
                                        value={groupForm.data.name_en}
                                        onChange={e => groupForm.setData('name_en', e.target.value)}
                                        placeholder="Al Habib Medical Group"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">رقم السجل التجاري CR</label>
                                    <input
                                        type="text"
                                        value={groupForm.data.cr_number}
                                        onChange={e => groupForm.setData('cr_number', e.target.value)}
                                        placeholder="1010187423"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            {!editingGroup && (
                                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={groupForm.data.create_admin}
                                            onChange={e => groupForm.setData('create_admin', e.target.checked)}
                                            className="rounded text-[#005ab5] focus:ring-[#005ab5]"
                                        />
                                        <span className="font-bold text-gray-800">تعيين حساب مدير لهذا المجمع الآن</span>
                                    </label>

                                    {groupForm.data.create_admin && (
                                        <div className="space-y-3 pt-2">
                                            <div>
                                                <label className="block font-bold text-gray-700 mb-1">اسم مدير المجمع</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={groupForm.data.admin_name}
                                                    onChange={e => groupForm.setData('admin_name', e.target.value)}
                                                    placeholder="أحمد العلي"
                                                    className="w-full p-2 rounded-xl bg-white border border-gray-200 text-xs"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block font-bold text-gray-700 mb-1">البريد الإلكتروني للولوج</label>
                                                    <input
                                                        type="email"
                                                        required
                                                        value={groupForm.data.admin_email}
                                                        onChange={e => groupForm.setData('admin_email', e.target.value)}
                                                        placeholder="admin@habeeb.com"
                                                        className="w-full p-2 rounded-xl bg-white border border-gray-200 text-xs"
                                                        dir="ltr"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block font-bold text-gray-700 mb-1">كلمة المرور</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        value={groupForm.data.admin_password}
                                                        onChange={e => groupForm.setData('admin_password', e.target.value)}
                                                        placeholder="••••••••"
                                                        className="w-full p-2 rounded-xl bg-white border border-gray-200 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setGroupModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold">
                                    إلغاء
                                </button>
                                <button type="submit" disabled={groupForm.processing} className="px-5 py-2 rounded-xl bg-[#005ab5] text-white font-bold hover:bg-[#00458e]">
                                    {editingGroup ? 'تحديث المجمع' : 'حفظ المجمع الطبي'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 2: ADD / EDIT CLINIC OR HOSPITAL */}
            {/* ========================================================= */}
            {clinicModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
                        <button onClick={() => setClinicModalOpen(false)} className="absolute left-6 top-6 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-black text-gray-900 font-['Cairo'] mb-4">
                            {editingClinic ? 'تعديل بيانات المنشأة الطبية' : 'إضافة مستشفى أو عيادة جديدة'}
                        </h3>
                        <form onSubmit={handleSaveClinic} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">المجمع الطبي التابع له</label>
                                    <select
                                        value={clinicForm.data.group_id}
                                        onChange={e => clinicForm.setData('group_id', e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    >
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name_ar}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">نوع المنشأة</label>
                                    <select
                                        value={clinicForm.data.type}
                                        onChange={e => clinicForm.setData('type', e.target.value as 'hospital' | 'clinic')}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    >
                                        <option value="hospital">مستشفى رئيسي (Hospital)</option>
                                        <option value="clinic">عيادة خارجية (Clinic)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">اسم المنشأة</label>
                                <input
                                    type="text"
                                    required
                                    value={clinicForm.data.name}
                                    onChange={(e) => clinicForm.setData('name', e.target.value)}
                                    placeholder="مثال: مستشفى د. سليمان الحبيب"
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
                                        placeholder="فرع طريق الملك فهد"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">ترخيص وزارة الصحة MOH</label>
                                    <input
                                        type="text"
                                        value={clinicForm.data.moh_license_no}
                                        onChange={(e) => clinicForm.setData('moh_license_no', e.target.value)}
                                        placeholder="MOH-RYD-9988"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
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
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">الحي</label>
                                    <input
                                        type="text"
                                        required
                                        value={clinicForm.data.district}
                                        onChange={(e) => clinicForm.setData('district', e.target.value)}
                                        placeholder="العليا"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">العنوان التفصيلي</label>
                                    <input
                                        type="text"
                                        required
                                        value={clinicForm.data.address}
                                        onChange={(e) => clinicForm.setData('address', e.target.value)}
                                        placeholder="طريق الملك فهد، حي العليا"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">رقم الهاتف</label>
                                    <input
                                        type="text"
                                        value={clinicForm.data.phone}
                                        onChange={(e) => clinicForm.setData('phone', e.target.value)}
                                        placeholder="+966112833333"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setClinicModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold">
                                    إلغاء
                                </button>
                                <button type="submit" disabled={clinicForm.processing} className="px-5 py-2 rounded-xl bg-[#005ab5] text-white font-bold hover:bg-[#00458e]">
                                    حفظ البيانات
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 3: ASSIGN STAFF / ADMIN */}
            {/* ========================================================= */}
            {roleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
                        <button onClick={() => setRoleModalOpen(false)} className="absolute left-6 top-6 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-black text-gray-900 font-['Cairo'] mb-4">
                            تعيين مشرف جديد للمنظومة
                        </h3>
                        <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">نوع الدور والصلاحية</label>
                                <select
                                    value={roleForm.data.role}
                                    onChange={e => {
                                        const r = e.target.value as 'group_admin' | 'facility_admin' | 'receptionist';
                                        roleForm.setData({
                                            ...roleForm.data,
                                            role: r,
                                            scope_type: r === 'group_admin' ? 'group' : 'facility',
                                            scope_id: r === 'group_admin' ? (groups[0]?.id || 0) : (clinics[0]?.id || 0),
                                        });
                                    }}
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                >
                                    <option value="group_admin">مدير مجمع طبي (Group Admin)</option>
                                    <option value="facility_admin">مدير مستشفى / عيادة (Facility Admin)</option>
                                    <option value="receptionist">موظف استقبال (Receptionist)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">
                                    {roleForm.data.scope_type === 'group' ? 'المجمع الطبي المستهدف' : 'المستشفى / العيادة المستهدفة'}
                                </label>
                                <select
                                    value={roleForm.data.scope_id}
                                    onChange={e => roleForm.setData('scope_id', parseInt(e.target.value))}
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                >
                                    {roleForm.data.scope_type === 'group' ? (
                                        groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name_ar}</option>
                                        ))
                                    ) : (
                                        clinics.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.group?.name_ar || 'مستقل'})</option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">طريقة تحديد المستخدم</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => roleForm.setData('user_mode', 'new')}
                                        className={`p-2 rounded-xl border text-center font-bold ${
                                            roleForm.data.user_mode === 'new'
                                                ? 'border-[#005ab5] bg-blue-50 text-[#005ab5]'
                                                : 'border-gray-200 text-gray-600'
                                        }`}
                                    >
                                        إنشاء حساب جديد فوراً
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => roleForm.setData('user_mode', 'existing')}
                                        className={`p-2 rounded-xl border text-center font-bold ${
                                            roleForm.data.user_mode === 'existing'
                                                ? 'border-[#005ab5] bg-blue-50 text-[#005ab5]'
                                                : 'border-gray-200 text-gray-600'
                                        }`}
                                    >
                                        اختيار مستخدم مسجل مسبقاً
                                    </button>
                                </div>
                            </div>

                            {roleForm.data.user_mode === 'existing' ? (
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">اختيار المستخدم</label>
                                    <select
                                        value={roleForm.data.user_id}
                                        onChange={e => roleForm.setData('user_id', e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    >
                                        {allUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">الاسم الكامل</label>
                                        <input
                                            type="text"
                                            required
                                            value={roleForm.data.new_name}
                                            onChange={e => roleForm.setData('new_name', e.target.value)}
                                            placeholder="سلمان الرشيد"
                                            className="w-full p-2.5 rounded-xl border border-gray-200 text-xs"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block font-bold text-gray-700 mb-1">البريد الإلكتروني للولوج</label>
                                            <input
                                                type="email"
                                                required
                                                value={roleForm.data.new_email}
                                                onChange={e => roleForm.setData('new_email', e.target.value)}
                                                placeholder="admin@branch.com"
                                                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs"
                                                dir="ltr"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-gray-700 mb-1">كلمة المرور</label>
                                            <input
                                                type="password"
                                                required
                                                value={roleForm.data.new_password}
                                                onChange={e => roleForm.setData('new_password', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">رقم الجوال (اختياري)</label>
                                        <input
                                            type="text"
                                            value={roleForm.data.new_phone}
                                            onChange={e => roleForm.setData('new_phone', e.target.value)}
                                            placeholder="+966500000000"
                                            className="w-full p-2.5 rounded-xl border border-gray-200 text-xs"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setRoleModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold">
                                    إلغاء
                                </button>
                                <button type="submit" disabled={roleForm.processing} className="px-5 py-2 rounded-xl bg-[#005ab5] text-white font-bold hover:bg-[#00458e]">
                                    حفظ وتعيين المشرف
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 4: ASSIGN DOCTOR TO ADDITIONAL FACILITY */}
            {/* ========================================================= */}
            {docFacilityModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setDocFacilityModalOpen(false)} className="absolute left-6 top-6 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-black text-gray-900 font-['Cairo'] mb-2">
                            تعيين الطبيب في منشأة إضافية
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            تمكين الطبيب من ممارسة الكشف بفرع/مستشفى إضافي مع تخصيص سعر الكشف
                        </p>
                        <form onSubmit={handleSaveDocFacility} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">الطبيب</label>
                                <select
                                    value={docFacilityForm.data.doctor_profile_id}
                                    onChange={e => docFacilityForm.setData('doctor_profile_id', parseInt(e.target.value))}
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                >
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.user.name} ({d.specialty.name_ar})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">المنشأة المستهدفة</label>
                                <select
                                    value={docFacilityForm.data.facility_id}
                                    onChange={e => docFacilityForm.setData('facility_id', parseInt(e.target.value))}
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                >
                                    {clinics.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} - {c.city} ({c.type === 'hospital' ? 'مستشفى' : 'عيادة'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">سعر الكشف بهذا الفرع (ر.س)</label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={docFacilityForm.data.consultation_fee}
                                        onChange={e => docFacilityForm.setData('consultation_fee', parseFloat(e.target.value))}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">مدة الكشف الافتراضية (دقيقة)</label>
                                    <input
                                        type="number"
                                        required
                                        min={5}
                                        max={120}
                                        value={docFacilityForm.data.default_slot_minutes}
                                        onChange={e => docFacilityForm.setData('default_slot_minutes', parseInt(e.target.value))}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setDocFacilityModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold">
                                    إلغاء
                                </button>
                                <button type="submit" disabled={docFacilityForm.processing} className="px-5 py-2 rounded-xl bg-[#005ab5] text-white font-bold hover:bg-[#00458e]">
                                    تأكيد التعيين
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 5: ADD / EDIT SPECIALTY */}
            {/* ========================================================= */}
            {specialtyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
                        <button onClick={() => setSpecialtyModalOpen(false)} className="absolute left-6 top-6 text-gray-400 hover:text-gray-600">
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
                                        placeholder="مثال: طب وجراحة العيون"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">الاسم بالإنجليزية</label>
                                    <input
                                        type="text"
                                        value={specialtyForm.data.name_en}
                                        onChange={(e) => specialtyForm.setData('name_en', e.target.value)}
                                        placeholder="Ophthalmology"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setSpecialtyModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold">
                                    إلغاء
                                </button>
                                <button type="submit" disabled={specialtyForm.processing} className="px-5 py-2 rounded-xl bg-[#005ab5] text-white font-bold hover:bg-[#00458e]">
                                    حفظ التخصص
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 6: EDIT DOCTOR */}
            {/* ========================================================= */}
            {doctorModalOpen && editingDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
                        <button onClick={() => setDoctorModalOpen(false)} className="absolute left-6 top-6 text-gray-400 hover:text-gray-600">
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
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setDoctorModalOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold">
                                    إلغاء
                                </button>
                                <button type="submit" disabled={doctorForm.processing} className="px-5 py-2 rounded-xl bg-[#005ab5] text-white font-bold hover:bg-[#00458e]">
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
