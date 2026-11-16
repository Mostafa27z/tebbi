import React, { memo } from 'react';
import {
    Building2,
    MapPin,
    Phone,
    ArrowUpRight,
    Copy,
    QrCode,
    ShieldCheck,
    CheckCircle2,
    Stethoscope,
    Users,
    Layers,
    ExternalLink,
} from 'lucide-react';
import { Modal, SurfaceCard, AppButton } from '@/components/common';
import { FacilityItem, GroupLandingInfo } from './types';

interface GroupFacilityCardProps {
    facility: FacilityItem;
    isSelected?: boolean;
    onSelectBranch: (id: number) => void;
    onSelectSpecialty?: (specialtyId: number, branchId: number) => void;
}

export const GroupFacilityCard = memo(function GroupFacilityCard({
    facility: fac,
    isSelected = false,
    onSelectBranch,
    onSelectSpecialty,
}: GroupFacilityCardProps) {
    const sectors = fac.sectors || [];
    const specialties = fac.specialties || [];
    const doctorsPreview = fac.doctors_preview || [];

    return (
        <SurfaceCard
            padding="lg"
            rounded="3xl"
            className={
                isSelected
                    ? 'border-[#005ab5] ring-2 ring-[#005ab5]/20 flex flex-col justify-between space-y-5'
                    : 'hover:border-blue-200 transition-colors flex flex-col justify-between space-y-5'
            }
        >
            <div className="space-y-4">
                {/* Header: Icon, Badges & Title */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-13 h-13 rounded-2xl bg-blue-50 text-[#005ab5] flex items-center justify-center shrink-0 border border-blue-100">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold">
                                    {fac.type === 'hospital' ? 'مستشفى متكامل' : 'مركز عيادات تخصصية'}
                                </span>
                                {fac.moh_license_no && (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
                                        ترخيص: {fac.moh_license_no}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-slate-900 text-base sm:text-lg font-['Cairo'] leading-snug">
                                {fac.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {fac.branch_name || `${fac.city} - حي ${fac.district}`}
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-[#005ab5] text-xs font-bold shrink-0">
                        <Users className="w-3.5 h-3.5" />
                        <span>{fac.doctor_profiles_count || 0} طبيب</span>
                    </span>
                </div>

                {/* Location & Contact Info */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#005ab5] shrink-0 mt-0.5" />
                        <span className="text-slate-700 font-medium">
                            {fac.city} — حي {fac.district}
                            {fac.address ? ` (${fac.address})` : ''}
                        </span>
                    </div>
                    {fac.phone && (
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-400 text-[11px]">الرقم الموحد والاستقبال:</span>
                            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-800" dir="ltr">
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{fac.phone}</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Hospital Sectors & Operational Tasks (القطاعات والمهام الطبية بالمستشفى) */}
                {sectors.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-['Cairo']">
                            <Layers className="w-3.5 h-3.5 text-[#005ab5]" />
                            <span>القطاعات والخدمات التشغيلية بالمنشأة:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {sectors.map((sector, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] font-medium text-slate-700"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span className="truncate">{sector}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Specialties Available in this Hospital (التخصصات المتوفرة بالمستشفى) */}
                {specialties.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 font-['Cairo'] flex items-center gap-1.5">
                                <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                                <span>الأقسام والتخصصات الطبية المعتمدة:</span>
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                                {specialties.length} تخصصات
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {specialties.map((spec) => (
                                <button
                                    key={spec.id}
                                    type="button"
                                    onClick={() => {
                                        if (onSelectSpecialty) {
                                            onSelectSpecialty(spec.id, fac.id);
                                        } else {
                                            onSelectBranch(fac.id);
                                        }
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/60 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                    {spec.name_ar}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Doctors Preview in this Hospital */}
                {doctorsPreview.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-slate-500">
                            نخبة الأطباء والاستشاريين المتواجدين:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {doctorsPreview.map((d) => (
                                <span
                                    key={d.id}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-bold text-slate-700"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>{d.name}</span>
                                    {d.specialty && (
                                        <span className="text-[10px] text-slate-400 font-normal">
                                            ({d.specialty})
                                        </span>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <AppButton
                    variant={isSelected ? 'emerald' : 'primary'}
                    fullWidth
                    icon={<ArrowUpRight className="w-4 h-4" />}
                    iconPosition="end"
                    onClick={() => {
                        onSelectBranch(fac.id);
                        const el = document.getElementById('group-doctors-section');
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                        } else {
                            window.scrollTo({ top: 380, behavior: 'smooth' });
                        }
                    }}
                >
                    {isSelected ? 'معروض حالياً بقائمة الأطباء' : `استعراض أطباء ${fac.name}`}
                </AppButton>

                <a
                    href={
                        fac.map_url ||
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${fac.name} ${fac.city} ${fac.district}`
                        )}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="h-10.5 px-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-[#005ab5] text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                    title="الموقع على خرائط جوجل"
                >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">الخريطة</span>
                </a>
            </div>
        </SurfaceCard>
    );
});

interface GroupQrModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: GroupLandingInfo;
    onCopyUrl: () => void;
}

export const GroupQrModal = memo(function GroupQrModal({
    isOpen,
    onClose,
    group,
    onCopyUrl,
}: GroupQrModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="باركود QR لصفحة المجمع الطبية"
            description="امسح الرمز للوصول المباشر إلى بوابة حجز المجمع الطبي"
            maxWidth="sm"
        >
            <div className="text-center space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl inline-block border border-slate-200">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                            group.public_url
                        )}`}
                        alt={group.name_ar}
                        className="w-48 h-48 mx-auto"
                    />
                </div>

                <div>
                    <h4 className="font-bold text-slate-900 text-sm font-['Cairo']">{group.name_ar}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-1" dir="ltr">
                        {group.public_url}
                    </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                    <AppButton
                        variant="secondary"
                        fullWidth
                        icon={<Copy className="w-3.5 h-3.5" />}
                        onClick={onCopyUrl}
                    >
                        نسخ الرابط
                    </AppButton>
                    <AppButton
                        variant="primary"
                        fullWidth
                        icon={<QrCode className="w-3.5 h-3.5" />}
                        onClick={() => {
                            window.open(
                                `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                                    group.public_url
                                )}`,
                                '_blank'
                            );
                        }}
                    >
                        تحميل الباركود
                    </AppButton>
                </div>
            </div>
        </Modal>
    );
});
