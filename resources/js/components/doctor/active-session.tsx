import React, { useState } from 'react';
import { Volume2, Pill, Clock, AlertCircle, X, Check, Plus, Minus } from 'lucide-react';
import { router } from '@inertiajs/react';
import { formatDurationArabic } from '@/lib/utils';

interface ActiveSessionProps {
    session: any;
    onCallNext: () => void;
    callingNext: boolean;
    onOpenPrescriptionModal: () => void;
}

export const ActiveSession: React.FC<ActiveSessionProps> = ({
    session,
    onCallNext,
    callingNext,
    onOpenPrescriptionModal,
}) => {
    const [delayModalOpen, setDelayModalOpen] = useState(false);
    const [delayMinutes, setDelayMinutes] = useState(30);
    const [delayReason, setDelayReason] = useState('نعتذر عن التأخير: تستدعي الحالة السريرية الحالية وقتاً إضافياً لتقديم العناية الطبية اللازمة. تم ترحيل وقت موعدكم تلقائياً.');
    const [isSubmittingDelay, setIsSubmittingDelay] = useState(false);

    const handleConfirmDelay = (e: React.FormEvent) => {
        e.preventDefault();
        const minutesToSend = Math.max(5, Math.min(180, delayMinutes || 15));
        setIsSubmittingDelay(true);
        router.post(
            `/doctor/appointments/${session.id}/delay`,
            {
                delay_minutes: minutesToSend,
                delay_reason: delayReason,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDelayModalOpen(false);
                },
                onFinish: () => {
                    setIsSubmittingDelay(false);
                },
            }
        );
    };

    return (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-blue-200 shadow-md mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#005ab5] text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-[#005ab5] animate-pulse"></span>
                            الحالة الحالية داخل غرفة الفحص السريري
                        </span>
                        {session.service_name && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                                <span>{session.service_name}</span>
                                {session.duration_minutes && (
                                    <span>• {formatDurationArabic(session.duration_minutes, true)}</span>
                                )}
                                {session.consultation_fee && (
                                    <span>• {Number(session.consultation_fee)} ر.س</span>
                                )}
                            </span>
                        )}
                        {session.delay_minutes > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold font-mono">
                                <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span>تم التمديد (+{session.delay_minutes} د)</span>
                            </span>
                        )}
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 font-['Cairo'] mb-1">
                        {session.patient.name}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-3">
                        <span>
                            رقم التذكرة: <strong>#{session.queueTicket?.ticket_number || 2}</strong>
                        </span>
                        <span>•</span>
                        <span>
                            الهاتف: <strong dir="ltr">{session.patient.phone}</strong>
                        </span>
                        <span>•</span>
                        <span>
                            طريقة الدفع:{' '}
                            <strong>
                                {session.payment_method === 'insurance' ? 'تأمين طبي (مغطى)' : 'نقدي'}
                            </strong>
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setDelayModalOpen(true)}
                        className="px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                        title="تمديد وقت الكشف وترحيل مواعيد المرضى اللاحقين بقائمة الانتظار"
                    >
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>تمديد الكشف {session.delay_minutes > 0 ? `(+${session.delay_minutes} د)` : '(+30 د)'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenPrescriptionModal}
                        className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
                        title="المرحلة 3: تأكيد إنهاء الكشف الطبي واعتماده"
                    >
                        <Pill className="w-4 h-4" />
                        <span>تأكيد إنهاء الكشف وإصدار الوصفة</span>
                    </button>

                    <button
                        type="button"
                        onClick={onCallNext}
                        disabled={callingNext}
                        className="px-5 py-3 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                        title="استدعاء المريض التالي وإرسال تنبيه فوري له في شاشته"
                    >
                        <Volume2 className="w-4 h-4" />
                        <span>{callingNext ? 'جارٍ الاستدعاء...' : 'استدعاء المريض التالي'}</span>
                    </button>
                </div>
            </div>

            <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                    <span className="block text-xs font-bold text-blue-900 mb-1">شكوى المريض وملاحظات الحجز:</span>
                    <p className="text-xs text-gray-700 leading-relaxed">
                        {session.patient_notes || 'كشف دوري وفحص سريري روتيني.'}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <span className="block text-xs font-bold text-gray-800 mb-1">سجل التغطية التأمينية:</span>
                    <p className="text-xs text-gray-600">
                        {session.insurance_provider || 'تأمين معتمد'} (موافقة الكشفية معتمدة آلياً).
                    </p>
                </div>
            </div>

            {/* Delay Extension Modal */}
            {delayModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    data-live-sync-pause="true"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Cairo'] animate-in fade-in"
                    dir="rtl"
                >
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-gray-900">
                                        تمديد وقت الكشف الطبي
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        ترحيل مواعيد المرضى اللاحقين وإشعار الاستقبال
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDelayModalOpen(false)}
                                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmDelay} className="p-6 space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-gray-700">
                                        مدة التمديد الإضافية للكشف:
                                    </label>
                                    <span className="text-[11px] font-bold text-[#005ab5] font-mono bg-blue-50 px-2.5 py-0.5 rounded-full">
                                        +{delayMinutes || 0} دقيقة إضافية
                                    </span>
                                </div>

                                {/* Quick Presets */}
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    {[15, 30, 45, 60].map((mins) => (
                                        <button
                                            key={mins}
                                            type="button"
                                            onClick={() => setDelayMinutes(mins)}
                                            className={`py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer font-mono border ${
                                                delayMinutes === mins
                                                    ? 'bg-[#005ab5] text-white border-[#005ab5] shadow-xs'
                                                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            +{mins} دقيقة
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Minutes Input & Stepper */}
                                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-700">
                                        أو أدخل رقماً مخصصاً (بالدقائق):
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDelayMinutes((prev) => Math.max(5, (prev || 15) - 5))}
                                            className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                                            title="إنقاص 5 دقائق"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>

                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                min="5"
                                                max="180"
                                                step="1"
                                                value={delayMinutes || ''}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (isNaN(val)) {
                                                        setDelayMinutes(0);
                                                    } else {
                                                        setDelayMinutes(Math.min(180, Math.max(0, val)));
                                                    }
                                                }}
                                                onBlur={() => {
                                                    if (!delayMinutes || delayMinutes < 5) setDelayMinutes(5);
                                                }}
                                                placeholder="أدخل عدد الدقائق..."
                                                className="w-full h-10 px-3 pl-14 text-center font-mono font-bold text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#005ab5] focus:outline-none"
                                                dir="ltr"
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                                                دقيقة
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setDelayMinutes((prev) => Math.min(180, (prev || 0) + 5))}
                                            className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                                            title="زيادة 5 دقائق"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500">
                                        يمكنك تحديد أي وقت مخصص يتراوح من 5 دقائق إلى 180 دقيقة.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    رسالة التنويه للمرضى بالانتظار والاستقبال:
                                </label>
                                <textarea
                                    rows={3}
                                    value={delayReason}
                                    onChange={(e) => setDelayReason(e.target.value)}
                                    placeholder="أدخل رسالة التنويه..."
                                    className="w-full p-3 rounded-2xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:outline-none resize-none leading-relaxed"
                                />
                                <p className="text-[11px] text-gray-500 mt-1">
                                    ستظهر هذه الرسالة فوراً في شاشات هواتف المرضى المنتظرين وتطبيق الاستقبال مع تعديل الوقت المتبقي.
                                </p>
                            </div>

                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmittingDelay}
                                    className="flex-1 py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmittingDelay ? 'جارٍ تحديث الطابور...' : `تأكيد تمديد (+${delayMinutes || 15} دقيقة) وإشعار المرضى`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDelayModalOpen(false)}
                                    className="py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

