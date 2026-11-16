import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchBoxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'filled';
    badge?: React.ReactNode;
    containerClassName?: string;
}

const sizeClasses = {
    sm: 'h-9.5 text-xs rounded-xl pr-9 pl-8',
    md: 'h-11 text-xs rounded-2xl pr-10 pl-9',
    lg: 'h-12 text-sm rounded-2xl pr-11 pl-10',
};

export const SearchBox = React.memo(
    React.forwardRef<HTMLInputElement, SearchBoxProps>(
        (
            {
                value,
                onChange,
                placeholder = 'ابحث هنا...',
                size = 'md',
                variant = 'default',
                badge,
                containerClassName,
                className,
                ...props
            },
            ref
        ) => {
            return (
                <div className={cn('relative w-full', containerClassName)} dir="rtl">
                    <Search
                        className={cn(
                            'text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none',
                            size === 'lg' ? 'w-4.5 h-4.5' : 'w-4 h-4'
                        )}
                    />
                    <input
                        ref={ref}
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={cn(
                            'w-full border font-medium text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-hidden focus:ring-2 focus:ring-[#005ab5]/15 focus:border-[#005ab5]',
                            sizeClasses[size],
                            variant === 'filled'
                                ? 'bg-slate-50/90 hover:bg-white focus:bg-white border-slate-200/90'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs',
                            className
                        )}
                        {...props}
                    />
                    {value ? (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-colors cursor-pointer"
                            title="مسح البحث"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    ) : badge ? (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            {badge}
                        </div>
                    ) : null}
                </div>
            );
        }
    )
);
SearchBox.displayName = 'SearchBox';
