import React, { useState, useEffect } from 'react';
import toast, { Toaster, resolveValue, useToasterStore, type Toast } from 'react-hot-toast';
import {
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    Loader2,
    BellRing,
    Clock,
    Volume2,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export { default as toast } from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type NotificationVariant = ToastType | 'loading' | 'clinic_call' | 'clinic_delay';

export interface AlertModalOptions {
    title: string;
    message: string;
    type?: ToastType;
    confirmText?: string;
    onConfirm?: () => void;
}

interface NotificationCardProps {
    t: Toast;
    variant: NotificationVariant;
    title?: string;
    message: React.ReactNode;
    badge?: string;
    onReplaySound?: () => void;
}

const variantTheme: Record<
    NotificationVariant,
    {
        bar: string;
        border: string;
        iconBox: string;
        progress: string;
        badge: string;
        defaultTitle: string;
        Icon: React.FC<{ className?: string }>;
    }
> = {
    success: {
        bar: 'bg-emerald-500',
        border: 'border-emerald-200/80',
        iconBox: 'bg-emerald-50 text-emerald-600 ring-emerald-200/70',
        progress: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
        defaultTitle: 'تمت العملية بنجاح',
        Icon: CheckCircle2,
    },
    error: {
        bar: 'bg-red-500',
        border: 'border-red-200/80',
        iconBox: 'bg-red-50 text-red-600 ring-red-200/70',
        progress: 'bg-red-500',
        badge: 'bg-red-50 text-red-700 border-red-200/70',
        defaultTitle: 'تعذر إتمام الإجراء',
        Icon: AlertCircle,
    },
    warning: {
        bar: 'bg-amber-500',
        border: 'border-amber-200/80',
        iconBox: 'bg-amber-50 text-amber-600 ring-amber-200/70',
        progress: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-800 border-amber-200/70',
        defaultTitle: 'تنبيه هام',
        Icon: AlertTriangle,
    },
    info: {
        bar: 'bg-[#005ab5]',
        border: 'border-blue-200/80',
        iconBox: 'bg-blue-50 text-[#005ab5] ring-blue-200/70',
        progress: 'bg-[#005ab5]',
        badge: 'bg-blue-50 text-[#005ab5] border-blue-200/70',
        defaultTitle: 'إشعار معلوماتي',
        Icon: Info,
    },
    loading: {
        bar: 'bg-[#005ab5]',
        border: 'border-blue-200/80',
        iconBox: 'bg-blue-50 text-[#005ab5] ring-blue-200/70',
        progress: 'bg-[#005ab5]',
        badge: 'bg-blue-50 text-[#005ab5] border-blue-200/70',
        defaultTitle: 'جارٍ التنفيذ...',
        Icon: Loader2,
    },
    clinic_call: {
        bar: 'bg-emerald-500',
        border: 'border-emerald-200/90',
        iconBox: 'bg-emerald-50 text-emerald-600 ring-emerald-200/80',
        progress: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        defaultTitle: 'نداء عيادة فوري',
        Icon: BellRing,
    },
    clinic_delay: {
        bar: 'bg-amber-500',
        border: 'border-amber-200/90',
        iconBox: 'bg-amber-50 text-amber-600 ring-amber-200/80',
        progress: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
        defaultTitle: 'تحديث وقت الكشف',
        Icon: Clock,
    },
};

const NotificationCard: React.FC<NotificationCardProps> = ({
    t,
    variant,
    title,
    message,
    badge,
    onReplaySound,
}) => {
    const theme = variantTheme[variant];
    const IconComp = theme.Icon;
    const hasFiniteDuration = typeof t.duration === 'number' && Number.isFinite(t.duration) && t.duration > 0;

    return (
        <div
            dir="rtl"
            className={cn(
                'pointer-events-auto relative w-[calc(100vw-2rem)] max-w-md bg-white/95 backdrop-blur-md rounded-2xl border shadow-[0_14px_34px_-10px_rgba(15,23,42,0.18)] overflow-hidden transition-all duration-300 ease-out font-["Tajawal"]',
                theme.border,
                t.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
            )}
        >
            <div className="flex items-stretch">
                {/* Right-edge semantic accent stripe */}
                <div className={cn('w-1 shrink-0', theme.bar)} />

                <div className="flex-1 p-3.5 sm:px-4 flex items-start gap-3 min-w-0">
                    {/* Soft Pastel Lucide Icon Badge */}
                    <div
                        className={cn(
                            'relative w-9 h-9 rounded-xl ring-1 flex items-center justify-center shrink-0 mt-0.5',
                            theme.iconBox
                        )}
                    >
                        <IconComp
                            className={cn(
                                'w-4.5 h-4.5',
                                variant === 'loading' && 'animate-spin'
                            )}
                        />
                        {variant === 'clinic_call' && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white" />
                            </span>
                        )}
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                            {title && (
                                <span className="text-[13px] font-black text-slate-900 font-['Cairo'] leading-snug">
                                    {title}
                                </span>
                            )}
                            {badge && (
                                <span
                                    className={cn(
                                        'px-2 py-0.5 rounded-full border text-[10px] font-bold',
                                        theme.badge
                                    )}
                                >
                                    {badge}
                                </span>
                            )}
                        </div>

                        <div className="text-xs font-semibold text-slate-600 leading-relaxed break-words">
                            {message}
                        </div>

                        {onReplaySound && (
                            <button
                                type="button"
                                onClick={onReplaySound}
                                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>إعادة الجرس</span>
                            </button>
                        )}
                    </div>

                    {/* Dismiss Button */}
                    <button
                        type="button"
                        onClick={() => toast.dismiss(t.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                        aria-label="إغلاق الإشعار"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {hasFiniteDuration && (
                <div className="h-0.5 w-full bg-slate-100 overflow-hidden">
                    <div
                        className={cn('h-full w-full animate-toast-progress', theme.progress)}
                        style={{ animationDuration: `${t.duration}ms` }}
                    />
                </div>
            )}
        </div>
    );
};

let lastToastTime = 0;
let lastToastMsg = '';

export const notify = {
    success(message: string, title?: string, duration = 4200) {
        const now = Date.now();
        if (now - lastToastTime < 1200 && lastToastMsg === message) {
            return;
        }
        lastToastTime = now;
        lastToastMsg = message;
        toast.dismiss();

        return toast.custom(
            (t) => <NotificationCard t={t} variant="success" title={title} message={message} />,
            { duration, id: 'app-global-toast' }
        );
    },
    error(message: string, title?: string, duration = 5000) {
        const now = Date.now();
        if (now - lastToastTime < 1200 && lastToastMsg === message) {
            return;
        }
        lastToastTime = now;
        lastToastMsg = message;
        toast.dismiss();

        return toast.custom(
            (t) => <NotificationCard t={t} variant="error" title={title} message={message} />,
            { duration, id: 'app-global-toast' }
        );
    },
    warning(message: string, title?: string, duration = 5000) {
        const now = Date.now();
        if (now - lastToastTime < 1200 && lastToastMsg === message) {
            return;
        }
        lastToastTime = now;
        lastToastMsg = message;
        toast.dismiss();

        return toast.custom(
            (t) => <NotificationCard t={t} variant="warning" title={title} message={message} />,
            { duration, id: 'app-global-toast' }
        );
    },
    info(message: string, title?: string, duration = 4500) {
        const now = Date.now();
        if (now - lastToastTime < 1200 && lastToastMsg === message) {
            return;
        }
        lastToastTime = now;
        lastToastMsg = message;
        toast.dismiss();

        return toast.custom(
            (t) => <NotificationCard t={t} variant="info" title={title} message={message} />,
            { duration, id: 'app-global-toast' }
        );
    },
    clinicCall(opts: {
        title?: string;
        message: string;
        badge?: string;
        onReplaySound?: () => void;
        duration?: number;
    }) {
        return toast.custom(
            (t) => (
                <NotificationCard
                    t={t}
                    variant="clinic_call"
                    title={opts.title || 'نداء عيادة فوري'}
                    message={opts.message}
                    badge={opts.badge}
                    onReplaySound={opts.onReplaySound}
                />
            ),
            { duration: opts.duration ?? 9000 }
        );
    },
    clinicDelay(opts: {
        title?: string;
        message: string;
        badge?: string;
        duration?: number;
    }) {
        return toast.custom(
            (t) => (
                <NotificationCard
                    t={t}
                    variant="clinic_delay"
                    title={opts.title || 'تمديد وقت الكشف'}
                    message={opts.message}
                    badge={opts.badge}
                />
            ),
            { duration: opts.duration ?? 9000 }
        );
    },
};

export const AppToaster: React.FC = () => {
    const { toasts } = useToasterStore();

    // Enforce strict limit: only 1 visible toast at any time
    useEffect(() => {
        toasts
            .filter((t) => t.visible)
            .filter((_, i) => i >= 1)
            .forEach((t) => toast.dismiss(t.id));
    }, [toasts]);

    return (
        <Toaster
            position="top-center"
            gutter={10}
            containerStyle={{ top: 18, zIndex: 9999 }}
        >
            {(t) => {
                if (t.type === 'custom') {
                    return <>{resolveValue(t.message, t)}</>;
                }

                const variant: NotificationVariant =
                    t.type === 'success'
                        ? 'success'
                        : t.type === 'error'
                          ? 'error'
                          : t.type === 'loading'
                            ? 'loading'
                            : 'info';

                return (
                    <NotificationCard
                        t={t}
                        variant={variant}
                        message={resolveValue(t.message, t)}
                    />
                );
            }}
        </Toaster>
    );
};

let showAlertModalHandler: ((options: AlertModalOptions) => void) | null = null;

export const showAlert = (options: AlertModalOptions) => {
    showAlertModalHandler?.(options);
};

const alertModalTheme: Record<
    ToastType,
    {
        iconWrap: string;
        button: string;
        Icon: React.FC<{ className?: string }>;
    }
> = {
    success: {
        iconWrap: 'bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60',
        button: 'bg-[#005ab5] hover:bg-[#004f9f] shadow-blue-500/20',
        Icon: CheckCircle2,
    },
    error: {
        iconWrap: 'bg-red-50 text-red-600 ring-8 ring-red-50/60',
        button: 'bg-red-600 hover:bg-red-700 shadow-red-500/20',
        Icon: AlertCircle,
    },
    warning: {
        iconWrap: 'bg-amber-50 text-amber-600 ring-8 ring-amber-50/60',
        button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20',
        Icon: AlertTriangle,
    },
    info: {
        iconWrap: 'bg-blue-50 text-[#005ab5] ring-8 ring-blue-50/60',
        button: 'bg-[#005ab5] hover:bg-[#004f9f] shadow-blue-500/20',
        Icon: Info,
    },
};

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

    useEffect(() => {
        if (!modalData) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setModalData(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [modalData]);

    if (!modalData) return null;

    const type: ToastType = modalData.type || 'success';
    const theme = alertModalTheme[type];
    const IconComp = theme.Icon;

    return (
        <div
            onClick={(e) => {
                if (e.target === e.currentTarget) setModalData(null);
            }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs animate-in fade-in duration-200"
            dir="rtl"
        >
            <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200 font-['Tajawal']">
                <button
                    type="button"
                    onClick={() => setModalData(null)}
                    className="absolute top-4 left-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="إغلاق"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4', theme.iconWrap)}>
                    <IconComp className="w-9 h-9" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 font-['Cairo'] mb-2">
                    {modalData.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {modalData.message}
                </p>
                <button
                    type="button"
                    onClick={() => {
                        modalData.onConfirm?.();
                        setModalData(null);
                    }}
                    className={cn(
                        'w-full py-3 px-4 rounded-xl text-white font-bold text-xs font-["Cairo"] transition-colors shadow-md cursor-pointer',
                        theme.button
                    )}
                >
                    {modalData.confirmText || 'حسناً، فهمت'}
                </button>
            </div>
        </div>
    );
};
