import React from 'react';
import { Sun, Moon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MORNING_SLOTS, EVENING_SLOTS } from './types';

interface BookingTimeSelectorProps {
    selectedTimeSlot: string;
    onSelectTime: (slot: string) => void;
    timePeriod: 'all' | 'morning' | 'evening';
    setTimePeriod: (period: 'all' | 'morning' | 'evening') => void;
}

export const BookingTimeSelector: React.FC<BookingTimeSelectorProps> = ({
    selectedTimeSlot,
    onSelectTime,
    timePeriod,
    setTimePeriod,
}) => {
    return (
        <div className="bg-gray-50/70 p-4 sm:p-5 rounded-3xl border border-gray-200/80 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#005ab5] flex items-center justify-center font-black text-xs font-['Cairo'] shadow-xs">
                        2
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 font-['Cairo']">
                            اختر وقت الكشف المناسب
                        </h4>
                        <p className="text-[11px] text-gray-500">مواعيد دقيقة مع خدمة التنبيه المسبق</p>
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

            {/* Morning Slots */}
            {(timePeriod === 'all' || timePeriod === 'morning') && (
                <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>الفترة الصباحية:</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {MORNING_SLOTS.map((slot) => {
                            const isSelected = selectedTimeSlot === slot;
                            return (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => onSelectTime(slot)}
                                    className={cn(
                                        'py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer font-mono select-none flex items-center justify-center gap-1.5',
                                        isSelected
                                            ? 'bg-[#005ab5] border-[#005ab5] text-white shadow-sm ring-2 ring-[#005ab5]/20 scale-[1.02]'
                                            : 'bg-white hover:bg-blue-50/50 border-gray-200 text-gray-800 hover:border-blue-200'
                                    )}
                                >
                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    <span>{slot}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Evening Slots */}
            {(timePeriod === 'all' || timePeriod === 'evening') && (
                <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>الفترة المسائية:</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {EVENING_SLOTS.map((slot) => {
                            const isSelected = selectedTimeSlot === slot;
                            return (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => onSelectTime(slot)}
                                    className={cn(
                                        'py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer font-mono select-none flex items-center justify-center gap-1.5',
                                        isSelected
                                            ? 'bg-[#005ab5] border-[#005ab5] text-white shadow-sm ring-2 ring-[#005ab5]/20 scale-[1.02]'
                                            : 'bg-white hover:bg-blue-50/50 border-gray-200 text-gray-800 hover:border-blue-200'
                                    )}
                                >
                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    <span>{slot}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
