import React from 'react';
import { Calendar, Clock, Building2, MessageCircle, FileText, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Doctor } from './types';

interface BookingSummarySidebarProps {
    doctor: Doctor;
    selectedDayLabel: string;
    selectedTimeSlot: string;
    fee: number;
    vat: number;
    totalAmount: number;
    isInsurance: boolean;
}

export const BookingSummarySidebar: React.FC<BookingSummarySidebarProps> = ({
    doctor,
    selectedDayLabel,
    selectedTimeSlot,
    fee,
    vat,
    totalAmount,
    isInsurance,
}) => {
    return (
        <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-4">
            <div className="p-5 rounded-3xl bg-gradient-to-b from-blue-50/50 via-white to-gray-50/50 border border-blue-100/90 shadow-sm space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-150">
                    <span className="text-xs font-black text-gray-900 font-['Cairo'] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#005ab5]" />
                        <span>ملخص تفاصيل الحجز</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>تأكيد فوري</span>
                    </span>
                </div>

                {/* Doctor Brief in Summary */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-150 shadow-xs">
                    <img
                        src={
                            doctor.user.avatar ||
                            'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=faces'
                        }
                        alt={doctor.user.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-gray-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-xs text-gray-900 font-['Cairo'] truncate">
                            {doctor.user.name}
                        </h5>
                        <p className="text-[11px] text-[#005ab5] font-medium truncate">
                            {doctor.specialty?.name_ar || doctor.title_ar}
                        </p>
                    </div>
                </div>

                {/* Appointment Schedule Highlight Card */}
                <div className="p-3.5 rounded-2xl bg-[#005ab5]/5 border border-[#005ab5]/15 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-[#005ab5]" />
                            <span>اليوم المحدد:</span>
                        </span>
                        <span className="font-bold text-gray-900 font-['Cairo']">
                            {selectedDayLabel}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-[#005ab5]" />
                            <span>وقت الكشف:</span>
                        </span>
                        <span className="font-mono font-bold text-[#005ab5] bg-white px-2 py-0.5 rounded-lg border border-blue-200/80 shadow-xs">
                            {selectedTimeSlot}
                        </span>
                    </div>

                    <div className="flex items-start justify-between text-xs pt-1 border-t border-blue-100/60">
                        <span className="text-gray-500 flex items-center gap-1.5 font-medium shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            <span>المنشأة:</span>
                        </span>
                        <span className="font-bold text-gray-800 text-left text-[11px] leading-snug">
                            {doctor.clinic.name}
                        </span>
                    </div>
                </div>

                {/* Live WhatsApp Queue Tracking Notice */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-xs">
                    <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>التتبع الحي للدور:</span>
                    </span>
                    <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-xs text-[11px]">
                        مفعّل تلقائياً
                    </span>
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-gray-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-gray-600">
                        <span>قيمة كشفية الاستشارة:</span>
                        <span className="font-mono font-bold text-gray-800">{fee.toFixed(2)} ر.س</span>
                    </div>

                    {isInsurance ? (
                        <div className="flex items-center justify-between text-emerald-600 font-bold bg-emerald-50/60 p-2 rounded-xl border border-emerald-200/70">
                            <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>تغطية التأمين الصحي (100%):</span>
                            </span>
                            <span className="font-mono">-{fee.toFixed(2)} ر.س</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between text-gray-500 text-[11px]">
                            <span>ضريبة القيمة المضافة (15%):</span>
                            <span className="font-mono">{vat.toFixed(2)} ر.س</span>
                        </div>
                    )}

                    <div className="pt-2 border-t border-gray-200 flex items-baseline justify-between">
                        <span className="font-black text-gray-900 font-['Cairo'] text-sm">
                            المبلغ المطلوب سداده:
                        </span>
                        <div className="text-left">
                            <span className="font-black text-lg text-[#005ab5] font-['Cairo'] block">
                                {isInsurance ? '0.00 ر.س' : `${totalAmount.toFixed(2)} ر.س`}
                            </span>
                            {isInsurance && (
                                <span className="text-[10px] font-bold text-emerald-600 block">
                                    (مغطى بالكامل عبر التأمين)
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Free Cancellation Guarantee Note */}
                <div className="p-3 rounded-2xl bg-gray-100/80 border border-gray-200/80 text-[10.5px] text-gray-600 flex items-start gap-2 leading-relaxed">
                    <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span>
                        يمكنك تغيير أو إلغاء موعدك مجاناً حتى ساعة واحدة قبل موعد الكشف عبر الرابط المرسل على الواتساب.
                    </span>
                </div>
            </div>
        </div>
    );
};
