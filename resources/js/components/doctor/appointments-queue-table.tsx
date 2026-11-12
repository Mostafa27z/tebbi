import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { 
    Calendar, 
    UserCheck, 
    Clock, 
    CheckCircle2, 
    Play, 
    Stethoscope, 
    AlertCircle, 
    ExternalLink, 
    Search, 
    X,
    Filter
} from 'lucide-react';
import { CustomSelect, CustomSelectOption } from '@/components/common/custom-select';
import { format12HourTime } from '@/lib/utils';

interface AppointmentsQueueTableProps {
    appointments: any[];
    onOpenPrescriptionModal?: (appointment: any) => void;
}

export const AppointmentsQueueTable: React.FC<AppointmentsQueueTableProps> = ({
    appointments,
    onOpenPrescriptionModal,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loadingId, setLoadingId] = useState<number | null>(null);

    // Counts for options
    const waitingCount = useMemo(() => appointments.filter((a) => a.status === 'waiting').length, [appointments]);
    const inConsultationCount = useMemo(() => appointments.filter((a) => a.status === 'in_consultation').length, [appointments]);
    const confirmedCount = useMemo(() => appointments.filter((a) => a.status === 'confirmed').length, [appointments]);
    const completedCount = useMemo(() => appointments.filter((a) => a.status === 'completed').length, [appointments]);

    const filterOptions: CustomSelectOption[] = [
        { value: 'all', label: `جميع الحالات (${appointments.length})` },
        { value: 'waiting', label: `في صالة الانتظار (${waitingCount})` },
        { value: 'in_consultation', label: `داخل العيادة معك (${inConsultationCount})` },
        { value: 'confirmed', label: `لم يحضروا بعد (${confirmedCount})` },
        { value: 'completed', label: `كشوفات مكتملة (${completedCount})` },
    ];

    const filtered = useMemo(() => {
        return appointments.filter((a) => {
            // Status match
            if (statusFilter !== 'all' && a.status !== statusFilter) {
                return false;
            }

            // Search query match (patient name, phone, ticket number, booking reference)
            if (searchQuery.trim()) {
                const query = searchQuery.trim().toLowerCase();
                const name = (a.patient?.name || '').toLowerCase();
                const phone = (a.patient?.phone || '').toLowerCase();
                const ticket = String(a.queueTicket?.ticket_number || a.id || '');
                const bookingRef = (a.booking_reference || '').toLowerCase();

                if (!name.includes(query) && !phone.includes(query) && !ticket.includes(query) && !bookingRef.includes(query)) {
                    return false;
                }
            }

            return true;
        });
    }, [appointments, statusFilter, searchQuery]);

    const handleStartConsultation = (appointmentId: number) => {
        setLoadingId(appointmentId);
        router.post(`/doctor/appointments/${appointmentId}/start`, {}, {
            onFinish: () => setLoadingId(null),
        });
    };

    const handleQuickComplete = (appointmentId: number) => {
        setLoadingId(appointmentId);
        router.post(`/doctor/appointments/${appointmentId}/complete`, {}, {
            onFinish: () => setLoadingId(null),
        });
    };

    return (
        <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs font-['Tajawal']" dir="rtl">
            {/* Header & Controls Toolbar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="font-bold text-gray-900 text-base font-['Cairo'] flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#005ab5]" />
                        <span>قائمة مواعيد ومرضى العيادة لليوم</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        الترتيب بحسب الحضور بالاستقبال ووقت الحجز المعتمد
                    </p>
                </div>

                {/* Search & Custom Select Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-72">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="بحث بالاسم، الجوال، التذكرة..."
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

                    {/* Status Select */}
                    <div className="w-full sm:w-56">
                        <CustomSelect
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(String(val))}
                            options={filterOptions}
                            icon={<Filter className="w-3.5 h-3.5 text-gray-400" />}
                            size="md"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                    <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-semibold bg-gray-50/50">
                            <th className="py-3 px-3">رقم التذكرة</th>
                            <th className="py-3 px-3">بيانات المريض</th>
                            <th className="py-3 px-3">وقت الموعد</th>
                            <th className="py-3 px-3">حالة الاستقبال والانتظار</th>
                            <th className="py-3 px-3">نوع التغطية</th>
                            <th className="py-3 px-3 text-center">إجراءات الطبيب</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.length > 0 ? (
                            filtered.map((appt) => {
                                const isWaiting = appt.status === 'waiting';
                                const isInConsultation = appt.status === 'in_consultation';
                                const isCompleted = appt.status === 'completed';
                                const isConfirmed = appt.status === 'confirmed';
                                const isLoading = loadingId === appt.id;

                                return (
                                    <tr key={appt.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-3.5 px-3">
                                            {appt.queueTicket ? (
                                                <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-[#005ab5] font-black text-xs font-mono">
                                                    #{appt.queueTicket.ticket_number}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 font-mono">#{appt.id}</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <span className="font-bold text-gray-900 block text-xs">
                                                {appt.patient?.name || 'مريض غير معروف'}
                                            </span>
                                            <span className="text-[11px] text-gray-400 font-mono" dir="ltr">
                                                {appt.patient?.phone || '—'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-3 font-semibold text-gray-700">
                                            <span className="px-2.5 py-1 rounded-lg bg-gray-100/70 text-gray-700 font-bold inline-block text-[11px]">
                                                {format12HourTime(appt.appointment_time)}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-3">
                                            {isWaiting && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                    حضر بالاستقبال (ينتظر بالخارج)
                                                </span>
                                            )}
                                            {isInConsultation && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                                    داخل العيادة معك الآن
                                                </span>
                                            )}
                                            {isConfirmed && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    لم يحضر للاستقبال بعد
                                                </span>
                                            )}
                                            {isCompleted && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#005ab5]">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#005ab5]" />
                                                    تم إنهاء الكشف
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-3">
                                            {appt.payment_method === 'insurance' || (appt.fee_amount ?? 0) === 0 ? (
                                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg text-[11px]">
                                                    تأمين معتمد (مغطى)
                                                </span>
                                            ) : (
                                                <span className="text-gray-600 font-medium">دفع نقدي / إلكتروني</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {isWaiting && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartConsultation(appt.id)}
                                                        disabled={isLoading}
                                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                                    >
                                                        <Play className="w-3.5 h-3.5" />
                                                        <span>بدء الكشف</span>
                                                    </button>
                                                )}
                                                {isInConsultation && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (onOpenPrescriptionModal) {
                                                                onOpenPrescriptionModal(appt);
                                                            } else {
                                                                handleQuickComplete(appt.id);
                                                            }
                                                        }}
                                                        disabled={isLoading}
                                                        className="px-3 py-1.5 rounded-xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                                    >
                                                        <Stethoscope className="w-3.5 h-3.5" />
                                                        <span>إنهاء وإصدار وصفة</span>
                                                    </button>
                                                )}
                                                {isCompleted && appt.prescription && (
                                                    <span className="text-gray-500 text-[11px] font-mono font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                                                        {appt.prescription.prescription_code}
                                                    </span>
                                                )}
                                                <a
                                                    href={`/queue/${appt.booking_reference}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#005ab5] hover:bg-blue-50 transition-colors"
                                                    title="عرض شاشة التتبع الحي"
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
                                <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                                    <span>لا توجد مواعيد تطابق الفلتر أو البحث المحدد.</span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
