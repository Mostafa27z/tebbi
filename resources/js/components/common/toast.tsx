import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Sparkles } from 'lucide-react';

export { default as toast } from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface AlertModalOptions {
    title: string;
    message: string;
    type?: ToastType;
    confirmText?: string;
    onConfirm?: () => void;
}

let showAlertModalHandler: ((options: AlertModalOptions) => void) | null = null;

export const showAlert = (options: AlertModalOptions) => {
    showAlertModalHandler?.(options);
};

/**
 * ToastContainer is kept for backward compatibility.
 * Toaster from react-hot-toast is mounted once globally in app.tsx.
 */
export const ToastContainer: React.FC = () => {
    const [modalData, setModalData] = useState<AlertModalOptions | null>(null);

    useEffect(() => {
        showAlertModalHandler = (options) => {
            setModalData(options);
        };

        return () => {
            showAlertModalHandler = null;
        };
    }, []);

    if (!modalData) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200 font-['Tajawal']">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50/50">
                    <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 font-['Cairo'] mb-2">
                    {modalData.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6">
                    {modalData.message}
                </p>
                <button
                    type="button"
                    onClick={() => {
                        modalData.onConfirm?.();
                        setModalData(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-[#005ab5] hover:bg-[#004f9f] text-white font-bold text-xs font-['Cairo'] transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
                >
                    {modalData.confirmText || 'حسناً، فهمت'}
                </button>
            </div>
        </div>
    );
};
