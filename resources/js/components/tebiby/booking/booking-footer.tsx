import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { LoadingButton } from '@/components/common/loading-button';

interface BookingFooterProps {
    isInsurance: boolean;
    totalAmount: number;
    submitting: boolean;
    onClose: () => void;
    formId: string;
}

export const BookingFooter: React.FC<BookingFooterProps> = ({
    isInsurance,
    totalAmount,
    submitting,
    onClose,
    formId,
}) => {
    return (
        <div className="shrink-0 bg-white border-t border-gray-150 px-5 py-4 sm:px-7 sm:py-4.5 flex items-center justify-between gap-4 z-20 shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
            {/* Price Summary */}
            <div className="min-w-0">
                <span className="block text-[10.5px] text-gray-500 font-bold font-['Cairo']">
                    المبلغ النهائي المستحق
                </span>
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

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                <button
                    type="button"
                    disabled={submitting}
                    onClick={onClose}
                    className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50 select-none border border-gray-200/60"
                >
                    إلغاء
                </button>

                <LoadingButton
                    type="submit"
                    form={formId}
                    loading={submitting}
                    loadingText="جارٍ إصدار التذكرة..."
                    variant="primary"
                    size="md"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    className="px-6 sm:px-9 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                    تأكيد الحجز وإصدار التذكرة
                </LoadingButton>
            </div>
        </div>
    );
};
