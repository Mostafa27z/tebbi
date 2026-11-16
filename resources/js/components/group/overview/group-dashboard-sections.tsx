import React, { memo } from 'react';
import { Link } from '@inertiajs/react';
import {
    Building2,
    Users,
    Calendar,
    CreditCard,
    Plus,
    UserPlus,
    ShieldCheck,
    ArrowLeft,
    Hospital,
    Stethoscope,
    MapPin,
    Globe,
    ExternalLink,
    Copy,
    Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MetricCard, AppButton } from '@/components/common';
import {
    Facility,
    Doctor,
    StaffAssignment,
    GroupInfo,
    GroupMetrics,
    SpecialtyOption,
} from '@/components/group';

interface GroupOverviewHeroProps {
    group: GroupInfo;
    onAddFacility: () => void;
    onAddDoctor: () => void;
    onAddSpecialty?: () => void;
    onAssignStaff: () => void;
}

export const GroupOverviewHero = memo(function GroupOverviewHero({
    group,
    onAddFacility,
    onAddDoctor,
    onAddSpecialty,
    onAssignStaff,
}: GroupOverviewHeroProps) {
    return (
        <>
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#005ab5] to-[#003b75] p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-blue-100 mb-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>نظام إدارة المنظومات والمجمعات الطبية المتكامل</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black font-['Cairo'] tracking-tight">
                            مرحباً بك في لوحة قيادة {group.name_ar}
                        </h2>
                        <p className="text-sm text-blue-100 mt-2 max-w-2xl leading-relaxed">
                            متابعة أداء كافة المستشفيات والعيادات التابعة للمجموعة، إدارة الأقسام والتخصصات الطبية، وتوزيع الكوادر الاستشارية من مكان موحد.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={onAddFacility}
                            className="px-4 py-2.5 rounded-2xl bg-white text-[#005ab5] hover:bg-blue-50 text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>إضافة منشأة</span>
                        </button>
                        {onAddSpecialty && (
                            <button
                                type="button"
                                onClick={onAddSpecialty}
                                className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                            >
                                <Stethoscope className="w-4 h-4" />
                                <span>+ إضافة تخصص طبي</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onAddDoctor}
                            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-white/20"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>إضافة طبيب</span>
                        </button>
                        <button
                            type="button"
                            onClick={onAssignStaff}
                            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-white/20"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>تعيين مشرف</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                            <Globe className="w-4 h-4" />
                        </span>
                        <h3 className="text-sm font-bold font-['Cairo'] text-gray-900 flex items-center gap-2">
                            <span>صفحة المجمع الطبية العامة للترويج والحجز</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                متاحة للجمهور
                            </span>
                        </h3>
                    </div>
                    <p className="text-xs text-gray-600">
                        رابط مخصص يستعرض كافة مستشفيات وفروع المجمع، أطباء واستشاريي المنظومة، وإمكانية الحجز الفوري المباشر للمرضى.
                    </p>
                    <div className="flex items-center gap-2 pt-1 font-mono text-xs text-[#005ab5] font-bold" dir="ltr">
                        <span className="truncate">
                            {typeof window !== 'undefined' ? window.location.origin : 'https://tebiby.com'}/group/{group.slug}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={() => {
                            const url = `${window.location.origin}/group/${group.slug}`;
                            navigator.clipboard.writeText(url);
                            toast.success('تم نسخ رابط الصفحة الترويجية للمجمع');
                        }}
                        className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                    >
                        <Copy className="w-4 h-4 text-gray-500" />
                        <span>نسخ الرابط</span>
                    </button>
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                            `احجز موعدك في ${group.name_ar} عبر منصة طبيبي:\n${
                                typeof window !== 'undefined' ? window.location.origin : ''
                            }/group/${group.slug}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                        <Share2 className="w-4 h-4" />
                        <span>مشاركة واتساب</span>
                    </a>
                    <a
                        href={`/group/${group.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#004494] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                        <span>معاينة الصفحة</span>
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </>
    );
});

export const GroupOverviewMetrics = memo(function GroupOverviewMetrics({ metrics }: { metrics: GroupMetrics }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
                title="إجمالي المنشآت الطبية"
                value={metrics.facilitiesCount}
                subtitle={`${metrics.hospitalsCount} مستشفى • ${metrics.clinicsCount} عيادة`}
                icon={<Building2 className="w-5 h-5 text-[#005ab5]" />}
                iconBg="bg-blue-50"
            />
            <MetricCard
                title="الأطباء والاستشاريون"
                value={metrics.doctorsCount}
                subtitle="استشاري معتمد بالمجموعة"
                icon={<Users className="w-5 h-5 text-purple-600" />}
                iconBg="bg-purple-50"
            />
            <MetricCard
                title="حجوزات اليوم"
                value={metrics.todayAppointments}
                subtitle="حالة مجدولة لليوم"
                icon={<Calendar className="w-5 h-5 text-emerald-600" />}
                iconBg="bg-emerald-50"
            />
            <MetricCard
                title="الإيرادات الفعلية للمجمع"
                value={metrics.totalRevenue}
                subtitle="مدفوعات مؤكدة"
                icon={<CreditCard className="w-5 h-5 text-teal-600" />}
                iconBg="bg-teal-50"
            />
        </div>
    );
});

interface GroupOverviewSnapshotsProps {
    facilities: Facility[];
    staffAssignments: StaffAssignment[];
    doctors: Doctor[];
    specialties?: SpecialtyOption[];
    onAssignStaff: () => void;
    onAddSpecialty?: () => void;
}

export const GroupOverviewSnapshots = memo(function GroupOverviewSnapshots({
    facilities,
    staffAssignments,
    doctors,
    specialties = [],
    onAssignStaff,
    onAddSpecialty,
}: GroupOverviewSnapshotsProps) {
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#005ab5] flex items-center justify-center font-bold">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm sm:text-base font-['Cairo']">
                                    المستشفيات والعيادات التابعة للمجمع
                                </h3>
                                <p className="text-xs text-gray-500">
                                    أحدث المنشآت المسجلة والفعالة في المنظومة
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/group/facilities"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005ab5] hover:text-[#00458e] transition-colors"
                        >
                            <span>عرض كافة المنشآت ({facilities.length})</span>
                            <ArrowLeft className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {facilities.slice(0, 4).map((f) => (
                            <div
                                key={f.id}
                                className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-colors group"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-blue-100/60 text-[#005ab5] flex items-center justify-center shrink-0">
                                        <Hospital className="w-4 h-4" />
                                    </div>
                                    <span
                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            f.type === 'hospital'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                        }`}
                                    >
                                        {f.type === 'hospital' ? 'مستشفى' : 'مركز طبي'}
                                    </span>
                                </div>
                                <h4 className="font-bold text-sm text-gray-900 font-['Cairo'] group-hover:text-[#005ab5] transition-colors">
                                    {f.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {f.branch_name || 'الفرع الرئيسي'}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 mt-3 border-t border-gray-100 font-mono">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-gray-400" />
                                        {f.city} - {f.district}
                                    </span>
                                    <span className="text-blue-600 font-bold">
                                        {f.doctor_profiles_count || 0} أطباء
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                    <ShieldCheck className="w-4.5 h-4.5" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-sm font-['Cairo']">
                                    المشرفون والصلاحيات
                                </h3>
                            </div>
                            <Link
                                href="/group/staff"
                                className="text-xs font-bold text-[#005ab5] hover:text-[#00458e] transition-colors inline-flex items-center gap-1"
                            >
                                <span>الكل</span>
                                <ArrowLeft className="w-3 h-3" />
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {staffAssignments.slice(0, 4).map((s) => (
                                <div
                                    key={s.id}
                                    className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/80 hover:bg-white border border-transparent hover:border-gray-200 transition-colors text-xs"
                                >
                                    <div className="truncate min-w-0 pr-1">
                                        <div className="font-bold text-gray-900 truncate">
                                            {s.user_name}
                                        </div>
                                        <div className="text-[11px] text-gray-400 truncate">
                                            {s.scope_name}
                                        </div>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                            s.role === 'facility_admin'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-emerald-100 text-emerald-800'
                                        }`}
                                    >
                                        {s.role === 'facility_admin' ? 'مدير منشأة' : 'استقبال'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onAssignStaff}
                        className="w-full mt-4 py-2.5 px-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>تعيين مشرف أو موظف استقبال جديد</span>
                    </button>
                </div>
            </div>

            {/* Medical Specialties & Clinical Departments Snapshot */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                            <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm sm:text-base font-['Cairo']">
                                الأقسام والتخصصات الطبية بالمجمع
                            </h3>
                            <p className="text-xs text-gray-500">
                                التخصصات والأقسام الإكلينيكية المعتمدة عبر مستشفيات وعيادات المجمع
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {onAddSpecialty && (
                            <AppButton
                                size="sm"
                                variant="emerald"
                                icon={<Plus className="w-4 h-4" />}
                                onClick={onAddSpecialty}
                            >
                                + إضافة تخصص طبي
                            </AppButton>
                        )}
                        <Link
                            href="/group/specialties"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005ab5] hover:text-[#00458e] transition-colors"
                        >
                            <span>إدارة كافة التخصصات ({specialties.length})</span>
                            <ArrowLeft className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {specialties.slice(0, 8).map((spec) => (
                        <div
                            key={spec.id}
                            className="p-4 rounded-2xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-teal-200 hover:shadow-md transition-colors flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold">
                                        {spec.badge_text || 'قسم معتمد'}
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-[#005ab5]">
                                        {spec.group_doctors_count ?? 0} طبيب
                                    </span>
                                </div>
                                <h4 className="font-bold text-sm text-gray-900 font-['Cairo']">
                                    {spec.name_ar}
                                </h4>
                                <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                                    {spec.description || 'قسم تخصصي معتمد بالمجمع الطبي.'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm sm:text-base font-['Cairo']">
                                الأطباء والاستشاريون بالمجموعة
                            </h3>
                            <p className="text-xs text-gray-500">
                                توزيع الكادر الطبي على المراكز والعيادات التابعة
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/group/doctors"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005ab5] hover:text-[#00458e] transition-colors"
                    >
                        <span>عرض كافة الأطباء ({doctors.length})</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {doctors.slice(0, 4).map((doc) => (
                        <div
                            key={doc.id}
                            className="p-4 rounded-2xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-purple-200 hover:shadow-md transition-colors group flex flex-col justify-between"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                                    {doc.user.avatar ? (
                                        <img
                                            src={doc.user.avatar}
                                            alt={doc.user.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span>{doc.user.name[0]}</span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                                        {doc.user.name}
                                    </h4>
                                    <span className="text-[11px] text-gray-500 block truncate">
                                        {doc.specialty?.name_ar || 'استشاري'}
                                    </span>
                                </div>
                            </div>

                            <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 flex items-center justify-between">
                                <span className="truncate max-w-[120px]">
                                    {doc.clinic?.name || 'الفرع الرئيسي'}
                                </span>
                                <span className="font-bold text-purple-700 font-mono">
                                    {doc.consultation_fee} ر.س
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
});
