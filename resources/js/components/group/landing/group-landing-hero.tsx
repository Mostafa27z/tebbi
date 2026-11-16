import React, { memo } from 'react';
import { Link } from '@inertiajs/react';
import {
    Building2,
    ShieldCheck,
    Copy,
    Share2,
    QrCode,
    Star,
    Users,
    Hospital,
    Stethoscope,
    MapPin,
    CheckCircle2,
    Activity,
} from 'lucide-react';
import { AppButton } from '@/components/common';
import { GroupLandingInfo, GroupLandingStats } from './types';

interface GroupLandingHeroProps {
    group: GroupLandingInfo;
    stats: GroupLandingStats;
    onCopyUrl: () => void;
    onShareWhatsApp: () => void;
    onOpenQrModal: () => void;
}

export const GroupLandingHero = memo(function GroupLandingHero({
    group,
    stats,
    onCopyUrl,
    onShareWhatsApp,
    onOpenQrModal,
}: GroupLandingHeroProps) {
    const availableCount = stats.availableTodayDoctors ?? stats.totalDoctors;

    return (
        <section
            className="bg-linear-to-bl from-[#002b5c] via-[#004a99] to-[#005ab5] text-white pt-8 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
            dir="rtl"
        >
            {/* Subtle Architectural Grid Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Breadcrumb Navigation */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-blue-200 mb-6">
                    <Link href="/" className="hover:text-white transition-colors font-medium">
                        الرئيسية
                    </Link>
                    <span className="opacity-50">/</span>
                    <Link href="/doctors" className="hover:text-white transition-colors font-medium">
                        المجمعات والمستشفيات المعتمدة
                    </Link>
                    <span className="opacity-50">/</span>
                    <span className="text-white font-bold">{group.name_ar}</span>
                </div>

                {/* Main Executive Header Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Right Column: Identity & Value Proposition (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col sm:flex-row items-start gap-5 text-right">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white p-3.5 shadow-xl flex items-center justify-center shrink-0 border-2 border-white/30">
                            {group.logo_url ? (
                                <img
                                    src={group.logo_url}
                                    alt={group.name_ar}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div
                                className={
                                    group.logo_url
                                        ? 'hidden w-full h-full items-center justify-center text-[#005ab5]'
                                        : 'flex w-full h-full items-center justify-center text-[#005ab5]'
                                }
                            >
                                <Building2 className="w-11 h-11" />
                            </div>
                        </div>

                        <div className="space-y-2.5 flex-1 min-w-0">
                            {/* Official Verification & Location Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-bold">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                                    <span>منظومة طبية معتمدة رسمياً</span>
                                </span>

                                {group.cr_number && (
                                    <span className="text-[11px] text-blue-100 font-mono bg-white/10 border border-white/15 px-2.5 py-1 rounded-full">
                                        س.ت: {group.cr_number}
                                    </span>
                                )}

                                {stats.cities && stats.cities.length > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-blue-100 bg-white/10 border border-white/15 px-2.5 py-1 rounded-full">
                                        <MapPin className="w-3 h-3 text-amber-300" />
                                        <span>{stats.cities.join(' • ')}</span>
                                    </span>
                                )}
                            </div>

                            {/* Group Arabic & English Title (properly right-aligned in RTL) */}
                            <div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-['Cairo'] tracking-tight text-white leading-snug">
                                    {group.name_ar}
                                </h1>
                                {group.name_en && (
                                    <p className="text-xs sm:text-sm text-blue-200/90 font-mono font-semibold mt-0.5 text-right">
                                        {group.name_en}
                                    </p>
                                )}
                            </div>

                            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
                                منظومة رعاية صحية متكاملة تضم نخبة الاستشاريين والأطباء عبر مستشفيات ومراكز تخصصية مجهزة بأحدث التقنيات، مع نظام حجز فوري وتتبع لحظي للطابور الطبي.
                            </p>

                            {/* Key Operational Pillars */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/95 bg-white/10 px-3 py-1 rounded-xl">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                                    <span>حجز فوري مؤكد</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/95 bg-white/10 px-3 py-1 rounded-xl">
                                    <Activity className="w-3.5 h-3.5 text-amber-300" />
                                    <span>تتبع مباشر لدور العيادة</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/95 bg-white/10 px-3 py-1 rounded-xl">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
                                    <span>اعتماد شركات التأمين</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Left Column: Share & QR Action Card (4 cols) */}
                    <div className="lg:col-span-4 bg-white/10 border border-white/20 rounded-3xl p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-100 font-['Cairo']">
                                البوابة الرقمية الرسمية للمجمع
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>الحجز المباشر متاح</span>
                            </span>
                        </div>

                        <div
                            className="p-2.5 rounded-xl bg-slate-950/35 border border-white/10 font-mono text-[11px] text-blue-100 truncate text-left"
                            dir="ltr"
                        >
                            {group.public_url}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <AppButton
                                size="sm"
                                variant="ghost"
                                onClick={onCopyUrl}
                                icon={<Copy className="w-3.5 h-3.5" />}
                                className="bg-white/15 hover:bg-white/25 text-white border border-white/15 text-[11px]"
                            >
                                نسخ الرابط
                            </AppButton>

                            <AppButton
                                size="sm"
                                variant="emerald"
                                onClick={onShareWhatsApp}
                                icon={<Share2 className="w-3.5 h-3.5" />}
                                className="text-[11px]"
                            >
                                واتساب
                            </AppButton>

                            <AppButton
                                size="sm"
                                variant="outline"
                                onClick={onOpenQrModal}
                                icon={<QrCode className="w-3.5 h-3.5 text-[#005ab5]" />}
                                className="bg-white text-[#005ab5] hover:bg-blue-50 border-white text-[11px]"
                            >
                                رمز QR
                            </AppButton>
                        </div>
                    </div>
                </div>

                {/* Executive KPI Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/15">
                    <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-4 border border-white/15 flex items-center justify-between gap-3">
                        <div>
                            <div className="text-2xl sm:text-3xl font-black font-['Cairo'] text-white flex items-baseline gap-2">
                                <span>{stats.totalDoctors}</span>
                                <span className="text-[11px] font-bold text-emerald-300">
                                    ({availableCount} متاح اليوم)
                                </span>
                            </div>
                            <div className="text-xs text-blue-100 mt-0.5 font-medium">
                                طبيب واستشاري معتمد بالمجمع
                            </div>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-4 border border-white/15 flex items-center justify-between gap-3">
                        <div>
                            <div className="text-2xl sm:text-3xl font-black font-['Cairo'] text-white">
                                {stats.totalFacilities}
                            </div>
                            <div className="text-xs text-blue-100 mt-0.5 font-medium">
                                {stats.totalHospitals} مستشفى • {stats.totalClinics} مركز عيادات
                            </div>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-300 shrink-0">
                            <Hospital className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-4 border border-white/15 flex items-center justify-between gap-3">
                        <div>
                            <div className="text-2xl sm:text-3xl font-black font-['Cairo'] text-white">
                                {stats.specialtiesCount}
                            </div>
                            <div className="text-xs text-blue-100 mt-0.5 font-medium">
                                قسم وتخصص طبي وإكلينيكي
                            </div>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-blue-200 shrink-0">
                            <Stethoscope className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-2xl p-4 border border-white/15 flex items-center justify-between gap-3">
                        <div>
                            <div className="text-2xl sm:text-3xl font-black font-['Cairo'] text-amber-300 flex items-center gap-1.5">
                                <span>{stats.avgRating}</span>
                                <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
                            </div>
                            <div className="text-xs text-blue-100 mt-0.5 font-medium">
                                متوسط تقييم المرضى المعتمد
                            </div>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-300 shrink-0">
                            <Star className="w-5 h-5 fill-amber-300" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
});
