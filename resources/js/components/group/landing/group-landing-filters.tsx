import React, { memo } from 'react';
import { Clock, ShieldCheck, Hospital, Stethoscope, Users, LayoutGrid } from 'lucide-react';
import { SearchBox, AppButton, SurfaceCard } from '@/components/common';
import { FacilityItem, SpecialtyItem } from './types';

interface GroupLandingFiltersProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    todayOnly: boolean;
    onToggleToday: () => void;
    insuranceOnly: boolean;
    onToggleInsurance: () => void;
    facilities: FacilityItem[];
    selectedBranchId: 'all' | number;
    onSelectBranch: (id: 'all' | number) => void;
    specialties: SpecialtyItem[];
    selectedSpecialtyId: 'all' | number;
    onSelectSpecialty: (id: 'all' | number) => void;
    activeSectionTab?: 'all' | 'doctors' | 'facilities' | 'specialties';
    onChangeSectionTab?: (tab: 'all' | 'doctors' | 'facilities' | 'specialties') => void;
    totalDoctorsCount?: number;
}

export const GroupLandingFilters = memo(function GroupLandingFilters({
    searchQuery,
    onSearchChange,
    todayOnly,
    onToggleToday,
    insuranceOnly,
    onToggleInsurance,
    facilities,
    selectedBranchId,
    onSelectBranch,
    specialties,
    selectedSpecialtyId,
    onSelectSpecialty,
    activeSectionTab = 'all',
    onChangeSectionTab,
    totalDoctorsCount = 0,
}: GroupLandingFiltersProps) {
    return (
        <SurfaceCard padding="md" rounded="3xl" className="shadow-xl space-y-4">
            {/* Section Navigation Pills */}
            {onChangeSectionTab && (
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                        <AppButton
                            size="sm"
                            variant={activeSectionTab === 'all' ? 'primary' : 'secondary'}
                            icon={<LayoutGrid className="w-3.5 h-3.5" />}
                            onClick={() => onChangeSectionTab('all')}
                        >
                            نظرة شاملة للمجمع
                        </AppButton>

                        <AppButton
                            size="sm"
                            variant={activeSectionTab === 'doctors' ? 'primary' : 'secondary'}
                            icon={<Users className="w-3.5 h-3.5" />}
                            onClick={() => onChangeSectionTab('doctors')}
                        >
                            الأطباء والاستشاريون ({totalDoctorsCount})
                        </AppButton>

                        <AppButton
                            size="sm"
                            variant={activeSectionTab === 'facilities' ? 'primary' : 'secondary'}
                            icon={<Hospital className="w-3.5 h-3.5" />}
                            onClick={() => onChangeSectionTab('facilities')}
                        >
                            المستشفيات والقطاعات التابعة ({facilities.length})
                        </AppButton>

                        <AppButton
                            size="sm"
                            variant={activeSectionTab === 'specialties' ? 'primary' : 'secondary'}
                            icon={<Stethoscope className="w-3.5 h-3.5" />}
                            onClick={() => onChangeSectionTab('specialties')}
                        >
                            الأقسام والتخصصات الطبية ({specialties.length})
                        </AppButton>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
                        تصفية فورية حسب المستشفى أو التخصص أو حالة التواجد
                    </span>
                </div>
            )}

            {/* Search & Quick Toggle Filters */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <SearchBox
                    size="lg"
                    value={searchQuery}
                    onChange={onSearchChange}
                    placeholder="ابحث باسم الطبيب، الاستشاري، التخصص الطبي، أو المستشفى..."
                    containerClassName="flex-1"
                />

                <div className="flex items-center gap-2">
                    <AppButton
                        size="lg"
                        variant={todayOnly ? 'emerald-soft' : 'outline'}
                        icon={<Clock className="w-4 h-4" />}
                        onClick={onToggleToday}
                    >
                        متاح اليوم
                    </AppButton>

                    <AppButton
                        size="lg"
                        variant={insuranceOnly ? 'blue-soft' : 'outline'}
                        icon={<ShieldCheck className="w-4 h-4" />}
                        onClick={onToggleInsurance}
                    >
                        تأمين معتمد
                    </AppButton>
                </div>
            </div>

            {/* Hospital / Branch Filter Strip (Always visible when facilities exist) */}
            {facilities.length > 0 && (
                <div className="pt-2.5 border-t border-slate-100">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                        <span className="text-slate-500 font-bold shrink-0 flex items-center gap-1.5 text-[11px]">
                            <Hospital className="w-3.5 h-3.5 text-[#005ab5]" />
                            <span>المستشفى / الفرع:</span>
                        </span>

                        <AppButton
                            size="xs"
                            variant={selectedBranchId === 'all' ? 'primary' : 'secondary'}
                            onClick={() => onSelectBranch('all')}
                        >
                            كافة المستشفيات والفروع ({facilities.length})
                        </AppButton>

                        {facilities.map((fac) => (
                            <AppButton
                                key={fac.id}
                                size="xs"
                                variant={selectedBranchId === fac.id ? 'primary' : 'secondary'}
                                onClick={() => onSelectBranch(fac.id)}
                            >
                                <span>{fac.name}</span>
                                <span className="opacity-75 text-[10px] mr-1">
                                    ({fac.city} - {fac.doctor_profiles_count || 0} طبيب)
                                </span>
                            </AppButton>
                        ))}
                    </div>
                </div>
            )}

            {/* Specialties Filter Strip */}
            {specialties.length > 0 && (
                <div className="pt-2.5 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                        <span className="text-slate-500 font-bold shrink-0 flex items-center gap-1.5 text-[11px]">
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                            <span>التخصص الطبي:</span>
                        </span>

                        <AppButton
                            size="xs"
                            variant={selectedSpecialtyId === 'all' ? 'emerald' : 'secondary'}
                            onClick={() => onSelectSpecialty('all')}
                            className="rounded-full"
                        >
                            جميع التخصصات ({specialties.length})
                        </AppButton>

                        {specialties.map((spec) => (
                            <AppButton
                                key={spec.id}
                                size="xs"
                                variant={selectedSpecialtyId === spec.id ? 'emerald' : 'secondary'}
                                onClick={() => onSelectSpecialty(spec.id)}
                                className="rounded-full"
                            >
                                <span>{spec.name_ar}</span>
                                <span className="text-[10px] opacity-80 font-mono mr-1">
                                    ({spec.doctors_count})
                                </span>
                            </AppButton>
                        ))}
                    </div>
                </div>
            )}
        </SurfaceCard>
    );
});
