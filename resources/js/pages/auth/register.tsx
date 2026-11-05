import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    Stethoscope, 
    User as UserIcon, 
    ShieldCheck, 
    Lock, 
    Mail, 
    Phone, 
    ArrowLeft, 
    AlertCircle, 
    Building2,
    Briefcase
} from 'lucide-react';

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

export default function Register({ specialties, clinics }: RegisterProps) {
    const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient');

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
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
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#005ab5]/5 via-[#f7f9fb] to-[#006b5c]/5 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Tajawal']" dir="rtl">
            <Head title="طبيبي - إنشاء حساب جديد" />

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
                    إنشاء حساب جديد
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                    اختر نوع الحساب وأكمل بياناتك للبدء فوراً في المنصة
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
                <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-blue-900/5 rounded-3xl border border-gray-100">
                    
                    {/* Role Selection Switcher */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-700 mb-2 font-['Cairo']">نوع الحساب:</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleRoleChange('patient')}
                                className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                                    selectedRole === 'patient'
                                        ? 'border-[#005ab5] bg-blue-50/60 ring-2 ring-[#005ab5]/20 text-[#005ab5]'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                            >
                                <UserIcon className="w-6 h-6" />
                                <span className="text-sm font-bold font-['Cairo']">حساب مريض</span>
                                <span className="text-[11px] text-gray-500">لحجز المواعيد وتتبع الدور الحي</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleRoleChange('doctor')}
                                className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                                    selectedRole === 'doctor'
                                        ? 'border-[#005ab5] bg-blue-50/60 ring-2 ring-[#005ab5]/20 text-[#005ab5]'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                            >
                                <Stethoscope className="w-6 h-6" />
                                <span className="text-sm font-bold font-['Cairo']">حساب طبيب / استشاري</span>
                                <span className="text-[11px] text-gray-500">لإدارة جدول العيادة والمرضى</span>
                            </button>
                        </div>
                    </div>

                    {/* Registration Form */}
                    <form onSubmit={submit} className="space-y-4">
                        {/* Name & Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">الاسم الكامل</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={selectedRole === 'doctor' ? 'د. عبدالله السعد' : 'محمد بن خالد'}
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden"
                                />
                                {errors.name && <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">رقم الجوال</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="05XXXXXXXX"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden text-left"
                                    dir="ltr"
                                />
                                {errors.phone && <p className="mt-1 text-[11px] text-red-600">{errors.phone}</p>}
                            </div>
                        </div>

                        {/* Email & National ID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="name@domain.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden text-left"
                                    dir="ltr"
                                />
                                {errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">رقم الهوية الوطنية / الإقامة</label>
                                <input
                                    type="text"
                                    placeholder="10XXXXXXXX"
                                    value={data.national_id}
                                    onChange={(e) => setData('national_id', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden text-left"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* Doctor Specific Fields */}
                        {selectedRole === 'doctor' && (
                            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-3">
                                <span className="block text-xs font-bold text-purple-900 font-['Cairo'] flex items-center gap-1.5">
                                    <Briefcase className="w-4 h-4" />
                                    <span>بيانات الاعتماد الطبي والعيادة:</span>
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">التخصص السريري</label>
                                        <select
                                            value={data.specialty_id}
                                            onChange={(e) => setData('specialty_id', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-600 bg-white"
                                        >
                                            {specialties.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name_ar}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">المستشفى / المجمع الطبي</label>
                                        <select
                                            value={data.clinic_id}
                                            onChange={(e) => setData('clinic_id', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-600 bg-white"
                                        >
                                            {clinics.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name} - {c.city}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">اللقب المهني والدرجة</label>
                                    <input
                                        type="text"
                                        placeholder="مثال: استشاري جراحة وزراعة الأسنان"
                                        value={data.title_ar}
                                        onChange={(e) => setData('title_ar', e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-600 bg-white"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password & Confirm */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">كلمة المرور</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden"
                                    dir="ltr"
                                />
                                {errors.password && <p className="mt-1 text-[11px] text-red-600">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">تأكيد كلمة المرور</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 px-4 rounded-xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 mt-4"
                        >
                            <span>{processing ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب ومتابعة'}</span>
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-600">
                            لديك حساب بالفعل؟{' '}
                            <Link href={route('login')} className="font-bold text-[#005ab5] hover:underline">
                                تسجيل الدخول الآن
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
