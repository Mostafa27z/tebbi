import React from 'react';
import { AlertCircle, CheckCircle2, Power, X } from 'lucide-react';
import { LoadingButton } from './loading-button';
import { cn } from '@/lib/utils';

export interface ConfirmStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    entityName: string;
    currentStatus: boolean;
    statusType?: 'active' | 'verification' | 'availability';
    loading?: boolean;
}

export const ConfirmStatusModal: React.FC<ConfirmStatusModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    entityName,
    currentStatus,
    statusType = 'active',
    loading = false,
}) => {
    if (!isOpen) return null;

    const willBeActive = !currentStatus;

    // Custom labels & descriptions based on statusType
    let defaultTitle = '';
    let currentLabel = '';
    let targetLabel = '';
    let warningNote = '';

    if (statusType === 'active') {
        defaultTitle = willBeActive ? 'تأكيد تفعيل المنشأة الطبية' : 'تأكيد تعطيل المنشأة الطبية';
        currentLabel = currentStatus ? 'نشط' : 'معطّل';
        targetLabel = willBeActive ? 'نشط' : 'معطّل';
        warningNote = willBeActive
            ? 'عند التفعيل، ستظهر المنشأة للمرضى وسيتمكنون من استعراض الخدمات وحجز المواعيد.'
            : 'تنبيه: عند التعطيل لن تظهر المنشأة في محركات البحث ولن يتمكن المرضى من حجز مواعيد جديدة.';
    } else if (statusType === 'verification') {
        defaultTitle = willBeActive ? 'تأكيد اعتماد وتوثيق المنشأة' : 'إلغاء توثيق المنشأة';
        currentLabel = currentStatus ? 'معتمد وموثق' : 'قيد التدقيق';
        targetLabel = willBeActive ? 'معتمد وموثق' : 'قيد التدقيق';
        warningNote = willBeActive
            ? 'سيتم منح المنشأة شارة التوثيق الرسمية بوزارة الصحة MOH.'
            : 'سيتم سحب شارة الاعتماد الموثقة وتحويل المنشأة إلى حالة قيد التدقيق.';
    } else {
        // availability
        defaultTitle = willBeActive ? 'تفعيل استقبال المرضى' : 'تعليق استقبال المرضى';
        currentLabel = currentStatus ? 'مفعل ويستقبل' : 'معلّق مؤقتًا';
        targetLabel = willBeActive ? 'مفعل ويستقبل' : 'معلّق مؤقتًا';
        warningNote = willBeActive
            ? 'سيتمكن المرضى من حجز مواعيد فورية في جدول الطبيب لليوم.'
            : 'لن يتم استقبال حجوزات جديدة في جدول الطبيب حتى إعادة التفعيل.';
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            dir="rtl"
        >
            <div
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-center p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-4 left-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Status Icon */}
                <div
                    className={cn(
                        'w-16 h-16 mx-auto rounded-3xl flex items-center justify-center shadow-inner',
                        willBeActive
                            ? 'bg-emerald-50 text-emerald-600 shadow-emerald-200/50'
                            : 'bg-amber-50 text-amber-600 shadow-amber-200/50'
                    )}
                >
                    {willBeActive ? (
                        <CheckCircle2 className="w-8 h-8" />
                    ) : (
                        <Power className="w-8 h-8" />
                    )}
                </div>

                {/* Title & Entity Name */}
                <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-gray-900 font-['Cairo']">
                        {title || defaultTitle}
                    </h3>
                    <p className="text-sm font-bold text-[#005ab5]">
                        {entityName}
                    </p>
                </div>

                {/* Status Transition Badges */}
                <div className="flex items-center justify-center gap-3 py-2 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs font-bold">
                    <span className="text-gray-500">الحالة الحالية:</span>
                    <span
                        className={cn(
                            'px-2.5 py-1 rounded-full text-[11px]',
                            currentStatus
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-200 text-gray-700'
                        )}
                    >
                        {currentLabel}
                    </span>
                    <span className="text-gray-400">←</span>
                    <span
                        className={cn(
                            'px-2.5 py-1 rounded-full text-[11px]',
                            willBeActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                        )}
                    >
                        {targetLabel}
                    </span>
                </div>

                {/* Warning note */}
                <p className="text-xs text-gray-500 font-medium leading-relaxed px-2">
                    {warningNote}
                </p>

                {/* Buttons */}
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                        إلغاء
                    </button>
                    <LoadingButton
                        type="button"
                        onClick={onConfirm}
                        loading={loading}
                        loadingText="جاري التنفيذ..."
                        variant={willBeActive ? 'emerald' : 'primary'}
                        className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs"
                    >
                        {willBeActive ? 'نعم، تفعيل الآن' : 'نعم، تأكيد التعطيل'}
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
};

