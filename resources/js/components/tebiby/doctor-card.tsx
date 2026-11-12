import React, { useState } from 'react';
import { 
    Star, 
    MapPin, 
    Clock, 
    ShieldCheck, 
    Calendar, 
    ChevronLeft, 
    Building2,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DoctorCardProps {
    doctor: {
        id: number;
        title_ar: string;
        subspecialty: string;
        consultation_fee: number;
        rating: number;
        review_count: number;
        waiting_time_minutes: number;
        accepts_insurance: boolean;
        accepted_insurances?: string[] | null;
        user: {
            name: string;
            avatar: string;
        };
        clinic: {
            name: string;
            city: string;
            district: string;
        };
        specialty?: {
            name_ar: string;
        };
    };
    onBookSlot: (doctor: any, slot: { date: string; time: string }) => void;
    onBookDirect: (doctor: any) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
    doctor,
    onBookSlot,
    onBookDirect,
}) => {
    const todaySlots = [
        { time: '05:00 م' },
        { time: '05:20 م' },
        { time: '05:40 م' },
        { time: '06:00 م' },
    ];

    return (
        <div className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col justify-between overflow-hidden text-right">
            {/* Top Banner & Photo Area (صورة الطبيب من فوق بمظهر عصري جذاب) */}
            <div className="relative p-6 pb-4 bg-gradient-to-b from-blue-50/50 via-white to-white flex flex-col items-center text-center border-b border-gray-100/70">
                {/* Available Badge on top corner */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>متاح اليوم</span>
                </div>

                {/* Rating Badge on opposite corner */}
                <div className="absolute top-4 left-4 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-amber-900 font-mono">{doctor.rating}</span>
                </div>

                {/* Top Centered Avatar with Verification Badge */}
                <div className="relative mt-2 mb-3">
                    <img
                        src={
                            doctor.user.avatar ||
                            'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=250&h=250&fit=crop&crop=faces'
                        }
                        alt={doctor.user.name}
                        className="w-24 h-24 sm:w-26 sm:h-26 rounded-full object-cover ring-4 ring-white shadow-md mx-auto group-hover:scale-105 transition-transform duration-300"
                    />
                    <div
                        className="absolute bottom-0 right-1 bg-[#005ab5] text-white rounded-full p-1 shadow-sm ring-2 ring-white"
                        title="طبيب معتمد وموثق"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                </div>

                {/* Doctor Name & Subtitle */}
                <h3 className="font-black text-lg sm:text-xl text-gray-900 font-['Cairo'] tracking-tight group-hover:text-[#005ab5] transition-colors">
                    {doctor.user.name}
                </h3>
                <p className="text-xs font-bold text-[#005ab5] mt-0.5">
                    {doctor.title_ar} {doctor.specialty && `• ${doctor.specialty.name_ar}`}
                </p>
                <p className="text-xs text-gray-500 line-clamp-1 mt-1 max-w-sm font-medium">
                    {doctor.subspecialty || 'استشاري معتمد في التشخيص والعلاج الطبي المتقدم.'}
                </p>

                {/* Hospital / Clinic Location */}
                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50/80 px-3 py-1 rounded-full border border-gray-100 mt-2.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate max-w-[220px] font-medium">
                        {doctor.clinic.name} - {doctor.clinic.district}
                    </span>
                </div>
            </div>

            {/* Middle Section: Clean 3-Metric Stats (سعر، انتظار، تأمين) */}
            <div className="px-6 py-3.5">
                <div className="grid grid-cols-3 gap-2 py-2.5 bg-gray-50/80 rounded-2xl border border-gray-100 text-center">
                    <div>
                        <span className="block text-[10px] text-gray-400 font-semibold mb-0.5">سعر الكشف</span>
                        <span className="font-black text-xs sm:text-sm text-gray-900 font-['Cairo']">
                            {Number(doctor.consultation_fee)} ر.س
                        </span>
                    </div>

                    <div className="border-x border-gray-200/70">
                        <span className="block text-[10px] text-gray-400 font-semibold mb-0.5">مدة الانتظار</span>
                        <span className="font-bold text-xs sm:text-sm text-[#005ab5]">
                            ~{doctor.waiting_time_minutes} دقيقة
                        </span>
                    </div>

                    <div>
                        <span className="block text-[10px] text-gray-400 font-semibold mb-0.5">التأمين الطبي</span>
                        <span className="font-bold text-xs sm:text-sm text-[#006b5c]">
                            {doctor.accepts_insurance ? 'مقبول' : 'نقدي'}
                        </span>
                    </div>
                </div>

                {/* Today Slots Picker */}
                <div className="mt-3.5">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#005ab5]" />
                            <span>المواعيد المتاحة اليوم:</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium">حجز فوري</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                        {todaySlots.map((slot) => (
                            <button
                                key={slot.time}
                                type="button"
                                onClick={() =>
                                    onBookSlot(doctor, {
                                        date: 'اليوم - الجمعة 6 نوفمبر',
                                        time: slot.time,
                                    })
                                }
                                className="py-2 px-1 text-center rounded-xl bg-gray-50 border border-gray-200/90 hover:bg-[#005ab5] hover:border-[#005ab5] hover:text-white text-xs font-bold text-gray-800 transition-all duration-150 cursor-pointer active:scale-95"
                            >
                                <span className="block text-[11px] font-mono leading-none">{slot.time}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Booking CTA Button */}
            <div className="p-6 pt-1">
                <button
                    type="button"
                    onClick={() => onBookDirect(doctor)}
                    className="w-full py-3 px-4 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.99] group/btn"
                >
                    <Sparkles className="w-4 h-4 text-blue-200" />
                    <span>حجز موعد فوري وتفعيل التتبع الحي</span>
                    <ChevronLeft className="w-4 h-4 text-white group-hover/btn:-translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};
