import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { FacilityDashboardLayout } from '@/layouts/facility-dashboard-layout';
import { CustomSelect } from '@/components/common/custom-select';
import { MetricCard } from '@/components/common/metric-card';
import { StatusSelect } from '@/components/common/status-select';
import {
    Clock,
    Search,
    Ticket,
    CheckCircle2,
    Activity,
    X,
    UserCheck,
    Stethoscope,
    AlertCircle,
    ExternalLink,
    CreditCard,
    DollarSign,
    Check,
    Receipt
} from 'lucide-react';
import { cn, format12HourTime } from '@/lib/utils';

interface Doctor {
    id: number;
    title_ar: string;
    subspecialty?: string;
    consultation_fee: number;
    waiting_time_minutes: number;
    is_available_today: boolean;
    user: { id: number; name: string; email: string; avatar?: string; phone?: string };
    specialty: { id: number; name_ar: string; description?: string };
}

interface Appointment {
    id: number;
    booking_reference: string;
    appointment_date: string;
    appointment_time: string;
    status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'confirmed' | 'booked';
    payment_status: 'paid' | 'pending' | 'refunded';
    payment_method?: 'cash' | 'pos' | 'card' | 'insurance' | string;
    total_amount: number;
    fee_amount?: number;
    patient: { name: string; phone: string; national_id?: string };
    doctor: {
        id: number;
        title_ar: string;
        user: { name: string };
        specialty?: { id?: number; name_ar: string };
        specialty_id?: number;
    };
    queueTicket?: {
        ticket_number: number;
        status: string;
        estimated_wait_minutes: number;
    };
}

interface SpecialtyItem {
    id: number;
    name_ar: string;
    name_en?: string;
    description?: string;
}

interface Props {
    facility: {
        id: number;
        name: string;
        branch_name: string;
        type: 'hospital' | 'clinic';
        moh_license_no?: string;
        city: string;
        district: string;
        address: string;
        phone: string;
        group?: { name_ar: string };
    };
    facilities: Array<{ id: number; name: string }>;
    metrics: {
        doctorsCount: number;
        activeDoctorsCount: number;
        specialtiesCount: number;
        totalToday: number;
        waitingCount: number;
        inConsultationCount: number;
        completedCount: number;
        notArrivedCount?: number;
        insuranceCount?: number;
    };
    doctors: Doctor[];
    specialties: SpecialtyItem[];
    todayAppointments: Appointment[];
}

export default function FacilityDashboard({
    facility,
    metrics,
    doctors = [],
    specialties = [],
    todayAppointments = [],
}: Props) {
    const [ticketModalOpen, setTicketModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | number>('all');
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | number>('all');
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    // Payment Collection Modal State
    const [paymentModal, setPaymentModal] = useState<{
        isOpen: boolean;
        appointment: Appointment | null;
        paymentMethod: 'cash' | 'pos' | 'card' | 'insurance';
        amount: number;
        loading: boolean;
    }>({
        isOpen: false,
        appointment: null,
        paymentMethod: 'cash',
        amount: 0,
        loading: false,
    });

    // Walk-in Ticket Form
    const walkInForm = useForm({
        doctor_profile_id: doctors[0]?.id || 0,
        patient_name: '',
        patient_phone: '',
        patient_national_id: '',
    });

    const handleIssueTicket = (e: React.FormEvent) => {
        e.preventDefault();
        walkInForm.post(`/facility/${facility.id}/walkin-ticket`, {
            preserveScroll: true,
            onSuccess: () => {
                setTicketModalOpen(false);
                walkInForm.reset();
            },
        });
    };

    const handleCheckIn = (appointmentId: number) => {
        setActionLoadingId(appointmentId);
        router.post(
            `/facility/appointments/${appointmentId}/check-in`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setActionLoadingId(null),
            }
        );
    };

    const handleStatusChange = (appointmentId: number, newStatus: string) => {
        setActionLoadingId(appointmentId);
        router.post(
            `/facility/appointments/${appointmentId}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                onFinish: () => setActionLoadingId(null),
            }
        );
    };

    const handleConfirmPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentModal.appointment) return;

        setPaymentModal((prev) => ({ ...prev, loading: true }));
        router.post(
            `/facility/appointments/${paymentModal.appointment.id}/payment`,
            {
                payment_method: paymentModal.paymentMethod,
                amount: paymentModal.amount,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setPaymentModal({
                        isOpen: false,
                        appointment: null,
                        paymentMethod: 'cash',
                        amount: 0,
                        loading: false,
                    });
                },
                onFinish: () => {
                    setPaymentModal((prev) => ({ ...prev, loading: false }));
                },
            }
        );
    };

    // Filter today's appointments
    const filteredTodayAppointments = todayAppointments.filter((a) => {
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

    const statusFilterOptions = [
        { value: 'all', label: `كل الحالات (${todayAppointments.length})` },
        { value: 'confirmed', label: `لم يحضروا بعد (${todayAppointments.filter((a) => a.status === 'confirmed' || a.status === 'booked').length})` },
        { value: 'waiting', label: `في صالة الانتظار (${todayAppointments.filter((a) => a.status === 'waiting').length})` },
        { value: 'in_consultation', label: `قيد الكشف (${todayAppointments.filter((a) => a.status === 'in_consultation').length})` },
        { value: 'completed', label: `مكتملة (${todayAppointments.filter((a) => a.status === 'completed').length})` },
        { value: 'cancelled', label: `ملغية (${todayAppointments.filter((a) => a.status === 'cancelled').length})` },
    ];

    const doctorFilterOptions = [
        { value: 'all', label: 'جميع أطباء المنشأة' },
        ...doctors.map((d) => ({
            value: d.id,
            label: `${d.user.name} (${d.specialty.name_ar})`,
        })),
    ];

    const specialtyFilterOptions = [
        { value: 'all', label: 'جميع التخصصات الطبية' },
        ...specialties.map((s) => ({
            value: s.id,
            label: s.name_ar,
        })),
    ];

    const doctorModalOptions = doctors.map((d) => ({
        value: d.id,
        label: `${d.user.name} - ${d.specialty.name_ar}`,
        sublabel: `${d.title_ar} - كشف: ${d.consultation_fee} ر.س`,
    }));

    return (
        <FacilityDashboardLayout
            activeTab="queue"
            facilityName={facility.name}
            branchName={facility.branch_name}
            counts={{
                waiting: metrics.waitingCount,
                doctors: metrics.doctorsCount,
                specialties: specialties?.length || metrics.specialtiesCount,
                appointments: metrics.totalToday,
            }}
            onOpenWalkInModal={() => setTicketModalOpen(true)}
        >
            <Head title={`استقبال وطابور الحضور - ${facility.name}`} />

            <div className="space-y-6">
                {/* Top KPI Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    <MetricCard
                        title="إجمالي مواعيد اليوم"
                        value={metrics.totalToday}
                        subtitle="حجوزات مسجلة بالجدول"
                        icon={<Activity className="w-5 h-5 text-[#005ab5]" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="في صالة الانتظار"
                        value={metrics.waitingCount}
                        subtitle="حضروا وينتظرون بالخارج"
                        icon={<Clock className="w-5 h-5 text-amber-600" />}
                        iconBg="bg-amber-50"
                    />
                    <MetricCard
                        title="قيد الكشف بالعيادات"
                        value={metrics.inConsultationCount}
                        subtitle="داخل غرف الفحص الآن"
                        icon={<Stethoscope className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="لم يحضروا بعد"
                        value={metrics.notArrivedCount ?? 0}
                        subtitle="مؤكد وبانتظار حضورهم"
                        icon={<AlertCircle className="w-5 h-5 text-blue-600" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="كشوفات مكتملة"
                        value={metrics.completedCount}
                        subtitle="أنهوا الكشف وغادروا"
                        icon={<CheckCircle2 className="w-5 h-5 text-teal-600" />}
                        iconBg="bg-teal-50"
                    />
                </div>

                {/* Today's Queue Card */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                    {/* Table Header & Unified Filter Toolbar */}
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 font-['Cairo'] flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-[#005ab5]" />
                                    <span>طابور الحضور وإدارة عمليات الاستقبال المباشرة</span>
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    يمكنك تعديل حالة الحضور فوراً، أو تحصيل رسوم الكشف ونوع السداد مباشرة من الجدول
                                </p>
                            </div>
                            <div className="text-xs font-bold text-gray-600 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200/80 flex items-center gap-2">
                                <span>المعروض بالجدول:</span>
                                <span className="font-mono font-black text-[#005ab5] text-sm">
                                    {filteredTodayAppointments.length}
                                </span>
                                <span className="text-gray-400">/</span>
                                <span className="font-mono text-gray-600">
                                    {todayAppointments.length}
                                </span>
                                <span>موعد</span>
                            </div>
                        </div>

                        {/* Single Unified Modern Filters Toolbar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-gray-50/90 rounded-2xl border border-gray-200/80">
                            {/* 1. Search Box */}
                            <div className="relative">
                                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="بحث برقم الحجز، الاسم، الجوال..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pr-10 pl-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-[#005ab5] focus:outline-none transition-all shadow-2xs"
                                />
                            </div>

                            {/* 2. Status Select Dropdown */}
                            <div>
                                <CustomSelect
                                    size="sm"
                                    value={statusFilter}
                                    onChange={(val) => setStatusFilter(String(val))}
                                    options={statusFilterOptions}
                                    placeholder="حالة الموعد"
                                />
                            </div>

                            {/* 3. Doctor Select Dropdown */}
                            <div>
                                <CustomSelect
                                    size="sm"
                                    value={selectedDoctorId}
                                    onChange={(val) => setSelectedDoctorId(val)}
                                    options={doctorFilterOptions}
                                    placeholder="جميع الأطباء بالمنشأة"
                                />
                            </div>

                            {/* 4. Specialty Select Dropdown */}
                            <div>
                                <CustomSelect
                                    size="sm"
                                    value={selectedSpecialtyId}
                                    onChange={(val) => setSelectedSpecialtyId(val)}
                                    options={specialtyFilterOptions}
                                    placeholder="جميع التخصصات"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Appointments Table with Interactive Status & Payment */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4">رقم التذكرة</th>
                                    <th className="py-3 px-4">بيانات المريض</th>
                                    <th className="py-3 px-4">الطبيب المعالج</th>
                                    <th className="py-3 px-4">وقت الموعد</th>
                                    <th className="py-3 px-4">حالة الحضور بالاستقبال (تغيير مباشر)</th>
                                    <th className="py-3 px-4">السداد والتحصيل المالي (جباية الرسوم)</th>
                                    <th className="py-3 px-4 text-center">إجراء الاستقبال</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTodayAppointments.length > 0 ? (
                                    filteredTodayAppointments.map((appt) => {
                                        const isWaiting = appt.status === 'waiting';
                                        const isInConsultation = appt.status === 'in_consultation';
                                        const isCompleted = appt.status === 'completed';
                                        const isConfirmed = appt.status === 'confirmed' || appt.status === 'booked';
                                        const isLoading = actionLoadingId === appt.id;

                                        return (
                                            <tr
                                                key={appt.id}
                                                className={cn(
                                                    'hover:bg-blue-50/40 transition-colors',
                                                    isInConsultation && 'bg-emerald-50/30',
                                                    isWaiting && 'bg-amber-50/20'
                                                )}
                                            >
                                                {/* Ticket Number */}
                                                <td className="py-3.5 px-4 font-mono">
                                                    {appt.queueTicket ? (
                                                        <span className="font-extrabold text-[#005ab5] text-sm bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                                            #{appt.queueTicket.ticket_number}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 font-medium text-[11px]">
                                                            لم تصدر
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Patient Info */}
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-gray-900">
                                                        {appt.patient.name}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 font-mono mt-0.5" dir="ltr">
                                                        {appt.patient.phone}
                                                    </div>
                                                </td>

                                                {/* Doctor Info */}
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-gray-900">
                                                        {appt.doctor.user.name}
                                                    </div>
                                                    <div className="text-[11px] text-purple-700">
                                                        {appt.doctor.specialty?.name_ar || appt.doctor.title_ar}
                                                    </div>
                                                </td>

                                                {/* Appointment Time */}
                                                <td className="py-3.5 px-4 font-mono font-bold text-gray-700">
                                                    <span className="px-2.5 py-1 rounded-lg bg-gray-100/70 text-gray-700 text-xs inline-block">
                                                        {format12HourTime(appt.appointment_time)}
                                                    </span>
                                                </td>

                                                {/* Live Status Selector */}
                                                <td className="py-3.5 px-4">
                                                    <div className="w-56">
                                                        <StatusSelect
                                                            value={appt.status}
                                                            onChange={(newStatus) => handleStatusChange(appt.id, newStatus)}
                                                            disabled={isLoading}
                                                        />
                                                    </div>
                                                </td>

                                                {/* Payment Collection & Verification */}
                                                <td className="py-3.5 px-4">
                                                    {appt.payment_status === 'paid' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPaymentModal({
                                                                    isOpen: true,
                                                                    appointment: appt,
                                                                    paymentMethod: (appt.payment_method as any) || 'cash',
                                                                    amount: appt.total_amount || 200,
                                                                    loading: false,
                                                                })
                                                            }
                                                            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                                                            title="اضغط لتعديل السداد أو إعادة التحصيل"
                                                        >
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>
                                                                {appt.payment_method === 'insurance'
                                                                    ? 'تأمين (مغطى 100%)'
                                                                    : appt.payment_method === 'pos'
                                                                    ? 'مسدد: شبكة / مدى'
                                                                    : appt.payment_method === 'card'
                                                                    ? 'مسدد: بطاقة'
                                                                    : 'مسدد: نقداً'}
                                                            </span>
                                                            <span className="font-mono text-emerald-950">
                                                                ({appt.total_amount} ر.س)
                                                            </span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPaymentModal({
                                                                    isOpen: true,
                                                                    appointment: appt,
                                                                    paymentMethod: 'cash',
                                                                    amount: appt.total_amount || 200,
                                                                    loading: false,
                                                                })
                                                            }
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer animate-pulse"
                                                        >
                                                            <CreditCard className="w-3.5 h-3.5" />
                                                            <span>تحصيل الرسوم ({appt.total_amount || 200} ر.س)</span>
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Quick Actions */}
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {isConfirmed && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCheckIn(appt.id)}
                                                                disabled={isLoading}
                                                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                                                title="تسجيل وصول فوري بالاستقبال"
                                                            >
                                                                <UserCheck className="w-3.5 h-3.5" />
                                                                <span>تسجيل وصول</span>
                                                            </button>
                                                        )}
                                                        <a
                                                            href={`/queue/${appt.booking_reference}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#005ab5] hover:bg-blue-50 transition-colors"
                                                            title="عرض شاشة التتبع الحي المباشر"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                                            لا توجد مواعيد مطابقة لخيارات البحث أو الفلتر المحددة.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Financial Payment Collection Modal */}
            {paymentModal.isOpen && paymentModal.appointment && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
                    dir="rtl"
                >
                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 bg-gray-50/60">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold font-['Cairo'] text-gray-900">
                                        تحصيل رسوم الكشف الطبي
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        حجز رقم: <span className="font-mono font-bold">{paymentModal.appointment.booking_reference}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setPaymentModal({
                                        isOpen: false,
                                        appointment: null,
                                        paymentMethod: 'cash',
                                        amount: 0,
                                        loading: false,
                                    })
                                }
                                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">اسم المريض:</span>
                                    <span className="font-bold text-gray-900">{paymentModal.appointment.patient.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">الطبيب المعالج:</span>
                                    <span className="font-bold text-gray-900">{paymentModal.appointment.doctor.user.name}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200/60 pt-2 text-sm font-bold">
                                    <span className="text-gray-900">المبلغ المطلوب سداده:</span>
                                    <span className="font-mono text-emerald-600">
                                        {paymentModal.amount} ر.س
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2 font-['Cairo']">
                                    اختر طريقة السداد والتحصيل:
                                </label>
                                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPaymentModal((prev) => ({ ...prev, paymentMethod: 'cash' }))
                                        }
                                        className={cn(
                                            'p-3 rounded-2xl border text-center transition-all cursor-pointer',
                                            paymentModal.paymentMethod === 'cash'
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-xs'
                                                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                        )}
                                    >
                                        💵 نقداً (كاش بالاستقبال)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPaymentModal((prev) => ({ ...prev, paymentMethod: 'pos' }))
                                        }
                                        className={cn(
                                            'p-3 rounded-2xl border text-center transition-all cursor-pointer',
                                            paymentModal.paymentMethod === 'pos'
                                                ? 'bg-blue-50 text-[#005ab5] border-[#005ab5] shadow-xs'
                                                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                        )}
                                    >
                                        💳 شبكة / مدى (POS)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPaymentModal((prev) => ({ ...prev, paymentMethod: 'card' }))
                                        }
                                        className={cn(
                                            'p-3 rounded-2xl border text-center transition-all cursor-pointer',
                                            paymentModal.paymentMethod === 'card'
                                                ? 'bg-blue-50 text-[#005ab5] border-[#005ab5] shadow-xs'
                                                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                        )}
                                    >
                                        🌐 بطاقة ائتمانية
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPaymentModal((prev) => ({ ...prev, paymentMethod: 'insurance' }))
                                        }
                                        className={cn(
                                            'p-3 rounded-2xl border text-center transition-all cursor-pointer',
                                            paymentModal.paymentMethod === 'insurance'
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-xs'
                                                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                        )}
                                    >
                                        🛡️ تأمين معتمد
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={paymentModal.loading}
                                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {paymentModal.loading ? 'جارٍ تسجيل التحصيل...' : 'تأكيد جباية الرسوم وتوثيق السداد'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Walk-in Ticket Modal with CustomSelect */}
            {ticketModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                    dir="rtl"
                >
                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-visible">
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold font-['Cairo'] text-gray-900">
                                    قطع تذكرة فورية (Walk-in)
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    للمرضى الحاضرين مباشرة دون حجز مسبق عبر المنصة
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTicketModalOpen(false)}
                                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleIssueTicket} className="p-6 space-y-4">
                            <div>
                                <CustomSelect
                                    label="اختر الطبيب المعالج"
                                    value={walkInForm.data.doctor_profile_id}
                                    onChange={(val) => walkInForm.setData('doctor_profile_id', Number(val))}
                                    options={doctorModalOptions}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 font-['Cairo']">
                                    اسم المريض الثلاثي
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={walkInForm.data.patient_name}
                                    onChange={(e) => walkInForm.setData('patient_name', e.target.value)}
                                    placeholder="مثال: صالح محمد الرويلي"
                                    className="w-full h-11 px-4 rounded-2xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 font-['Cairo']">
                                    رقم الجوال
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={walkInForm.data.patient_phone}
                                    onChange={(e) => walkInForm.setData('patient_phone', e.target.value)}
                                    placeholder="05XXXXXXXX"
                                    className="w-full h-11 px-4 rounded-2xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 font-['Cairo']">
                                    رقم الهوية الوطنية / الإقامة (اختياري)
                                </label>
                                <input
                                    type="text"
                                    value={walkInForm.data.patient_national_id}
                                    onChange={(e) => walkInForm.setData('patient_national_id', e.target.value)}
                                    placeholder="10XXXXXXXX"
                                    className="w-full h-11 px-4 rounded-2xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={walkInForm.processing}
                                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {walkInForm.processing ? 'جارٍ إصدار التذكرة...' : 'إصدار التذكرة وإلحاق المريض بالطابور'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </FacilityDashboardLayout>
    );
}
