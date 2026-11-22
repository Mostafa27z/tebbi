import React from 'react';
import { RefreshCw, Pause, Play, WifiOff } from 'lucide-react';
import type { LiveSyncController } from '@/hooks/use-live-sync';
import { cn } from '@/lib/utils';

export interface LiveSyncIndicatorProps {
    sync: LiveSyncController;
    variant?: 'pill' | 'bar';
    title?: string;
    subtitle?: string;
    className?: string;
}

export const LiveSyncIndicator: React.FC<LiveSyncIndicatorProps> = ({
    sync,
    variant = 'pill',
    title = 'متابعة وتحديث مباشر للبيانات',
    subtitle,
    className,
}) => {
    const intervalSeconds = Math.max(1, Math.round(sync.intervalMs / 1000));

    if (variant === 'bar') {
        const barDescription =
            subtitle ??
            (sync.isPaused
                ? `التحديث التلقائي متوقف مؤقتاً • آخر تحديث: ${sync.lastSyncedLabel}`
                : sync.status === 'reconnecting'
                  ? `جارٍ إعادة الاتصال بالخادم تلقائياً • آخر تحديث: ${sync.lastSyncedLabel}`
                  : `مزامنة تلقائية كل ${intervalSeconds} ثوانٍ • آخر فحص: ${sync.lastSyncedLabel}`);

        return (
            <div
                className={cn(
                    'flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs font-[\'Tajawal\']',
                    className
                )}
                dir="rtl"
            >
                <div className="flex items-center gap-3 min-w-0">
                    {sync.status === 'reconnecting' ? (
                        <span className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                            <WifiOff className="w-4 h-4" />
                        </span>
                    ) : sync.isPaused ? (
                        <span className="relative flex h-3 w-3 shrink-0">
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                        </span>
                    ) : (
                        <span className="relative flex h-3 w-3 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                        </span>
                    )}

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                        <span className="text-xs sm:text-sm font-black text-slate-900 font-['Cairo'] truncate">
                            {title}
                        </span>
                        <span
                            className={cn(
                                'text-[11px] font-medium',
                                sync.status === 'reconnecting'
                                    ? 'text-rose-600'
                                    : sync.isPaused
                                      ? 'text-amber-700'
                                      : 'text-slate-500'
                            )}
                        >
                            ({barDescription})
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={sync.togglePause}
                        title={sync.isPaused ? 'استئناف المزامنة التلقائية' : 'إيقاف المزامنة مؤقتاً'}
                        aria-label={sync.isPaused ? 'استئناف المزامنة التلقائية' : 'إيقاف المزامنة مؤقتاً'}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer',
                            sync.isPaused
                                ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        )}
                    >
                        {sync.isPaused ? (
                            <>
                                <Play className="w-3.5 h-3.5" />
                                <span>استئناف</span>
                            </>
                        ) : (
                            <>
                                <Pause className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">إيقاف مؤقت</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={sync.syncNow}
                        title="تحديث فوري الآن"
                        aria-label="تحديث فوري الآن"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                        <RefreshCw className={cn('w-3.5 h-3.5', sync.isSyncing && 'animate-spin text-[#005ab5]')} />
                        <span>تحديث فوري</span>
                    </button>
                </div>
            </div>
        );
    }

    const toneClasses =
        sync.status === 'reconnecting'
            ? 'bg-rose-50/90 border-rose-200/80 text-rose-800'
            : sync.isPaused
              ? 'bg-amber-50/90 border-amber-200/80 text-amber-800'
              : 'bg-emerald-50/90 border-emerald-200/80 text-emerald-800';

    const statusLabel =
        sync.status === 'reconnecting' ? 'إعادة الاتصال' : sync.isPaused ? 'متوقف' : 'مباشر';

    return (
        <div
            className={cn(
                'inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border shadow-2xs transition-colors text-[11px] font-bold select-none',
                toneClasses,
                className
            )}
            dir="rtl"
        >
            <div className="inline-flex items-center gap-1.5">
                {sync.status === 'reconnecting' ? (
                    <WifiOff className="w-3.5 h-3.5 shrink-0" />
                ) : sync.isPaused ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                ) : (
                    <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                )}
                <span>{statusLabel}</span>
            </div>

            <span className="hidden xl:inline text-[10px] font-medium opacity-75 font-mono">
                {sync.lastSyncedLabel}
            </span>

            <span className="h-3.5 w-px bg-current opacity-20" aria-hidden="true" />

            <div className="inline-flex items-center gap-1">
                <button
                    type="button"
                    onClick={sync.syncNow}
                    title="تحديث فوري الآن"
                    aria-label="تحديث فوري الآن"
                    className="p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                >
                    <RefreshCw className={cn('w-3.5 h-3.5', sync.isSyncing && 'animate-spin')} />
                </button>
                <button
                    type="button"
                    onClick={sync.togglePause}
                    title={sync.isPaused ? 'استئناف المزامنة التلقائية' : 'إيقاف المزامنة مؤقتاً'}
                    aria-label={sync.isPaused ? 'استئناف المزامنة التلقائية' : 'إيقاف المزامنة مؤقتاً'}
                    className="p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                >
                    {sync.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </button>
            </div>
        </div>
    );
};
