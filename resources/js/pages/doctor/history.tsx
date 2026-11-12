import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { DoctorDashboardLayout } from '@/layouts/doctor-dashboard-layout';
import { MetricCard } from '@/components/common/metric-card';
import { formatArabicDate, format12HourTime } from '@/lib/utils';
import { 
    FileText, 
    Search, 
    X, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    ShieldCheck, 
    Stethoscope, 
    Eye,
    AlertCircle
} from 'lucide-react';

interface DoctorHistoryProps {
    doctor: {
        id: number;
        title_ar: string;
        is_available_today: boolean;
        consultation_fee: number;
        waiting_time_minutes: number;
        user: {
            name: string;
            email: string;
            avatar: string;
        };
        specialty: {
            name_ar: string;
        };
        clinic: {
            name: string;
            district: string;
        };
    };
    todayAppointments: any[];
    historyAppointments: any[];
    stats: {
        totalPatients: number;
        waitingCount: number;
        inConsultationCount: number;
        completedCount: number;
        notArrivedCount: number;
        insuranceCount: number;
        currentTicketNum: number | null;
    };
}

export default function DoctorHistory({
    doctor,
    historyAppointments = [],
    stats,
}: DoctorHistoryProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null);

    // Filter consultations by search
    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return historyAppointments;
        const q = searchQuery.trim().toLowerCase();

        return historyAppointments.filter((item) => {
            const patientName = (item.patient?.name || '').toLowerCase();
            const patientPhone = (item.patient?.phone || '').toLowerCase();
            const ticket = String(item.queueTicket?.ticket_number || item.id || '');
            const diagnosis = (item.prescription?.diagnosis || '').toLowerCase();
            const rxCode = (item.prescription?.prescription_code || '').toLowerCase();

            return (
                patientName.includes(q) ||
                patientPhone.includes(q) ||
                ticket.includes(q) ||
                diagnosis.includes(q) ||
                rxCode.includes(q)
            );
        });
    }, [historyAppointments, searchQuery]);

    const rxCount = useMemo(() => {
        return historyAppointments.filter((a) => a.prescription).length;
    }, [historyAppointments]);

    const insuredCount = useMemo(() => {
        return historyAppointments.filter((a) => a.payment_method === 'insurance' || (a.fee_amount ?? 0) === 0).length;
    }, [historyAppointments]);

    return (
        <DoctorDashboardLayout
            doctor={doctor}
            counts={{
                waiting: stats?.waitingCount,
                inConsultation: stats?.inConsultationCount,
                completed: stats?.completedCount,
            }}
        >
            <Head title={`سجل الكشوفات والروشتات - د. ${doctor.user.name}`} />

            <div className="space-y-6 font-['Tajawal']" dir="rtl">
                {/* Metrics Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MetricCard
                        title="إجمالي الكشوفات المسجلة"
                        value={historyAppointments.length}
                        subtitle="أرشيف الحالات المكتملة"
                        icon={<FileText className="w-5 h-5 text-[#005ab5]" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="الوصفات والروشتات الصادرة"
                        value={rxCount}
                        subtitle="وصفات إلكترونية معتمدة"
                        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="كشوفات التأمين الطبي"
                        value={insuredCount}
                        subtitle="تغطية شركات التأمين"
                        icon={<ShieldCheck className="w-5 h-5 text-purple-600" />}
                        iconBg="bg-purple-50"
                    />
                </div>

                {/* Main Table Card */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                    {/* Header & Search Toolbar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 font-['Cairo'] flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-600" />
                                <span>أرشيف الكشوفات والروشتات الطبية الصادرة</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                استعراض ملفات المرضى الذين أتموا الكشف، التشخيص الطبي والوصفات الصادرة
                            </p>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-80">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="بحث باسم المريض، الجوال، التشخيص، RX..."
                                className="w-full pr-9 pl-8 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005ab5]/20 focus:border-[#005ab5] transition-all"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4">رقم التذكرة</th>
                                    <th className="py-3 px-4">المريض</th>
                                    <th className="py-3 px-4">التاريخ والوقت</th>
                                    <th className="py-3 px-4">التشخيص الطبي</th>
                                    <th className="py-3 px-4">رمز الوصفة (RX)</th>
                                    <th className="py-3 px-4">نوع الدفع / التغطية</th>
                                    <th className="py-3 px-4 text-center">التفاصيل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.length > 0 ? (
                                    filtered.map((appt) => (
                                        <tr key={appt.id} className="hover:bg-blue-50/20 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-bold text-[#005ab5]">
                                                {appt.queueTicket?.ticket_number ? (
                                                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-[#005ab5] font-black text-xs font-mono">
                                                        #{appt.queueTicket.ticket_number}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 font-mono">#{appt.id}</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-bold text-gray-900 block font-['Cairo']">
                                                    {appt.patient?.name || 'مريض غير معروف'}
                                                </span>
                                                <span className="text-[11px] text-gray-400 font-mono" dir="ltr">
                                                    {appt.patient?.phone || '—'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {/* Clean Arabic Date and 12-hour Time */}
                                                <span className="font-bold text-gray-800 block text-xs">
                                                    {formatArabicDate(appt.appointment_date)}
                                                </span>
                                                <span className="text-[11px] text-gray-500 font-semibold inline-block mt-0.5">
                                                    {format12HourTime(appt.appointment_time)}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-medium text-gray-800 max-w-xs block truncate" title={appt.prescription?.diagnosis || 'كشف استشاري روتيني'}>
                                                    {appt.prescription?.diagnosis || 'كشف استشاري روتيني'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {appt.prescription ? (
                                                    <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 font-mono font-bold text-[11px] border border-teal-200">
                                                        {appt.prescription.prescription_code}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 font-mono">—</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {appt.payment_method === 'insurance' || (appt.fee_amount ?? 0) === 0 ? (
                                                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg text-[11px]">
                                                        تأمين معتمد
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-600 font-medium">دفع مباشر</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedConsultation(appt)}
                                                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#005ab5] hover:text-white text-gray-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>عرض التفاصيل</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                                            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                                            <span>لا توجد حالات كشف سابقة تطابق البحث.</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Consultation Details Modal Dialog */}
            {selectedConsultation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Tajawal']" dir="rtl">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative">
                        <button
                            type="button"
                            onClick={() => setSelectedConsultation(null)}
                            className="absolute top-4 left-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                                <Stethoscope className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-base text-gray-900 font-['Cairo']">
                                    تفاصيل الكشف الطبي
                                </h3>
                                <p className="text-xs text-gray-500">
                                    المريض: {selectedConsultation.patient?.name}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                                <div>
                                    <span className="text-gray-400 block text-[11px]">تاريخ الكشف:</span>
                                    <span className="font-bold text-gray-800">
                                        {formatArabicDate(selectedConsultation.appointment_date)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[11px]">وقت الموعد:</span>
                                    <span className="font-bold text-gray-800">
                                        {format12HourTime(selectedConsultation.appointment_time)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[11px]">رقم التذكرة:</span>
                                    <span className="font-mono font-bold text-[#005ab5]">
                                        #{selectedConsultation.queueTicket?.ticket_number || selectedConsultation.id}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[11px]">رمز الوصفة (RX):</span>
                                    <span className="font-mono font-bold text-teal-700">
                                        {selectedConsultation.prescription?.prescription_code || 'لم تصدر روشتة'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-gray-700 block mb-1">التشخيص الطبي:</label>
                                <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100 text-gray-800 leading-relaxed">
                                    {selectedConsultation.prescription?.diagnosis || 'كشف استشاري روتيني ومتابعة الحالة.'}
                                </div>
                            </div>

                            {selectedConsultation.prescription?.instructions && (
                                <div>
                                    <label className="font-bold text-gray-700 block mb-1">التعليمات والإرشادات الطبية:</label>
                                    <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 text-gray-800 leading-relaxed">
                                        {selectedConsultation.prescription.instructions}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedConsultation(null)}
                                className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs cursor-pointer shadow-xs"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DoctorDashboardLayout>
    );
}

