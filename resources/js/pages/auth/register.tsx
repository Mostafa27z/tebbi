import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { 
    User as UserIcon, 
    Stethoscope, 
    Mail, 
    CreditCard, 
    UserPlus, 
    CheckCircle2, 
    Building2,
    Sparkles,
    ShieldCheck,
    Clock
} from 'lucide-react';
import { AuthLayout } from '@/components/common/auth-layout';
import { FormInput } from '@/components/common/form-input';
import { CustomSelect } from '@/components/common/custom-select';
import { PasswordInput } from '@/components/common/password-input';
import { InternationalPhoneInput } from '@/components/common/international-phone-input';
import { LoadingButton } from '@/components/common/loading-button';
import { toast } from '@/components/common/toast';

interface Specialty {
    id: number;
    name_ar: string;
}

interface Clinic {
    id: number;
    name: string;
    city: string;
}

interface RegisterProps {
    specialties: Specialty[];
    clinics: Clinic[];
}

interface RegisterForm {
    [key: string]: any;
    name: string;
    email: string;
    phone: string;
    role: 'patient' | 'doctor';
    national_id: string;
    specialty_id: string | number;
    clinic_id: string | number;
    title_ar: string;
    password: string;
    password_confirmation: string;
}

export default function Register({ specialties, clinics }: RegisterProps) {
    const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient');

    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        phone: '+966',
        role: 'patient',
        national_id: '',
        specialty_id: specialties[0]?.id || '',
        clinic_id: clinics[0]?.id || '',
        title_ar: 'استشاري معتمد',
        password: '',
        password_confirmation: '',
    });

    const handleRoleChange = (role: 'patient' | 'doctor') => {
        setSelectedRole(role);
        setData('role', role);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
            onError: (errs) => {
                const firstError = Object.values(errs)[0];
                toast.error(firstError || 'تعذر إنشاء الحساب، يرجى مراجعة البيانات والتأكد من صحتها');
            },
        });
    };

    return (
        <AuthLayout
            title="إنشاء حساب جديد في منصة طبيبي"
            subtitle="اختر نوع الحساب المناسب للبدء في الاستفادة من خدمات الحجز الذكي والتتبع المباشر"
            maxWidth="2xl"
            footerText="لديك حساب بالفعل؟"
            footerLinkText="تسجيل الدخول هنا"
            footerLinkHref={route('login')}
        >
            <form onSubmit={submit} className="space-y-6">
                {/* Modern Segmented Role Selector */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-800 font-['Cairo']">
                            اختر نوع الحساب:
                        </label>
                        <span className="text-[11px] font-semibold text-[#005ab5] flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>تسجيل فوري بدون رسوم</span>
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Patient Account Option */}
                        <button
                            type="button"
                            onClick={() => handleRoleChange('patient')}
                            className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3.5 cursor-pointer select-none ${
                                selectedRole === 'patient'
                                    ? 'border-[#005ab5] bg-blue-50/70 ring-2 ring-[#005ab5]/20 shadow-xs'
                                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                selectedRole === 'patient' ? 'bg-[#005ab5] text-white shadow-xs' : 'bg-gray-100 text-gray-500'
                            }`}>
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-black text-sm font-['Cairo'] text-gray-900 block">
                                        حساب مريض / مراجع
                                    </span>
                                    {selectedRole === 'patient' && (
                                        <CheckCircle2 className="w-4 h-4 text-[#005ab5] shrink-0" />
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                                    حجز المواعيد الفورية، تتبع الدور لحظياً عبر واتساب، وتغطية التأمين.
                                </p>
                            </div>
                        </button>

                        {/* Doctor Account Option */}
                        <button
                            type="button"
                            onClick={() => handleRoleChange('doctor')}
                            className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3.5 cursor-pointer select-none ${
                                selectedRole === 'doctor'
                                    ? 'border-[#005ab5] bg-blue-50/70 ring-2 ring-[#005ab5]/20 shadow-xs'
                                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                selectedRole === 'doctor' ? 'bg-[#005ab5] text-white shadow-xs' : 'bg-gray-100 text-gray-500'
                            }`}>
                                <Stethoscope className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-black text-sm font-['Cairo'] text-gray-900 block">
                                        طبيب / ممارس صحي
                                    </span>
                                    {selectedRole === 'doctor' && (
                                        <CheckCircle2 className="w-4 h-4 text-[#005ab5] shrink-0" />
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                                    إدارة طابور الانتظار الذكي، إصدار التذاكر والكشوفات الطبية.
                                </p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Role Feature Highlights */}
                {selectedRole === 'patient' ? (
                    <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100/80 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-[#005ab5] shrink-0" />
                        <div className="text-xs text-gray-700">
                            <span className="font-bold text-[#005ab5]">مميزات حساب المريض: </span>
                            تنبيهك عبر واتساب قبل موعد كشفك بـ 15 دقيقة مع إمكانية التتبع الحي لوقت الانتظار الفعلي.
                        </div>
                    </div>
                ) : (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-[#006b5c] shrink-0" />
                        <div className="text-xs text-gray-700">
                            <span className="font-bold text-[#006b5c]">مميزات الطبيب: </span>
                            ربط فوري بجدول مواعيد العيادة ومتابعة تدفق المراجعين في صالة الانتظار رقمياً.
                        </div>
                    </div>
                )}

                {/* Main Inputs Grid */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <FormInput
                            label={selectedRole === 'doctor' ? 'الاسم واللقب المهني' : 'الاسم الثلاثي للمريض'}
                            required
                            placeholder={selectedRole === 'doctor' ? 'مثال: د. عبدالمحسن الشمري' : 'محمد فهد الدوسري'}
                            icon={<UserIcon className="w-4 h-4 text-gray-400" />}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                        />

                        <FormInput
                            label="البريد الإلكتروني"
                            type="email"
                            required
                            placeholder="user@example.com"
                            icon={<Mail className="w-4 h-4 text-gray-400" />}
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            error={errors.email}
                            dir="ltr"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* International Phone Input with Flags */}
                        <InternationalPhoneInput
                            label="رقم الجوال (لاستلام تنبيهات الواتساب)"
                            required
                            value={data.phone}
                            onChange={(fullPhone) => setData('phone', fullPhone)}
                            error={errors.phone}
                        />

                        <FormInput
                            label="رقم الهوية الوطنية / الإقامة"
                            required={selectedRole === 'patient'}
                            placeholder="10xxxxxxxx"
                            icon={<CreditCard className="w-4 h-4 text-gray-400" />}
                            value={data.national_id}
                            onChange={(e) => setData('national_id', e.target.value)}
                            error={errors.national_id}
                            helperText={selectedRole === 'patient' ? 'مطلوب لمطابقة تغطية التأمين وفتح الملف الطبي' : undefined}
                            dir="ltr"
                        />
                    </div>

                    {/* Doctor-Specific Professional Credentials */}
                    {selectedRole === 'doctor' && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 border border-gray-200/90 space-y-3.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#005ab5] font-['Cairo']">
                                <Building2 className="w-4 h-4" />
                                <span>بيانات الاعتماد المهني والمنشأة الطبية</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <CustomSelect
                                    label="التخصص الطبي الرئيسي"
                                    value={data.specialty_id}
                                    onChange={(val) => setData('specialty_id', val)}
                                    error={errors.specialty_id}
                                    options={specialties.map((s) => ({ value: s.id, label: s.name_ar }))}
                                />

                                <CustomSelect
                                    label="المنشأة الطبية التابع لها"
                                    value={data.clinic_id}
                                    onChange={(val) => setData('clinic_id', val)}
                                    error={errors.clinic_id}
                                    options={clinics.map((c) => ({ value: c.id, label: `${c.name} (${c.city})` }))}
                                />
                            </div>

                            <FormInput
                                label="المسمى المهني / الدرجة العلمية"
                                required
                                placeholder="مثال: استشاري جراحة قلب وقسطرة تداخلية"
                                value={data.title_ar}
                                onChange={(e) => setData('title_ar', e.target.value)}
                                error={errors.title_ar}
                            />
                        </div>
                    )}

                    {/* Password Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <PasswordInput
                            label="كلمة المرور"
                            required
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
                    </div>
                </div>

                {/* Submit Button */}
                <LoadingButton
                    type="submit"
                    loading={processing}
                    loadingText="جارٍ إنشاء الحساب وتجهيز بياناتك..."
                    variant="primary"
                    size="lg"
                    icon={<UserPlus className="w-4 h-4" />}
                    className="w-full h-12 rounded-2xl text-sm font-bold shadow-sm"
                >
                    {selectedRole === 'doctor' ? 'تسجيل الطبيب وإرسال للاعتماد' : 'إنشاء حساب المريض فوراً'}
                </LoadingButton>
            </form>
        </AuthLayout>
    );
}
