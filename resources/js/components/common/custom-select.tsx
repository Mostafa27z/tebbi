import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CustomSelectOption {
    value: string | number;
    label: string;
    sublabel?: string;
    icon?: React.ReactNode;
}

interface CustomSelectProps {
    value: string | number;
    onChange: (value: string | number) => void;
    options: CustomSelectOption[];
    placeholder?: string;
    label?: string;
    error?: string;
    className?: string;
    icon?: React.ReactNode;
    size?: 'sm' | 'md';
    menuWidth?: 'trigger' | 'auto' | number;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'اختر من القائمة...',
    label,
    error,
    className,
    icon,
    size = 'md',
    menuWidth,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
        width: number;
        maxHeight: number;
    } | null>(null);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));
    const isSmall = size === 'sm';

    // Dynamic viewport positioning (flips upwards if not enough space below)
    const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const minHeightNeeded = 180;
        const openUpwards = spaceBelow < minHeightNeeded && spaceAbove > spaceBelow;

        let computedWidth = rect.width;
        if (typeof menuWidth === 'number') {
            computedWidth = menuWidth;
        } else if (menuWidth === 'trigger') {
            computedWidth = rect.width;
        } else if (isSmall) {
            computedWidth = Math.max(rect.width, 100);
        } else {
            computedWidth = Math.max(rect.width, 180);
        }

        const availableHeight = openUpwards ? spaceAbove - 16 : spaceBelow - 16;
        const calculatedMaxHeight = Math.max(100, Math.min(260, availableHeight));

        const isRtl = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';

        let leftPos: number | undefined = undefined;
        let rightPos: number | undefined = undefined;

        if (isRtl) {
            let right = window.innerWidth - rect.right;
            if (right + computedWidth > window.innerWidth - 8) {
                right = Math.max(8, window.innerWidth - computedWidth - 8);
            }
            if (right < 8) right = 8;
            rightPos = right;
        } else {
            let left = rect.left;
            if (left + computedWidth > window.innerWidth - 8) {
                left = Math.max(8, window.innerWidth - computedWidth - 8);
            }
            if (left < 8) left = 8;
            leftPos = left;
        }

        setDropdownPosition({
            top: openUpwards ? undefined : rect.bottom + 6,
            bottom: openUpwards ? window.innerHeight - rect.top + 6 : undefined,
            left: leftPos,
            right: rightPos,
            width: computedWidth,
            maxHeight: calculatedMaxHeight,
        });
    };

    useEffect(() => {
        if (!isOpen) return;
        updatePosition();

        const handleScrollOrResize = () => {
            updatePosition();
        };

        window.addEventListener('resize', handleScrollOrResize);
        window.addEventListener('scroll', handleScrollOrResize, true);

        return () => {
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
        };
    }, [isOpen]);

    // Close on click outside (both button and portaled menu)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                buttonRef.current &&
                !buttonRef.current.contains(target) &&
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
        <div className={cn('relative w-full text-right', (label || error) && 'space-y-1.5', className)}>
            {label && (
                <label className="block text-xs font-bold text-gray-700 font-['Cairo']">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full bg-white border font-semibold transition-all duration-200 flex items-center justify-between gap-1.5 cursor-pointer select-none text-right box-border',
                    isSmall ? 'h-9 px-2.5 rounded-xl text-xs' : 'h-12 px-4 rounded-2xl text-xs sm:text-sm',
                    isOpen
                        ? 'border-[#005ab5] ring-2 ring-[#005ab5]/20 shadow-xs'
                        : error
                        ? 'border-red-400 ring-1 ring-red-400/20'
                        : 'border-gray-200 hover:border-gray-300'
                )}
            >
                <div className="flex items-center gap-1.5 truncate">
                    {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
                    {selectedOption ? (
                        <span className="text-gray-900 font-bold truncate">
                            {selectedOption.label}
                        </span>
                    ) : (
                        <span className="text-gray-400 font-normal truncate">{placeholder}</span>
                    )}
                </div>
                <ChevronDown
                    className={cn(
                        'w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200',
                        isOpen && 'rotate-180 text-[#005ab5]'
                    )}
                />
            </button>

            {/* Custom Dropdown Menu Rendered via Portal (Never Clipped by Modals, Cards or Tables) */}
            {isOpen &&
                dropdownPosition &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={menuRef}
                        style={{
                            position: 'fixed',
                            top: dropdownPosition.top !== undefined ? `${dropdownPosition.top}px` : undefined,
                            bottom: dropdownPosition.bottom !== undefined ? `${dropdownPosition.bottom}px` : undefined,
                            left: dropdownPosition.left !== undefined ? `${dropdownPosition.left}px` : undefined,
                            right: dropdownPosition.right !== undefined ? `${dropdownPosition.right}px` : undefined,
                            width: `${dropdownPosition.width}px`,
                            maxHeight: `${dropdownPosition.maxHeight}px`,
                            zIndex: 999999,
                        }}
                        className="bg-white rounded-2xl shadow-2xl shadow-blue-950/25 border border-gray-150 p-1 overflow-y-auto animate-in fade-in duration-100"
                        dir="rtl"
                    >
                        {options.map((opt) => {
                            const isSelected = String(opt.value) === String(value);
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        'w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs sm:text-sm transition-colors text-right cursor-pointer select-none',
                                        isSelected
                                            ? 'bg-blue-50 text-[#005ab5] font-bold'
                                            : 'hover:bg-gray-50 text-gray-700'
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 truncate">
                                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                                        <span className="truncate">{opt.label}</span>
                                        {opt.sublabel && (
                                            <span className="text-[11px] text-gray-400">({opt.sublabel})</span>
                                        )}
                                    </div>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-[#005ab5] shrink-0 mr-1.5" />}
                                </button>
                            );
                        })}
                    </div>,
                    document.body
                )}

            {error && <p className="text-[11px] text-red-600 font-bold mt-1">{error}</p>}
        </div>
    );
};
