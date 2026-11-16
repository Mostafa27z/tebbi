import React, { memo } from 'react';
import { Star, Hospital, Clock, Calendar, Share2, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { SurfaceCard, AppButton } from '@/components/common';
import { DoctorItem } from './types';

interface GroupDoctorCardProps {
    doctor: DoctorItem;
    groupName: string;
    groupSlug: string;
    onBook: (doctor: DoctorItem, preferredSlot?: string) => void;
}

const QUICK_SLOTS = ['04:30 م', '05:20 م', '06:00 م', '07:30 م'];

export const GroupDoctorCard = memo(function GroupDoctorCard({
    doctor: doc,
    groupName,
    groupSlug,
    onBook,
}: GroupDoctorCardProps) {
    const primaryFacility = doc.clinic || (doc.facilities && doc.facilities[0]);
    const allBranchNames = doc.facilities && doc.facilities.length > 1
        ? doc.facilities.map((f) => f.name)
        : primaryFacility
          ? [primaryFacility.name]
          : [groupName];

    return (
        <SurfaceCard
            padding="md"
            rounded="3xl"
            className="hover:border-blue-300 hover:shadow-lg transition-colors flex flex-col justify-between group/card"
        >
            <div className="space-y-4">
                {/* Doctor Profile Header */}
                <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                        <div className="w-18 h-18 rounded-2xl bg-linear-to-br from-blue-50 to-indigo-100 p-1 border border-blue-100 overflow-hidden shadow-2xs">
                            <img
                                src={doc.user.avatar || '/images/default-avatar.png'}
                                alt={doc.user.name}
                                className="w-full h-full object-cover rounded-xl"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80';
                                }}
                            />
                        </div>
                        {doc.is_available_today && (
                            <span
                                className="absolute -bottom-1 -left-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold border-2 border-white shadow-2xs"
                                title="متاح للكشف اليوم"
                            >
                                متاح اليوم
                            </span>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#005ab5] border border-blue-100 text-[10px] font-bold">
                                {doc.specialty?.name_ar || 'استشاري'}
                            </span>
                            {doc.accepts_insurance && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>تأمين معتمد</span>
                                </span>
                            )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-base font-['Cairo'] mt-1.5 truncate group-hover/card:text-[#005ab5] transition-colors">
                            {doc.user.name}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {doc.title_ar} {doc.subspecialty ? `• ${doc.subspecialty}` : ''}
                        </p>

                        <div className="flex items-center gap-3 text-xs mt-2 text-slate-600">
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{Number(doc.rating || 4.9).toFixed(1)}</span>
                                <span className="text-slate-400 text-[10px] font-normal">
                                    ({doc.review_count || 120} تقييم)
                                </span>
                            </div>
                            {doc.experience_years && (
                                <div className="text-slate-400 text-[11px] font-medium">
                                    • خبرة {doc.experience_years} سنة
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hospital / Branch & Consultation Metrics */}
                <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-700 font-bold min-w-0">
                            <Hospital className="w-3.5 h-3.5 text-[#005ab5] shrink-0" />
                            <span className="truncate">{allBranchNames[0]}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0">
                            {primaryFacility?.district || primaryFacility?.city || ''}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                        <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>انتظار العيادة:</span>
                            <strong className="text-slate-800 font-mono">
                                ~{doc.waiting_time_minutes || 15} د
                            </strong>
                        </span>

                        <span className="flex items-center gap-1">
                            <span className="text-slate-500">الكشفية:</span>
                            <strong className="font-black text-emerald-700 text-sm font-mono">
                                {doc.consultation_fee} ر.س
                            </strong>
                        </span>
                    </div>
                </div>

                {/* Quick Available Slots Today */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-600 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>أقرب المواعيد المتاحة للحجز الفوري:</span>
                        </span>
                        <span className="text-emerald-600 font-bold">تأكيد فوري</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                        {QUICK_SLOTS.map((slot) => (
                            <button
                                key={slot}
                                type="button"
                                onClick={() => onBook(doc, slot)}
                                className="py-1.5 px-2 rounded-xl bg-blue-50/70 hover:bg-[#005ab5] text-[#005ab5] hover:text-white border border-blue-200/70 text-[11px] font-bold transition-colors cursor-pointer text-center"
                            >
                                {slot}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <AppButton
                    variant="primary"
                    fullWidth
                    icon={<Calendar className="w-4 h-4" />}
                    onClick={() => onBook(doc)}
                >
                    حجز موعد وتذكرة طابور
                </AppButton>

                <AppButton
                    variant="outline"
                    size="icon"
                    onClick={() => {
                        const url = `${window.location.origin}/group/${groupSlug}?doctor=${doc.id}`;
                        navigator.clipboard.writeText(url);
                        toast.success(`تم نسخ رابط حجز ${doc.user.name}`);
                    }}
                    title="نسخ رابط حجز الطبيب"
                >
                    <Share2 className="w-4 h-4" />
                </AppButton>
            </div>
        </SurfaceCard>
    );
});
