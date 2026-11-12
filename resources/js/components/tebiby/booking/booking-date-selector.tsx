import React from 'react';
import { Calendar, CalendarCheck2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PresetDay, PRESET_DAYS } from './types';

interface BookingDateSelectorProps {
    selectedDayIso: string;
    onSelectDay: (iso: string, formattedLabel: string) => void;
    showCustomDatePicker: boolean;
    onToggleCustomPicker: () => void;
    onCustomDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BookingDateSelector: React.FC<BookingDateSelectorProps> = ({
    selectedDayIso,
    onSelectDay,
    showCustomDatePicker,
    onToggleCustomPicker,
    onCustomDateChange,
}) => {
    return (
        <div className="bg-gray-50/70 p-4 sm:p-5 rounded-3xl border border-gray-200/80 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#005ab5] flex items-center justify-center font-black text-xs font-['Cairo'] shadow-xs">
                        1
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 font-['Cairo']">
                            اختر يوم الكشف الطبي
                        </h4>
                        <p className="text-[11px] text-gray-500">حدد اليوم المناسب من الأيام المتاحة أدناه</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onToggleCustomPicker}
                    className="text-xs font-bold text-[#005ab5] hover:text-[#00478f] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/70 transition-colors cursor-pointer select-none border border-blue-200/60"
                >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{showCustomDatePicker ? 'إخفاء التقويم' : 'تاريخ آخر'}</span>
                </button>
            </div>

            {/* Custom Date Input Popdown */}
            {showCustomDatePicker && (
                <div className="p-3.5 rounded-2xl bg-white border border-blue-200 shadow-xs animate-in fade-in duration-150">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 font-['Cairo']">
                        اختر أي تاريخ مستقبلي ترغب به:
                    </label>
                    <input
                        type="date"
                        min="2026-11-06"
                        value={selectedDayIso}
                        onChange={onCustomDateChange}
                        className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-sm font-bold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden"
                    />
                </div>
            )}

            {/* Days Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
                {PRESET_DAYS.map((day: PresetDay) => {
                    const isSelected = selectedDayIso === day.iso;
                    return (
                        <button
                            key={day.iso}
                            type="button"
                            onClick={() => onSelectDay(day.iso, day.fullFormatted)}
                            className={cn(
                                'p-3 rounded-2xl border text-center transition-all cursor-pointer select-none flex flex-col items-center justify-between min-h-[76px]',
                                isSelected
                                    ? 'bg-[#005ab5] border-[#005ab5] text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                                    : 'bg-white hover:bg-gray-100/80 border-gray-200 hover:border-gray-300 text-gray-700'
                            )}
                        >
                            <span className={cn('text-xs font-black block', isSelected ? 'text-white' : 'text-gray-900 font-[\'Cairo\']')}>
                                {day.label}
                            </span>
                            <span className={cn('text-[10px] block font-medium mt-0.5', isSelected ? 'text-blue-100' : 'text-gray-500')}>
                                {day.dateStr}
                            </span>
                            <span className={cn(
                                'text-[9.5px] px-2 py-0.5 rounded-md font-bold mt-1',
                                isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            )}>
                                متاح
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
