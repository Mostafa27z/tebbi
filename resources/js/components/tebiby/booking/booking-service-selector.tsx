import React from 'react';
import { Check, Clock, Stethoscope } from 'lucide-react';
import { cn, formatDurationArabic } from '@/lib/utils';
import type { DoctorServiceItem } from './types';

interface BookingServiceSelectorProps {
    stepNumber?: number;
    services: DoctorServiceItem[];
    selectedServiceId: number | null;
    onSelectService: (serviceId: number) => void;
    fallbackFee: number;
    fallbackDurationMinutes: number;
}

export const BookingServiceSelector: React.FC<BookingServiceSelectorProps> = React.memo(({
    stepNumber = 1,
    services,
    selectedServiceId,
    onSelectService,
    fallbackFee,
    fallbackDurationMinutes,
}) => {
    return (
        <div className="bg-gray-50/70 p-4 sm:p-5 rounded-3xl border border-gray-200/80 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#005ab5] flex items-center justify-center font-black text-xs font-['Cairo'] shadow-xs shrink-0">
                        {stepNumber}
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 font-['Cairo']">
                            اختر نوع الكشف أو الإجراء الطبي
                        </h4>
                        <p className="text-[11px] text-gray-500">
                            يتحدد السعر ومدة الجلسة تلقائياً حسب الإجراء المختار
                        </p>
                    </div>
                </div>

                {services.length > 0 && (
                    <span className="text-[11px] font-bold text-[#005ab5] bg-blue-50 border border-blue-200/70 px-2.5 py-1 rounded-xl shrink-0">
                        {services.length} خيارات متاحة
                    </span>
                )}
            </div>

            {services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((service) => {
                        const isSelected = service.id === selectedServiceId;

                        return (
                            <button
                                key={service.id}
                                type="button"
                                onClick={() => onSelectService(service.id)}
                                className={cn(
                                    'text-right p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer select-none flex flex-col justify-between gap-2.5 group',
                                    isSelected
                                        ? 'bg-blue-50/70 border-[#005ab5] ring-2 ring-[#005ab5]/15 shadow-xs'
                                        : 'bg-white hover:bg-blue-50/30 border-gray-200 hover:border-blue-300'
                                )}
                            >
                                <div className="flex items-start justify-between gap-2 w-full">
                                    <div className="min-w-0 flex-1">
                                        <span
                                            className={cn(
                                                "block text-xs sm:text-sm font-black font-['Cairo'] leading-snug",
                                                isSelected ? 'text-[#005ab5]' : 'text-gray-900'
                                            )}
                                        >
                                            {service.name}
                                        </span>
                                        {service.description && (
                                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                                {service.description}
                                            </p>
                                        )}
                                    </div>

                                    <span
                                        className={cn(
                                            'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors border',
                                            isSelected
                                                ? 'bg-[#005ab5] border-[#005ab5] text-white'
                                                : 'bg-gray-50 border-gray-300 text-transparent group-hover:border-blue-300'
                                        )}
                                    >
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 w-full">
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border',
                                            isSelected
                                                ? 'bg-white text-[#005ab5] border-blue-200'
                                                : 'bg-gray-50 text-gray-600 border-gray-200/80'
                                        )}
                                    >
                                        <Clock className="w-3 h-3 shrink-0" />
                                        <span>{formatDurationArabic(service.duration_minutes)}</span>
                                    </span>

                                    <span className="font-black text-xs sm:text-sm text-emerald-700 font-['Cairo'] shrink-0">
                                        {Number(service.price)} ر.س
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="p-3.5 rounded-2xl bg-white border border-blue-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005ab5] flex items-center justify-center shrink-0">
                            <Stethoscope className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-xs sm:text-sm font-black text-gray-900 font-['Cairo']">
                                كشف استشاري عام
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                                <Clock className="w-3 h-3 text-[#005ab5]" />
                                <span>{formatDurationArabic(fallbackDurationMinutes)}</span>
                            </span>
                        </div>
                    </div>

                    <span className="font-black text-sm text-emerald-700 font-['Cairo'] shrink-0">
                        {Number(fallbackFee)} ر.س
                    </span>
                </div>
            )}
        </div>
    );
});
BookingServiceSelector.displayName = 'BookingServiceSelector';
