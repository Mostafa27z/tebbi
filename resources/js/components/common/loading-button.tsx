import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AppButtonVariant =
    | 'primary'
    | 'secondary'
    | 'emerald'
    | 'amber'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'blue-soft'
    | 'emerald-soft'
    | 'amber-soft'
    | 'danger-soft';

export type AppButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    loadingText?: string;
    variant?: AppButtonVariant;
    size?: AppButtonSize;
    icon?: React.ReactNode;
    iconPosition?: 'start' | 'end';
    fullWidth?: boolean;
}

export type AppButtonProps = LoadingButtonProps;

const variantStyles: Record<AppButtonVariant, string> = {
    primary:
        'bg-[#005ab5] hover:bg-[#00458e] text-white shadow-xs border border-transparent',
    secondary:
        'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-transparent',
    emerald:
        'bg-[#059669] hover:bg-[#047857] text-white shadow-xs border border-transparent',
    amber:
        'bg-amber-600 hover:bg-amber-700 text-white shadow-xs border border-transparent',
    outline:
        'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
    ghost:
        'bg-transparent hover:bg-slate-100 text-slate-600 border border-transparent',
    danger:
        'bg-red-600 hover:bg-red-700 text-white shadow-xs border border-transparent',
    'blue-soft':
        'bg-blue-50 hover:bg-blue-100 text-[#005ab5] border border-blue-200',
    'emerald-soft':
        'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200',
    'amber-soft':
        'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200',
    'danger-soft':
        'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200',
};

const sizeStyles: Record<AppButtonSize, string> = {
    xs: 'h-8 px-3 text-[11px] rounded-xl gap-1.5',
    sm: 'h-9 px-3.5 text-xs rounded-xl gap-1.5',
    md: 'h-10.5 px-5 text-xs rounded-2xl gap-2',
    lg: 'h-12 px-6 text-sm rounded-2xl gap-2',
    icon: 'h-10 w-10 p-0 rounded-xl',
};

export const AppButton = React.memo(
    React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
        (
            {
                children,
                loading = false,
                loadingText,
                disabled,
                variant = 'primary',
                size = 'md',
                icon,
                iconPosition = 'start',
                fullWidth = false,
                className,
                onClick,
                type = 'button',
                ...props
            },
            ref
        ) => {
            const isLocked = loading || disabled;

            const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                if (isLocked) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                onClick?.(e);
            };

            return (
                <button
                    ref={ref}
                    type={type}
                    disabled={isLocked}
                    aria-disabled={isLocked}
                    onClick={handleClick}
                    className={cn(
                        "inline-flex items-center justify-center font-bold font-['Cairo'] transition-colors duration-150 select-none cursor-pointer whitespace-nowrap",
                        sizeStyles[size],
                        variantStyles[variant],
                        fullWidth && 'w-full',
                        isLocked && 'opacity-55 cursor-not-allowed pointer-events-none shadow-none',
                        className
                    )}
                    {...props}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            {(loadingText || children) && <span>{loadingText || children}</span>}
                        </>
                    ) : (
                        <>
                            {icon && iconPosition === 'start' && (
                                <span className="shrink-0 inline-flex items-center">{icon}</span>
                            )}
                            {children !== undefined && children !== null && <span>{children}</span>}
                            {icon && iconPosition === 'end' && (
                                <span className="shrink-0 inline-flex items-center">{icon}</span>
                            )}
                        </>
                    )}
                </button>
            );
        }
    )
);
AppButton.displayName = 'AppButton';

export const LoadingButton = AppButton;
