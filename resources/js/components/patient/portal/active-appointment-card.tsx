import React from 'react';
import { Link } from '@inertiajs/react';
import {
    Building2,
    Clock,
    CheckCircle2,
    Stethoscope,
    FileText,
    QrCode,
    ArrowUpRight,
} from 'lucide-react';
import { cn, format12HourTime } from '@/lib/utils';
import { formatRemainingArabic } from '@/components/queue/queue-hero-banner';

interface ActiveAppointmentCardProps {
    activeAppt: any;
    clinicLoc: {
        name: string;
        district?: string;
        city?: string;
    };
    liveQueueData: {
        ticketNumber: number | null;
        currentServingNumber: number | null;
        patientsAhead: number;
        estimatedWaitMinutes: number;
        delayMinutes: number;
        delayReason: string | null;
        status: string;
        isCalled: boolean;
        minutesRemaining: number | null;
        expectedTime: string | null;
    } | null;
    onOpenCheckin: () => void;
    onOpenTicketQr: () => void;
}

export const ActiveAppointmentCard: React.FC<ActiveAppointmentCardProps> = React.memo(({
    activeAppt,
    clinicLoc,
    liveQueueData,
    onOpenCheckin,
    onOpenTicketQr,
}) => {
    const isStage1Done = activeAppt.status !== 'booked';
    const isStage2Done = ['waiting', 'in_consultation', 'completed'].includes(activeAppt.status);
    const isStage3Done = activeAppt.status === 'in_consultation' || activeAppt.status === 'completed';
    const isStage4Done = activeAppt.status === 'completed';

    return (
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs flex flex-col justify-between space-y-6">
            <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold text-gray-900 font-['Cairo']">
                            موعدك النشط اليوم
                        </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-gray-100 font-mono text-[11px] font-bold text-gray-600">
                        #{activeAppt.booking_reference}
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-100/70">
                    <div className="flex items-center gap-3.5">
                        <img
                            src={
                                activeAppt.doctor.user.avatar ||
                                'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=160&h=160&fit=crop&crop=faces'
                            }
                            alt={activeAppt.doctor.user.name}
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow-xs"
                        />
                        <div>
                            <h3 className="font-black text-gray-900 text-sm sm:text-base font-['Cairo']">
                                {activeAppt.doctor.user.name}
                            </h3>
                            <p className="text-xs text-[#005ab5] font-semibold mt-0.5">
                                {activeAppt.doctor.specialty?.name_ar} • {activeAppt.doctor.title_ar}
                            </p>
                            {clinicLoc.name && (
                                <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span>
                                        {clinicLoc.name}
                                        {clinicLoc.district || clinicLoc.city
                                            ? ` (${clinicLoc.district || clinicLoc.city})`
                                            : ''}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="sm:text-left self-end sm:self-auto bg-white px-3.5 py-2 rounded-xl border border-blue-200/70 shadow-2xs space-y-1">
                        <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-[10px] text-gray-400 font-bold">الموعد:</span>
                            <span className="text-xs font-black text-[#005ab5] font-mono">
                                {liveQueueData?.expectedTime || format12HourTime(activeAppt.appointment_time)}
                            </span>
                        </div>
                        {liveQueueData?.minutesRemaining !== undefined && liveQueueData?.minutesRemaining !== null && (
                            <div className="flex items-center gap-1 justify-end text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{formatRemainingArabic(liveQueueData.minutesRemaining, Boolean(liveQueueData.isCalled))}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-[#003875] via-[#005ab5] to-[#0070e0] text-white shadow-md relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-right">
                            <span className="text-xs text-blue-100 font-bold block mb-1">
                                رقم تذكرتك في العيادة
                            </span>
                            <div className="text-4xl sm:text-5xl font-black font-['Cairo'] tracking-wider text-amber-300 drop-shadow-sm font-mono">
                                #{liveQueueData?.ticketNumber || activeAppt.queueTicket?.ticket_number || '01'}
                            </div>
                        </div>

                        <div className="flex-1 sm:max-w-xs text-center sm:text-right bg-white/10 p-3.5 rounded-xl backdrop-blur-xs border border-white/15">
                            <div className="text-xs font-bold leading-relaxed">
                                {activeAppt.status === 'in_consultation' ? (
                                    <span className="text-emerald-300 flex items-center gap-1.5 justify-center sm:justify-start">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                        <span>🎉 حان دورك الآن! تفضل بالدخول للطبيب</span>
                                    </span>
                                ) : activeAppt.status === 'waiting' ? (
                                    <span className="text-amber-200">
                                        أنت في صالة الانتظار • باقي{' '}
                                        <strong className="underline text-white font-mono text-sm">
                                            {liveQueueData?.patientsAhead ?? activeAppt.people_ahead ?? 0}
                                        </strong>{' '}
                                        مرضى قبل دورك
                                    </span>
                                ) : (
                                    <span className="text-blue-100">
                                        موعدك مؤكد اليوم • بانتظار إثبات وصولك بالاستقبال
                                    </span>
                                )}
                            </div>
                            <div className="text-[11px] text-blue-200 mt-1">
                                يرجى التواجد بالقرب من العيادة للاستماع إلى النداء الآلي
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-500 block mb-3 font-['Cairo']">
                        مسار رحلة الموعد الحي بالمنشأة:
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div
                            className={cn(
                                'p-2.5 rounded-2xl border transition-all',
                                isStage1Done
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                                    : 'bg-gray-50 border-gray-200 text-gray-500'
                            )}
                        >
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <CheckCircle2
                                    className={cn('w-3.5 h-3.5', isStage1Done ? 'text-emerald-600' : 'text-gray-400')}
                                />
                                <span className="text-[11px]">المرحلة 1</span>
                            </div>
                            <span className="text-[10px] block">تأكيد الحجز</span>
                        </div>

                        <div
                            className={cn(
                                'p-2.5 rounded-2xl border transition-all',
                                isStage2Done
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                                    : isStage1Done
                                      ? 'bg-amber-50 border-amber-200 text-amber-800 font-bold'
                                      : 'bg-gray-50 border-gray-200 text-gray-400'
                            )}
                        >
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <CheckCircle2
                                    className={cn('w-3.5 h-3.5', isStage2Done ? 'text-emerald-600' : 'text-amber-500')}
                                />
                                <span className="text-[11px]">المرحلة 2</span>
                            </div>
                            <span className="text-[10px] block">إثبات الحضور</span>
                        </div>

                        <div
                            className={cn(
                                'p-2.5 rounded-2xl border transition-all',
                                isStage3Done
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                                    : isStage2Done
                                      ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold'
                                      : 'bg-gray-50 border-gray-200 text-gray-400'
                            )}
                        >
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Stethoscope
                                    className={cn('w-3.5 h-3.5', isStage3Done ? 'text-emerald-600' : 'text-blue-500')}
                                />
                                <span className="text-[11px]">المرحلة 3</span>
                            </div>
                            <span className="text-[10px] block">جلسة الكشف</span>
                        </div>

                        <div
                            className={cn(
                                'p-2.5 rounded-2xl border transition-all',
                                isStage4Done
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                                    : 'bg-gray-50 border-gray-200 text-gray-400'
                            )}
                        >
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <FileText
                                    className={cn('w-3.5 h-3.5', isStage4Done ? 'text-emerald-600' : 'text-gray-400')}
                                />
                                <span className="text-[11px]">المرحلة 4</span>
                            </div>
                            <span className="text-[10px] block">التقرير والروشتة</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
                {!isStage2Done ? (
                    <button
                        type="button"
                        onClick={onOpenCheckin}
                        className="flex-1 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:-translate-y-0.5"
                    >
                        <QrCode className="w-4 h-4 text-gray-950" />
                        <span>وصلت العيادة؟ مسح QR لتأكيد الحضور فوراً</span>
                    </button>
                ) : (
                    <div className="flex-1 w-full flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>تم إثبات وصولك بالاستقبال (مكتمل)</span>
                        </span>
                        <button
                            type="button"
                            onClick={onOpenTicketQr}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>عرض باركود تذكرتي</span>
                        </button>
                    </div>
                )}

                <Link
                    href={`/queue/${activeAppt.booking_reference}`}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-[#005ab5] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="فتح شاشة الطابور الحي المباشر"
                >
                    <span>شاشة الطابور الحي</span>
                    <ArrowUpRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
});
ActiveAppointmentCard.displayName = 'ActiveAppointmentCard';
