import React, { useState, useMemo } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AdminDashboardLayout } from '@/layouts/admin-dashboard-layout';
import { MetricCard } from '@/components/common/metric-card';
import {
    KeyRound,
    Plus,
    Copy,
    Check,
    AlertCircle,
    ShieldCheck,
    Building2,
    Hospital,
    Search,
    FileCode2,
    Trash2,
    Ban,
    ExternalLink,
    Zap,
    CheckCircle2,
    Eye,
    EyeOff,
    Filter,
    Layers,
    Clock
} from 'lucide-react';
import { Modal } from '@/components/common';
import { cn } from '@/lib/utils';

interface FacilityItem {
    id: number;
    name: string;
    branch_name?: string;
    group_name: string;
    city: string;
    api_status: 'live' | 'sandbox' | 'none';
    credentials_count: number;
    credentials: {
        id: number;
        integration_name: string;
        environment: 'live' | 'sandbox';
        pk_display: string;
        secret_preview: string | null;
        status: string;
        is_active: boolean;
        created_at: string;
        expires_at: string | null;
        remaining_days: number | null;
        last_used_at: string;
    }[];
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
    facilities: FacilityItem[];
    allFacilities: { id: number; name: string; group: string }[];
    metrics: {
        totalFacilities: number;
        connectedCount: number;
        unconnectedCount: number;
        activeLiveCount: number;
        activeSandboxCount: number;
    };
}

export default function AdminApiIntegrationsPage({ facilities = [], allFacilities = [], metrics }: Props) {
    const { props } = usePage();
    const flashCredential = (props as any).flash?.flash_credential as FlashCredential | undefined;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedFacilityForModal, setSelectedFacilityForModal] = useState<number | null>(null);
    const [filterTab, setFilterTab] = useState<'all' | 'connected' | 'unconnected' | 'live' | 'sandbox'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [revealedSecrets, setRevealedSecrets] = useState<Record<number, boolean>>({});
    const [justCopied, setJustCopied] = useState<string | null>(null);
    const [acknowledgedSecret, setAcknowledgedSecret] = useState(false);

    // Form for Super Admin (Can create Live OR Sandbox!)
    const { data, setData, post, processing, errors, reset } = useForm({
        facility_id: allFacilities[0]?.id || '',
        environment: 'live',
        integration_name: '',
        lifespan: '90_days',
    });

    const openCreateModalFor = (facilityId?: number) => {
        if (facilityId) {
            setData('facility_id', facilityId);
        } else if (allFacilities.length > 0) {
            setData('facility_id', allFacilities[0].id);
        }
        setIsCreateModalOpen(true);
    };

    const handleCreateKey = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/api-credentials', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset('integration_name');
            },
        });
    };

    const handleRevoke = (credId: number) => {
        if (confirm('هل أنت متأكد من إلغاء تفعيل هذا المفتاح؟')) {
            router.post(`/admin/api-credentials/${credId}/revoke`);
        }
    };

    const handleDelete = (credId: number) => {
        if (confirm('هل أنت متأكد من حذف هذا المفتاح نهائياً من النظام؟')) {
            router.delete(`/admin/api-credentials/${credId}`);
        }
    };

    const copyToClipboard = (text: string, keyName: string) => {
        navigator.clipboard.writeText(text);
        setJustCopied(keyName);
        setTimeout(() => setJustCopied(null), 2500);
    };

    const toggleRevealSecret = (credId: number) => {
        setRevealedSecrets((prev) => ({ ...prev, [credId]: !prev[credId] }));
    };

    const filteredFacilities = useMemo(() => {
        return facilities.filter((fac) => {
            const matchesSearch =
                fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (fac.branch_name && fac.branch_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                fac.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fac.city.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (filterTab === 'connected') return fac.api_status !== 'none';
            if (filterTab === 'unconnected') return fac.api_status === 'none';
            if (filterTab === 'live') return fac.api_status === 'live';
            if (filterTab === 'sandbox') return fac.api_status === 'sandbox';
            return true;
        });
    }, [facilities, searchQuery, filterTab]);

    return (
        <AdminDashboardLayout activeTab="api-integrations">
            <Head title="إدارة بوابات الربط البرمجي للشركاء (Tebiby Connect API) - الإدارة العامة" />

            <div className="space-y-6 font-['Tajawal']" dir="rtl">
                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <MetricCard
                        title="إجمالي المنشآت الطبية"
                        value={metrics.totalFacilities}
                        subtitle="المستشفيات والمراكز المسجلة"
                        icon={<Hospital className="w-5 h-5 text-[#005ab5]" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="منشآت مربوطة برمجياً"
                        value={metrics.connectedCount}
                        subtitle="تمتلك مفتاح ربط نشط"
                        icon={<KeyRound className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="منشآت غير مربوطة"
                        value={metrics.unconnectedCount}
                        subtitle="لم يتم إصدار مفاتيح بعد"
                        icon={<Building2 className="w-5 h-5 text-slate-500" />}
                        iconBg="bg-slate-100"
                    />
                    <MetricCard
                        title="مفاتيح إنتاج Live"
                        value={metrics.activeLiveCount}
                        subtitle="مفاتيح نشطة تستقبل حجوزات"
                        icon={<Zap className="w-5 h-5 text-indigo-600" />}
                        iconBg="bg-indigo-50"
                    />
                    <MetricCard
                        title="مفاتيح Sandbox تجريبية"
                        value={metrics.activeSandboxCount}
                        subtitle="بيئة المحاكاة والاختبار"
                        icon={<Clock className="w-5 h-5 text-amber-500" />}
                        iconBg="bg-amber-50"
                    />
                </div>

                {/* Newly Created Flash Credential Banner */}
                {flashCredential && !acknowledgedSecret && (
                    <div className="p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 shadow-md space-y-4 animate-in fade-in">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black font-['Cairo'] text-emerald-950">
                                        تم إصدار مفتاح الربط البرمجي بنجاح للمنشأة: {flashCredential.facility_name}
                                    </h3>
                                    <p className="text-xs text-emerald-800 mt-0.5">
                                        البيئة: <strong>{flashCredential.environment === 'live' ? 'إنتاج مباشر (LIVE)' : 'بيئة اختبار (SANDBOX)'}</strong> | الصلاحية: <strong>{flashCredential.lifespan_label}</strong> (حتى {flashCredential.expires_at})
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setAcknowledgedSecret(true)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-200 hover:bg-emerald-300 text-emerald-900 text-xs font-bold transition-colors cursor-pointer"
                            >
                                إغلاق الإشعار
                            </button>
                        </div>

                        {/* Keys Box */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-white border border-emerald-200">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 font-['Cairo'] mb-1">
                                    المفتاح العام (Client ID / Public Key):
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="text"
                                        readOnly
                                        value={flashCredential.pk}
                                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 dir-ltr text-left select-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(flashCredential.pk, 'flash_pk')}
                                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                                    >
                                        {justCopied === 'flash_pk' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>نسخ</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-rose-800 font-['Cairo'] mb-1">
                                    المفتاح السري (Client Secret):
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="text"
                                        readOnly
                                        value={flashCredential.sk}
                                        className="w-full px-3 py-1.5 rounded-xl bg-rose-50/50 border border-rose-300 font-mono text-xs text-rose-950 font-bold dir-ltr text-left select-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(flashCredential.sk, 'flash_sk')}
                                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                                    >
                                        {justCopied === 'flash_sk' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>نسخ السر</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Table Card */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                { id: 'all', label: 'كافة المنشآت', count: facilities.length },
                                { id: 'connected', label: 'منشآت مربوطة بـ API', count: metrics.connectedCount },
                                { id: 'unconnected', label: 'منشآت غير مربوطة', count: metrics.unconnectedCount },
                                { id: 'live', label: 'مربوطة Live', count: facilities.filter((f) => f.api_status === 'live').length },
                                { id: 'sandbox', label: 'مربوطة Sandbox', count: facilities.filter((f) => f.api_status === 'sandbox').length },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setFilterTab(tab.id as any)}
                                    className={cn(
                                        'px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border',
                                        filterTab === tab.id
                                            ? 'bg-[#005ab5] text-white border-[#005ab5] shadow-xs'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    )}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={cn(
                                            'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                                            filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                        )}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => openCreateModalFor()}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer font-['Cairo']"
                            >
                                <Plus className="w-4 h-4" />
                                <span>إصدار مفتاح ربط لمنشأة (Create Key)</span>
                            </button>

                            <a
                                href="/admin/api-docs"
                                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer font-['Cairo']"
                            >
                                <FileCode2 className="w-4 h-4 text-[#005ab5]" />
                                <span>التوثيق البرمجي</span>
                            </a>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="ابحث باسم المستشفى، المجمع الطبي، الفرع، أو المدينة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:ring-2 focus:ring-[#005ab5] focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Facilities Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-bold font-['Cairo']">
                                    <th className="pb-3">المنشأة الطبية والمجمع</th>
                                    <th className="pb-3">المدينة</th>
                                    <th className="pb-3">حالة الربط البرمجي</th>
                                    <th className="pb-3">مفاتيح الربط الصادرة والتفاصيل</th>
                                    <th className="pb-3 text-left">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredFacilities.map((fac) => (
                                    <tr key={fac.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-4 font-bold text-slate-900 font-['Cairo']">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005ab5] flex items-center justify-center shrink-0">
                                                    <Hospital className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="block text-slate-900 text-xs font-bold">{fac.name}</span>
                                                    <span className="block text-[11px] text-slate-400 font-normal">
                                                        {fac.branch_name ? `فرع: ${fac.branch_name}` : ''} | {fac.group_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 text-slate-600 font-medium">
                                            {fac.city || 'الرياض'}
                                        </td>

                                        <td className="py-4">
                                            {fac.api_status === 'live' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    LIVE مباشر
                                                </span>
                                            )}
                                            {fac.api_status === 'sandbox' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 font-mono">
                                                    SANDBOX تجريبي
                                                </span>
                                            )}
                                            {fac.api_status === 'none' && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                    غير مربوط
                                                </span>
                                            )}
                                        </td>

                                        {/* Credentials List for this Facility */}
                                        <td className="py-4">
                                            {fac.credentials.length === 0 ? (
                                                <span className="text-[11px] text-slate-400">لا توجد مفاتيح مصدرة</span>
                                            ) : (
                                                <div className="space-y-2">
                                                    {fac.credentials.map((cred) => {
                                                        const isRevealed = revealedSecrets[cred.id] || false;
                                                        return (
                                                            <div
                                                                key={cred.id}
                                                                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]"
                                                            >
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span
                                                                            className={cn(
                                                                                'px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase',
                                                                                cred.environment === 'live'
                                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                                    : 'bg-amber-100 text-amber-800'
                                                                            )}
                                                                        >
                                                                            {cred.environment}
                                                                        </span>
                                                                        <span className="font-bold text-slate-800 font-['Cairo'] truncate max-w-[120px]">
                                                                            {cred.integration_name}
                                                                        </span>
                                                                    </div>

                                                                    {cred.is_active ? (
                                                                        <span className="text-[10px] text-emerald-600 font-bold">نشط</span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-rose-500 font-bold">ملغي</span>
                                                                    )}
                                                                </div>

                                                                {/* Keys Row (PK & SK for Super Admin) */}
                                                                <div className="space-y-1 font-mono text-[10px]">
                                                                    <div className="flex items-center justify-between gap-2 text-slate-500 dir-ltr text-left">
                                                                        <span className="truncate max-w-[170px] select-all">PK: {cred.pk_display}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => copyToClipboard(cred.pk_display, `pk_${cred.id}`)}
                                                                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                                                            title="نسخ المفتاح العام"
                                                                        >
                                                                            {justCopied === `pk_${cred.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                                                        </button>
                                                                    </div>

                                                                    {/* Secret Key with Reveal Toggle for Super Admin! */}
                                                                    {cred.secret_preview && (
                                                                        <div className="flex items-center justify-between gap-2 text-slate-800 dir-ltr text-left bg-white p-1 rounded border border-slate-200">
                                                                            <span className="truncate max-w-[160px] select-all font-bold">
                                                                                SK: {isRevealed ? cred.secret_preview : cred.secret_preview.substring(0, 10) + '••••••••'}
                                                                            </span>
                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleRevealSecret(cred.id)}
                                                                                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                                                                                    title={isRevealed ? 'إخفاء' : 'إظهار السر'}
                                                                                >
                                                                                    {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-indigo-600" />}
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => copyToClipboard(cred.secret_preview!, `sk_${cred.id}`)}
                                                                                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                                                                                    title="نسخ السر"
                                                                                >
                                                                                    {justCopied === `sk_${cred.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Expiry */}
                                                                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-200/60">
                                                                    <span>ينتهي: {cred.expires_at || 'غير محدد'}</span>
                                                                    {cred.remaining_days !== null && (
                                                                        <span className="font-bold text-emerald-700">({cred.remaining_days} يوم متبقي)</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 text-left">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openCreateModalFor(fac.id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 text-[#005ab5] hover:bg-blue-100 font-bold transition-colors cursor-pointer text-xs"
                                                    title="إصدار مفتاح جديد لهذه المنشأة"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>إصدار مفتاح</span>
                                                </button>

                                                {fac.credentials.map((c) => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => handleDelete(c.id)}
                                                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                                        title={`حذف مفتاح ${c.integration_name}`}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal: Super Admin Create Key (Allows Live OR Sandbox!) */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="إصدار مفتاح ربط برمجي جديد كمسؤول منصة"
                description="يمكنك كمسؤول عام تحديد بيئة العمل (إنتاج مباشر أو تجريبي) وتحديد مدة الصلاحية"
                headerIcon={<KeyRound className="w-5 h-5 text-indigo-600" />}
                maxWidth="md"
            >
                <form onSubmit={handleCreateKey} className="space-y-4 font-['Tajawal']" dir="rtl">
                    {/* Facility Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 font-['Cairo'] mb-1">
                            اختر المنشأة الطبية المستهدفة: <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={data.facility_id}
                            onChange={(e) => setData('facility_id', Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#005ab5] focus:border-transparent outline-none font-bold"
                        >
                            {allFacilities.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name} ({f.group})
                                </option>
                            ))}
                        </select>
                        {errors.facility_id && (
                            <span className="text-xs text-rose-500 mt-1 block">{errors.facility_id}</span>
                        )}
                    </div>

                    {/* Environment Selection: Live vs Sandbox (Super Admin superpower!) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 font-['Cairo'] mb-1">
                            بيئة العمل (Environment): <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label
                                className={cn(
                                    'p-3 rounded-2xl border-2 flex items-center gap-2.5 cursor-pointer transition-all',
                                    data.environment === 'live'
                                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold shadow-xs'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                )}
                            >
                                <input
                                    type="radio"
                                    name="environment"
                                    value="live"
                                    checked={data.environment === 'live'}
                                    onChange={() => setData('environment', 'live')}
                                    className="hidden"
                                />
                                <div className="w-4 h-4 rounded-full border border-emerald-600 flex items-center justify-center">
                                    {data.environment === 'live' && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                                </div>
                                <div>
                                    <span className="block text-xs font-black font-['Cairo']">إنتاج مباشر (Live)</span>
                                    <span className="block text-[10px] text-slate-500">حجوزات حقيقية مؤكدة</span>
                                </div>
                            </label>

                            <label
                                className={cn(
                                    'p-3 rounded-2xl border-2 flex items-center gap-2.5 cursor-pointer transition-all',
                                    data.environment === 'sandbox'
                                        ? 'border-amber-500 bg-amber-50/60 text-amber-950 font-bold shadow-xs'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                )}
                            >
                                <input
                                    type="radio"
                                    name="environment"
                                    value="sandbox"
                                    checked={data.environment === 'sandbox'}
                                    onChange={() => setData('environment', 'sandbox')}
                                    className="hidden"
                                />
                                <div className="w-4 h-4 rounded-full border border-amber-600 flex items-center justify-center">
                                    {data.environment === 'sandbox' && <div className="w-2 h-2 rounded-full bg-amber-600" />}
                                </div>
                                <div>
                                    <span className="block text-xs font-black font-['Cairo']">بيئة تجريبية (Sandbox)</span>
                                    <span className="block text-[10px] text-slate-500">اختبار وتطوير الشركاء</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Integration Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 font-['Cairo'] mb-1">
                            اسم النظام أو التكامل: <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="مثال: نظام إدارة المستشفى HIS - الحبيب"
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
                            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            {processing ? 'جارٍ الإصدار...' : 'إصدار وتفعيل المفتاح'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminDashboardLayout>
    );
}
