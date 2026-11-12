import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, X, ToggleRight, ToggleLeft } from 'lucide-react';

interface AvailabilityDialogProps {
    isOpen: boolean;
    onClose: () => void;
    isAvailable: boolean;
}

export const AvailabilityDialog: React.FC<AvailabilityDialogProps> = ({
    isOpen,
    onClose,
    isAvailable,
}) => {
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        setSubmitting(true);
        router.post('/doctor/toggle-availability', {}, {
            onFinish: () => {
                setSubmitting(false);
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-['Tajawal']" dir="rtl">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="absolute top-4 left-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Icon */}
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        isAvailable ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                        {isAvailable ? (
                            <ToggleLeft className="w-7 h-7" />
                        ) : (
                            <ToggleRight className="w-7 h-7" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-black text-base text-gray-900 font-['Cairo']">
                            تأكيد تغيير حالة استقبال العيادة
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {isAvailable ? 'تعليق استقبال الحالات مؤقتاً' : 'تفعيل استقبال المرضى لليوم'}
                        </p>
                    </div>
                </div>

                {/* Description */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-600 leading-relaxed mb-6">
                    {isAvailable ? (
                        <>
                            هل أنت متأكد من <span className="font-bold text-amber-700">تعليق استقبال الحالات</span> في العيادة لليوم؟ لن يتمكن موظفو الاستقبال من إدخال حالات جديدة إلى صالة الانتظار.
                        </>
                    ) : (
                        <>
                            هل أنت متأكد من <span className="font-bold text-emerald-700">تفعيل جاهزية العيادة</span> لاستقبال المرضى لليوم؟ ستظهر عيادتك متاحة فوراً في نظام الطابور ومكتب الاستقبال.
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-xs transition-colors cursor-pointer"
                    >
                        إلغاء
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={submitting}
                        className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
                            isAvailable
                                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                        }`}
                    >
                        {submitting ? (
                            <span>جارٍ الحفظ...</span>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{isAvailable ? 'تأكيد التعليق المؤقت' : 'تأكيد تفعيل العيادة'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

