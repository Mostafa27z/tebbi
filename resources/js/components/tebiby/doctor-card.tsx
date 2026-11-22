import React from 'react';
import {
    Star,
    Clock,
    Calendar,
    ChevronLeft,
    Building2,
    CheckCircle2,
    Sparkles,
    ClipboardList,
} from 'lucide-react';
import { formatDurationArabic } from '@/lib/utils';
import { PRESET_DAYS, type DoctorServiceItem } from './booking/types';

export interface DoctorCardProps {
    doctor: {
        id: number;
        title_ar: string;
        subspecialty: string;
        consultation_fee: number;
        rating: number;
        review_count: number;
        waiting_time_minutes: number;
        slot_auto_confirm_limit?: number;
        slot_waitlist_limit?: number;
        accepts_insurance: boolean;
        accepted_insurances?: string[] | null;
        active_services?: DoctorServiceItem[];
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
    onBookSlot: (doctor: any, slot: { iso: string; date: string; time: string }) => void;
    onBookDirect: (doctor: any, serviceId?: number) => void;
}

const TODAY_QUICK_SLOTS = ['04:30 م', '05:00 م', '05:30 م', '06:00 م'];

export const DoctorCard: React.FC<DoctorCardProps> = ({
    doctor,
    onBookSlot,
    onBookDirect,
}) => {
    const services = doctor.active_services || [];
    const hasMultipleServices = services.length > 1;
    const displayMinPrice =
        services.length > 0
            ? Math.min(...services.map((s) => Number(s.price)))
            : Number(doctor.consultation_fee);
    const todayPreset = PRESET_DAYS[0];

    return (
        <div className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col justify-between overflow-hidden text-right">
            {/* Top Banner & Photo Area */}
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

            {/* Middle Section: Metrics + Services + Slots */}
            <div className="px-5 sm:px-6 py-3.5 space-y-3.5 flex-1">
                <div className="grid grid-cols-3 gap-2 py-2.5 bg-gray-50/80 rounded-2xl border border-gray-100 text-center">
                    <div>
                        <span className="block text-[10px] text-gray-400 font-semibold mb-0.5">
                            {hasMultipleServices ? 'سعر الكشف يبدأ من' : 'سعر الكشف'}
                        </span>
                        <span className="font-black text-xs sm:text-sm text-gray-900 font-['Cairo']">
                            {displayMinPrice} ر.س
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

                {/* Clickable Doctor Services Preview */}
                {services.length > 0 && (
                    <div className="p-3 rounded-2xl bg-blue-50/45 border border-blue-100/90 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                            <span className="flex items-center gap-1.5 text-[#005ab5]">
                                <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                                <span>أنواع الكشوفات والخدمات</span>
                            </span>
                            <span className="text-[10px] font-bold text-gray-500">اختر للحجز</span>
                        </div>

                        <div className="space-y-1.5">
                            {services.slice(0, 3).map((srv) => (
                                <button
                                    key={srv.id}
                                    type="button"
                                    onClick={() => onBookDirect(doctor, srv.id)}
                                    className="w-full px-2.5 py-2 rounded-xl bg-white hover:bg-[#005ab5] border border-blue-100 hover:border-[#005ab5] text-right flex items-center justify-between gap-2 transition-colors cursor-pointer group/srv"
                                >
                                    <span className="text-[11px] font-bold text-gray-800 group-hover/srv:text-white truncate">
                                        {srv.name}
                                    </span>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-blue-50 group-hover/srv:bg-white/15 text-[#005ab5] group-hover/srv:text-blue-100 text-[10px] font-bold">
                                            <Clock className="w-2.5 h-2.5" />
                                            <span>{formatDurationArabic(srv.duration_minutes, true)}</span>
                                        </span>
                                        <span className="text-[11px] font-black text-emerald-700 group-hover/srv:text-white font-['Cairo']">
                                            {Number(srv.price)} ر.س
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {services.length > 3 && (
                            <button
                                type="button"
                                onClick={() => onBookDirect(doctor)}
                                className="w-full text-center text-[10.5px] font-bold text-[#005ab5] hover:underline pt-0.5 cursor-pointer"
                            >
                                +{services.length - 3} خدمات وكشوفات أخرى متاحة عند الحجز
                            </button>
                        )}
                    </div>
                )}

                {/* Today Slots Picker */}
                <div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#005ab5]" />
                            <span>المواعيد المتاحة اليوم:</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium">
                            {(doctor.slot_auto_confirm_limit ?? 1) > 0 ? 'تأكيد فوري' : 'حجز بالتأكيد المسبق'}
                        </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                        {TODAY_QUICK_SLOTS.map((slotTime) => (
                            <button
                                key={slotTime}
                                type="button"
                                onClick={() =>
                                    onBookSlot(doctor, {
                                        iso: todayPreset.iso,
                                        date: todayPreset.fullFormatted,
                                        time: slotTime,
                                    })
                                }
                                className="py-2 px-1 text-center rounded-xl bg-gray-50 border border-gray-200/90 hover:bg-[#005ab5] hover:border-[#005ab5] hover:text-white text-xs font-bold text-gray-800 transition-all duration-150 cursor-pointer active:scale-95"
                            >
                                <span className="block text-[11px] font-mono leading-none">{slotTime}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Booking CTA Button */}
            <div className="p-5 sm:p-6 pt-1">
                <button
                    type="button"
                    onClick={() => onBookDirect(doctor)}
                    className="w-full py-3 px-4 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.99] group/btn"
                >
                    <Sparkles className="w-4 h-4 text-blue-200" />
                    <span>حجز موعد وتحديد نوع الكشف</span>
                    <ChevronLeft className="w-4 h-4 text-white group-hover/btn:-translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};
