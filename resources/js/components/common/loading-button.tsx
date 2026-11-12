import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    loadingText?: string;
    variant?: 'primary' | 'secondary' | 'emerald' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
}

const variantStyles = {
    primary:
        'bg-[#005ab5] hover:bg-[#00458e] text-white shadow-md shadow-blue-500/20 active:scale-[0.98]',
    secondary:
        'bg-gray-100 hover:bg-gray-200 text-gray-800 active:scale-[0.98]',
    emerald:
        'bg-[#006b5c] hover:bg-[#005549] text-white shadow-md shadow-emerald-600/20 active:scale-[0.98]',
    outline:
        'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 active:scale-[0.98]',
    danger:
        'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 active:scale-[0.98]',
};

const sizeStyles = {
    sm: 'py-2 px-3.5 text-xs rounded-xl',
    md: 'py-2.5 px-5 text-xs rounded-2xl',
    lg: 'py-3.5 px-6 text-sm rounded-2xl',
};

export const LoadingButton: React.FC<LoadingButtonProps> = ({
    children,
    loading = false,
    loadingText,
    disabled,
    variant = 'primary',
    size = 'md',
    icon,
    className,
    onClick,
    ...props
}) => {
    const isLocked = loading || disabled;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Strict Double-Click Lockout Guard
        if (isLocked) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <button
            type="button"
            disabled={isLocked}
            aria-disabled={isLocked}
            onClick={handleClick}
            className={cn(
                'inline-flex items-center justify-center gap-2 font-bold transition-all duration-150 select-none cursor-pointer',
                sizeStyles[size],
                variantStyles[variant],
                isLocked &&
                    'opacity-60 cursor-not-allowed pointer-events-none active:scale-100 shadow-none',
                className
            )}
            {...props}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>{loadingText || children}</span>
                </>
            ) : (
                <>
                    {icon && <span className="shrink-0">{icon}</span>}
                    <span>{children}</span>
                </>
            )}
        </button>
    );
};

