import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { FacilityDashboardLayout } from '@/layouts/facility-dashboard-layout';
import { 
    Calendar, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Search, 
    ExternalLink, 
    CreditCard, 
    ChevronRight, 
    ChevronLeft 
} from 'lucide-react';
import { cn, formatArabicDate, format12HourTime } from '@/lib/utils';
import { CustomSelect } from '@/components/common/custom-select';

interface Appointment {
    id: number;
    booking_reference: string;
    appointment_date: string;
    appointment_time: string;
    status: 'booked' | 'confirmed' | 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show';
    payment_method: string;
    payment_status: string;
    total_amount: number;
    patient: {
        id: number;
        name: string;
        phone: string;
    };
    doctor: {
        id: number;
        title_ar: string;
        consultation_fee: number;
        user: {
            name: string;
            avatar?: string;
        };
        specialty?: {
            id: number;
            name_ar: string;
        };
    };
    queueTicket?: {
        ticket_number: number;
        status: string;
    };
}

interface Doctor {
    id: number;
    title_ar: string;
    user: { name: string };
    specialty: { id: number; name_ar: string };
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
    specialties: Array<{ id: number; name_ar: string }>;
    allAppointments: Appointment[];
}

export default function FacilityAppointmentsPage({
    facility,
    metrics,
    doctors,
    specialties,
    allAppointments = [],
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | number>('all');
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | number>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    const statusOptions = [
        { value: 'all', label: `كافة الحالات (${allAppointments.length})` },
        { value: 'completed', label: `كشوفات مكتملة (${allAppointments.filter((a) => a.status === 'completed').length})` },
        { value: 'in_consultation', label: `قيد الكشف (${allAppointments.filter((a) => a.status === 'in_consultation').length})` },
        { value: 'waiting', label: `في صالة الانتظار (${allAppointments.filter((a) => a.status === 'waiting').length})` },
        { value: 'confirmed', label: `مؤكد / لم يحضر بعد (${allAppointments.filter((a) => a.status === 'confirmed' || a.status === 'booked').length})` },
        { value: 'cancelled', label: `حجوزات ملغية (${allAppointments.filter((a) => a.status === 'cancelled').length})` },
    ];

    const doctorOptions = [
        { value: 'all', label: 'جميع الأطباء بالمنشأة' },
        ...doctors.map((d) => ({
            value: d.id,
            label: `${d.user.name} (${d.specialty.name_ar})`,
        })),
    ];

    const specialtyOptions = [
        { value: 'all', label: 'جميع التخصصات الطبية' },
        ...specialties.map((s) => ({
            value: s.id,
            label: s.name_ar,
        })),
    ];

    const filteredAppointments = allAppointments.filter((a) => {
        const matchesSearch =
            a.booking_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.doctor.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (a.patient.phone && a.patient.phone.includes(searchQuery));

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'confirmed'
                ? a.status === 'confirmed' || a.status === 'booked'
                : a.status === statusFilter);

        const matchesDoctor = selectedDoctorId === 'all' || a.doctor.id === Number(selectedDoctorId);

        const matchesSpecialty =
            selectedSpecialtyId === 'all' ||
            (a.doctor as any).specialty_id === Number(selectedSpecialtyId) ||
            a.doctor.specialty?.id === Number(selectedSpecialtyId);

        return matchesSearch && matchesStatus && matchesDoctor && matchesSpecialty;
    });

    const totalPages = Math.ceil(filteredAppointments.length / pageSize) || 1;
    const paginatedAppointments = filteredAppointments.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return { label: 'مكتمل (أنهى الكشف)', bg: 'bg-gray-100 text-gray-800 border-gray-200' };
            case 'in_consultation':
                return { label: 'قيد الكشف الآن', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
            case 'waiting':
                return { label: 'في صالة الانتظار', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
            case 'confirmed':
            case 'booked':
                return { label: 'مؤكد (بانتظار الحضور)', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
            case 'cancelled':
                return { label: 'ملغي', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
            default:
                return { label: status, bg: 'bg-gray-50 text-gray-700 border-gray-200' };
        }
    };

    return (
        <FacilityDashboardLayout
            activeTab="appointments"
            facilityName={facility.name}
            branchName={facility.branch_name}
            counts={{
                waiting: metrics.waitingCount,
                doctors: metrics.doctorsCount,
                specialties: specialties?.length || metrics.specialtiesCount,
                appointments: metrics.totalToday,
            }}
        >
            <Head title={`سجل المواعيد والتذاكر - ${facility.name}`} />

            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 block">إجمالي سجل المواعيد</span>
                            <span className="text-2xl font-black text-[#005ab5] font-mono mt-1 block">
                                {allAppointments.length}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5 block">كافة الحجوزات المقيدة</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#005ab5]">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 block">كشوفات مكتملة</span>
                            <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                                {allAppointments.filter((a) => a.status === 'completed').length}
                            </span>
                            <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">تم إنهاء فحصها</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 block">مواعيد اليوم النشطة</span>
                            <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">
                                {metrics.totalToday}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5 block">حجوزات تاريخ اليوم</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 block">حالات ملغية / معتذرة</span>
                            <span className="text-2xl font-black text-rose-600 font-mono mt-1 block">
                                {allAppointments.filter((a) => a.status === 'cancelled').length}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5 block">لم يتم الحضور</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 font-['Cairo'] flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#005ab5]" />
                                <span>سجل المواعيد والتذاكر التاريخي الكامل</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                استعراض كافة الحجوزات السابقة والجارية وتفاصيل سدادها والتذاكر المرتبطة
                            </p>
                        </div>

                        <div className="text-xs font-bold text-gray-500 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-100">
                            المعروض: <span className="font-mono text-[#005ab5] font-black">{filteredAppointments.length}</span> من أصل <span className="font-mono">{allAppointments.length}</span> موعد
                        </div>
                    </div>

                    {/* Filters Toolbar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-gray-50/90 rounded-2xl border border-gray-200/80 mb-6">
                        <div className="relative">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="بحث برقم الحجز، الاسم، الجوال..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pr-10 pl-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                            />
                        </div>

                        <div>
                            <CustomSelect
                                size="sm"
                                value={statusFilter}
                                onChange={(val) => {
                                    setStatusFilter(String(val));
                                    setCurrentPage(1);
                                }}
                                options={statusOptions}
                                placeholder="حالة الموعد"
                            />
                        </div>

                        <div>
                            <CustomSelect
                                size="sm"
                                value={selectedDoctorId}
                                onChange={(val) => {
                                    setSelectedDoctorId(val);
                                    setCurrentPage(1);
                                }}
                                options={doctorOptions}
                                placeholder="جميع الأطباء"
                            />
                        </div>

                        <div>
                            <CustomSelect
                                size="sm"
                                value={selectedSpecialtyId}
                                onChange={(val) => {
                                    setSelectedSpecialtyId(val);
                                    setCurrentPage(1);
                                }}
                                options={specialtyOptions}
                                placeholder="جميع التخصصات"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4">رقم الحجز</th>
                                    <th className="py-3 px-4">بيانات المريض</th>
                                    <th className="py-3 px-4">الطبيب والتخصص</th>
                                    <th className="py-3 px-4">التاريخ والوقت</th>
                                    <th className="py-3 px-4">حالة الحضور والكشف</th>
                                    <th className="py-3 px-4">حالة السداد</th>
                                    <th className="py-3 px-4 text-center">التتبع المباشر</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedAppointments.length > 0 ? (
                                    paginatedAppointments.map((appt) => {
                                        const badge = getStatusBadge(appt.status);

                                        return (
                                            <tr key={appt.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                                                    {appt.booking_reference}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-gray-900">{appt.patient.name}</div>
                                                    <div className="text-[11px] text-gray-400 font-mono mt-0.5" dir="ltr">
                                                        {appt.patient.phone}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-gray-900">{appt.doctor.user.name}</div>
                                                    <div className="text-[11px] text-[#005ab5]">
                                                        {appt.doctor.specialty?.name_ar || appt.doctor.title_ar}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-gray-900 text-xs">
                                                        {formatArabicDate(appt.appointment_date)}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 font-semibold mt-0.5">
                                                        {format12HourTime(appt.appointment_time)}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block', badge.bg)}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-emerald-700 block">
                                                        {appt.payment_method === 'insurance'
                                                            ? 'تأمين طبي (معتمد)'
                                                            : appt.payment_method === 'pos'
                                                            ? 'شبكة / مدى'
                                                            : appt.payment_method === 'card'
                                                            ? 'بطاقة دفع'
                                                            : 'نقداً بالعيادة'}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-gray-500">
                                                        {appt.total_amount} ر.س
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <a
                                                        href={`/queue/${appt.booking_reference}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#005ab5] hover:bg-blue-50 transition-colors inline-block"
                                                        title="عرض شاشة التتبع الحي"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-gray-400 text-xs">
                                            لا توجد مواعيد مطابقة لخيارات الفلترة المحددة.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4 text-xs">
                            <span className="text-gray-500">
                                صفحة <span className="font-bold text-gray-900 font-mono">{currentPage}</span> من <span className="font-bold text-gray-900 font-mono">{totalPages}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </FacilityDashboardLayout>
    );
}

