import React from 'react';
import {
    Clock,
    Check,
    CreditCard,
    ShieldCheck,
    UserCheck,
    ExternalLink,
    Calendar,
    FileText,
} from 'lucide-react';
import { cn, format12HourTime, formatDurationArabic } from '@/lib/utils';
import { StatusSelect } from '@/components/common/status-select';
import { ConfirmationStagesBadge } from '@/components/common/confirmation-stages-badge';
import { ReceptionAppointment } from './types';

interface ReceptionQueueRowProps {
    appt: ReceptionAppointment;
    isLoading: boolean;
    onStatusChange: (appointmentId: number, newStatus: string) => void;
    onConfirmBooking: (appointmentId: number) => void;
    onCheckIn: (appointmentId: number) => void;
    onOpenPayment: (appt: ReceptionAppointment) => void;
}

const ReceptionQueueRow: React.FC<ReceptionQueueRowProps> = React.memo(({
    appt,
    isLoading,
    onStatusChange,
    onConfirmBooking,
    onCheckIn,
    onOpenPayment,
}) => {
    const isWaiting = appt.status === 'waiting';
    const isInConsultation = appt.status === 'in_consultation';

    return (
        <tr
            className={cn(
                'hover:bg-blue-50/40 transition-colors',
                isInConsultation && 'bg-emerald-50/25',
                isWaiting && 'bg-amber-50/20'
            )}
        >
            <td className="py-3.5 px-4">
                <div className="flex items-center gap-2.5">
                    {appt.queueTicket ? (
                        <span className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200 text-[#005ab5] font-black text-sm flex items-center justify-center font-mono shadow-2xs shrink-0">
                            #{appt.queueTicket.ticket_number}
                        </span>
                    ) : (
                        <span className="w-9 h-9 rounded-2xl bg-gray-100 border border-gray-200 text-gray-400 font-bold text-xs flex items-center justify-center shrink-0">
                            —
                        </span>
                    )}
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold font-mono text-gray-900 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                            {format12HourTime(appt.appointment_time)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {appt.booking_reference}
                        </span>
                    </div>
                </div>
            </td>

            <td className="py-3.5 px-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 text-[#005ab5] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {appt.patient.name ? appt.patient.name[0] : 'م'}
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-gray-900 text-xs truncate max-w-[140px]">
                            {appt.patient.name}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5" dir="ltr">
                            {appt.patient.phone}
                        </div>
                    </div>
                </div>
            </td>

            <td className="py-3.5 px-4">
                <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-xs truncate max-w-[140px]">
                        {appt.doctor.user.name}
                    </div>
                    <div className="text-[11px] text-purple-700 font-medium truncate max-w-[140px] mt-0.5">
                        {appt.doctor.specialty?.name_ar || appt.doctor.title_ar}
                    </div>
                    {appt.service_name && (
                        <div className="text-[10px] font-bold text-teal-700 truncate max-w-[160px] mt-0.5">
                            {appt.service_name}
                            {appt.duration_minutes ? ` • ${formatDurationArabic(appt.duration_minutes, true)}` : ''}
                        </div>
                    )}
                </div>
            </td>

            <td className="py-3.5 px-4 text-center">
                <ConfirmationStagesBadge
                    stages={appt.confirmation_stages}
                    status={appt.status}
                    compact={true}
                />
            </td>

            <td className="py-3.5 px-4">
                <div className="w-40">
                    <StatusSelect
                        value={appt.status}
                        onChange={(newStatus) => onStatusChange(appt.id, newStatus)}
                        disabled={isLoading}
                    />
                </div>
            </td>

            <td className="py-3.5 px-4">
                {appt.payment_status === 'paid' ? (
                    <div className="space-y-1">
                        <button
                            type="button"
                            onClick={() => onOpenPayment(appt)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                            title="اضغط لتعديل السداد أو إيصال التحصيل"
                        >
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                                {appt.payment_method === 'insurance'
                                    ? 'تأمين (مغطى)'
                                    : appt.payment_method === 'pos'
                                      ? 'مدى (Mada)'
                                      : appt.payment_method === 'card'
                                        ? 'بطاقة ائتمانية'
                                        : 'نقداً'}
                            </span>
                            <span className="font-mono text-emerald-950 font-black mr-0.5">
                                {appt.total_amount} ر.س
                            </span>
                        </button>
                        {appt.payment_notes && (
                            <p
                                className="text-[10px] text-gray-500 font-medium flex items-center gap-1 max-w-[150px]"
                                title={appt.payment_notes}
                            >
                                <FileText className="w-3 h-3 text-gray-400 shrink-0" />
                                <span className="truncate">{appt.payment_notes}</span>
                            </p>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => onOpenPayment(appt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                    >
                        <CreditCard className="w-3.5 h-3.5 shrink-0" />
                        <span>تحصيل ({appt.total_amount || 200} ر.س)</span>
                    </button>
                )}
            </td>

            <td className="py-3.5 px-4 text-center">
                <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                    {appt.status === 'booked' && (
                        <button
                            type="button"
                            onClick={() => onConfirmBooking(appt.id)}
                            disabled={isLoading}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                            title="المرحلة 1: اعتماد وتأكيد الحجز"
                        >
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>تأكيد الحجز</span>
                        </button>
                    )}

                    {appt.status === 'confirmed' && (
                        <button
                            type="button"
                            onClick={() => onCheckIn(appt.id)}
                            disabled={isLoading}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
                            title="المرحلة 2: تأكيد وصول المريض بالاستقبال"
                        >
                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>تسجيل وصول</span>
                        </button>
                    )}

                    <a
                        href={`/queue/${appt.booking_reference}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-xl bg-gray-100/80 hover:bg-blue-50 text-gray-500 hover:text-[#005ab5] flex items-center justify-center transition-colors"
                        title="شاشة تتبع الطابور الحي للمريض"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </td>
        </tr>
    );
});
ReceptionQueueRow.displayName = 'ReceptionQueueRow';

interface ReceptionQueueTableProps {
    appointments: ReceptionAppointment[];
    actionLoadingId: number | null;
    onStatusChange: (appointmentId: number, newStatus: string) => void;
    onConfirmBooking: (appointmentId: number) => void;
    onCheckIn: (appointmentId: number) => void;
    onOpenPayment: (appt: ReceptionAppointment) => void;
}

export const ReceptionQueueTable: React.FC<ReceptionQueueTableProps> = React.memo(({
    appointments,
    actionLoadingId,
    onStatusChange,
    onConfirmBooking,
    onCheckIn,
    onOpenPayment,
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
                <thead className="bg-gray-50/90 text-gray-600 font-bold border-b border-gray-200/80">
                    <tr>
                        <th className="py-3.5 px-4 font-['Cairo']">التذكرة والوقت</th>
                        <th className="py-3.5 px-4 font-['Cairo']">بيانات المريض</th>
                        <th className="py-3.5 px-4 font-['Cairo']">الطبيب المعالج</th>
                        <th className="py-3.5 px-4 font-['Cairo'] text-center">مسار التأكيد</th>
                        <th className="py-3.5 px-4 font-['Cairo']">حالة الحضور</th>
                        <th className="py-3.5 px-4 font-['Cairo']">الرسوم والسداد</th>
                        <th className="py-3.5 px-4 font-['Cairo'] text-center">الإجراء</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {appointments.length > 0 ? (
                        appointments.map((appt) => (
                            <ReceptionQueueRow
                                key={appt.id}
                                appt={appt}
                                isLoading={actionLoadingId === appt.id}
                                onStatusChange={onStatusChange}
                                onConfirmBooking={onConfirmBooking}
                                onCheckIn={onCheckIn}
                                onOpenPayment={onOpenPayment}
                            />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="py-14 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <p className="font-bold text-gray-600 text-sm">لا توجد مواعيد مطابقة لخيارات البحث</p>
                                    <p className="text-xs text-gray-400">يرجى تعديل مصطلحات البحث أو تغيير فلاتر التاريخ والطبيب</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
});
ReceptionQueueTable.displayName = 'ReceptionQueueTable';
