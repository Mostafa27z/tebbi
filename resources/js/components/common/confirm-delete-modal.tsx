import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { LoadingButton } from './loading-button';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'تأكيد الحذف',
    message,
    confirmText = 'نعم، تأكيد الحذف',
    cancelText = 'إلغاء',
    loading = false,
}) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            dir="rtl"
        >
            <div 
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all text-center p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close X */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-4 left-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Danger Icon Accent */}
                <div className="w-16 h-16 mx-auto rounded-3xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner shadow-red-200/50">
                    <Trash2 className="w-8 h-8" />
                </div>

                {/* Title & Description */}
                <div className="space-y-2">
                    <h3 className="text-lg font-black text-gray-900 font-['Cairo']">
                        {title}
                    </h3>
                    <div className="text-xs text-gray-600 font-medium leading-relaxed px-2">
                        {message}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-2.5 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <LoadingButton
                        variant="danger"
                        loading={loading}
                        onClick={onConfirm}
                        className="flex-1 font-['Cairo']"
                    >
                        {confirmText}
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
};

