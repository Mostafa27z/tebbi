import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    User, 
    KeyRound, 
    Camera, 
    ChevronRight, 
    ShieldCheck, 
    Building2, 
    Stethoscope, 
    HeartPulse,
    ArrowRight
} from 'lucide-react';
import { 
    AvatarUpload, 
    ProfilePersonalForm, 
    DoctorProfessionalForm, 
    PasswordSettingsForm 
} from '@/components/settings';
import { cn } from '@/lib/utils';

interface ProfileProps {
    profileUser: {
        id: number;
        name: string;
        email: string;
        phone?: string | null;
        national_id?: string | null;
        gender?: string | null;
        dob?: string | null;
        role: string;
        avatar?: string | null;
        [key: string]: any;
    };
    doctorProfile?: any;
    returnUrl: string;
    returnLabel: string;
    mustVerifyEmail?: boolean;
    status?: string;
    initialTab?: 'personal' | 'avatar' | 'security';
}

export default function Profile({
    profileUser,
    doctorProfile,
    returnUrl,
    returnLabel,
    initialTab = 'personal',
}: ProfileProps) {
    const [activeTab, setActiveTab] = useState<'personal' | 'avatar' | 'security'>(initialTab);

    const getRoleBadge = (u: any) => {
        if (u.role === 'admin') {
            return { text: 'مشرف المنصة العام', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
        }
        if (u.is_group_admin) {
            return { text: 'مدير مجمع طبي', bg: 'bg-blue-100 text-[#005ab5] border-blue-200' };
        }
        if (u.is_facility_admin) {
            return { text: 'مدير منشأة طبية', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
        }
        if (u.is_receptionist || u.role === 'receptionist') {
            return { text: 'موظف استقبال معتمد', bg: 'bg-teal-100 text-teal-800 border-teal-200' };
        }
        if (u.role === 'doctor') {
            return { text: 'طبيب ومستشار معتمد', bg: 'bg-purple-100 text-purple-700 border-purple-200' };
        }
        return { text: 'مريض معتمد', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    };

    const roleBadge = getRoleBadge(profileUser);

    return (
        <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-['Tajawal']" dir="rtl">
            <Head title="إعدادات الحساب والملف الشخصي - طبيبي" />

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={returnUrl || '/'}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4 ml-0.5" />
                            <span>العودة إلى: {returnLabel || 'الرئيسية'}</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#005ab5] to-blue-400 flex items-center justify-center text-white shadow-xs">
                            <HeartPulse className="w-5 h-5" />
                        </div>
                        <span className="font-black text-base text-gray-900 font-['Cairo'] hidden sm:inline">
                            منصة طبيبي
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Hero Header Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-right">
                        <div className="relative shrink-0">
                            {profileUser.avatar ? (
                                <img
                                    src={profileUser.avatar}
                                    alt={profileUser.name}
                                    className="w-20 h-20 rounded-3xl object-cover ring-4 ring-[#005ab5]/20 shadow-md"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#005ab5] to-blue-400 flex items-center justify-center text-white font-black text-xl font-['Cairo'] shadow-md ring-4 ring-[#005ab5]/15">
                                    {profileUser.name ? profileUser.name.slice(0, 2) : 'ط'}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setActiveTab('avatar')}
                                className="absolute -bottom-1 -left-1 w-7 h-7 rounded-xl bg-[#005ab5] text-white flex items-center justify-center shadow-xs hover:bg-[#00458e] transition-colors border-2 border-white"
                                title="تعديل الصورة"
                            >
                                <Camera className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                                <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-['Cairo']">
                                    {profileUser.name}
                                </h1>
                                <span className={cn('text-xs font-bold px-3 py-1 rounded-full border', roleBadge.bg)}>
                                    {roleBadge.text}
                                </span>
                            </div>

                            <p className="text-xs text-gray-500 font-medium">
                                إدارة وتحديث بياناتك الشخصية، معلومات الاتصال، صورتك الشخصية، وإعدادات الأمان.
                            </p>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-gray-500 font-medium">
                                <span className="font-mono text-gray-700" dir="ltr">
                                    {profileUser.email}
                                </span>
                                {profileUser.phone && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <span className="font-mono text-gray-700" dir="ltr">
                                            {profileUser.phone}
                                        </span>
                                    </>
                                )}
                                {profileUser.national_id && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <span>
                                            الهوية: <strong className="font-mono text-gray-700">{profileUser.national_id}</strong>
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 mt-8 border-b border-gray-100 overflow-x-auto pb-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('personal')}
                            className={cn(
                                'flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer',
                                activeTab === 'personal'
                                    ? 'bg-[#005ab5] text-white shadow-sm shadow-blue-500/20'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            )}
                        >
                            <User className="w-4 h-4" />
                            <span>البيانات الشخصية والمهنية</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('avatar')}
                            className={cn(
                                'flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer',
                                activeTab === 'avatar'
                                    ? 'bg-[#005ab5] text-white shadow-sm shadow-blue-500/20'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            )}
                        >
                            <Camera className="w-4 h-4" />
                            <span>الصورة الشخصية والرمزية</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('security')}
                            className={cn(
                                'flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer',
                                activeTab === 'security'
                                    ? 'bg-[#005ab5] text-white shadow-sm shadow-blue-500/20'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            )}
                        >
                            <KeyRound className="w-4 h-4" />
                            <span>الأمان وكلمة المرور</span>
                        </button>
                    </div>
                </div>

                {/* Tab Content Panels */}
                <div className="space-y-6">
                    {activeTab === 'personal' && (
                        <div className="space-y-6">
                            <ProfilePersonalForm user={profileUser} />

                            {profileUser.role === 'doctor' && (
                                <DoctorProfessionalForm
                                    doctorProfile={doctorProfile}
                                    userName={profileUser.name}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'avatar' && (
                        <div>
                            <AvatarUpload
                                currentAvatar={profileUser.avatar}
                                userName={profileUser.name}
                                userRole={roleBadge.text}
                            />
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <PasswordSettingsForm />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
