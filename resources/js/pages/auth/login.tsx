import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Mail, LogIn } from 'lucide-react';
import { AuthLayout } from '@/components/common/auth-layout';
import { FormInput } from '@/components/common/form-input';
import { PasswordInput } from '@/components/common/password-input';
import { LoadingButton } from '@/components/common/loading-button';
import toast from 'react-hot-toast';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

interface LoginForm {
    [key: string]: any;
    email: string;
    password: string;
    remember: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: true,
    });

    const hasAuthError = !!(errors.email || errors.password);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
            onError: (errs) => {
                const message = errs.email || errs.password || 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                toast.error(message);
            },
        });
    };

    return (
        <AuthLayout
            title="تسجيل الدخول إلى حسابك"
            subtitle="أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم والخدمات الطبية"
            status={status}
            maxWidth="md"
            footerText="ليس لديك حساب بعد؟"
            footerLinkText="إنشاء حساب جديد فوراً"
            footerLinkHref={route('register')}
        >
            <form onSubmit={submit} className="space-y-4">
                <FormInput
                    label="البريد الإلكتروني"
                    type="email"
                    required
                    autoFocus
                    placeholder="name@example.com"
                    icon={<Mail className="w-4 h-4 text-gray-400" />}
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={hasAuthError}
                    dir="ltr"
                />

                <div>
                    <PasswordInput
                        label="كلمة المرور"
                        required
                        placeholder="••••••••"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={hasAuthError}
                    />

                    {/* Forgot password link placed UNDER the input on the left */}
                    {canResetPassword && (
                        <div className="flex justify-end mt-1.5">
                            <Link
                                href={route('password.request')}
                                className="text-xs font-bold text-[#005ab5] hover:underline"
                            >
                                نسيت كلمة المرور؟
                            </Link>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded-md text-[#005ab5] focus:ring-[#005ab5] w-4 h-4 border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs text-gray-600 font-medium">تذكر تسجيل دخولي</span>
                    </label>
                </div>

                <LoadingButton
                    type="submit"
                    loading={processing}
                    loadingText="جارٍ تسجيل الدخول..."
                    variant="primary"
                    size="lg"
                    icon={<LogIn className="w-4 h-4" />}
                    className="w-full mt-2"
                >
                    تسجيل الدخول
                </LoadingButton>
            </form>
        </AuthLayout>
    );
}
