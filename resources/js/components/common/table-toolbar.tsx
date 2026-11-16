import React from 'react';
import { Plus } from 'lucide-react';
import { CustomSelect } from './custom-select';
import { SearchBox } from './search-box';
import { AppButton, AppButtonVariant } from './loading-button';
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
    actionVariant?: AppButtonVariant;
    className?: string;
    children?: React.ReactNode;
}

export const TableToolbar: React.FC<TableToolbarProps> = React.memo(({
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
                <SearchBox
                    value={search}
                    onChange={onSearchChange}
                    placeholder={searchPlaceholder}
                    containerClassName="flex-1 min-w-[200px]"
                />

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
                    <AppButton
                        type="button"
                        variant={actionVariant}
                        icon={actionIcon}
                        onClick={onAction}
                    >
                        {actionLabel}
                    </AppButton>
                )}
            </div>
        </div>
    );
});
TableToolbar.displayName = 'TableToolbar';
