import React from 'react';
import { Sun, Moon, Check, Clock, AlertCircle, Loader2, CheckCircle2, Ban, AlertTriangle } from 'lucide-react';
import { cn, formatDurationArabic, minutesToArabicTime, timeToMinutes } from '@/lib/utils';
import { MORNING_SLOTS, EVENING_SLOTS, BookedInterval, getSlotAvailability } from './types';

interface BookingTimeSelectorProps {
    stepNumber?: number;
    badgeIcon?: React.ReactNode;
    selectedTimeSlot: string;
    onSelectTime: (slot: string) => void;
    timePeriod: 'all' | 'morning' | 'evening';
    setTimePeriod: (period: 'all' | 'morning' | 'evening') => void;
    selectedDurationMinutes: number;
    bookedIntervals: BookedInterval[];
    autoConfirmLimit: number;
    waitlistLimit: number;
    loadingSlots?: boolean;
    error?: string;
}

export const BookingTimeSelector: React.FC<BookingTimeSelectorProps> = React.memo(({
    stepNumber = 3,
    badgeIcon,
    selectedTimeSlot,
    onSelectTime,
    timePeriod,
    setTimePeriod,
    selectedDurationMinutes,
    bookedIntervals,
    autoConfirmLimit,
    waitlistLimit,
    loadingSlots = false,
    error,
}) => {
    const startMinutes = selectedTimeSlot ? timeToMinutes(selectedTimeSlot) : null;
    const endTimeFormatted =
        startMinutes !== null ? minutesToArabicTime(startMinutes + selectedDurationMinutes) : null;

    const visibleMorning = timePeriod === 'all' || timePeriod === 'morning';
    const visibleEvening = timePeriod === 'all' || timePeriod === 'evening';

    const visibleSlots = [
        ...(visibleMorning ? MORNING_SLOTS : []),
        ...(visibleEvening ? EVENING_SLOTS : []),
    ];

    const hasAnyBookable = visibleSlots.some(
        (slot) =>
            getSlotAvailability(
                slot,
                selectedDurationMinutes,
                bookedIntervals,
                autoConfirmLimit,
                waitlistLimit
            ).status !== 'full'
    );

    const selectedInfo = selectedTimeSlot
        ? getSlotAvailability(
              selectedTimeSlot,
              selectedDurationMinutes,
              bookedIntervals,
              autoConfirmLimit,
              waitlistLimit
          )
        : null;

    const renderSlotButton = (slot: string) => {
        const info = getSlotAvailability(
            slot,
            selectedDurationMinutes,
            bookedIntervals,
            autoConfirmLimit,
            waitlistLimit
        );
        const isFull = info.status === 'full';
        const isWaitlist = info.status === 'waitlist';
        const isSelected = !isFull && selectedTimeSlot === slot;

        return (
            <button
                key={slot}
                type="button"
                disabled={isFull}
                onClick={() => onSelectTime(slot)}
                title={
                    isFull
                        ? `مكتمل (${info.bookedCount}/${info.totalCapacity}) — لا يمكن الحجز`
                        : isWaitlist
                          ? `يوجد ${info.bookedCount} حجز في نفس الموعد (قائمة انتظار — يحتاج تأكيد)`
                          : `متاح للتأكيد الفوري (${slot})`
                }
                className={cn(
                    'py-2 px-2 rounded-2xl border text-xs font-bold transition-all select-none flex flex-col items-center justify-center gap-0.5 min-h-[54px]',
                    isFull
                        ? 'bg-red-50 border-red-200 text-red-700 cursor-not-allowed opacity-90'
                        : isWaitlist
                          ? isSelected
                              ? 'bg-amber-500 border-amber-600 text-white shadow-sm ring-2 ring-amber-400/30 cursor-pointer'
                              : 'bg-amber-50 hover:bg-amber-100 border-amber-300 hover:border-amber-500 text-amber-950 cursor-pointer'
                          : isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20 cursor-pointer'
                            : 'bg-white border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400 text-gray-900 cursor-pointer'
                )}
            >
                <div className="flex items-center gap-1 font-mono leading-none">
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                    <span className={cn(isFull && 'line-through')}>{slot}</span>
                </div>

                {isFull ? (
                    <span className="text-[9.5px] font-['Tajawal'] font-bold text-red-700">
                        مكتمل ({info.bookedCount}/{info.totalCapacity})
                    </span>
                ) : isWaitlist ? (
                    <span
                        className={cn(
                            "text-[9.5px] font-['Tajawal'] font-bold",
                            isSelected ? 'text-amber-50' : 'text-amber-800'
                        )}
                    >
                        في الموعد ({info.bookedCount}) • انتظار
                    </span>
                ) : (
                    <span
                        className={cn(
                            "text-[9.5px] font-['Tajawal'] font-bold",
                            isSelected ? 'text-emerald-100' : 'text-emerald-700'
                        )}
                    >
                        {info.bookedCount > 0
                            ? `متاح (${info.bookedCount}/${autoConfirmLimit})`
                            : 'تأكيد فوري'}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div className="bg-gray-50/70 p-4 sm:p-5 rounded-3xl border border-gray-200/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#005ab5] flex items-center justify-center font-black text-xs font-['Cairo'] shadow-xs">
                        {badgeIcon ?? stepNumber}
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 font-['Cairo']">
                            اختر وقت الكشف المناسب
                        </h4>
                        <p className="text-[11px] text-gray-500">
                            مواعيد دقيقة تتوافق مع مدة الإجراء ({formatDurationArabic(selectedDurationMinutes)})
                        </p>
                    </div>
                </div>

                {/* Period Filter Tabs */}
                <div className="flex items-center bg-gray-200/70 p-1 rounded-2xl text-[11px] font-bold">
                    <button
                        type="button"
                        onClick={() => setTimePeriod('all')}
                        className={cn(
                            'px-3 py-1 rounded-xl transition-all cursor-pointer select-none',
                            timePeriod === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                        )}
                    >
                        الكل
                    </button>
                    <button
                        type="button"
                        onClick={() => setTimePeriod('morning')}
                        className={cn(
                            'px-3 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer select-none',
                            timePeriod === 'morning' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                        )}
                    >
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span>صباحاً</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTimePeriod('evening')}
                        className={cn(
                            'px-3 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer select-none',
                            timePeriod === 'evening' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                        )}
                    >
                        <Moon className="w-3 h-3 text-indigo-500" />
                        <span>مساءً</span>
                    </button>
                </div>
            </div>

            {/* 3-Color Availability Legend */}
            <div className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-2xl bg-white border border-gray-200/70 text-[11px] font-bold">
                <span className="inline-flex items-center gap-1.5 text-emerald-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>متاح (تأكيد فوري)</span>
                </span>
                {waitlistLimit > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-amber-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                        <span>يوجد حجز (قائمة انتظار — يحتاج تأكيد)</span>
                    </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-red-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                    <span>مكتمل (لا يمكن الحجز)</span>
                </span>
            </div>

            {/* Live Duration Window Preview */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-white border border-blue-100 text-xs">
                <div className="flex items-center gap-2 text-gray-700 font-bold">
                    <Clock className="w-3.5 h-3.5 text-[#005ab5] shrink-0" />
                    {selectedTimeSlot && endTimeFormatted ? (
                        <span>
                            نطاق الجلسة:{' '}
                            <span className="font-mono text-[#005ab5]">
                                {selectedTimeSlot} ← {endTimeFormatted}
                            </span>
                        </span>
                    ) : (
                        <span className="text-red-700">لا توجد مواعيد متاحة في هذه الفترة</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {loadingSlots && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>جاري فحص التوفر...</span>
                        </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#005ab5] font-bold text-[11px] border border-blue-200/70">
                        {formatDurationArabic(selectedDurationMinutes)}
                    </span>
                </div>
            </div>

            {/* Selected Slot Contextual Status Banner */}
            {selectedInfo && selectedInfo.status === 'available' && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-bold flex items-start gap-2 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                        <span>
                            تأكيد فوري مباشر: سيتم تأكيد حجزك فوراً دون انتظار موافقة الإدارة أو الاستقبال.
                        </span>
                        {selectedInfo.bookedCount > 0 && (
                            <span className="block text-[11px] font-semibold text-emerald-800 mt-0.5">
                                يوجد حالياً ({selectedInfo.bookedCount}) حجز في هذا الموعد، ويتبقى ({selectedInfo.remainingAutoConfirm}) مقعد للتأكيد الفوري.
                            </span>
                        )}
                    </div>
                </div>
            )}

            {selectedInfo && selectedInfo.status === 'waitlist' && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-start gap-2 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                        <span>
                            يوجد حالياً ({selectedInfo.bookedCount}) حجز في هذا الموعد — يمكنك الحجز الآن على قائمة الانتظار (متبقي {selectedInfo.remainingWaitlist} مقعد انتظار)، وسيتم التواصل معك وتأكيد الموعد من العيادة.
                        </span>
                    </div>
                </div>
            )}

            {!loadingSlots && !hasAnyBookable && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                    <Ban className="w-4 h-4 shrink-0 text-red-600" />
                    <span>
                        جميع المواعيد في هذه الفترة مكتملة تماماً. يرجى تبديل الفترة (صباحاً / مساءً) أو اختيار يوم آخر.
                    </span>
                </div>
            )}

            {/* Morning Slots */}
            {visibleMorning && (
                <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>الفترة الصباحية:</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {MORNING_SLOTS.map(renderSlotButton)}
                    </div>
                </div>
            )}

            {/* Evening Slots */}
            {visibleEvening && (
                <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>الفترة المسائية:</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {EVENING_SLOTS.map(renderSlotButton)}
                    </div>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 pt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
});
BookingTimeSelector.displayName = 'BookingTimeSelector';
