import React, { memo } from 'react';
import { X, Building2, CalendarDays } from 'lucide-react';
import { Doctor } from './types';

interface BookingHeaderProps {
    doctor: Doctor;
    selectedDayLabel: string;
    selectedTimeSlot: string;
    onClose: () => void;
}

export const BookingHeader: React.FC<BookingHeaderProps> = memo(function BookingHeader({
    doctor,
    selectedDayLabel,
    selectedTimeSlot,
    onClose,
}) {
    return (
        <div className="shrink-0 bg-gradient-to-r from-[#005ab5] via-[#00478f] to-[#003366] text-white px-5 py-4 sm:px-7 sm:py-5 border-b border-blue-800/40">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                        <img
                            src={
                                doctor.user.avatar ||
                                'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=faces'
                            }
                            alt={doctor.user.name}
                            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-white/30"
                        />
                        <span className="absolute -bottom-1 -left-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="bg-white/15 text-blue-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                                حجز وتتبع فوري
                            </span>
                        </div>
                        <h3 className="font-black text-base sm:text-lg text-white font-['Cairo'] truncate">
                            {doctor.user.name}
                        </h3>
                        <div className="text-xs text-blue-100/90 font-medium truncate flex items-center gap-1.5 mt-0.5">
                            <span>{doctor.title_ar}</span>
                            {doctor.specialty && (
                                <>
                                    <span className="text-blue-300/60">•</span>
                                    <span className="text-blue-200">{doctor.specialty.name_ar}</span>
                                </>
                            )}
                            <span className="text-blue-300/60">•</span>
                            <span className="text-blue-200 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-blue-300 shrink-0" />
                                <span className="truncate">{doctor.clinic.name}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    <div className="hidden md:flex items-center gap-2.5 bg-white/10 px-3.5 py-2 rounded-2xl border border-white/15">
                        <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                            <CalendarDays className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-right">
                            <span className="block text-[10px] text-blue-200/90 leading-none font-medium">الموعد المختار:</span>
                            <span className="text-xs font-bold text-white font-['Cairo'] mt-0.5 block">
                                {selectedDayLabel} ({selectedTimeSlot})
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/15"
                        title="إغلاق النافذة"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
});
