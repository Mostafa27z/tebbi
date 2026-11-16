import React from 'react';
import { cn } from '@/lib/utils';
import { AppButton, AppButtonVariant } from './loading-button';

/* ============================================================================
 * 1. SurfaceCard — Reusable Div Container for Cards, Panels, and Sections
 * ============================================================================ */
export type SurfaceCardVariant = 'default' | 'muted' | 'blue' | 'emerald' | 'amber' | 'danger';
export type SurfaceCardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: SurfaceCardVariant;
    padding?: SurfaceCardPadding;
    rounded?: 'xl' | '2xl' | '3xl';
}

const surfaceVariantStyles: Record<SurfaceCardVariant, string> = {
    default: 'bg-white border-slate-200/80 shadow-xs',
    muted: 'bg-slate-50/80 border-slate-200/80',
    blue: 'bg-blue-50/50 border-blue-100',
    emerald: 'bg-emerald-50/50 border-emerald-100',
    amber: 'bg-amber-50/60 border-amber-200/70',
    danger: 'bg-red-50/50 border-red-100',
};

const surfacePaddingStyles: Record<SurfaceCardPadding, string> = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-6',
};

const surfaceRoundedStyles = {
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
};

export const SurfaceCard = React.memo(
    React.forwardRef<HTMLDivElement, SurfaceCardProps>(
        (
            {
                variant = 'default',
                padding = 'lg',
                rounded = '3xl',
                className,
                children,
                ...props
            },
            ref
        ) => {
            return (
                <div
                    ref={ref}
                    className={cn(
                        'border',
                        surfaceVariantStyles[variant],
                        surfacePaddingStyles[padding],
                        surfaceRoundedStyles[rounded],
                        className
                    )}
                    {...props}
                >
                    {children}
                </div>
            );
        }
    )
);
SurfaceCard.displayName = 'SurfaceCard';

/* ============================================================================
 * 2. SectionHeader — Reusable Header Div with Icon, Title, Subtitle & Actions
 * ============================================================================ */
export interface SectionHeaderProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    icon?: React.ReactNode;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = React.memo(({
    title,
    description,
    icon,
    badge,
    actions,
    className,
}) => {
    return (
        <div
            className={cn(
                'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3',
                className
            )}
            dir="rtl"
        >
            <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    {icon && <span className="shrink-0 text-[#005ab5]">{icon}</span>}
                    <h2 className="text-base sm:text-lg font-black text-slate-900 font-['Cairo']">
                        {title}
                    </h2>
                    {badge && <span className="shrink-0">{badge}</span>}
                </div>
                {description && (
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
});
SectionHeader.displayName = 'SectionHeader';

/* ============================================================================
 * 3. ModalFooter — Reusable Action Bar at Bottom of Modals & Forms
 * ============================================================================ */
export interface ModalFooterProps {
    onCancel?: () => void;
    cancelText?: string;
    submitText: string;
    loading?: boolean;
    loadingText?: string;
    disabled?: boolean;
    submitVariant?: AppButtonVariant;
    submitIcon?: React.ReactNode;
    submitType?: 'submit' | 'button';
    onSubmitClick?: () => void;
    fullWidthSubmit?: boolean;
    className?: string;
    extraActions?: React.ReactNode;
}

export const ModalFooter: React.FC<ModalFooterProps> = React.memo(({
    onCancel,
    cancelText = 'إلغاء',
    submitText,
    loading = false,
    loadingText,
    disabled = false,
    submitVariant = 'primary',
    submitIcon,
    submitType = 'submit',
    onSubmitClick,
    fullWidthSubmit = false,
    className,
    extraActions,
}) => {
    return (
        <div
            className={cn(
                'flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100',
                className
            )}
            dir="rtl"
        >
            {extraActions}
            {onCancel && !fullWidthSubmit && (
                <AppButton
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    {cancelText}
                </AppButton>
            )}
            <AppButton
                type={submitType}
                variant={submitVariant}
                loading={loading}
                loadingText={loadingText}
                disabled={disabled}
                icon={submitIcon}
                fullWidth={fullWidthSubmit}
                onClick={onSubmitClick}
            >
                {submitText}
            </AppButton>
        </div>
    );
});
ModalFooter.displayName = 'ModalFooter';

/* ============================================================================
 * 4. ChoicePillGroup — Reusable Option / Status / Tab Selector Buttons
 * ============================================================================ */
export interface ChoicePillOption<T extends string | number = string> {
    value: T;
    label: React.ReactNode;
    sublabel?: React.ReactNode;
    icon?: React.ReactNode;
    dotColor?: string;
    activeTone?: 'blue' | 'emerald' | 'amber' | 'danger' | 'indigo' | 'teal';
}

export interface ChoicePillGroupProps<T extends string | number = string> {
    label?: React.ReactNode;
    value: T;
    onChange: (value: T) => void;
    options: ChoicePillOption<T>[];
    columns?: 1 | 2 | 3 | 4;
    size?: 'sm' | 'md';
    className?: string;
}

const activeToneStyles = {
    blue: 'bg-blue-50 text-[#005ab5] border-[#005ab5] ring-1 ring-[#005ab5]/20 shadow-2xs',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500/20 shadow-2xs',
    amber: 'bg-amber-50 text-amber-800 border-amber-500 ring-1 ring-amber-500/20 shadow-2xs',
    danger: 'bg-red-50 text-red-800 border-red-400 ring-1 ring-red-400/20 shadow-2xs',
    indigo: 'bg-indigo-50 text-indigo-800 border-indigo-500 ring-1 ring-indigo-500/20 shadow-2xs',
    teal: 'bg-teal-50 text-teal-800 border-teal-500 ring-1 ring-teal-500/20 shadow-2xs',
};

const gridColsMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
};

export function ChoicePillGroup<T extends string | number = string>({
    label,
    value,
    onChange,
    options,
    columns = 2,
    size = 'md',
    className,
}: ChoicePillGroupProps<T>) {
    return (
        <div className={cn('space-y-1.5', className)} dir="rtl">
            {label && (
                <label className="block text-xs font-bold text-slate-700 font-['Cairo']">
                    {label}
                </label>
            )}
            <div className={cn('grid gap-2.5', gridColsMap[columns])}>
                {options.map((opt) => {
                    const isSelected = opt.value === value;
                    const tone = opt.activeTone || 'blue';
                    return (
                        <button
                            key={String(opt.value)}
                            type="button"
                            onClick={() => onChange(opt.value)}
                            className={cn(
                                "rounded-2xl border font-bold font-['Cairo'] transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer select-none text-center",
                                size === 'sm' ? 'py-2 px-3 text-xs' : 'py-2.5 px-3.5 text-xs',
                                isSelected
                                    ? activeToneStyles[tone]
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                            )}
                        >
                            {opt.dotColor && (
                                <span className={cn('w-2 h-2 rounded-full shrink-0', opt.dotColor)} />
                            )}
                            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                            <div className="min-w-0">
                                <div>{opt.label}</div>
                                {opt.sublabel && (
                                    <div className="text-[10px] font-normal opacity-75 mt-0.5">
                                        {opt.sublabel}
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ============================================================================
 * 5. InfoBanner — Reusable Alert / Preview / Callout Div
 * ============================================================================ */
export interface InfoBannerProps {
    variant?: 'blue' | 'emerald' | 'amber' | 'danger' | 'slate';
    icon?: React.ReactNode;
    title?: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

const infoBannerStyles = {
    blue: 'bg-blue-50/70 border-blue-100 text-[#005ab5]',
    emerald: 'bg-emerald-50/70 border-emerald-100 text-emerald-800',
    amber: 'bg-amber-50/70 border-amber-200 text-amber-800',
    danger: 'bg-red-50/70 border-red-100 text-red-800',
    slate: 'bg-slate-50 border-slate-200/80 text-slate-700',
};

export const InfoBanner: React.FC<InfoBannerProps> = React.memo(({
    variant = 'blue',
    icon,
    title,
    children,
    actions,
    className,
}) => {
    return (
        <div
            className={cn(
                'p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs',
                infoBannerStyles[variant],
                className
            )}
            dir="rtl"
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                {icon && <span className="shrink-0">{icon}</span>}
                <div className="min-w-0 flex-1">
                    {title && <div className="font-bold mb-0.5">{title}</div>}
                    <div className="leading-relaxed">{children}</div>
                </div>
            </div>
            {actions && <div className="shrink-0">{actions}</div>}
        </div>
    );
});
InfoBanner.displayName = 'InfoBanner';

/* ============================================================================
 * 6. EmptyStateCard — Reusable Empty Table / List Placeholder Div
 * ============================================================================ */
export interface EmptyStateCardProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = React.memo(({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    className,
}) => {
    return (
        <div
            className={cn(
                'p-10 rounded-3xl bg-slate-50/60 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2.5',
                className
            )}
            dir="rtl"
        >
            {icon && (
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 text-slate-400 flex items-center justify-center shadow-2xs">
                    {icon}
                </div>
            )}
            <h3 className="text-sm font-bold text-slate-800 font-['Cairo']">{title}</h3>
            {description && <p className="text-xs text-slate-500 max-w-md">{description}</p>}
            {actionLabel && onAction && (
                <div className="mt-2">
                    <AppButton variant="primary" size="sm" onClick={onAction}>
                        {actionLabel}
                    </AppButton>
                </div>
            )}
        </div>
    );
});
EmptyStateCard.displayName = 'EmptyStateCard';
