import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: React.ReactNode;
    labelAction?: React.ReactNode;
    error?: string | boolean;
    helperText?: React.ReactNode;
    containerClassName?: string;
}

export const FormTextarea = React.memo(
    React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
        (
            {
                label,
                labelAction,
                error,
                helperText,
                containerClassName,
                className,
                id,
                rows = 3,
                ...props
            },
            ref
        ) => {
            const textareaId = id || props.name;

            return (
                <div className={cn('w-full space-y-1.5 text-right', containerClassName)}>
                    {(label || labelAction) && (
                        <div className="flex items-center justify-between gap-2">
                            {label && (
                                <label
                                    htmlFor={textareaId}
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
                    <textarea
                        id={textareaId}
                        ref={ref}
                        rows={rows}
                        className={cn(
                            'w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors duration-150 bg-white font-medium text-slate-900 placeholder:text-slate-400 resize-y',
                            error
                                ? 'border-red-400 focus:outline-hidden focus:ring-2 focus:ring-red-400/20 focus:border-red-500'
                                : 'border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#005ab5]/15 focus:border-[#005ab5]',
                            className
                        )}
                        {...props}
                    />
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
FormTextarea.displayName = 'FormTextarea';
