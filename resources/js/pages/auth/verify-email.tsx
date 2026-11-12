import React from 'react';
import { useForm } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { AuthLayout } from '@/components/common/auth-layout';
import { LoadingButton } from '@/components/common/loading-button';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    const verificationLinkSent = status === 'verification-link-sent';

    return (
        <AuthLayout
            title="تأكيد البريد الإلكتروني"
            subtitle="شكراً لتسجيلك! قبل البدء، يرجى تأكيد بريدك الإلكتروني بالضغط على الرابط الذي أرسلناه لك."
            status={verificationLinkSent ? 'تم إرسال رابط تأكيد جديد إلى عنوان بريدك الإلكتروني المسجل.' : undefined}
            maxWidth="md"
            footerText="أو إذا أردت استخدام حساب آخر:"
            footerLinkText="تسجيل الخروج"
            footerLinkHref={route('logout')}
        >
            <form onSubmit={submit} className="space-y-4">
                <LoadingButton
                    type="submit"
                    loading={processing}
                    loadingText="جارٍ الإرسال..."
                    variant="primary"
                    size="lg"
                    icon={<Mail className="w-4 h-4" />}
                    className="w-full h-11 rounded-xl text-sm font-bold"
                >
                    إعادة إرسال رابط التأكيد
                </LoadingButton>
            </form>
        </AuthLayout>
    );
}
