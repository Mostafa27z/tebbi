import React, { FormEventHandler } from 'react';
import { useForm } from '@inertiajs/react';
import { User, Mail, Phone, CreditCard, Calendar, Check, ShieldCheck } from 'lucide-react';
import { FormInput } from '@/components/common/form-input';
import { LoadingButton } from '@/components/common/loading-button';
import { SurfaceCard } from '@/components/common/surface-card';

interface ProfilePersonalFormProps {
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string | null;
        national_id?: string | null;
        gender?: string | null;
        dob?: string | null;
        role: string;
    };
    onUpdated?: () => void;
}

export const ProfilePersonalForm: React.FC<ProfilePersonalFormProps> = React.memo(({
    user,
    onUpdated,
}) => {
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        national_id: user.national_id || '',
        gender: user.gender || '',
        dob: user.dob ? user.dob.split('T')[0] : '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => {
                onUpdated?.();
            },
        });
    };

    return (
        <SurfaceCard padding="lg" rounded="3xl">
            <form onSubmit={submit} className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                        <h3 className="text-base font-black text-gray-900 font-['Cairo'] flex items-center gap-2">
                            <User className="w-5 h-5 text-[#005ab5]" />
                            <span>المعلومات الشخصية والاتصال</span>
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                            تحديث الاسم، البريد الإلكتروني، رقم الجوال، وبيانات الهوية المسجلة في حسابك.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                    {/* Name */}
                    <FormInput
                        id="name"
                        name="name"
                        label="الاسم بالكامل"
                        required
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        error={errors.name}
                        placeholder="أدخل الاسم الثلاثي أو الرباعي"
                        icon={<User className="w-4 h-4 text-gray-400" />}
                    />

                    {/* Email */}
                    <FormInput
                        id="email"
                        name="email"
                        type="email"
                        label="البريد الإلكتروني"
                        required
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        placeholder="example@domain.com"
                        icon={<Mail className="w-4 h-4 text-gray-400" />}
                        dir="ltr"
                    />

                    {/* Phone */}
                    <FormInput
                        id="phone"
                        name="phone"
                        label="رقم الجوال / الهاتف"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        error={errors.phone}
                        placeholder="05XXXXXXXX أو 01XXXXXXXXX"
                        icon={<Phone className="w-4 h-4 text-gray-400" />}
                        dir="ltr"
                    />

                    {/* National ID */}
                    <FormInput
                        id="national_id"
                        name="national_id"
                        label="رقم الهوية الوطنية / الإقامة / الرقم القومي"
                        value={data.national_id}
                        onChange={(e) => setData('national_id', e.target.value)}
                        error={errors.national_id}
                        placeholder="أدخل رقم الهوية المسجل"
                        icon={<CreditCard className="w-4 h-4 text-gray-400" />}
                    />

                    {/* Gender */}
                    <div className="w-full space-y-1.5 text-right">
                        <label
                            htmlFor="gender"
                            className="block text-xs font-bold text-slate-700 font-['Cairo']"
                        >
                            الجنس
                        </label>
                        <select
                            id="gender"
                            name="gender"
                            value={data.gender}
                            onChange={(e) => setData('gender', e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-[#005ab5]/20 focus:border-[#005ab5] transition-all"
                        >
                            <option value="">-- اختر الجنس --</option>
                            <option value="male">ذكر</option>
                            <option value="female">أنثى</option>
                        </select>
                        {errors.gender && (
                            <p className="text-xs text-red-500 font-bold mt-1">{errors.gender}</p>
                        )}
                    </div>

                    {/* DOB */}
                    <FormInput
                        id="dob"
                        name="dob"
                        type="date"
                        label="تاريخ الميلاد"
                        value={data.dob}
                        onChange={(e) => setData('dob', e.target.value)}
                        error={errors.dob}
                        icon={<Calendar className="w-4 h-4 text-gray-400" />}
                    />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-[11px] text-gray-400">
                        * الحقول المطلوبة ملزمة لتحديث حسابك.
                    </p>

                    <div className="flex items-center gap-3">
                        <LoadingButton
                            type="submit"
                            variant="primary"
                            size="md"
                            loading={processing}
                            loadingText="جارٍ الحفظ..."
                            icon={<Check className="w-4 h-4" />}
                        >
                            حفظ التعديلات
                        </LoadingButton>
                    </div>
                </div>
            </form>
        </SurfaceCard>
    );
});

ProfilePersonalForm.displayName = 'ProfilePersonalForm';
