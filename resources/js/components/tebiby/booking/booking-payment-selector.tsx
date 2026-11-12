import React from 'react';
import { ShieldCheck, CreditCard, Banknote, CheckCircle2, FileText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INSURANCE_COMPANIES } from './types';
import { CustomSelect } from '@/components/common/custom-select';

interface BookingPaymentSelectorProps {
    paymentMethod: 'insurance' | 'at-clinic' | 'online';
    setPaymentMethod: (method: 'insurance' | 'at-clinic' | 'online') => void;
    insuranceProvider: string;
    setInsuranceProvider: (provider: string) => void;
    insurancePolicyNumber: string;
    setInsurancePolicyNumber: (policy: string) => void;
    notifyWhatsapp: boolean;
    setNotifyWhatsapp: (notify: boolean) => void;
}

export const BookingPaymentSelector: React.FC<BookingPaymentSelectorProps> = ({
    paymentMethod,
    setPaymentMethod,
    insuranceProvider,
    setInsuranceProvider,
    insurancePolicyNumber,
    setInsurancePolicyNumber,
    notifyWhatsapp,
    setNotifyWhatsapp,
}) => {
    const isInsurance = paymentMethod === 'insurance';

    return (
        <div className="bg-gray-50/70 p-4 sm:p-5 rounded-3xl border border-gray-200/80 space-y-4">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#005ab5] flex items-center justify-center font-black text-xs font-['Cairo'] shadow-xs">
                    4
                </div>
                <div>
                    <h4 className="text-xs sm:text-sm font-black text-gray-900 font-['Cairo']">
                        طريقة السداد والتغطية
                    </h4>
                    <p className="text-[11px] text-gray-500">قبول فوري لجميع شركات التأمين أو الدفع بالعيادة</p>
                </div>
            </div>

            {/* 3 Payment Method Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Insurance Option */}
                <button
                    type="button"
                    onClick={() => setPaymentMethod('insurance')}
                    className={cn(
                        'p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 select-none',
                        paymentMethod === 'insurance'
                            ? 'border-[#005ab5] bg-blue-50/90 ring-2 ring-[#005ab5]/20 text-[#005ab5] shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    )}
                >
                    <div className="flex items-center justify-between">
                        <div className={cn(
                            'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
                            paymentMethod === 'insurance' ? 'bg-[#005ab5] text-white shadow-xs' : 'bg-blue-100/70 text-[#005ab5]'
                        )}>
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        {paymentMethod === 'insurance' && <CheckCircle2 className="w-4 h-4 text-[#005ab5]" />}
                    </div>
                    <div>
                        <span className="text-xs font-bold font-['Cairo'] block">تأمين طبي</span>
                        <span className="text-[10.5px] text-gray-500 block mt-0.5">بوبا / التعاونية / ميدغلف</span>
                    </div>
                </button>

                {/* Online Pay Option */}
                <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={cn(
                        'p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 select-none',
                        paymentMethod === 'online'
                            ? 'border-purple-600 bg-purple-50/90 ring-2 ring-purple-600/20 text-purple-700 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    )}
                >
                    <div className="flex items-center justify-between">
                        <div className={cn(
                            'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
                            paymentMethod === 'online' ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-100/70 text-purple-600'
                        )}>
                            <CreditCard className="w-4 h-4" />
                        </div>
                        {paymentMethod === 'online' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                    </div>
                    <div>
                        <span className="text-xs font-bold font-['Cairo'] block">دفع إلكتروني</span>
                        <span className="text-[10.5px] text-gray-500 block mt-0.5">مدى / Apple Pay / فيزا</span>
                    </div>
                </button>

                {/* At Clinic Option */}
                <button
                    type="button"
                    onClick={() => setPaymentMethod('at-clinic')}
                    className={cn(
                        'p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 select-none',
                        paymentMethod === 'at-clinic'
                            ? 'border-[#006b5c] bg-emerald-50/90 ring-2 ring-[#006b5c]/20 text-[#006b5c] shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    )}
                >
                    <div className="flex items-center justify-between">
                        <div className={cn(
                            'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
                            paymentMethod === 'at-clinic' ? 'bg-[#006b5c] text-white shadow-xs' : 'bg-emerald-100/70 text-[#006b5c]'
                        )}>
                            <Banknote className="w-4 h-4" />
                        </div>
                        {paymentMethod === 'at-clinic' && <CheckCircle2 className="w-4 h-4 text-[#006b5c]" />}
                    </div>
                    <div>
                        <span className="text-xs font-bold font-['Cairo'] block">في العيادة</span>
                        <span className="text-[10.5px] text-gray-500 block mt-0.5">سداد عند الحضور للموعد</span>
                    </div>
                </button>
            </div>

            {/* Insurance Details Box (Harmonized Inputs) */}
            {isInsurance && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200/90 space-y-3.5 shadow-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-950 font-['Cairo'] flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>بيانات وثيقة التأمين الصحي:</span>
                        </span>
                        <span className="bg-emerald-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-xs">
                            تغطية 100% بدون دفع
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
                        <div>
                            <CustomSelect
                                label="شركة التأمين:"
                                value={insuranceProvider}
                                onChange={(val) => setInsuranceProvider(String(val))}
                                options={INSURANCE_COMPANIES.map((c) => ({ value: c, label: c }))}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 font-['Cairo']">
                                رقم الوثيقة / بطاقة التأمين:
                            </label>
                            <input
                                type="text"
                                value={insurancePolicyNumber}
                                onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                                placeholder="BUP-XXXXXXX"
                                className="w-full h-12 px-4 rounded-2xl border border-gray-200 hover:border-gray-300 text-xs sm:text-sm font-mono bg-white focus:border-[#005ab5] focus:ring-2 focus:ring-[#005ab5]/20 focus:outline-hidden text-left"
                                dir="ltr"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Notification Agreement */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 flex items-start gap-3">
                <input
                    type="checkbox"
                    id="whatsapp-agree-check"
                    checked={notifyWhatsapp}
                    onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                    className="mt-0.5 rounded-lg text-[#005ab5] focus:ring-[#005ab5] w-4 h-4 border-gray-300 cursor-pointer shrink-0"
                />
                <label
                    htmlFor="whatsapp-agree-check"
                    className="text-xs text-gray-700 leading-relaxed cursor-pointer select-none font-medium"
                >
                    أوافق على استلام <strong>رابط التتبع الحي للدور وتنبيه واتساب قبل الكشف بـ 15 دقيقة</strong> مباشرة على رقم جوالي.
                </label>
            </div>
        </div>
    );
};
