import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { X, Calendar, Clock, MapPin, ShieldCheck, CheckCircle2, CreditCard, Banknote, Building2 } from 'lucide-react';

interface Doctor {
    id: number;
    title_ar: string;
    consultation_fee: number;
    user: {
        name: string;
        avatar: string;
    };
    clinic: {
        name: string;
        district: string;
        city: string;
    };
}

interface BookingModalProps {
    doctor: Doctor | null;
    selectedSlot: { date: string; time: string } | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function BookingModal({ doctor, selectedSlot, isOpen, onClose }: BookingModalProps) {
    if (!isOpen || !doctor) return null;

    const [patientName, setPatientName] = useState('محمد فهد الدوسري');
    const [patientPhone, setPatientPhone] = useState('0555123456');
    const [patientNationalId, setPatientNationalId] = useState('1098765432');
    const [paymentMethod, setPaymentMethod] = useState<'insurance' | 'at-clinic' | 'online'>('insurance');
    const [insuranceProvider, setInsuranceProvider] = useState('شركة بوبا العربية للتأمين');
    const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('BUP-8491023');
    const [patientNotes, setPatientNotes] = useState('');
    const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fee = Number(doctor.consultation_fee) || 250;
    const isInsurance = paymentMethod === 'insurance';
    const totalAmount = isInsurance ? 0 : fee * 1.15;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        router.post('/appointments/book', {
            doctor_id: doctor.id,
            patient_name: patientName,
            patient_phone: patientPhone,
            patient_national_id: patientNationalId,
            appointment_date: selectedSlot?.date || '2026-11-06',
            appointment_time: selectedSlot?.time || '17:40:00',
            payment_method: paymentMethod === 'at-clinic' ? 'at_clinic' : paymentMethod,
            insurance_provider: isInsurance ? insuranceProvider : null,
            insurance_policy_number: isInsurance ? insurancePolicyNumber : null,
            patient_notes: patientNotes,
            notify_whatsapp: notifyWhatsapp,
        }, {
            onFinish: () => {
                setSubmitting(false);
                onClose();
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#005ab5] to-[#0072e2] text-white p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-5 left-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-white text-[22px]">event_available</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-100">تأكيد حجز الموعد الفوري</span>
                    </div>
                    <h3 className="text-xl font-bold font-['Cairo']">إتمام بيانات الحجز وتفعيل تتبع الدور الحي</h3>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Doctor Info Card */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f7f9fb] border border-gray-200/80">
                        <img
                            src={doctor.user.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=faces'}
                            alt={doctor.user.name}
                            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#005ab5]/20"
                        />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-base font-['Cairo']">{doctor.user.name}</h4>
                            <p className="text-xs text-[#005ab5] font-semibold">{doctor.title_ar}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                {doctor.clinic.name} - {doctor.clinic.district}
                            </p>
                        </div>
                    </div>

                    {/* Appointment Slot Details */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs">
                        <div className="flex items-center gap-2 text-blue-900 font-bold">
                            <Calendar className="w-4 h-4 text-[#005ab5]" />
                            <span>التاريخ: {selectedSlot?.date || 'اليوم - الجمعة 6 نوفمبر'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-900 font-bold">
                            <Clock className="w-4 h-4 text-[#005ab5]" />
                            <span>الوقت: {selectedSlot?.time || '05:40 م'}</span>
                        </div>
                    </div>

                    {/* Patient Fields */}
                    <div className="space-y-4">
                        <h5 className="font-bold text-gray-900 text-sm font-['Cairo'] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#005ab5] text-[18px]">person</span>
                            بيانات المريض
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">اسم المريض ثلاثي</label>
                                <input
                                    type="text"
                                    required
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">رقم الجوال (لرسائل الواتساب)</label>
                                <input
                                    type="tel"
                                    required
                                    value={patientPhone}
                                    onChange={(e) => setPatientPhone(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden text-left"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">رقم الهوية الوطنية / الإقامة</label>
                            <input
                                type="text"
                                required
                                value={patientNationalId}
                                onChange={(e) => setPatientNationalId(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden text-left"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-3">
                        <h5 className="font-bold text-gray-900 text-sm font-['Cairo'] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#005ab5] text-[18px]">payments</span>
                            طريقة السداد وتغطية التأمين
                        </h5>
                        <div className="grid grid-cols-3 gap-2.5">
                            {/* Insurance Option */}
                            <label
                                className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
                                    paymentMethod === 'insurance'
                                        ? 'border-[#005ab5] bg-blue-50/50 shadow-xs'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="payment"
                                    checked={paymentMethod === 'insurance'}
                                    onChange={() => setPaymentMethod('insurance')}
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-1.5 mb-1 text-[#005ab5]">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-xs font-bold font-['Cairo']">تأمين طبي</span>
                                </div>
                                <span className="text-[11px] text-gray-500">موافقة فورية من شبكة بوبا/التعاونية</span>
                            </label>

                            {/* At Clinic Option */}
                            <label
                                className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
                                    paymentMethod === 'at-clinic'
                                        ? 'border-[#005ab5] bg-blue-50/50 shadow-xs'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="payment"
                                    checked={paymentMethod === 'at-clinic'}
                                    onChange={() => setPaymentMethod('at-clinic')}
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-1.5 mb-1 text-[#006b5c]">
                                    <Banknote className="w-4 h-4" />
                                    <span className="text-xs font-bold font-['Cairo']">عند الحضور</span>
                                </div>
                                <span className="text-[11px] text-gray-500">سداد في استقبال العيادة (نقداً/مدى)</span>
                            </label>

                            {/* Online Pay Option */}
                            <label
                                className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
                                    paymentMethod === 'online'
                                        ? 'border-[#005ab5] bg-blue-50/50 shadow-xs'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="payment"
                                    checked={paymentMethod === 'online'}
                                    onChange={() => setPaymentMethod('online')}
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-1.5 mb-1 text-purple-700">
                                    <CreditCard className="w-4 h-4" />
                                    <span className="text-xs font-bold font-['Cairo']">دفع إلكتروني</span>
                                </div>
                                <span className="text-[11px] text-gray-500">Apple Pay وبطاقات مدى الائتمانية</span>
                            </label>
                        </div>

                        {/* If Insurance Selected, show policy inputs */}
                        {isInsurance && (
                            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-emerald-900">الشركة المعتمدة: {insuranceProvider}</span>
                                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">مغطى بنسبة ١٠٠٪</span>
                                </div>
                                <p className="text-emerald-700 text-[11px]">رقم وثيقة التأمين: <strong>{insurancePolicyNumber}</strong></p>
                            </div>
                        )}
                    </div>

                    {/* Agreement & Live WhatsApp Tracker */}
                    <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                        <input
                            type="checkbox"
                            id="whatsapp-agree"
                            checked={notifyWhatsapp}
                            onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                            className="mt-0.5 rounded-md text-[#005ab5] focus:ring-[#005ab5] w-4 h-4"
                        />
                        <label htmlFor="whatsapp-agree" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
                            أوافق على استلام <strong>رابط تتبع الدور الحي ومستجدات وقت الانتظار عبر الواتساب والرسائل النصية</strong>، والالتزام بسياسة الحضور قبل الموعد بـ 15 دقيقة.
                        </label>
                    </div>

                    {/* Summary and Buttons */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-4">
                        <div>
                            <span className="block text-[11px] text-gray-500">إجمالي المبلغ المستحق</span>
                            <span className="font-black text-xl text-[#005ab5] font-['Cairo']">
                                {isInsurance ? '0.00 ر.س (مغطى بالكامل)' : `${totalAmount.toFixed(2)} ر.س`}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
                            >
                                رجوع
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{submitting ? 'جارٍ التأكيد...' : 'تأكيد الحجز الفوري وإصدار التذكرة'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

