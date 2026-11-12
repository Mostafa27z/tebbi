import React from 'react';
import { useForm } from '@inertiajs/react';
import { Mail, KeyRound } from 'lucide-react';
import { AuthLayout } from '@/components/common/auth-layout';
import { FormInput } from '@/components/common/form-input';
import { PasswordInput } from '@/components/common/password-input';
import { LoadingButton } from '@/components/common/loading-button';
import { toast } from '@/components/common/toast';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
            onError: (errs) => {
                const firstError = Object.values(errs)[0];
                toast.error(firstError || 'تعذر تعيين كلمة المرور، يرجى مراجعة البيانات المدخلة');
            },
        });
    };

    return (
        <AuthLayout
            title="تعيين كلمة مرور جديدة"
            subtitle="أدخل بريدك الإلكتروني وكلمة المرور الجديدة لإكمال استعادة الحساب"
            maxWidth="md"
        >
            <form onSubmit={submit} className="space-y-4">
                <FormInput
                    label="البريد الإلكتروني"
                    type="email"
                    required
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    icon={<Mail className="w-4 h-4 text-gray-400" />}
                    dir="ltr"
                />

                <PasswordInput
                    label="كلمة المرور الجديدة"
                    required
                    autoFocus
                    placeholder="••••••••"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                />

                <PasswordInput
                    label="تأكيد كلمة المرور"
                    required
                    placeholder="••••••••"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    error={errors.password_confirmation}
                />

                <LoadingButton
                    type="submit"
                    loading={processing}
                    loadingText="جارٍ حفظ كلمة المرور..."
                    variant="primary"
                    size="lg"
                    icon={<KeyRound className="w-4 h-4" />}
                    className="w-full h-11 rounded-xl text-sm font-bold mt-2"
                >
                    حفظ كلمة المرور الجديدة
                </LoadingButton>
            </form>
        </AuthLayout>
    );
}
