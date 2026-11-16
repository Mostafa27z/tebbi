import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AppointmentStatusValue = 'booked' | 'confirmed' | 'waiting' | 'in_consultation' | 'completed' | 'cancelled';

interface StatusOption {
    value: AppointmentStatusValue;
    label: string;
    shortLabel: string;
    sublabel?: string;
    dotColor: string;
    pillBg: string;
    pillText: string;
    pillBorder: string;
}

const statusOptions: StatusOption[] = [
    {
        value: 'booked',
        label: 'حجز جديد (بانتظار تأكيد الإدارة)',
        shortLabel: 'بانتظار التأكيد',
        sublabel: 'المرحلة 1: يتطلب تأكيد إدارة المنشأة',
        dotColor: 'bg-purple-500 animate-pulse',
        pillBg: 'bg-purple-50',
        pillText: 'text-purple-800',
        pillBorder: 'border-purple-200',
    },
    {
        value: 'confirmed',
        label: 'تم تأكيد الحجز (لم يحضر بعد)',
        shortLabel: 'لم يحضر (مؤكد)',
        sublabel: 'المرحلة 1 مكتملة: بانتظار وصول المريض للاستقبال',
        dotColor: 'bg-blue-500',
        pillBg: 'bg-blue-50',
        pillText: 'text-blue-700',
        pillBorder: 'border-blue-200',
    },
    {
        value: 'waiting',
        label: 'حضر بالاستقبال (في صالة الانتظار)',
        shortLabel: 'في صالة الانتظار',
        sublabel: 'المرحلة 2 مكتملة: في قائمة الانتظار بانتظار استدعاء الطبيب',
        dotColor: 'bg-amber-500 animate-pulse',
        pillBg: 'bg-amber-50',
        pillText: 'text-amber-800',
        pillBorder: 'border-amber-300',
    },
    {
        value: 'in_consultation',
        label: 'داخل العيادة مع الطبيب',
        shortLabel: 'داخل العيادة',
        sublabel: 'جلسة المعاينة الطبية والفحص السريري جارية الآن',
        dotColor: 'bg-emerald-500 animate-ping',
        pillBg: 'bg-emerald-50',
        pillText: 'text-emerald-800',
        pillBorder: 'border-emerald-300',
    },
    {
        value: 'completed',
        label: 'مكتمل (أنهى الكشف وغادر)',
        shortLabel: 'أنهى الكشف',
        sublabel: 'المرحلة 3 مكتملة: تم إنهاء الكشف الطبي واعتماده من الطبيب',
        dotColor: 'bg-gray-400',
        pillBg: 'bg-gray-100',
        pillText: 'text-gray-800',
        pillBorder: 'border-gray-300',
    },
    {
        value: 'cancelled',
        label: 'غائب / ملغي',
        shortLabel: 'غائب / ملغي',
        sublabel: 'لم يحضر الموعد أو تم إلغاؤه',
        dotColor: 'bg-red-500',
        pillBg: 'bg-red-50',
        pillText: 'text-red-700',
        pillBorder: 'border-red-200',
    },
];

interface StatusSelectProps {
    value: AppointmentStatusValue | string;
    onChange: (newValue: AppointmentStatusValue) => void;
    disabled?: boolean;
    className?: string;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({
    value,
    onChange,
    disabled = false,
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
        width: number;
    } | null>(null);

    const currentOpt = statusOptions.find((opt) => opt.value === value) || statusOptions[0];

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const menuHeight = 220;
        const openUpwards = spaceBelow < menuHeight && spaceAbove > spaceBelow;

        const isRtl = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';
        const menuWidth = Math.max(rect.width, 210);

        let leftPos: number | undefined = undefined;
        let rightPos: number | undefined = undefined;

        if (isRtl) {
            let right = window.innerWidth - rect.right;
            if (right + menuWidth > window.innerWidth - 8) {
                right = Math.max(8, window.innerWidth - menuWidth - 8);
            }
            if (right < 8) right = 8;
            rightPos = right;
        } else {
            let left = rect.left;
            if (left + menuWidth > window.innerWidth - 8) {
                left = Math.max(8, window.innerWidth - menuWidth - 8);
            }
            if (left < 8) left = 8;
            leftPos = left;
        }

        setDropdownPos({
            top: openUpwards ? undefined : rect.bottom + 6,
            bottom: openUpwards ? window.innerHeight - rect.top + 6 : undefined,
            left: leftPos,
            right: rightPos,
            width: menuWidth,
        });
    };

    useEffect(() => {
        if (!isOpen) return;
        updatePosition();

        const handleScrollOrResize = () => updatePosition();
        window.addEventListener('resize', handleScrollOrResize);
        window.addEventListener('scroll', handleScrollOrResize, true);

        return () => {
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
        };
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                triggerRef.current &&
                !triggerRef.current.contains(target) &&
                menuRef.current &&
                !menuRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className={cn('relative inline-block text-right select-none', className)}>
            {/* Custom Interactive Status Pill Trigger Button */}
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'h-8.5 px-3 rounded-xl text-xs font-bold border transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer shadow-2xs whitespace-nowrap w-full',
                    currentOpt.pillBg,
                    currentOpt.pillText,
                    currentOpt.pillBorder,
                    isOpen && 'ring-2 ring-blue-500/20 shadow-sm scale-[1.01]',
                    disabled && 'opacity-60 cursor-not-allowed'
                )}
            >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', currentOpt.dotColor)} />
                    <span className="font-['Cairo'] tracking-tight truncate">{currentOpt.shortLabel || currentOpt.label}</span>
                </div>
                <ChevronDown
                    className={cn(
                        'w-3.5 h-3.5 opacity-60 transition-transform duration-200 shrink-0 mr-1',
                        isOpen && 'rotate-180 opacity-100'
                    )}
                />
            </button>

            {/* Portal-rendered Dropdown Menu */}
            {isOpen &&
                dropdownPos &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={menuRef}
                        style={{
                            position: 'fixed',
                            top: dropdownPos.top !== undefined ? `${dropdownPos.top}px` : undefined,
                            bottom: dropdownPos.bottom !== undefined ? `${dropdownPos.bottom}px` : undefined,
                            left: dropdownPos.left !== undefined ? `${dropdownPos.left}px` : undefined,
                            right: dropdownPos.right !== undefined ? `${dropdownPos.right}px` : undefined,
                            width: `${dropdownPos.width}px`,
                            zIndex: 999999,
                        }}
                        className="bg-white rounded-2xl shadow-2xl shadow-blue-950/20 border border-gray-200 p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        dir="rtl"
                    >
                        <div className="px-2.5 py-1.5 text-[10px] font-bold text-gray-400 border-b border-gray-100 mb-1">
                            تحديث حالة المريض بالاستقبال
                        </div>

                        {statusOptions.map((opt) => {
                            const isSelected = opt.value === value;

                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-right cursor-pointer group',
                                        isSelected
                                            ? 'bg-blue-50 text-[#005ab5] font-bold'
                                            : 'hover:bg-gray-50 text-gray-700'
                                    )}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span className={cn('w-2 h-2 rounded-full shrink-0', opt.dotColor)} />
                                        <div className="truncate">
                                            <div className="truncate font-bold font-['Cairo'] text-xs">
                                                {opt.label}
                                            </div>
                                            {opt.sublabel && (
                                                <div className="text-[10px] text-gray-400 font-normal truncate">
                                                    {opt.sublabel}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <Check className="w-3.5 h-3.5 text-[#005ab5] shrink-0 mr-1.5" />
                                    )}
                                </button>
                            );
                        })}
                    </div>,
                    document.body
                )}
        </div>
    );
};

