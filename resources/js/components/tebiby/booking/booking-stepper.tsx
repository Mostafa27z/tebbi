import React, { memo } from 'react';
import { Check, ClipboardList, CalendarClock, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BookingStep = 1 | 2 | 3;

export interface BookingStepperProps {
    currentStep: BookingStep;
    onStepClick: (step: BookingStep) => void;
    serviceSummary?: string;
    scheduleSummary?: string;
    canReachStep3?: boolean;
}

export const BookingStepper: React.FC<BookingStepperProps> = memo(function BookingStepper({
    currentStep,
    onStepClick,
    serviceSummary,
    scheduleSummary,
    canReachStep3 = true,
}) {
    const steps: Array<{
        step: BookingStep;
        label: string;
        subtitle: string;
        icon: React.ComponentType<{ className?: string }>;
        disabled?: boolean;
    }> = [
        {
            step: 1,
            label: 'نوع الكشف',
            subtitle: serviceSummary || 'تحديد الإجراء والسعر',
            icon: ClipboardList,
        },
        {
            step: 2,
            label: 'اليوم والوقت',
            subtitle: scheduleSummary || 'اختيار الموعد المتاح',
            icon: CalendarClock,
        },
        {
            step: 3,
            label: 'بيانات المريض والتأكيد',
            subtitle: 'إصدار التذكرة',
            icon: UserCheck,
            disabled: currentStep < 3 && !canReachStep3,
        },
    ];

    return (
        <div
            className="shrink-0 bg-slate-50/90 border-b border-gray-200/80 px-5 sm:px-7 py-3 font-['Tajawal']"
            dir="rtl"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center flex-1 min-w-0">
                    {steps.map((item, idx) => {
                        const Icon = item.icon;
                        const isCompleted = item.step < currentStep;
                        const isActive = item.step === currentStep;
                        const isDisabled = Boolean(item.disabled);

                        return (
                            <React.Fragment key={item.step}>
                                <button
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => onStepClick(item.step)}
                                    className={cn(
                                        'flex items-center gap-2.5 text-right min-w-0 rounded-2xl px-2 py-1 transition-all select-none group',
                                        isDisabled
                                            ? 'cursor-not-allowed opacity-55'
                                            : 'cursor-pointer hover:bg-white/80'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all border text-xs font-black',
                                            isCompleted
                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                                                : isActive
                                                  ? 'bg-[#005ab5] border-[#005ab5] text-white ring-4 ring-[#005ab5]/15 shadow-xs'
                                                  : 'bg-white border-gray-300 text-gray-500 group-hover:border-blue-300 group-hover:text-[#005ab5]'
                                        )}
                                    >
                                        {isCompleted ? (
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        ) : (
                                            <Icon className="w-3.5 h-3.5" />
                                        )}
                                    </span>

                                    <div className="min-w-0">
                                        <span
                                            className={cn(
                                                "block text-[11px] sm:text-xs font-black font-['Cairo'] truncate leading-tight",
                                                isActive
                                                    ? 'text-[#005ab5]'
                                                    : isCompleted
                                                      ? 'text-emerald-700'
                                                      : 'text-gray-600'
                                            )}
                                        >
                                            {item.label}
                                        </span>
                                        <span className="hidden sm:block text-[10px] text-gray-500 truncate max-w-[150px] leading-snug mt-0.5">
                                            {item.subtitle}
                                        </span>
                                    </div>
                                </button>

                                {idx < steps.length - 1 && (
                                    <div className="flex-1 mx-2 sm:mx-3 h-1 rounded-full bg-gray-200 overflow-hidden min-w-[16px]">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all duration-300',
                                                item.step < currentStep ? 'w-full bg-emerald-500' : 'w-0 bg-[#005ab5]'
                                            )}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-200 text-[11px] font-black text-gray-700 font-['Cairo'] shrink-0 shadow-2xs">
                    الخطوة {currentStep} من 3
                </span>
            </div>
        </div>
    );
});
