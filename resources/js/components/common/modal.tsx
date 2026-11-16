import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    description?: React.ReactNode;
    headerIcon?: React.ReactNode;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = React.memo(({
    isOpen,
    onClose,
    title,
    description,
    headerIcon,
    children,
    maxWidth = 'lg',
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto font-['Tajawal']"
            dir="rtl"
        >
            <div
                className={cn(
                    'relative w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8',
                    maxWidthMap[maxWidth]
                )}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 bg-slate-50/40">
                    <div className="flex items-center gap-3 min-w-0">
                        {headerIcon && (
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#005ab5] flex items-center justify-center shrink-0">
                                {headerIcon}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-bold font-['Cairo'] text-slate-900 truncate">
                                {title}
                            </h3>
                            {description && (
                                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 max-h-[calc(85vh-110px)] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
});
Modal.displayName = 'Modal';
