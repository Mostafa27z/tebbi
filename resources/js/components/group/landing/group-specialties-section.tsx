import React, { memo } from 'react';
import {
    Stethoscope,
    Eye,
    Brain,
    Bone,
    Baby,
    Sparkles,
    Activity,
    Users,
    Building2,
    CheckCircle2,
} from 'lucide-react';
import { SurfaceCard, SectionHeader } from '@/components/common';
import { cn } from '@/lib/utils';
import { SpecialtyItem } from './types';

interface GroupSpecialtiesSectionProps {
    groupName: string;
    specialties: SpecialtyItem[];
    selectedSpecialtyId: 'all' | number;
    onSelectSpecialty: (id: 'all' | number) => void;
}

function getSpecialtyIcon(slug?: string) {
    switch (slug) {
        case 'ophthalmology':
            return <Eye className="w-6 h-6" />;
        case 'neurology':
            return <Brain className="w-6 h-6" />;
        case 'orthopedics':
            return <Bone className="w-6 h-6" />;
        case 'pediatrics':
            return <Baby className="w-6 h-6" />;
        case 'dermatology':
            return <Sparkles className="w-6 h-6" />;
        case 'cardiology':
        case 'internal_medicine':
            return <Activity className="w-6 h-6" />;
        default:
            return <Stethoscope className="w-6 h-6" />;
    }
}

export const GroupSpecialtiesSection = memo(function GroupSpecialtiesSection({
    groupName,
    specialties,
    selectedSpecialtyId,
    onSelectSpecialty,
}: GroupSpecialtiesSectionProps) {
    if (specialties.length === 0) return null;

    return (
        <section className="space-y-5">
            <SectionHeader
                icon={<Stethoscope className="w-6 h-6 text-[#005ab5]" />}
                title={`الأقسام والتخصصات الطبية في ${groupName}`}
                description="اضغط على أي قسم طبي لاستعراض أطبائه واستشارييه المتاحين للحجز الفوري"
                badge={
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#005ab5] text-xs font-bold font-mono">
                        {specialties.length} أقسام تخصصية
                    </span>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {specialties.map((spec) => {
                    const isSelected = selectedSpecialtyId === spec.id;
                    return (
                        <SurfaceCard
                            key={spec.id}
                            padding="md"
                            rounded="3xl"
                            onClick={() => onSelectSpecialty(isSelected ? 'all' : spec.id)}
                            className={cn(
                                'cursor-pointer transition-colors duration-150 flex flex-col justify-between group',
                                isSelected
                                    ? 'border-[#005ab5] bg-blue-50/40 ring-2 ring-[#005ab5]/20'
                                    : 'hover:border-blue-300 hover:bg-slate-50/40'
                            )}
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div
                                        className={cn(
                                            'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
                                            isSelected
                                                ? 'bg-[#005ab5] text-white'
                                                : 'bg-blue-50 text-[#005ab5] group-hover:bg-[#005ab5] group-hover:text-white'
                                        )}
                                    >
                                        {getSpecialtyIcon(spec.icon_slug || spec.icon)}
                                    </div>

                                    {spec.badge_text ? (
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold">
                                            {spec.badge_text}
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                            قسم معتمد
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-bold text-slate-900 text-base font-['Cairo'] group-hover:text-[#005ab5] transition-colors">
                                    {spec.name_ar}
                                </h3>

                                {spec.name_en && (
                                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                        {spec.name_en}
                                    </p>
                                )}

                                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                    {spec.description ||
                                        'عيادات تخصصية واستشارية مجهزة بأحدث تقنيات التشخيص والعلاج الدقيق.'}
                                </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="inline-flex items-center gap-1 text-slate-600 font-bold">
                                    <Users className="w-3.5 h-3.5 text-[#005ab5]" />
                                    <span>{spec.doctors_count} طبيب واستشاري</span>
                                </span>

                                {isSelected ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005ab5]">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>مفعل بالفلتر</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                        <Building2 className="w-3 h-3" />
                                        <span>{spec.facilities_count || 1} فرع</span>
                                    </span>
                                )}
                            </div>
                        </SurfaceCard>
                    );
                })}
            </div>
        </section>
    );
});
