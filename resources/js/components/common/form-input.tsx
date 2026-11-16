import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    labelAction?: React.ReactNode;
    error?: string | boolean;
    helperText?: React.ReactNode;
    icon?: React.ReactNode;
    endAdornment?: React.ReactNode;
    containerClassName?: string;
    inputSize?: 'sm' | 'md' | 'lg';
}

const inputSizeStyles = {
    sm: 'h-9.5 text-xs rounded-xl',
    md: 'h-11 text-sm rounded-xl',
    lg: 'h-12 text-sm rounded-2xl',
};

export const FormInput = React.memo(
    React.forwardRef<HTMLInputElement, FormInputProps>(
        (
            {
                label,
                labelAction,
                error,
                helperText,
                icon,
                endAdornment,
                containerClassName,
                inputSize = 'md',
                className,
                id,
                ...props
            },
            ref
        ) => {
            const inputId = id || props.name;

            return (
                <div className={cn('w-full space-y-1.5 text-right', containerClassName)}>
                    {(label || labelAction) && (
                        <div className="flex items-center justify-between gap-2">
                            {label && (
                                <label
                                    htmlFor={inputId}
                                    className="block text-xs font-bold text-slate-700 font-['Cairo'] flex items-center gap-1.5"
                                >
                                    <span>{label}</span>
                                    {props.required && <span className="text-red-500">*</span>}
                                </label>
                            )}
                            {labelAction && (
                                <div className="text-[11px] text-slate-400 font-normal shrink-0">
                                    {labelAction}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="relative">
                        {icon && (
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                                {icon}
                            </div>
                        )}
                        <input
                            id={inputId}
                            ref={ref}
                            className={cn(
                                'w-full px-3.5 border transition-colors duration-150 bg-white font-medium box-border text-slate-900 placeholder:text-slate-400',
                                inputSizeStyles[inputSize],
                                icon ? 'pr-10' : 'pr-3.5',
                                endAdornment ? 'pl-10' : 'pl-3.5',
                                error
                                    ? 'border-red-400 focus:outline-hidden focus:ring-2 focus:ring-red-400/20 focus:border-red-500'
                                    : 'border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#005ab5]/15 focus:border-[#005ab5]',
                                className
                            )}
                            {...props}
                        />
                        {endAdornment && (
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                {endAdornment}
                            </div>
                        )}
                    </div>
                    {typeof error === 'string' && error && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-bold">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{error}</span>
                        </p>
                    )}
                    {helperText && !error && (
                        <div className="text-[11px] text-slate-500 mt-1">{helperText}</div>
                    )}
                </div>
            );
        }
    )
);
FormInput.displayName = 'FormInput';
