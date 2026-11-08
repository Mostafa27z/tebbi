import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import {
    Hospital,
    Users,
    Clock,
    Plus,
    Search,
    Ticket,
    CheckCircle2,
    Activity,
    Phone,
    MapPin,
    ShieldCheck,
    X,
    UserPlus
} from 'lucide-react';

interface Doctor {
    id: number;
    title_ar: string;
    subspecialty: string;
    consultation_fee: number;
    waiting_time_minutes: number;
    is_available_today: boolean;
    user: { id: number; name: string; email: string; avatar?: string };
    specialty: { name_ar: string };
    doctor_facilities?: Array<{
        consultation_fee: number;
        default_slot_minutes: number;
    }>;
}

interface Appointment {
    id: number;
    booking_reference: string;
    appointment_time: string;
    status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
    payment_status: string;
    total_amount: number;
    patient: { name: string; phone: string };
    doctor: {
        title_ar: string;
        user: { name: string };
    };
    queueTicket?: {
        ticket_number: number;
        status: string;
        estimated_wait_minutes: number;
    };
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
        totalToday: number;
        waitingCount: number;
        inConsultationCount: number;
        completedCount: number;
    };
    doctors: Doctor[];
    todayAppointments: Appointment[];
}

export default function FacilityDashboard({ facility, metrics, doctors, todayAppointments }: Props) {
    const [ticketModalOpen, setTicketModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const walkInForm = useForm({
        doctor_profile_id: doctors[0]?.id || 0,
        patient_name: '',
        patient_phone: '',
        patient_national_id: '',
    });

    const handleIssueTicket = (e: React.FormEvent) => {
        e.preventDefault();
        walkInForm.post(`/facility/${facility.id}/walkin-ticket`, {
            onSuccess: () => {
                setTicketModalOpen(false);
                walkInForm.reset();
            },
        });
    };

    const filteredAppointments = todayAppointments.filter(a =>
        a.booking_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.doctor.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title={`طبيبي - إدارة ${facility.name}`} />
            <TebibyHeader />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-gray-500">
                                {facility.group ? `تابع لـ ${facility.group.name_ar}` : 'منشأة طبية مستقلة'}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-['Cairo']">
                            {facility.name}
                        </h1>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{facility.city} - {facility.district} ({facility.branch_name})</span>
                            {facility.moh_license_no && (
                                <span className="text-[#006b5c] font-bold"> • ترخيص MOH: {facility.moh_license_no}</span>
                            )}
                        </p>
                    </div>

                    <button
                        onClick={() => setTicketModalOpen(true)}
                        className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                    >
                        <Ticket className="w-4 h-4" />
                        <span>قطع تذكرة فورية (Walk-in)</span>
                    </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
                    <div className="p-4 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-gray-500 font-bold">أطباء اليوم</span>
                            <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.doctorsCount}</div>
                        <span className="text-[10px] text-gray-400">على رأس العمل</span>
                    </div>

                    <div className="p-4 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-gray-500 font-bold">إجمالي الحالات</span>
                            <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.totalToday}</div>
                        <span className="text-[10px] text-gray-400">مواعيد اليوم</span>
                    </div>

                    <div className="p-4 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-gray-500 font-bold">صالة الانتظار</span>
                            <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-2xl font-black text-amber-600 font-['Cairo']">{metrics.waitingCount}</div>
                        <span className="text-[10px] text-amber-600 font-bold">تنتظر الاستدعاء</span>
                    </div>

                    <div className="p-4 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-gray-500 font-bold">قيد المعاينة</span>
                            <Activity className="w-4 h-4 text-emerald-600 animate-spin" />
                        </div>
                        <div className="text-2xl font-black text-emerald-600 font-['Cairo']">{metrics.inConsultationCount}</div>
                        <span className="text-[10px] text-emerald-600 font-bold">في العيادة الآن</span>
                    </div>

                    <div className="p-4 rounded-3xl bg-white border border-gray-200/80 shadow-xs col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-gray-500 font-bold">مكتملة</span>
                            <CheckCircle2 className="w-4 h-4 text-[#006b5c]" />
                        </div>
                        <div className="text-2xl font-black text-[#006b5c] font-['Cairo']">{metrics.completedCount}</div>
                        <span className="text-[10px] text-gray-400">تم إنهاء الكشف</span>
                    </div>
                </div>

                {/* Queue & Appointments Today */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 font-['Cairo']">
                                سجل الانتظار والطابور الحي لليوم
                            </h2>
                            <p className="text-xs text-gray-500">حركة المرضى وتذاكر الطابور في هذه المنشأة</p>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="بحث برقم الحجز أو اسم المريض..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pr-10 pl-4 py-2 rounded-2xl bg-[#f7f9fb] border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4">رقم التذكرة</th>
                                    <th className="py-3 px-4">المريض</th>
                                    <th className="py-3 px-4">الطبيب المعالج</th>
                                    <th className="py-3 px-4">وقت الحجز</th>
                                    <th className="py-3 px-4">الحالة</th>
                                    <th className="py-3 px-4">حالة الدفع</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAppointments.length > 0 ? (
                                    filteredAppointments.map(appt => (
                                        <tr key={appt.id} className="hover:bg-gray-50/50">
                                            <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                                                {appt.queueTicket ? (
                                                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-[#005ab5] font-black text-xs">
                                                        #{appt.queueTicket.ticket_number}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-gray-900 font-['Cairo']">{appt.patient.name}</div>
                                                <div className="text-[11px] text-gray-400 font-mono" dir="ltr">{appt.patient.phone}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-gray-800">{appt.doctor.user.name}</div>
                                                <div className="text-[11px] text-gray-400">{appt.doctor.title_ar}</div>
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-gray-600" dir="ltr">
                                                {appt.appointment_time}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    appt.status === 'in_consultation'
                                                        ? 'bg-emerald-50 text-emerald-700 animate-pulse'
                                                        : appt.status === 'waiting'
                                                        ? 'bg-amber-50 text-amber-700'
                                                        : appt.status === 'completed'
                                                        ? 'bg-blue-50 text-[#005ab5]'
                                                        : 'bg-red-50 text-red-600'
                                                }`}>
                                                    {appt.status === 'in_consultation' ? 'في الكشف الآن' : appt.status === 'waiting' ? 'في الانتظار' : appt.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                    appt.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {appt.payment_status === 'paid' ? 'مدفوع' : 'معلق'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-400 font-bold">
                                            لا توجد مواعيد مسجلة اليوم حتى الآن
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Doctors at this facility */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                    <h2 className="text-lg font-black text-gray-900 font-['Cairo'] mb-4">
                        الكوادر الطبية المعتمدة في هذه المنشأة
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {doctors.map(doc => (
                            <div key={doc.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-900 font-['Cairo'] text-sm">{doc.user.name}</h4>
                                    <p className="text-xs text-[#005ab5] font-semibold">{doc.specialty.name_ar}</p>
                                    <p className="text-[11px] text-gray-400 mt-1">وقت الكشف المتوقع: {doc.waiting_time_minutes} دقيقة</p>
                                </div>
                                <div className="text-left">
                                    <span className="text-sm font-black text-emerald-600 font-['Cairo']">
                                        {doc.doctor_facilities?.[0]?.consultation_fee ?? doc.consultation_fee} ر.س
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* MODAL: WALK-IN TICKET */}
            {ticketModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
                        <button
                            onClick={() => setTicketModalOpen(false)}
                            className="absolute left-6 top-6 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-black text-gray-900 font-['Cairo'] mb-2">
                            قطع تذكرة فورية (Walk-in)
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            تسجيل مراجع في صالة الانتظار بـ {facility.name}
                        </p>

                        <form onSubmit={handleIssueTicket} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">اختيار الطبيب</label>
                                <select
                                    value={walkInForm.data.doctor_profile_id}
                                    onChange={e => walkInForm.setData('doctor_profile_id', parseInt(e.target.value))}
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                >
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.user.name} - {d.specialty.name_ar} ({d.consultation_fee} ر.س)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">اسم المراجع</label>
                                <input
                                    type="text"
                                    required
                                    value={walkInForm.data.patient_name}
                                    onChange={e => walkInForm.setData('patient_name', e.target.value)}
                                    placeholder="سلطان فهد الدوسري"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">رقم الجوال</label>
                                <input
                                    type="text"
                                    required
                                    value={walkInForm.data.patient_phone}
                                    onChange={e => walkInForm.setData('patient_phone', e.target.value)}
                                    placeholder="0555123456"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                    dir="ltr"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">رقم الهوية الوطنية / الإقامة (اختياري)</label>
                                <input
                                    type="text"
                                    value={walkInForm.data.patient_national_id}
                                    onChange={e => walkInForm.setData('patient_national_id', e.target.value)}
                                    placeholder="1098765432"
                                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setTicketModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={walkInForm.processing}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                                >
                                    إصدار التذكرة وإضافة للطابور
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

