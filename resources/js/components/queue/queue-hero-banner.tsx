import React, { useState, useEffect, memo } from 'react';
import {
    Clock,
    QrCode,
    BellRing,
    Volume2,
    CalendarClock,
    Users,
    Stethoscope,
    Building2,
    Sparkles,
    CheckCircle2,
} from 'lucide-react';
import { playCallChime } from '@/lib/chime';
import { format12HourTime, formatDurationArabic } from '@/lib/utils';

export function formatDoctorName(name?: string): string {
    if (!name) return 'الطبيب المعالج';
    const trimmed = name.trim();
    if (trimmed.startsWith('د.') || trimmed.startsWith('د /') || trimmed.startsWith('دكتور')) {
        return trimmed;
    }
    return `د. ${trimmed}`;
}

export function formatRemainingArabic(minutes: number, isYourTurn: boolean): string {
    if (isYourTurn) {
        return 'حان دورك الآن! تفضل بالدخول للعيادة';
    }
    const mins = Math.max(0, Math.round(minutes));
    if (mins <= 0) {
        return 'أقل من دقيقة (على وشك المناداة)';
    }
    if (mins >= 13 && mins <= 16) {
        return `متبقي ربع ساعة (${mins} دقيقة)`;
    }
    if (mins >= 19 && mins <= 21) {
        return `متبقي ثلث ساعة (${mins} دقيقة)`;
    }
    if (mins >= 28 && mins <= 32) {
        return `متبقي نصف ساعة (${mins} دقيقة)`;
    }
    if (mins >= 43 && mins <= 47) {
        return `متبقي ساعة إلا ربع (${mins} دقيقة)`;
    }
    if (mins < 60) {
        return `متبقي ${mins} دقيقة على موعدك`;
    }

    const hours = Math.floor(mins / 60);
    const rem = mins % 60;

    let hoursText = '';
    if (hours === 1) hoursText = 'ساعة واحدة';
    else if (hours === 2) hoursText = 'ساعتين';
    else if (hours >= 3 && hours <= 10) hoursText = `${hours} ساعات`;
    else hoursText = `${hours} ساعة`;

    if (rem === 0) {
        return `متبقي ${hoursText} على موعدك`;
    }
    if (rem >= 13 && rem <= 16) {
        return `متبقي ${hoursText} وربع ساعة`;
    }
    if (rem >= 19 && rem <= 21) {
        return `متبقي ${hoursText} وثلث ساعة`;
    }
    if (rem >= 28 && rem <= 32) {
        return `متبقي ${hoursText} ونصف ساعة`;
    }
    return `متبقي ${hoursText} و ${rem} دقيقة`;
}

interface QueueHeroBannerProps {
    bookingReference: string;
    patientName: string;
    doctor: {
        title_ar: string;
        user: { name: string; avatar: string };
        specialty: { name_ar: string };
    };
    clinicName: string;
    ticketNumber: number;
    currentServingNumber: number;
    patientsAhead: number;
    estimatedWaitMinutes: number;
    minutesRemaining?: number;
    targetTimestampMs?: number;
    scheduledTime?: string;
    expectedTime?: string | null;
    delayMinutes?: number;
    delayReason?: string | null;
    serviceName?: string | null;
    durationMinutes?: number | null;
    isYourTurn: boolean;
    isStage2Done: boolean;
    onOpenCheckin: () => void;
}

export const QueueHeroBanner: React.FC<QueueHeroBannerProps> = memo(function QueueHeroBanner({
    bookingReference,
    patientName,
    doctor,
    clinicName,
    ticketNumber,
    currentServingNumber,
    patientsAhead,
    minutesRemaining = 15,
    targetTimestampMs,
    scheduledTime,
    expectedTime,
    delayMinutes = 0,
    delayReason,
    serviceName,
    durationMinutes,
    isYourTurn,
    isStage2Done,
    onOpenCheckin,
}) {
    const [liveMinsLeft, setLiveMinsLeft] = useState<number>(minutesRemaining);

    useEffect(() => {
        const updateCountdown = () => {
            if (isYourTurn) {
                setLiveMinsLeft(0);
                return;
            }
            if (targetTimestampMs && targetTimestampMs > Date.now()) {
                const diffMins = Math.max(1, Math.ceil((targetTimestampMs - Date.now()) / 60000));
                setLiveMinsLeft(diffMins);
            } else {
                setLiveMinsLeft(minutesRemaining);
            }
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 10000);
        return () => clearInterval(timer);
    }, [targetTimestampMs, minutesRemaining, isYourTurn]);

    const readableRemaining = formatRemainingArabic(liveMinsLeft, isYourTurn);
    const displayDocName = formatDoctorName(doctor.user.name);
    const cleanTime = expectedTime || (scheduledTime ? format12HourTime(scheduledTime) : 'اليوم');

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between h-full">
            {/* 1. Top Royal Blue / Emerald Digital Ticket Header */}
            <div
                className={`p-6 sm:p-7 text-white relative overflow-hidden transition-colors duration-300 ${
                    isYourTurn
                        ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800'
                        : 'bg-gradient-to-br from-[#005ab5] via-[#00478f] to-[#003366]'
                }`}
            >
                <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-20 -right-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />

                <div className="relative z-10 space-y-5">
                    {/* Top Row: Reference Pill & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold font-mono text-white">
                            #{bookingReference}
                        </span>

                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                isYourTurn
                                    ? 'bg-white text-emerald-900 shadow-sm animate-pulse font-black'
                                    : isStage2Done
                                      ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/30'
                                      : 'bg-white/15 text-blue-100 border border-white/20'
                            }`}
                        >
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    isYourTurn ? 'bg-emerald-600 animate-ping' : isStage2Done ? 'bg-emerald-400' : 'bg-sky-300'
                                }`}
                            />
                            <span>
                                {isYourTurn
                                    ? 'دورك الآن - ادخل للعيادة'
                                    : isStage2Done
                                      ? 'تم تأكيد حضورك بالاستقبال'
                                      : 'حجز مؤكد - بانتظار الحضور'}
                            </span>
                        </span>
                    </div>

                    {/* Center Ticket Display Box */}
                    <div className="p-5 rounded-2xl bg-white/10 border border-white/15 text-center space-y-1.5">
                        <span className="text-xs font-bold text-blue-100 block">
                            رقم تذكرتك في العيادة
                        </span>
                        <div className="text-5xl sm:text-6xl font-black font-['Cairo'] text-white tracking-tight font-mono py-1">
                            #{ticketNumber}
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-blue-100 font-['Cairo']">
                            {isYourTurn ? (
                                <span className="text-white inline-flex items-center justify-center gap-1.5">
                                    <BellRing className="w-4 h-4 shrink-0" />
                                    <span>حان دورك الآن! تفضل بالدخول لغرفة الفحص</span>
                                    <Stethoscope className="w-4 h-4 shrink-0" />
                                </span>
                            ) : patientsAhead === 0 ? (
                                <span className="text-sky-200">أنت المريض التالي مباشرة! استعد لمناداة الطبيب</span>
                            ) : (
                                <span>أنت في قائمة الانتظار • باقي {patientsAhead} مرضى قبل دورك</span>
                            )}
                        </p>
                    </div>

                    {/* 2 Mini Queue Counter Pills Inside Ticket */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] text-blue-100 block font-medium">يُفحص الآن بالعيادة</span>
                                <span className="text-xs font-bold text-emerald-300 mt-0.5 block">
                                    {isYourTurn ? 'أنت بالعيادة' : 'جلسة جارية'}
                                </span>
                            </div>
                            <span className="text-2xl font-black font-mono text-white">
                                #{currentServingNumber}
                            </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] text-blue-100 block font-medium">المرضى قبلك</span>
                                <span className="text-xs font-bold text-sky-200 mt-0.5 block">
                                    {isYourTurn ? 'دورك الآن' : patientsAhead === 0 ? 'أنت التالي' : 'في الانتظار'}
                                </span>
                            </div>
                            <span className="text-2xl font-black font-mono text-white">
                                {isYourTurn ? 0 : patientsAhead}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Clean White Body: Appointment Time, Live Remaining Countdown & Doctor Info */}
            <div className="p-6 space-y-5 flex-1 flex flex-col justify-between bg-white">
                <div className="space-y-4">
                    {/* Time & Remaining Countdown Box (High Contrast, Clean Colors) */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                <CalendarClock className="w-4 h-4 text-[#005ab5]" />
                                <span>{delayMinutes > 0 ? 'موعدك المحدّث بعد التمديد:' : 'وقت الكشف المحدد:'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {delayMinutes > 0 && scheduledTime && scheduledTime !== expectedTime && (
                                    <span className="text-xs text-slate-400 line-through font-mono">
                                        {scheduledTime}
                                    </span>
                                )}
                                <span className="px-3 py-1 rounded-xl bg-blue-50 text-[#005ab5] border border-blue-200/70 font-mono font-black text-xs sm:text-sm">
                                    {cleanTime}
                                </span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                <Clock className="w-4 h-4 text-emerald-600" />
                                <span>الوقت المتبقي للدخول:</span>
                            </div>
                            <span
                                className={`px-3 py-1 rounded-xl text-xs font-black font-['Cairo'] ${
                                    isYourTurn
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                                }`}
                            >
                                {readableRemaining}
                            </span>
                        </div>
                    </div>

                    {/* Doctor Delay Explanation if present */}
                    {delayMinutes > 0 && (
                        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-1">
                            <div className="font-black font-['Cairo'] flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>تم تمديد وقت الكشف (+{delayMinutes} دقيقة)</span>
                            </div>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                                {delayReason || 'تستدعي الحالة السريرية الحالية وقتاً إضافياً لتقديم الرعاية الطبية اللازمة.'}
                            </p>
                        </div>
                    )}

                    {/* Doctor & Facility Profile Card */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3.5">
                        <img
                            src={
                                doctor.user.avatar ||
                                'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=faces'
                            }
                            alt={displayDocName}
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-50 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-black text-slate-900 text-sm sm:text-base font-['Cairo'] truncate">
                                    {displayDocName}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold shrink-0">
                                    متواجد بالعيادة
                                </span>
                            </div>
                            <p className="text-xs text-[#005ab5] font-bold truncate mt-0.5">
                                {doctor.title_ar} • {doctor.specialty.name_ar}
                            </p>
                            {serviceName && (
                                <p className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 mt-1">
                                    <span>{serviceName}</span>
                                    {durationMinutes && (
                                        <span className="text-teal-600">
                                            • {formatDurationArabic(durationMinutes)}
                                        </span>
                                    )}
                                </p>
                            )}
                            <p className="text-[11px] text-slate-500 truncate mt-1 flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{clinicName}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Action: QR Check-in or Live Status Confirmation */}
                <div className="pt-4 border-t border-slate-100">
                    {!isStage2Done && !isYourTurn ? (
                        <button
                            type="button"
                            onClick={onOpenCheckin}
                            className="w-full py-3.5 px-5 rounded-2xl bg-[#005ab5] hover:bg-[#00478f] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                            <QrCode className="w-4 h-4" />
                            <span>وصلت للمستشفى؟ امسح كود QR لتأكيد الحضور</span>
                        </button>
                    ) : (
                        <div className="w-full py-3 px-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                                {isYourTurn
                                    ? 'تذكرتك قيد الفحص الآن داخل العيادة'
                                    : 'تم تأكيد حضورك بالاستقبال (المرحلة 2 مكتملة)'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
QueueHeroBanner.displayName = 'QueueHeroBanner';
