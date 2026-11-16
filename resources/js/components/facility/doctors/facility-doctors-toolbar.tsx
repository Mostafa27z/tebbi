import React, { useMemo } from 'react';
import { Users, Plus, Clock } from 'lucide-react';
import {
    CustomSelect,
    SearchBox,
    AppButton,
    SurfaceCard,
    SectionHeader,
} from '@/components/common';
import { FacilitySpecialtyItem } from './types';

interface FacilityDoctorsToolbarProps {
    isManager: boolean;
    filteredCount: number;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    specialtyFilter: string;
    onSpecialtyChange: (val: string) => void;
    presenceFilter: 'all' | 'available' | 'unavailable';
    onPresenceChange: (val: 'all' | 'available' | 'unavailable') => void;
    specialties: FacilitySpecialtyItem[];
    onOpenAddModal: () => void;
}

const PRESENCE_OPTIONS = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'available', label: 'حاضر ومتاح اليوم' },
    { value: 'unavailable', label: 'غير متواجد / معلّق' },
];

export const FacilityDoctorsToolbar: React.FC<FacilityDoctorsToolbarProps> = React.memo(({
    isManager,
    filteredCount,
    searchQuery,
    onSearchChange,
    specialtyFilter,
    onSpecialtyChange,
    presenceFilter,
    onPresenceChange,
    specialties,
    onOpenAddModal,
}) => {
    const specialtyOptions = useMemo(
        () => [
            { value: 'all', label: 'جميع التخصصات' },
            ...specialties.map((s) => ({ value: s.id, label: s.name_ar })),
        ],
        [specialties]
    );

    return (
        <>
            <SectionHeader
                className="mb-6"
                icon={<Users className="w-5 h-5 text-purple-600" />}
                title={
                    isManager
                        ? 'إدارة كادر أطباء المنشأة وضبط الخدمات والأسعار'
                        : 'أطباء المنشأة وتفعيل المربعات المتاحة'
                }
                description={
                    isManager
                        ? 'يمكنك إضافة أطباء جدد، تعيين أطباء مسجلين، تعديل أسعار الكشف بالمنشأة، وضبط الحضور اليومي'
                        : 'متابعة كادر الأطباء، حالة التواجد اليومي، وتفعيل المربعات المتاحة لاستقبال المرضى وحجز الأدوار'
                }
                actions={
                    <>
                        {isManager ? (
                            <AppButton
                                variant="primary"
                                icon={<Plus className="w-4 h-4" />}
                                onClick={onOpenAddModal}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                + إضافة واستدعاء طبيب
                            </AppButton>
                        ) : (
                            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                <span>صلاحية الاستقبال: ضبط الحضور والمربعات</span>
                            </div>
                        )}

                        <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-100">
                            المعروض: <span className="font-mono text-purple-700 font-black">{filteredCount}</span> طبيب
                        </div>
                    </>
                }
            />

            <SurfaceCard
                variant="muted"
                padding="sm"
                rounded="2xl"
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
            >
                <SearchBox
                    size="sm"
                    value={searchQuery}
                    onChange={onSearchChange}
                    placeholder="بحث باسم الطبيب، التخصص، اللقب..."
                />

                <CustomSelect
                    size="sm"
                    value={specialtyFilter}
                    onChange={(val) => onSpecialtyChange(String(val))}
                    options={specialtyOptions}
                    placeholder="تصفية بالتخصص"
                />

                <CustomSelect
                    size="sm"
                    value={presenceFilter}
                    onChange={(val) => onPresenceChange(val as 'all' | 'available' | 'unavailable')}
                    options={PRESENCE_OPTIONS}
                    placeholder="تصفية بحالة التواجد"
                />
            </SurfaceCard>
        </>
    );
});
FacilityDoctorsToolbar.displayName = 'FacilityDoctorsToolbar';
