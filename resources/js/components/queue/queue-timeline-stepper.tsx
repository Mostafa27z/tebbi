import React, { memo } from 'react';
import { Check, Clock } from 'lucide-react';

interface TimelineStep {
    title: string;
    status: string;
    desc: string;
}

interface QueueTimelineStepperProps {
    steps: TimelineStep[];
}

export const QueueTimelineStepper: React.FC<QueueTimelineStepperProps> = memo(function QueueTimelineStepper({
    steps,
}) {
    return (
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#005ab5]" />
                    <h3 className="font-black text-slate-900 text-base font-['Cairo']">
                        المسار التدفقي الحي لمراحل الموعد
                    </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    تحديث تلقائي متزامن مع الاستقبال والطبيب
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {steps.map((step, idx) => {
                    const isDone = step.status === 'done';
                    const isActive = step.status === 'active';

                    return (
                        <div
                            key={step.title}
                            className={`p-4 rounded-2xl border text-center transition-colors ${
                                isDone
                                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                    : isActive
                                      ? 'bg-blue-50/90 border-[#005ab5] ring-2 ring-[#005ab5]/15 text-[#005ab5]'
                                      : 'bg-slate-50/70 border-slate-200/80 text-slate-400'
                            }`}
                        >
                            <div className="text-[11px] font-black mb-1.5 font-['Cairo'] flex items-center justify-center gap-1">
                                {isDone ? (
                                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                ) : isActive ? (
                                    <Clock className="w-3.5 h-3.5 text-[#005ab5] animate-pulse" />
                                ) : null}
                                <span className={isDone ? 'text-emerald-700' : isActive ? 'text-[#005ab5]' : 'text-slate-400'}>
                                    المرحلة {idx + 1}
                                </span>
                            </div>
                            <div className="text-xs sm:text-sm font-black mb-1 text-slate-900 font-['Cairo']">
                                {step.title}
                            </div>
                            <div className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
QueueTimelineStepper.displayName = 'QueueTimelineStepper';
