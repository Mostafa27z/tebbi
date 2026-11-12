import React, { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AuthLayoutProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    status?: string;
    footerText?: string;
    footerLinkText?: string;
    footerLinkHref?: string;
    maxWidth?: 'md' | 'lg' | 'xl' | '2xl';
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
    title,
    subtitle,
    children,
    status,
    footerText,
    footerLinkText,
    footerLinkHref,
    maxWidth = 'md',
}) => {
    const maxWidthClasses = {
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
    };

    useEffect(() => {
        if (status) {
            toast.success(status);
        }
    }, [status]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#005ab5]/5 via-[#f8fafc] to-[#006b5c]/5 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-['Tajawal']" dir="rtl">
            <Head title={`طبيبي - ${title}`} />

            {/* Logo & Header */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link href="/" className="inline-flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#005ab5] to-[#0072e2] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div className="text-right">
                        <span className="font-black text-2xl tracking-tight text-[#005ab5] font-['Cairo'] block leading-tight">طبيبي</span>
                        <span className="text-[11px] text-gray-500 font-medium">منصة الحجز الذكي والتتبع الحي</span>
                    </div>
                </Link>

                <h2 className="mt-5 text-xl sm:text-2xl font-black text-gray-900 font-['Cairo'] tracking-tight">
                    {title}
                </h2>
                {subtitle && (
                    <p className="mt-1.5 text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Main Form Card */}
            <div className={cn('mt-6 sm:mx-auto sm:w-full px-4', maxWidthClasses[maxWidth])}>
                <div className="bg-white py-7 px-5 sm:px-8 shadow-xl shadow-blue-900/5 rounded-3xl border border-gray-100">
                    {children}

                    {footerText && footerLinkText && footerLinkHref && (
                        <div className="mt-6 text-center text-xs text-gray-500 pt-4 border-t border-gray-100 font-medium">
                            {footerText}{' '}
                            <Link href={footerLinkHref} className="font-bold text-[#005ab5] hover:underline">
                                {footerLinkText}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
