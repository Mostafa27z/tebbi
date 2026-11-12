import React, { useState } from 'react';
import { Eye, EyeOff, Lock, AlertCircle, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string | boolean;
    helperText?: string;
    hideIcon?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ label, error, helperText, hideIcon = false, className, id, onKeyUp, onKeyDown, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const [capsLockActive, setCapsLockActive] = useState(false);
        const inputId = id || props.name || 'password-input';

        const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (typeof e.getModifierState === 'function') {
                setCapsLockActive(e.getModifierState('CapsLock'));
            }
        };

        return (
            <div className="w-full space-y-1.5 text-right">
                {label && (
                    <label htmlFor={inputId} className="block text-xs font-bold text-gray-700 font-['Cairo']">
                        {label}
                        {props.required && <span className="text-red-500 mr-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    {/* Lock Icon (Right side in RTL) */}
                    {!hideIcon && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center">
                            <Lock className="w-4 h-4" />
                        </div>
                    )}

                    <input
                        id={inputId}
                        ref={ref}
                        type={showPassword ? 'text' : 'password'}
                        className={cn(
                            'w-full h-11 px-3.5 rounded-xl border text-sm transition-all bg-white font-medium box-border',
                            !hideIcon ? 'pr-10' : 'pr-3.5',
                            'pl-11', // Space for Eye toggle
                            error
                                ? 'border-red-400 focus:outline-hidden focus:ring-2 focus:ring-red-400/20 focus:border-red-500'
                                : 'border-gray-200 hover:border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#005ab5]/20 focus:border-[#005ab5]',
                            className
                        )}
                        dir="ltr"
                        onKeyUp={(e) => {
                            handleKeyEvent(e);
                            onKeyUp?.(e);
                        }}
                        onKeyDown={(e) => {
                            handleKeyEvent(e);
                            onKeyDown?.(e);
                        }}
                        {...props}
                    />

                    {/* Capsule Eye Toggle Button (Left side in RTL) */}
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer select-none"
                        title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                {/* Capsule Caps Lock Indicator */}
                {capsLockActive && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg w-fit animate-in fade-in duration-150">
                        <ArrowUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>زر الحروف الكبيرة (Caps Lock) مفعّل</span>
                    </div>
                )}

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
PasswordInput.displayName = 'PasswordInput';
