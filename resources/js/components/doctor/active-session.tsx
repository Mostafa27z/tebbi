import React from 'react';
import { Volume2, Pill } from 'lucide-react';

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
    return (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-blue-200 shadow-md mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#005ab5] text-xs font-bold mb-2">
                        <span className="w-2 h-2 rounded-full bg-[#005ab5] animate-pulse"></span>
                        الحالة الحالية داخل غرفة الفحص السريري
                    </span>
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
                        onClick={onOpenPrescriptionModal}
                        className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-[1.01]"
                    >
                        <Pill className="w-4 h-4" />
                        <span>إنهاء الكشف وإصدار الوصفة</span>
                    </button>

                    <button
                        onClick={onCallNext}
                        disabled={callingNext}
                        className="px-5 py-3 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
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
        </div>
    );
};

