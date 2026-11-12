import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string | boolean;
    helperText?: string;
    icon?: React.ReactNode;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, error, helperText, icon, className, id, ...props }, ref) => {
        const inputId = id || props.name;

        return (
            <div className="w-full space-y-1.5 text-right">
                {label && (
                    <label htmlFor={inputId} className="block text-xs font-bold text-gray-700 font-['Cairo']">
                        {label}
                        {props.required && <span className="text-red-500 mr-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center">
                            {icon}
                        </div>
                    )}
                    <input
                        id={inputId}
                        ref={ref}
                        className={cn(
                            'w-full h-11 px-3.5 rounded-xl border text-sm transition-all bg-white font-medium box-border',
                            icon ? 'pr-10' : 'pr-3.5',
                            error
                                ? 'border-red-400 focus:outline-hidden focus:ring-2 focus:ring-red-400/20 focus:border-red-500'
                                : 'border-gray-200 hover:border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#005ab5]/20 focus:border-[#005ab5]',
                            className
                        )}
                        {...props}
                    />
                </div>
                {typeof error === 'string' && error && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{error}</span>
                    </p>
                )}
                {helperText && !error && (
                    <p className="text-[11px] text-gray-500 mt-1">{helperText}</p>
                )}
            </div>
        );
    }
);
FormInput.displayName = 'FormInput';

