import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { Users, CheckCircle2, Clock, Ban, Save, Plus, Minus, AlertCircle } from 'lucide-react';
import { SurfaceCard } from '@/components/common/surface-card';
import { LoadingButton } from '@/components/common/loading-button';
import { cn } from '@/lib/utils';

interface SlotCapacityCardProps {
    autoConfirmLimit: number;
    waitlistLimit: number;
    compact?: boolean;
}

export const SlotCapacityCard: React.FC<SlotCapacityCardProps> = ({
    autoConfirmLimit,
    waitlistLimit,
    compact = false,
}) => {
    const [autoLimit, setAutoLimit] = useState<number>(Math.max(0, Number(autoConfirmLimit ?? 1)));
    const [waitLimit, setWaitLimit] = useState<number>(Math.max(0, Number(waitlistLimit ?? 1)));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setAutoLimit(Math.max(0, Number(autoConfirmLimit ?? 1)));
        setWaitLimit(Math.max(0, Number(waitlistLimit ?? 1)));
    }, [autoConfirmLimit, waitlistLimit]);

    const totalCapacity = autoLimit + waitLimit;
    const hasChanges = autoLimit !== Number(autoConfirmLimit ?? 1) || waitLimit !== Number(waitlistLimit ?? 1);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;

        if (totalCapacity < 1) {
            setError('يجب أن يكون إجمالي السعة (التأكيد الفوري + الانتظار) مريضاً واحداً على الأقل.');
            return;
        }

        setError(null);
        setSaving(true);

        router.put(
            '/doctor/slot-capacity',
            {
                slot_auto_confirm_limit: autoLimit,
                slot_waitlist_limit: waitLimit,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('تم حفظ إعدادات سعة المواعيد والتأكيد الفوري بنجاح');
                },
                onError: (errors) => {
                    const msg = errors.slot_auto_confirm_limit || errors.slot_waitlist_limit || 'تعذر حفظ الإعدادات';
                    setError(msg);
                    toast.error(msg);
                },
                onFinish: () => {
                    setSaving(false);
                },
            }
        );
    };

    return (
        <SurfaceCard padding={compact ? 'md' : 'lg'} className="border-slate-200/90">
            <form onSubmit={handleSave} className="space-y-5 font-['Tajawal']" dir="rtl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#005ab5] border border-blue-100 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-black text-slate-900 font-['Cairo']">
                                سعة الحجز في نفس الموعد والتأكيد الفوري
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                حدد عدد المرضى الذين يتم تأكيد حجزهم تلقائياً في نفس الساعة، وعدد مقاعد الانتظار الإضافية قبل إغلاق الموعد
                            </p>
                        </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shrink-0 self-start sm:self-auto">
                        إجمالي السعة للموعد: <strong className="font-mono text-[#005ab5]">{totalCapacity}</strong> مريض
                    </span>
                </div>

                {/* Two Stepper Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Auto-Confirm Limit */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <label className="text-xs sm:text-sm font-black text-emerald-950 font-['Cairo'] flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>عدد الحجوزات بالتأكيد الفوري المباشر</span>
                                </label>
                                <p className="text-[11px] text-emerald-800/80 mt-0.5">
                                    أول {autoLimit || 0} مرضى في نفس الموعد يتم تأكيد حجزهم فوراً دون انتظار الإدارة
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setAutoLimit((v) => Math.max(0, v - 1))}
                                className="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="إنقاص التأكيد الفوري"
                            >
                                <Minus className="w-4 h-4" />
                            </button>

                            <input
                                type="number"
                                min={0}
                                max={20}
                                value={autoLimit}
                                onChange={(e) =>
                                    setAutoLimit(Math.max(0, Math.min(20, parseInt(e.target.value || '0', 10) || 0)))
                                }
                                className="flex-1 h-10 text-center font-mono font-black text-base rounded-xl bg-white border border-emerald-200 text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                                dir="ltr"
                            />

                            <button
                                type="button"
                                onClick={() => setAutoLimit((v) => Math.min(20, v + 1))}
                                className="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="زيادة التأكيد الفوري"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Waitlist Limit */}
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <label className="text-xs sm:text-sm font-black text-amber-950 font-['Cairo'] flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>عدد حجوزات الانتظار الإضافية</span>
                                </label>
                                <p className="text-[11px] text-amber-900/80 mt-0.5">
                                    تظهر للمريض باللون الأصفر مع تنبيه بوجود حجز مسبق واحتياج التأكيد
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setWaitLimit((v) => Math.max(0, v - 1))}
                                className="w-10 h-10 rounded-xl bg-white border border-amber-200 text-amber-900 hover:bg-amber-100 flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="إنقاص مقاعد الانتظار"
                            >
                                <Minus className="w-4 h-4" />
                            </button>

                            <input
                                type="number"
                                min={0}
                                max={20}
                                value={waitLimit}
                                onChange={(e) =>
                                    setWaitLimit(Math.max(0, Math.min(20, parseInt(e.target.value || '0', 10) || 0)))
                                }
                                className="flex-1 h-10 text-center font-mono font-black text-base rounded-xl bg-white border border-amber-200 text-amber-950 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                                dir="ltr"
                            />

                            <button
                                type="button"
                                onClick={() => setWaitLimit((v) => Math.min(20, v + 1))}
                                className="w-10 h-10 rounded-xl bg-white border border-amber-200 text-amber-900 hover:bg-amber-100 flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="زيادة مقاعد الانتظار"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live 3-State Visual Simulation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 mt-1" />
                        <div>
                            <span className="font-black text-emerald-900 block">أخضر: تأكيد فوري</span>
                            <span className="text-[11px] text-emerald-800">
                                {autoLimit > 0
                                    ? `أول ${autoLimit} ${autoLimit === 1 ? 'مريض' : 'مرضى'} يُؤكد فوراً`
                                    : 'معطّل (جميع الحجوزات تنتظر التأكيد)'}
                            </span>
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0 mt-1" />
                        <div>
                            <span className="font-black text-amber-900 block">أصفر: قائمة انتظار</span>
                            <span className="text-[11px] text-amber-800">
                                {waitLimit > 0
                                    ? `من الحجز #${autoLimit + 1} حتى #${totalCapacity} (بتنبيه للمريض)`
                                    : 'بدون مقاعد انتظار إضافية'}
                            </span>
                        </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-red-50 border border-red-200/80 flex items-start gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 shrink-0 mt-1" />
                        <div>
                            <span className="font-black text-red-900 block flex items-center gap-1">
                                <Ban className="w-3.5 h-3.5 text-red-600" />
                                <span>أحمر: مكتمل ومغلق</span>
                            </span>
                            <span className="text-[11px] text-red-800">
                                عند الوصول إلى {totalCapacity} {totalCapacity === 1 ? 'حجز' : 'حجوزات'} يتوقف الحجز
                            </span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                    <LoadingButton
                        type="submit"
                        variant="primary"
                        loading={saving}
                        loadingText="جارٍ الحفظ..."
                        disabled={totalCapacity < 1}
                        icon={<Save className="w-4 h-4" />}
                        className={cn(!hasChanges && 'opacity-90')}
                    >
                        حفظ إعدادات السعة والتأكيد الفوري
                    </LoadingButton>
                </div>
            </form>
        </SurfaceCard>
    );
};
