import React, { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FacilityDashboardLayout } from '@/layouts/facility-dashboard-layout';
import {
    KeyRound,
    Plus,
    Copy,
    Check,
    AlertCircle,
    ShieldCheck,
    Clock,
    FileCode2,
    Trash2,
    Ban,
    ExternalLink,
    Zap,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2
} from 'lucide-react';
import { Modal, FormInput, AppButton } from '@/components/common';
import { cn } from '@/lib/utils';

interface CredentialItem {
    id: number;
    integration_name: string;
    environment: 'live' | 'sandbox';
    pk_display: string;
    status: 'active' | 'revoked' | 'suspended';
    is_active: boolean;
    created_at: string;
    expires_at: string | null;
    remaining_days: number | null;
    last_used_at: string;
}

interface FlashCredential {
    id: number;
    pk: string;
    sk: string;
    integration_name: string;
    environment: string;
    facility_name: string;
    expires_at: string;
    lifespan_label: string;
}

interface Props {
    facility: {
        id: number;
        name: string;
        name_ar?: string;
        branch_name?: string;
    };
    credentials: CredentialItem[];
    metrics?: any;
    counts?: any;
}

export default function FacilityApiKeysPage({ facility, credentials = [], metrics, counts }: Props) {
    const { props } = usePage();
    const flashCredential = (props as any).flash?.flash_credential as FlashCredential | undefined;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [justCopied, setJustCopied] = useState<string | null>(null);
    const [acknowledgedSecret, setAcknowledgedSecret] = useState(false);

    const facilityName = facility.name_ar || facility.name || 'المنشأة الطبية';

    // Form for creating Live API Key (Locked to Live only!)
    const { data, setData, post, processing, errors, reset } = useForm({
        facility_id: facility.id,
        integration_name: '',
        lifespan: '90_days',
    });

    const handleCreateKey = (e: React.FormEvent) => {
        e.preventDefault();
        post('/facility/api-keys', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset('integration_name');
            },
        });
    };

    const handleRevoke = (credId: number) => {
        if (confirm('هل أنت متأكد من إلغاء تفعيل هذا المفتاح؟ لن يتمكن نظام المستشفى من إجراء حجوزات جديدة بهذا المفتاح.')) {
            router.post(`/facility/api-keys/${credId}/revoke`);
        }
    };

    const handleDelete = (credId: number) => {
        if (confirm('هل أنت متأكد من حذف هذا المفتاح نهائياً من النظام؟')) {
            router.delete(`/facility/api-keys/${credId}`);
        }
    };

    const copyToClipboard = (text: string, keyName: string) => {
        navigator.clipboard.writeText(text);
        setJustCopied(keyName);
        setTimeout(() => setJustCopied(null), 2500);
    };

    return (
        <FacilityDashboardLayout
            activeTab="api-keys"
            facilityName={facilityName}
            branchName={facility.branch_name}
            counts={counts}
        >
            <Head title="إدارة مفاتيح الربط المباشر (Live API Keys) - طبيبي" />

            <div className="space-y-6 font-['Tajawal']" dir="rtl">
                {/* Hero Banner */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                        <div className="max-w-2xl space-y-2.5">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold font-['Cairo']">
                                <Zap className="w-3.5 h-3.5" />
                                <span>بيئة الإنتاج المباشرة (Live Mode Only)</span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-black font-['Cairo'] leading-tight">
                                بوابة الربط البرمجي لنظام: {facilityName}
                            </h1>

                            <p className="text-sm text-slate-300 leading-relaxed">
                                يمكنك من هنا إنشاء وإدارة مفاتيح الربط البرمجي الحية (Live API Keys) لربط نظام المستشفى الداخلي (HIS) أو تطبيق الحجوزات الخاص بك بمنصة طبيبي مباشرة وبأعلى معايير الأمان.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer font-['Cairo']"
                            >
                                <Plus className="w-4 h-4" />
                                <span>إنشاء مفتاح ربط لايف (Generate Live Key)</span>
                            </button>

                            <a
                                href="/facility/api-docs"
                                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all cursor-pointer font-['Cairo']"
                            >
                                <FileCode2 className="w-4 h-4 text-cyan-300" />
                                <span>دليل ومواصفات الـ API</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Newly Created Flash Credential Modal / Banner */}
                {flashCredential && !acknowledgedSecret && (
                    <div className="p-6 sm:p-7 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 shadow-md space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-black font-['Cairo'] text-emerald-900">
                                        تم إصدار مفتاح الربط المباشر (Live API Key) بنجاح!
                                    </h2>
                                    <p className="text-xs text-emerald-800 mt-0.5">
                                        النظام: <strong>{flashCredential.integration_name}</strong> | الصلاحية: <strong>{flashCredential.lifespan_label}</strong> (حتى {flashCredential.expires_at})
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setAcknowledgedSecret(true)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-200 hover:bg-emerald-300 text-emerald-900 text-xs font-bold transition-colors cursor-pointer"
                            >
                                تم الحفظ وإغلاق
                            </button>
                        </div>

                        {/* Keys Display Box */}
                        <div className="space-y-3.5 p-4 rounded-2xl bg-white border border-emerald-200">
                            {/* Public Key */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 font-['Cairo'] mb-1">
                                    المفتاح العام (Client ID / Public Key):
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={flashCredential.pk}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 dir-ltr text-left select-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(flashCredential.pk, 'flash_pk')}
                                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                        {justCopied === 'flash_pk' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                        <span>نسخ</span>
                                    </button>
                                </div>
                            </div>

                            {/* Secret Key */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-black text-rose-800 font-['Cairo'] flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                        <span>المفتاح السري (Secret Key - احفظه الآن بأمان):</span>
                                    </label>
                                    <span className="text-[11px] text-rose-600 font-bold">
                                        لن يظهر هذا المفتاح السري مرة أخرى بعد إغلاق هذه النافذة
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={flashCredential.sk}
                                        className="w-full px-3 py-2 rounded-xl bg-rose-50/50 border border-rose-300 font-mono text-xs text-rose-950 font-bold dir-ltr text-left select-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(flashCredential.sk, 'flash_sk')}
                                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                        {justCopied === 'flash_sk' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        <span>نسخ السر</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-xs">
                            <span className="text-emerald-800">
                                يمكنك استخدامه مباشرة عبر الترويسة: <code className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-900">Authorization: Bearer {flashCredential.sk.substring(0, 14)}...</code>
                            </span>
                            <a
                                href="/facility/api-docs"
                                className="text-[#005ab5] font-bold hover:underline flex items-center gap-1"
                            >
                                <span>الانتقال إلى توثيق الـ API لتجربة الاستدعاء</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                )}

                {/* Active Credentials Table */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-base font-bold font-['Cairo'] text-slate-900">
                                سجل مفاتيح الربط البرمجي الفعالة للمنشأة
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                المفاتيح المصدرة لصالح أنظمة المستشفى وفروعها
                            </p>
                        </div>

                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                            إجمالي المفاتيح: {credentials.length}
                        </span>
                    </div>

                    {credentials.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                            <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                <KeyRound className="w-7 h-7" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 font-['Cairo']">
                                لا توجد مفاتيح ربط صادرة بعد لهذه المنشأة
                            </h3>
                            <p className="text-xs text-slate-400 max-w-md mx-auto">
                                اضغط على زر "إنشاء مفتاح ربط لايف" أعلاه لإصدار أول مفتاح ربط مباشر لنظام المستشفى الداخلي.
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#005ab5] text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>إصدار مفتاح ربط الآن</span>
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 font-bold font-['Cairo']">
                                        <th className="pb-3">اسم النظام / التكامل</th>
                                        <th className="pb-3">البيئة</th>
                                        <th className="pb-3">المعرف العام (Client ID)</th>
                                        <th className="pb-3">تاريخ الانتهاء والصلاحية</th>
                                        <th className="pb-3">آخر استخدام</th>
                                        <th className="pb-3">الحالة</th>
                                        <th className="pb-3 text-left">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {credentials.map((cred) => (
                                        <tr key={cred.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3.5 font-bold text-slate-900 font-['Cairo']">
                                                {cred.integration_name}
                                                <span className="block text-[10px] text-slate-400 font-normal">
                                                    تم الإنشاء: {cred.created_at}
                                                </span>
                                            </td>

                                            <td className="py-3.5">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                                                    LIVE مباشر
                                                </span>
                                            </td>

                                            <td className="py-3.5 font-mono text-slate-700 dir-ltr text-left">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="truncate max-w-[180px]">{cred.pk_display}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(cred.pk_display, `pk_${cred.id}`)}
                                                        className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
                                                        title="نسخ المعرف"
                                                    >
                                                        {justCopied === `pk_${cred.id}` ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="py-3.5">
                                                {cred.expires_at ? (
                                                    <div>
                                                        <span className="font-mono text-slate-800 block">{cred.expires_at}</span>
                                                        {cred.remaining_days !== null && cred.remaining_days > 0 ? (
                                                            <span className="text-[10px] text-emerald-700 font-bold">
                                                                (متبقي {cred.remaining_days} يوماً)
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-rose-600 font-bold">
                                                                (منتهي الصلاحية)
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">غير محدد</span>
                                                )}
                                            </td>

                                            <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                                                {cred.last_used_at}
                                            </td>

                                            <td className="py-3.5">
                                                {cred.is_active ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        نشط
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        معطل / ملغي
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3.5 text-left">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {cred.is_active && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRevoke(cred.id)}
                                                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                                            title="تعطيل / إلغاء المفتاح"
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(cred.id)}
                                                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                        title="حذف المفتاح نهائياً"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Create Live API Key */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="إصدار مفتاح ربط مباشر جديد (Live API Key)"
                description={`سيتم إصدار زوج مفاتيح مشفر لصالح منشأة: ${facilityName}`}
                headerIcon={<KeyRound className="w-5 h-5 text-emerald-600" />}
                maxWidth="md"
            >
                <form onSubmit={handleCreateKey} className="space-y-4 font-['Tajawal']" dir="rtl">
                    {/* Notice */}
                    <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs leading-relaxed space-y-1">
                        <div className="font-bold font-['Cairo'] flex items-center gap-1.5 text-[#005ab5]">
                            <ShieldCheck className="w-4 h-4" />
                            <span>بيئة المفتاح المتاحة: إنتاج مباشر (Live Mode)</span>
                        </div>
                        <p className="text-slate-600">
                            بصفتك مديراً للمنشأة، فإن جميع المفاتيح المصدرة تعمل مباشرة في بيئة الحجوزات الحقيقية لعيادات المستشفى.
                        </p>
                    </div>

                    {/* Integration Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 font-['Cairo'] mb-1">
                            اسم النظام أو الجهة المرتبطة: <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="مثال: نظام المستشفى الداخلي HIS - الحبيب"
                            value={data.integration_name}
                            onChange={(e) => setData('integration_name', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#005ab5] focus:border-transparent outline-none"
                        />
                        {errors.integration_name && (
                            <span className="text-xs text-rose-500 mt-1 block">{errors.integration_name}</span>
                        )}
                    </div>

                    {/* Lifespan Select (30, 90, 180, 270, 365) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 font-['Cairo'] mb-1">
                            مدة صلاحية المفتاح (Lifespan): <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={data.lifespan}
                            onChange={(e) => setData('lifespan', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#005ab5] focus:border-transparent outline-none font-bold"
                        >
                            <option value="30_days">30 يوماً (شهر واحد)</option>
                            <option value="90_days">90 يوماً (3 أشهر - الخيار الموصى به)</option>
                            <option value="180_days">180 يوماً (6 أشهر)</option>
                            <option value="270_days">270 يوماً (9 أشهر)</option>
                            <option value="365_days">365 يوماً (سنة كاملة)</option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">
                            بعد انتهاء هذه المدة سيتوقف المفتاح تلقائياً حتى يتم تجديده لضمان المعايير الأمنية.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            إلغاء
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#005ab5] hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            {processing ? 'جارٍ الإصدار...' : 'توليد المفتاح المباشر'}
                        </button>
                    </div>
                </form>
            </Modal>
        </FacilityDashboardLayout>
    );
}
