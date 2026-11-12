import React from 'react';
import { Search, X, Plus } from 'lucide-react';
import { CustomSelect } from './custom-select';
import { cn } from '@/lib/utils';

export interface ToolbarFilterOption {
    value: string | number;
    label: string;
}

export interface ToolbarFilter {
    id: string;
    label?: string;
    value: string | number;
    onChange: (value: string) => void;
    options: ToolbarFilterOption[];
    className?: string;
}

export interface TableToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    filters?: ToolbarFilter[];
    actionLabel?: string;
    onAction?: () => void;
    actionIcon?: React.ReactNode;
    actionVariant?: 'primary' | 'secondary' | 'emerald';
    className?: string;
    children?: React.ReactNode;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
    search,
    onSearchChange,
    searchPlaceholder = 'ابحث هنا...',
    filters = [],
    actionLabel,
    onAction,
    actionIcon = <Plus className="w-4 h-4" />,
    actionVariant = 'primary',
    className,
    children,
}) => {
    const actionBgClasses = {
        primary: 'bg-[#005ab5] hover:bg-[#00458e] text-white shadow-blue-500/20',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-gray-400/20',
        emerald: 'bg-[#006b5c] hover:bg-[#005549] text-white shadow-emerald-600/20',
    };

    return (
        <div
            className={cn(
                'flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3',
                className
            )}
            dir="rtl"
        >
            {/* Search Input & Select Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                {/* Search Box */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full h-11 pr-10 pl-9 rounded-2xl bg-white border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden transition-all shadow-xs"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                            title="مسح البحث"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Dropdowns */}
                {filters.map((filter) => (
                    <div
                        key={filter.id}
                        className={cn('w-full sm:w-52 shrink-0', filter.className)}
                    >
                        <CustomSelect
                            value={filter.value}
                            onChange={(val) => filter.onChange(String(val))}
                            options={filter.options}
                        />
                    </div>
                ))}
            </div>

            {/* Action Button & Extra Slots */}
            <div className="flex items-center gap-2 shrink-0">
                {children}

                {actionLabel && onAction && (
                    <button
                        type="button"
                        onClick={onAction}
                        className={cn(
                            'px-5 h-11 rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]',
                            actionBgClasses[actionVariant]
                        )}
                    >
                        {actionIcon}
                        <span>{actionLabel}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

