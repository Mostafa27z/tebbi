import React, { memo } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { LoadingButton } from '@/components/common/loading-button';
import { formatDurationArabic } from '@/lib/utils';
import type { SlotAvailabilityStatus } from './types';
import type { BookingStep } from './booking-stepper';

interface BookingFooterProps {
    currentStep: BookingStep;
    totalSteps?: number;
    onPrevStep: () => void;
    onNextStep: () => void;
    canProceed?: boolean;
    loadingSlots?: boolean;
    isInsurance: boolean;
    totalAmount: number;
    selectedServiceName?: string;
    selectedDurationMinutes?: number;
    slotStatus?: SlotAvailabilityStatus;
    submitting: boolean;
    onClose: () => void;
    formId: string;
}

export const BookingFooter: React.FC<BookingFooterProps> = memo(function BookingFooter({
    currentStep,
    totalSteps = 3,
    onPrevStep,
    onNextStep,
    canProceed = true,
    loadingSlots = false,
    isInsurance,
    totalAmount,
    selectedServiceName,
    selectedDurationMinutes,
    slotStatus = 'available',
    submitting,
    onClose,
    formId,
}) {
    const isWaitlist = slotStatus === 'waitlist';

    return (
        <div className="shrink-0 bg-white border-t border-gray-150 px-5 py-4 sm:px-7 sm:py-4.5 flex items-center justify-between gap-4 z-20">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10.5px] text-gray-500 font-bold font-['Cairo']">
                        المبلغ النهائي المستحق
                    </span>
                    {selectedServiceName && (
                        <span className="text-[10px] font-bold text-[#005ab5] bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-full truncate max-w-[180px]">
                            {selectedServiceName}
                            {selectedDurationMinutes ? ` (${formatDurationArabic(selectedDurationMinutes, true)})` : ''}
                        </span>
                    )}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-black text-xl sm:text-2xl text-[#005ab5] font-['Cairo']">
                        {isInsurance ? '0.00 ر.س' : `${totalAmount.toFixed(2)} ر.س`}
                    </span>
                    {isInsurance && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>مغطى بالكامل</span>
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                {currentStep === 1 ? (
                    <>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer select-none border border-gray-200/60"
                        >
                            إلغاء
                        </button>
                        <button
                            type="button"
                            onClick={onNextStep}
                            className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-[#005ab5] hover:bg-[#00478f] text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer select-none inline-flex items-center gap-2 font-['Cairo']"
                        >
                            <span>التالي: اختيار الموعد</span>
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    </>
                ) : currentStep < totalSteps ? (
                    <>
                        <button
                            type="button"
                            onClick={onPrevStep}
                            className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer select-none border border-gray-200/60 inline-flex items-center gap-1.5"
                        >
                            <ArrowRight className="w-4 h-4" />
                            <span>السابق</span>
                        </button>
                        <button
                            type="button"
                            disabled={!canProceed || loadingSlots}
                            onClick={onNextStep}
                            className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-[#005ab5] hover:bg-[#00478f] text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer select-none inline-flex items-center gap-2 font-['Cairo'] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>التالي: بيانات المريض</span>
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={onPrevStep}
                            className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50 select-none border border-gray-200/60 inline-flex items-center gap-1.5"
                        >
                            <ArrowRight className="w-4 h-4" />
                            <span>السابق</span>
                        </button>

                        <LoadingButton
                            type="submit"
                            form={formId}
                            loading={submitting}
                            disabled={slotStatus === 'full'}
                            loadingText="جارٍ إصدار التذكرة..."
                            variant={isWaitlist ? 'amber' : 'primary'}
                            size="md"
                            icon={isWaitlist ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            className="px-6 sm:px-9 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition-colors"
                        >
                            {isWaitlist ? 'إرسال طلب الحجز (قائمة انتظار)' : 'تأكيد الحجز الفوري وإصدار التذكرة'}
                        </LoadingButton>
                    </>
                )}
            </div>
        </div>
    );
});
