import React from 'react';
import { useForm } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { AuthLayout } from '@/components/common/auth-layout';
import { PasswordInput } from '@/components/common/password-input';
import { LoadingButton } from '@/components/common/loading-button';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="تأكيد كلمة المرور"
            subtitle="هذه منطقة آمنة في المنصة الطبية. يرجى تأكيد كلمة المرور الخاصة بك للمتابعة."
            maxWidth="md"
        >
            <form onSubmit={submit} className="space-y-4">
                <PasswordInput
                    label="كلمة المرور"
                    required
                    autoFocus
                    placeholder="••••••••"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                />

                <LoadingButton
                    type="submit"
                    loading={processing}
                    loadingText="جارٍ التأكيد..."
                    variant="primary"
                    size="lg"
                    icon={<KeyRound className="w-4 h-4" />}
                    className="w-full h-11 rounded-xl text-sm font-bold mt-2"
                >
                    تأكيد المتابعة
                </LoadingButton>
            </form>
        </AuthLayout>
    );
}
