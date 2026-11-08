import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import {
    Building2,
    Users,
    Calendar,
    CreditCard,
    Plus,
    Search,
    ShieldCheck,
    CheckCircle2,
    Hospital,
    Phone,
    MapPin,
    UserPlus,
    X,
    Clock
} from 'lucide-react';

interface Facility {
    id: number;
    name: string;
    branch_name: string;
    type: 'hospital' | 'clinic';
    moh_license_no?: string;
    city: string;
    district: string;
    address: string;
    phone: string;
    is_active: boolean;
    is_verified: boolean;
    doctor_profiles_count?: number;
    admins?: Array<{ id: number; name: string; email: string }>;
    receptionists?: Array<{ id: number; name: string; email: string }>;
}

interface Doctor {
    id: number;
    title_ar: string;
    subspecialty: string;
    consultation_fee: number;
    user: { id: number; name: string; email: string; phone?: string; avatar?: string };
    specialty: { name_ar: string };
    clinic?: { name: string };
    doctor_facilities?: Array<{
        facility: { id: number; name: string; type: string };
        consultation_fee: number;
    }>;
}

interface StaffAssignment {
    id: number;
    user_name: string;
    user_email: string;
    user_phone: string;
    role: string;
    scope_type: string;
    scope_id: number;
    scope_name: string;
}

interface Props {
    group: {
        id: number;
        name_ar: string;
        name_en?: string;
        cr_number?: string;
        logo_url?: string;
    };
    groups: Array<{ id: number; name_ar: string }>;
    metrics: {
        facilitiesCount: number;
        hospitalsCount: number;
        clinicsCount: number;
        doctorsCount: number;
        todayAppointments: number;
        totalRevenue: string;
    };
    facilities: Facility[];
    doctors: Doctor[];
    specialties?: Array<{ id: number; name_ar: string }>;
    staffAssignments: StaffAssignment[];
}

export default function GroupDashboard({ group, metrics, facilities, doctors, specialties = [], staffAssignments }: Props) {
    const [activeTab, setActiveTab] = useState<'facilities' | 'doctors' | 'staff'>('facilities');
    const [facilityModalOpen, setFacilityModalOpen] = useState(false);
    const [staffModalOpen, setStaffModalOpen] = useState(false);
    const [doctorModalOpen, setDoctorModalOpen] = useState(false);
    const [searchFacility, setSearchFacility] = useState('');
    const [searchDoctor, setSearchDoctor] = useState('');

    // Facility Form
    const facilityForm = useForm({
        name: '',
        branch_name: '',
        type: 'hospital' as 'hospital' | 'clinic',
        moh_license_no: '',
        city: 'الرياض',
        district: '',
        address: '',
        phone: '',
    });

    // Staff Form
    const staffForm = useForm({
        facility_id: facilities[0]?.id || 0,
        role: 'facility_admin' as 'facility_admin' | 'receptionist',
        user_mode: 'new' as 'existing' | 'new',
        user_id: '',
        new_name: '',
        new_email: '',
        new_password: '',
        new_phone: '',
    });

    // Doctor Form
    const doctorForm = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        facility_id: facilities[0]?.id || 0,
        specialty_id: specialties[0]?.id || 1,
        title_ar: 'استشاري',
        subspecialty: '',
        consultation_fee: 250,
        waiting_time_minutes: 15,
        experience_years: 5,
        accepts_insurance: true,
    });

    const handleSaveFacility = (e: React.FormEvent) => {
        e.preventDefault();
        facilityForm.post(`/group/${group.id}/facilities`, {
            onSuccess: () => {
                setFacilityModalOpen(false);
                facilityForm.reset();
            },
        });
    };

    const handleSaveStaff = (e: React.FormEvent) => {
        e.preventDefault();
        staffForm.post(`/group/${group.id}/staff`, {
            onSuccess: () => {
                setStaffModalOpen(false);
                staffForm.reset();
            },
        });
    };

    const handleSaveDoctor = (e: React.FormEvent) => {
        e.preventDefault();
        doctorForm.post(`/group/${group.id}/doctors`, {
            onSuccess: () => {
                setDoctorModalOpen(false);
                doctorForm.reset();
            },
        });
    };

    const filteredFacilities = facilities.filter(f =>
        f.name.toLowerCase().includes(searchFacility.toLowerCase()) ||
        f.city.toLowerCase().includes(searchFacility.toLowerCase()) ||
        f.district.toLowerCase().includes(searchFacility.toLowerCase())
    );

    const filteredDoctors = doctors.filter(d =>
        d.user.name.toLowerCase().includes(searchDoctor.toLowerCase()) ||
        d.specialty.name_ar.toLowerCase().includes(searchDoctor.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title={`طبيبي - لوحة إدارة ${group.name_ar}`} />
            <TebibyHeader />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                            <span className="text-xs font-bold text-gray-500">إدارة المنظومة الطبية والمجمعات</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-['Cairo']">
                            {group.name_ar}
                        </h1>
                        {group.cr_number && (
                            <p className="text-xs text-gray-500 mt-1 font-mono">
                                السجل التجاري: {group.cr_number}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {activeTab === 'facilities' && (
                            <button
                                onClick={() => setFacilityModalOpen(true)}
                                className="px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>إضافة مستشفى أو عيادة تابعة</span>
                            </button>
                        )}
                        {activeTab === 'doctors' && (
                            <button
                                onClick={() => setDoctorModalOpen(true)}
                                className="px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>إضافة طبيب / استشاري جديد</span>
                            </button>
                        )}
                        {activeTab === 'staff' && (
                            <button
                                onClick={() => setStaffModalOpen(true)}
                                className="px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>تعيين مدير فرع أو استقبال</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-bold">إجمالي المنشآت</span>
                            <Building2 className="w-4 h-4 text-[#005ab5]" />
                        </div>
                        <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.facilitiesCount}</div>
                        <span className="text-[11px] text-gray-400 font-semibold">
                            {metrics.hospitalsCount} مستشفى • {metrics.clinicsCount} عيادة
                        </span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-bold">الأطباء والاستشاريون</span>
                            <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.doctorsCount}</div>
                        <span className="text-[11px] text-gray-400 font-semibold">استشاري معتمد بالمجمع</span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-bold">حجوزات اليوم</span>
                            <Calendar className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.todayAppointments}</div>
                        <span className="text-[11px] text-gray-400 font-semibold">حالة مجدولة لليوم</span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-bold">الإيرادات الفعلية للمجمع</span>
                            <CreditCard className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div className="text-2xl font-black text-emerald-600 font-['Cairo']">{metrics.totalRevenue}</div>
                        <span className="text-[11px] text-emerald-600 font-bold">مدفوعات مؤكدة</span>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar pb-2">
                    <button
                        onClick={() => setActiveTab('facilities')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'facilities'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        <span>المستشفيات والعيادات التابعة ({facilities.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('doctors')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'doctors'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>الأطباء والاستشاريون ({doctors.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('staff')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'staff'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>المشرفون وموظفو الاستقبال ({staffAssignments.length})</span>
                    </button>
                </div>

                {/* TAB 1: FACILITIES */}
                {activeTab === 'facilities' && (
                    <div className="space-y-6">
                        <div className="relative max-w-md">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="البحث عن مستشفى أو عيادة أو حي..."
                                value={searchFacility}
                                onChange={e => setSearchFacility(e.target.value)}
                                className="w-full pr-10 pl-4 py-2 rounded-2xl bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredFacilities.map(f => (
                                <div key={f.id} className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mb-1 ${
                                                f.type === 'hospital' ? 'bg-blue-50 text-[#005ab5]' : 'bg-purple-50 text-purple-700'
                                            }`}>
                                                {f.type === 'hospital' ? 'مستشفى رئيسي' : 'عيادة تخصصية'}
                                            </span>
                                            <h3 className="font-bold text-gray-900 font-['Cairo'] text-base">{f.name}</h3>
                                            <p className="text-xs text-gray-500">{f.branch_name}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                            f.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                        }`}>
                                            {f.is_active ? 'نشط' : 'معطل'}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span>{f.city} - {f.district}</span>
                                        </div>
                                        {f.phone && (
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span dir="ltr">{f.phone}</span>
                                            </div>
                                        )}
                                        {f.moh_license_no && (
                                            <div className="flex items-center gap-1.5">
                                                <ShieldCheck className="w-3.5 h-3.5 text-[#006b5c] shrink-0" />
                                                <span>ترخيص MOH: {f.moh_license_no}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                        <span className="font-bold text-gray-700">
                                            {f.doctor_profiles_count ?? 0} استشاري مسجل
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                            f.is_verified ? 'bg-blue-50 text-[#005ab5]' : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            {f.is_verified ? 'معتمد رسمياً' : 'قيد التدقيق'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 2: DOCTORS */}
                {activeTab === 'doctors' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="relative max-w-md w-full">
                                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="البحث عن طبيب أو تخصص..."
                                    value={searchDoctor}
                                    onChange={e => setSearchDoctor(e.target.value)}
                                    className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={() => setDoctorModalOpen(true)}
                                className="px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all shrink-0"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>+ إضافة طبيب واستشاري جديد</span>
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                                        <tr>
                                            <th className="py-3 px-4">الطبيب</th>
                                            <th className="py-3 px-4">التخصص</th>
                                            <th className="py-3 px-4">الفروع المتاح بها</th>
                                            <th className="py-3 px-4">سعر الكشف</th>
                                            <th className="py-3 px-4">الترخيص</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredDoctors.map(doc => (
                                            <tr key={doc.id} className="hover:bg-gray-50/50">
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-gray-900 font-['Cairo']">{doc.user.name}</div>
                                                    <div className="text-[11px] text-gray-400">{doc.title_ar}</div>
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-[#005ab5]">
                                                    {doc.specialty.name_ar}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {doc.doctor_facilities && doc.doctor_facilities.length > 0 ? (
                                                            doc.doctor_facilities.map((df, i) => (
                                                                <span key={i} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-semibold">
                                                                    {df.facility.name} ({df.consultation_fee} ر.س)
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400">{doc.clinic?.name || 'الفرع الرئيسي'}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-emerald-600">
                                                    {doc.consultation_fee} ر.س
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                                        مرخص ومفعل
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: STAFF ASSIGNMENTS */}
                {activeTab === 'staff' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                                        <tr>
                                            <th className="py-3 px-4">المشرف / الموظف</th>
                                            <th className="py-3 px-4">البريد الإلكتروني</th>
                                            <th className="py-3 px-4">الهاتف</th>
                                            <th className="py-3 px-4">الدور الوظيفي</th>
                                            <th className="py-3 px-4">الفرع المخصص</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {staffAssignments.map(s => (
                                            <tr key={s.id} className="hover:bg-gray-50/50">
                                                <td className="py-3.5 px-4 font-bold text-gray-900 font-['Cairo']">
                                                    {s.user_name}
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-500 font-mono" dir="ltr">
                                                    {s.user_email}
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-500 font-mono" dir="ltr">
                                                    {s.user_phone}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                        s.role === 'facility_admin'
                                                            ? 'bg-blue-50 text-[#005ab5]'
                                                            : s.role === 'receptionist'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-purple-50 text-purple-700'
                                                    }`}>
                                                        {s.role === 'facility_admin' ? 'مدير منشأة' : s.role === 'receptionist' ? 'موظف استقبال' : 'مدير مجمع'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-gray-800">
                                                    {s.scope_name}
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

            {/* MODAL 1: ADD FACILITY */}
            {facilityModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
                        <button
                            onClick={() => setFacilityModalOpen(false)}
                            className="absolute left-6 top-6 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-black text-gray-900 font-['Cairo'] mb-4">
                            إضافة منشأة طبية تابعة لـ {group.name_ar}
                        </h3>

                        <form onSubmit={handleSaveFacility} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">نوع المنشأة</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => facilityForm.setData('type', 'hospital')}
                                        className={`p-3 rounded-xl border text-center font-bold ${
                                            facilityForm.data.type === 'hospital'
                                                ? 'border-[#005ab5] bg-blue-50 text-[#005ab5]'
                                                : 'border-gray-200 text-gray-600'
                                        }`}
                                    >
                                        مستشفى رئيسي (Hospital)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => facilityForm.setData('type', 'clinic')}
                                        className={`p-3 rounded-xl border text-center font-bold ${
                                            facilityForm.data.type === 'clinic'
                                                ? 'border-[#005ab5] bg-blue-50 text-[#005ab5]'
                                                : 'border-gray-200 text-gray-600'
                                        }`}
                                    >
                                        عيادة تخصصية (Clinic)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">اسم المنشأة</label>
                                <input
                                    type="text"
                                    required
                                    value={facilityForm.data.name}
                                    onChange={e => facilityForm.setData('name', e.target.value)}
                                    placeholder="مثال: مستشفى د. سليمان الحبيب - فرع النرجس"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">الفرع</label>
                                    <input
                                        type="text"
                                        value={facilityForm.data.branch_name}
                                        onChange={e => facilityForm.setData('branch_name', e.target.value)}
                                        placeholder="فرع طريق التخصصي"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">ترخيص وزارة الصحة MOH</label>
                                    <input
                                        type="text"
                                        value={facilityForm.data.moh_license_no}
                                        onChange={e => facilityForm.setData('moh_license_no', e.target.value)}
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
                                        value={facilityForm.data.city}
                                        onChange={e => facilityForm.setData('city', e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">الحي</label>
                                    <input
                                        type="text"
                                        required
                                        value={facilityForm.data.district}
                                        onChange={e => facilityForm.setData('district', e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">العنوان بالتفصيل</label>
                                <input
                                    type="text"
                                    required
                                    value={facilityForm.data.address}
                                    onChange={e => facilityForm.setData('address', e.target.value)}
                                    placeholder="طريق الملك فهد، حي الصحافة"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">هاتف التواصل</label>
                                <input
                                    type="text"
                                    value={facilityForm.data.phone}
                                    onChange={e => facilityForm.setData('phone', e.target.value)}
                                    placeholder="+966112833333"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    dir="ltr"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setFacilityModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={facilityForm.processing}
                                    className="px-5 py-2 rounded-xl bg-[#005ab5] text-white font-bold hover:bg-[#00458e]"
                                >
                                    حفظ المنشأة
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: ASSIGN STAFF */}
            {staffModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
                        <button
                            onClick={() => setStaffModalOpen(false)}
                            className="absolute left-6 top-6 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-black text-gray-900 font-['Cairo'] mb-4">
                            تعيين مدير أو موظف استقبال لمنشأة
                        </h3>

                        <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">المنشأة المستهدفة</label>
                                <select
                                    value={staffForm.data.facility_id}
                                    onChange={e => staffForm.setData('facility_id', parseInt(e.target.value))}
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                >
                                    {facilities.map(f => (
                                        <option key={f.id} value={f.id}>{f.name} - {f.city}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">المسمى والصلاحية</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => staffForm.setData('role', 'facility_admin')}
                                        className={`p-3 rounded-xl border text-center font-bold ${
                                            staffForm.data.role === 'facility_admin'
                                                ? 'border-[#005ab5] bg-blue-50 text-[#005ab5]'
                                                : 'border-gray-200 text-gray-600'
                                        }`}
                                    >
                                        مدير منشأة (Facility Admin)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => staffForm.setData('role', 'receptionist')}
                                        className={`p-3 rounded-xl border text-center font-bold ${
                                            staffForm.data.role === 'receptionist'
                                                ? 'border-[#005ab5] bg-blue-50 text-[#005ab5]'
                                                : 'border-gray-200 text-gray-600'
                                        }`}
                                    >
                                        موظف استقبال (Receptionist)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">اسم المشرف بالكامل</label>
                                <input
                                    type="text"
                                    required
                                    value={staffForm.data.new_name}
                                    onChange={e => staffForm.setData('new_name', e.target.value)}
                                    placeholder="سلطان عبدالكريم"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">البريد الإلكتروني للولوج</label>
                                    <input
                                        type="email"
                                        required
                                        value={staffForm.data.new_email}
                                        onChange={e => staffForm.setData('new_email', e.target.value)}
                                        placeholder="admin.olaya@tebiby.com"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">كلمة المرور المؤقتة</label>
                                    <input
                                        type="password"
                                        required
                                        value={staffForm.data.new_password}
                                        onChange={e => staffForm.setData('new_password', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">رقم الجوال</label>
                                <input
                                    type="text"
                                    value={staffForm.data.new_phone}
                                    onChange={e => staffForm.setData('new_phone', e.target.value)}
                                    placeholder="+966500000000"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    dir="ltr"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStaffModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={staffForm.processing}
                                    className="px-5 py-2 rounded-xl bg-[#005ab5] text-white font-bold hover:bg-[#00458e]"
                                >
                                    حفظ وتعيين المشرف
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: ADD DOCTOR */}
            {doctorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setDoctorModalOpen(false)}
                            className="absolute left-6 top-6 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-black text-gray-900 font-['Cairo'] mb-1">
                            إضافة طبيب واستشاري جديد بالمجمع
                        </h3>
                        <p className="text-xs text-gray-500 mb-6">
                            إنشاء حساب الطبيب واعتماده بالمنشأة وتحديد سعر الكشف ومدة الموعد
                        </p>

                        <form onSubmit={handleSaveDoctor} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">اسم الطبيب بالكامل</label>
                                    <input
                                        type="text"
                                        required
                                        value={doctorForm.data.name}
                                        onChange={e => doctorForm.setData('name', e.target.value)}
                                        placeholder="د. ماجد السبيعي"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                    {doctorForm.errors.name && (
                                        <p className="text-[10px] text-red-600 mt-1">{doctorForm.errors.name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">البريد الإلكتروني للولوج</label>
                                    <input
                                        type="email"
                                        required
                                        value={doctorForm.data.email}
                                        onChange={e => doctorForm.setData('email', e.target.value)}
                                        placeholder="dr.majed@tebiby.com"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                        dir="ltr"
                                    />
                                    {doctorForm.errors.email && (
                                        <p className="text-[10px] text-red-600 mt-1">{doctorForm.errors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">كلمة المرور</label>
                                    <input
                                        type="password"
                                        required
                                        value={doctorForm.data.password}
                                        onChange={e => doctorForm.setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">رقم الجوال</label>
                                    <input
                                        type="text"
                                        value={doctorForm.data.phone}
                                        onChange={e => doctorForm.setData('phone', e.target.value)}
                                        placeholder="+966500000000"
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">المنشأة المتاح بها</label>
                                    <select
                                        value={doctorForm.data.facility_id}
                                        onChange={e => doctorForm.setData('facility_id', parseInt(e.target.value))}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    >
                                        {facilities.map(f => (
                                            <option key={f.id} value={f.id}>{f.name} ({f.city})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">التخصص الطبي</label>
                                    <select
                                        value={doctorForm.data.specialty_id}
                                        onChange={e => doctorForm.setData('specialty_id', parseInt(e.target.value))}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    >
                                        {specialties.map(s => (
                                            <option key={s.id} value={s.id}>{s.name_ar}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">اللقب والمسمى المهني</label>
                                <input
                                    type="text"
                                    required
                                    value={doctorForm.data.title_ar}
                                    onChange={e => doctorForm.setData('title_ar', e.target.value)}
                                    placeholder="استشاري جراحة العظام والمفاصل والعمود الفقري"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">التخصص الدقيق والاهتمام الإكلينيكي</label>
                                <input
                                    type="text"
                                    value={doctorForm.data.subspecialty}
                                    onChange={e => doctorForm.setData('subspecialty', e.target.value)}
                                    placeholder="زراعة المفاصل، مناظير الركبة، إصابات الملاعب المتقدمة"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">سعر الكشف (ر.س)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="10"
                                        required
                                        value={doctorForm.data.consultation_fee}
                                        onChange={e => doctorForm.setData('consultation_fee', parseFloat(e.target.value))}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">مدة الكشف (بالدقائق)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="120"
                                        required
                                        value={doctorForm.data.waiting_time_minutes}
                                        onChange={e => doctorForm.setData('waiting_time_minutes', parseInt(e.target.value))}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">سنوات الخبرة</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={doctorForm.data.experience_years}
                                        onChange={e => doctorForm.setData('experience_years', parseInt(e.target.value))}
                                        className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={doctorForm.data.accepts_insurance}
                                        onChange={e => doctorForm.setData('accepts_insurance', e.target.checked)}
                                        className="rounded text-[#005ab5] focus:ring-[#005ab5] w-4 h-4"
                                    />
                                    <span className="font-bold text-gray-700">قبول شركات التأمين الطبي المعتمدة بالمجمع</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setDoctorModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={doctorForm.processing}
                                    className="px-5 py-2 rounded-xl bg-[#005ab5] text-white font-bold hover:bg-[#00458e] shadow-md shadow-blue-500/20"
                                >
                                    حفظ واعتماد الطبيب
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

