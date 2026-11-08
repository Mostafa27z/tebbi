import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    Lock, 
    Mail, 
    CheckCircle2, 
    AlertCircle,
    ArrowLeft
} from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#005ab5]/5 via-[#f7f9fb] to-[#006b5c]/5 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Tajawal']" dir="rtl">
            <Head title="طبيبي - تسجيل الدخول إلى حسابك" />

            {/* Logo & Header */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link href="/" className="inline-flex items-center gap-3 group">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#005ab5] to-[#0072e2] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[32px]">health_and_safety</span>
                    </div>
                    <div className="text-right">
                        <span className="font-extrabold text-3xl tracking-tight text-[#005ab5] font-['Cairo'] block">طبيبي</span>
                        <span className="text-xs text-gray-500 font-medium">منصة الحجز الذكي والتتبع الحي</span>
                    </div>
                </Link>

                <h2 className="mt-6 text-2xl font-black text-gray-900 font-['Cairo']">
                    تسجيل الدخول إلى حسابك
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                    أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم والخدمات الطبية
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
                <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-blue-900/5 rounded-3xl border border-gray-100">
                    {/* Status Message */}
                    {status && (
                        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                البريد الإلكتروني
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                                <input
                                    type="email"
                                    required
                                    autoFocus
                                    placeholder="name@example.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden"
                                    dir="ltr"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>{errors.email}</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-gray-700">
                                    كلمة المرور
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-[11px] font-bold text-[#005ab5] hover:underline"
                                    >
                                        نسيت كلمة المرور؟
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden"
                                    dir="ltr"
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>{errors.password}</span>
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded text-[#005ab5] focus:ring-[#005ab5] w-4 h-4"
                                />
                                <span className="text-xs text-gray-600 font-semibold">تذكر تسجيل دخولي</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 px-4 rounded-xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                        >
                            <span>{processing ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}</span>
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-600">
                            ليس لديك حساب بعد؟{' '}
                            <Link href={route('register')} className="font-bold text-[#005ab5] hover:underline">
                                إنشاء حساب جديد الآن
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
