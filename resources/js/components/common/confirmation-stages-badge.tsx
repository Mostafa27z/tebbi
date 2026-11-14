import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, UserCheck, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmationStageInfo {
    stage: number;
    key: string;
    title: string;
    actor_role: string;
    actor_label: string;
    is_confirmed: boolean;
    confirmed_at?: string | null;
    confirmed_by_name?: string | null;
    status_label: string;
}

export interface ConfirmationStages {
    stage1_booking: ConfirmationStageInfo;
    stage2_arrival: ConfirmationStageInfo;
    stage3_kashf: ConfirmationStageInfo;
}

interface ConfirmationStagesBadgeProps {
    stages?: ConfirmationStages;
    status?: string;
    compact?: boolean;
    className?: string;
}

export const ConfirmationStagesBadge: React.FC<ConfirmationStagesBadgeProps> = ({
    stages,
    status,
    compact = true,
    className,
}) => {
    // Fallback derived if stages object is not directly passed
    const isStage1 = stages?.stage1_booking?.is_confirmed ?? 
        (status ? ['confirmed', 'waiting', 'in_consultation', 'completed'].includes(status) : false);
    const isStage2 = stages?.stage2_arrival?.is_confirmed ?? 
        (status ? ['waiting', 'in_consultation', 'completed'].includes(status) : false);
    const isStage3 = stages?.stage3_kashf?.is_confirmed ?? 
        (status ? status === 'completed' : false);

    const s1 = stages?.stage1_booking;
    const s2 = stages?.stage2_arrival;
    const s3 = stages?.stage3_kashf;

    const formatStageTooltip = (stageNum: number, name: string, actor: string, confirmed: boolean, byName?: string | null, at?: string | null) => {
        let tooltip = `المرحلة ${stageNum}: ${name} (${actor})\nالحالة: ${confirmed ? 'مؤكد ومكتمل ✓' : 'بانتظار الإجراء ⌛'}`;
        if (byName) tooltip += `\nبواسطة: ${byName}`;
        if (at) {
            try {
                const date = new Date(at);
                tooltip += `\nالوقت: ${date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
            } catch {
                tooltip += `\nالوقت: ${at}`;
            }
        }
        return tooltip;
    };

    if (compact) {
        return (
            <div className={cn('inline-flex items-center gap-1 font-["Cairo"] text-[10px] select-none', className)} dir="rtl">
                {/* Stage 1: Admin */}
                <div
                    title={formatStageTooltip(1, 'تأكيد الحجز', 'Admin / الإدارة', isStage1, s1?.confirmed_by_name, s1?.confirmed_at)}
                    className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold transition-all cursor-help',
                        isStage1
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60'
                    )}
                >
                    <ShieldCheck className={cn('w-3 h-3', isStage1 ? 'text-purple-600' : 'text-gray-400')} />
                    <span>١. الإدارة</span>
                    {isStage1 && <span className="text-[11px] font-bold text-purple-700">✓</span>}
                </div>

                <span className="text-gray-300 font-bold text-[9px]">←</span>

                {/* Stage 2: Receptionist */}
                <div
                    title={formatStageTooltip(2, 'تأكيد الحضور', 'الاستقبال', isStage2, s2?.confirmed_by_name, s2?.confirmed_at)}
                    className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold transition-all cursor-help',
                        isStage2
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isStage1
                            ? 'bg-blue-50 text-[#005ab5] border-blue-200 animate-pulse'
                            : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60'
                    )}
                >
                    <UserCheck className={cn('w-3 h-3', isStage2 ? 'text-amber-600' : 'text-gray-400')} />
                    <span>٢. الاستقبال</span>
                    {isStage2 && <span className="text-[11px] font-bold text-amber-700">✓</span>}
                </div>

                <span className="text-gray-300 font-bold text-[9px]">←</span>

                {/* Stage 3: Doctor */}
                <div
                    title={formatStageTooltip(3, 'إنهاء الكشف', 'الطبيب', isStage3, s3?.confirmed_by_name, s3?.confirmed_at)}
                    className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold transition-all cursor-help',
                        isStage3
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : status === 'in_consultation'
                            ? 'bg-emerald-50/50 text-emerald-700 border-emerald-200 animate-pulse'
                            : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60'
                    )}
                >
                    <Stethoscope className={cn('w-3 h-3', isStage3 ? 'text-emerald-600' : 'text-gray-400')} />
                    <span>٣. الطبيب</span>
                    {isStage3 && <span className="text-[11px] font-bold text-emerald-700">✓</span>}
                </div>
            </div>
        );
    }

    return (
        <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-gray-50/80 border border-gray-200 font-["Cairo"] text-xs', className)} dir="rtl">
            {/* Stage 1 */}
            <div className={cn(
                'p-2.5 rounded-xl border flex flex-col justify-between transition-all',
                isStage1 ? 'bg-purple-50/80 border-purple-200 text-purple-900' : 'bg-white border-gray-200 text-gray-400'
            )}>
                <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 font-bold text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span>المرحلة ١: تأكيد الحجز</span>
                    </span>
                    {isStage1 ? (
                        <span className="bg-purple-200 text-purple-800 text-[9px] px-1.5 py-0.5 rounded-md font-extrabold">مؤكد ✓</span>
                    ) : (
                        <span className="bg-gray-200 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-md">معلق</span>
                    )}
                </div>
                <div className="text-[10px] text-gray-600">
                    {s1?.confirmed_by_name ? `بواسطة: ${s1.confirmed_by_name}` : 'خاص بإدارة المنشأة'}
                </div>
            </div>

            {/* Stage 2 */}
            <div className={cn(
                'p-2.5 rounded-xl border flex flex-col justify-between transition-all',
                isStage2 ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-white border-gray-200 text-gray-400'
            )}>
                <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 font-bold text-[11px]">
                        <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                        <span>المرحلة ٢: تأكيد الحضور</span>
                    </span>
                    {isStage2 ? (
                        <span className="bg-amber-200 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-md font-extrabold">حضر ✓</span>
                    ) : (
                        <span className="bg-gray-200 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-md">لم يحضر</span>
                    )}
                </div>
                <div className="text-[10px] text-gray-600">
                    {s2?.confirmed_by_name ? `بواسطة: ${s2.confirmed_by_name}` : 'خاص بموظف الاستقبال'}
                </div>
            </div>

            {/* Stage 3 */}
            <div className={cn(
                'p-2.5 rounded-xl border flex flex-col justify-between transition-all',
                isStage3 ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-white border-gray-200 text-gray-400'
            )}>
                <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 font-bold text-[11px]">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                        <span>المرحلة ٣: إنهاء الكشف</span>
                    </span>
                    {isStage3 ? (
                        <span className="bg-emerald-200 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-md font-extrabold">اكتمل ✓</span>
                    ) : (
                        <span className="bg-gray-200 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-md">بانتظار الكشف</span>
                    )}
                </div>
                <div className="text-[10px] text-gray-600">
                    {s3?.confirmed_by_name ? `بواسطة: ${s3.confirmed_by_name}` : 'خاص بالطبيب المعالج'}
                </div>
            </div>
        </div>
    );
};
