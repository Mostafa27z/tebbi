import React from 'react';
import { useForm } from '@inertiajs/react';
import { Mail, Send } from 'lucide-react';
import { AuthLayout } from '@/components/common/auth-layout';
import { FormInput } from '@/components/common/form-input';
import { LoadingButton } from '@/components/common/loading-button';
import { toast } from '@/components/common/toast';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.email'), {
            onError: (errs) => {
                toast.error(errs.email || 'تعذر الإرسال، يرجى التأكد من البريد الإلكتروني المدخل');
            },
        });
    };

    return (
        <AuthLayout
            title="استعادة كلمة المرور"
            subtitle="أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور فوراً"
            status={status}
            maxWidth="md"
            footerText="تذكرت كلمة المرور؟"
            footerLinkText="العودة لتسجيل الدخول"
            footerLinkHref={route('login')}
        >
            <form onSubmit={submit} className="space-y-5">
                <FormInput
                    label="البريد الإلكتروني"
                    type="email"
                    required
                    autoFocus
                    placeholder="name@example.com"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    icon={<Mail className="w-4 h-4 text-gray-400" />}
                    dir="ltr"
                />

                <LoadingButton
                    type="submit"
                    loading={processing}
                    loadingText="جارٍ إرسال الرابط..."
                    variant="primary"
                    size="lg"
                    icon={<Send className="w-4 h-4" />}
                    className="w-full h-11 rounded-xl text-sm font-bold"
                >
                    إرسال رابط استعادة كلمة المرور
                </LoadingButton>
            </form>
        </AuthLayout>
    );
}
