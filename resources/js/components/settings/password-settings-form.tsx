import React, { FormEventHandler, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Lock, Check, ShieldCheck, KeyRound } from 'lucide-react';
import { PasswordInput } from '@/components/common/password-input';
import { LoadingButton } from '@/components/common/loading-button';
import { SurfaceCard } from '@/components/common/surface-card';

export const PasswordSettingsForm: React.FC = React.memo(() => {
    const currentPasswordRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
            },
            onError: (errs) => {
                if (errs.current_password) {
                    currentPasswordRef.current?.focus();
                } else if (errs.password) {
                    passwordRef.current?.focus();
                }
            },
        });
    };

    return (
        <SurfaceCard padding="lg" rounded="3xl">
            <form onSubmit={submit} className="space-y-6">
                <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-base font-black text-gray-900 font-['Cairo'] flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-[#005ab5]" />
                        <span>تغيير كلمة المرور والأمان</span>
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                        احرص على استخدام كلمة مرور قوية مكونة من حروف وأرقام ورموز لحماية حسابك الطبي وسجلاتك.
                    </p>
                </div>

                <div className="space-y-4.5 max-w-xl">
                    <PasswordInput
                        id="current_password"
                        name="current_password"
                        ref={currentPasswordRef}
                        label="كلمة المرور الحالية"
                        required
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        error={errors.current_password}
                        placeholder="أدخل كلمة المرور الحالية للتحقق"
                    />

                    <PasswordInput
                        id="password"
                        name="password"
                        ref={passwordRef}
                        label="كلمة المرور الجديدة"
                        required
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                        helperText="يجب أن لا تقل عن 8 أحرف وتحتوي على مزيج آمن"
                        placeholder="أدخل كلمة المرور الجديدة"
                    />

                    <PasswordInput
                        id="password_confirmation"
                        name="password_confirmation"
                        label="تأكيد كلمة المرور الجديدة"
                        required
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        error={errors.password_confirmation}
                        placeholder="أعد إدخال كلمة المرور الجديدة"
                    />
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                    <LoadingButton
                        type="submit"
                        variant="primary"
                        size="md"
                        loading={processing}
                        loadingText="جارٍ التحديث..."
                        icon={<Check className="w-4 h-4" />}
                    >
                        تحديث كلمة المرور
                    </LoadingButton>
                </div>
            </form>
        </SurfaceCard>
    );
});

PasswordSettingsForm.displayName = 'PasswordSettingsForm';
