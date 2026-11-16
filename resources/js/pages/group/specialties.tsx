import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Stethoscope,
    Plus,
    Edit3,
    Hospital,
    Users,
    Layers,
    CheckCircle2,
    Trash2,
} from 'lucide-react';
import { GroupDashboardLayout } from '@/layouts/group-dashboard-layout';
import {
    MetricCard,
    SurfaceCard,
    SectionHeader,
    SearchBox,
    AppButton,
    Modal,
    FormInput,
    ModalFooter,
} from '@/components/common';
import {
    Facility,
    Doctor,
    StaffAssignment,
    GroupInfo,
    GroupMetrics,
    SpecialtyOption,
    AddGroupSpecialtyModal,
} from '@/components/group';
import { cn } from '@/lib/utils';

interface Props {
    group: GroupInfo;
    metrics: GroupMetrics;
    facilities: Facility[];
    doctors: Doctor[];
    specialties: SpecialtyOption[];
    staffAssignments: StaffAssignment[];
}

const DEFAULT_HOSPITAL_SECTORS = [
    'قسم الطوارئ والرعاية الحرجة 24/7',
    'العيادات الخارجية والاستشارية',
    'المختبر المركزي والتحاليل الطبية',
    'قسم الأشعة التشخيصية والرنين',
    'وحدة جراحة اليوم الواحد والمناظير',
    'مكتب موافقات التأمين الطبي الفوري',
];

export default function GroupSpecialtiesPage({
    group,
    facilities = [],
    doctors = [],
    specialties = [],
    staffAssignments = [],
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [specialtyModalOpen, setSpecialtyModalOpen] = useState(false);
    const [editingSpecialty, setEditingSpecialty] = useState<SpecialtyOption | null>(null);

    const [managingFacility, setManagingFacility] = useState<Facility | null>(null);
    const [selectedSpecIds, setSelectedSpecIds] = useState<number[]>([]);
    const [facilitySectors, setFacilitySectors] = useState<string[]>([]);
    const [newSectorText, setNewSectorText] = useState('');
    const [savingFacilityConfig, setSavingFacilityConfig] = useState(false);

    const filteredSpecialties = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return specialties;
        return specialties.filter(
            (s) =>
                s.name_ar.toLowerCase().includes(q) ||
                (s.name_en && s.name_en.toLowerCase().includes(q)) ||
                (s.description && s.description.toLowerCase().includes(q))
        );
    }, [specialties, searchQuery]);

    const handleOpenManageFacility = (fac: Facility) => {
        setManagingFacility(fac);
        const existingSpecIds =
            fac.settings?.specialty_ids && fac.settings.specialty_ids.length > 0
                ? fac.settings.specialty_ids
                : specialties
                      .filter((s) => s.facility_ids?.includes(fac.id))
                      .map((s) => s.id);
        setSelectedSpecIds(existingSpecIds);
        setFacilitySectors(
            fac.settings?.sectors && fac.settings.sectors.length > 0
                ? fac.settings.sectors
                : DEFAULT_HOSPITAL_SECTORS
        );
        setNewSectorText('');
    };

    const handleSaveFacilityConfig = () => {
        if (!managingFacility) return;
        setSavingFacilityConfig(true);
        router.post(
            `/group/${group.id}/facilities/${managingFacility.id}/specialties`,
            {
                specialty_ids: selectedSpecIds,
                sectors: facilitySectors,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSavingFacilityConfig(false);
                    setManagingFacility(null);
                },
                onFinish: () => {
                    setSavingFacilityConfig(false);
                },
            }
        );
    };

    return (
        <GroupDashboardLayout
            activeTab="specialties"
            group={group}
            counts={{
                facilities: facilities.length,
                doctors: doctors.length,
                specialties: specialties.length,
                staff: staffAssignments.length,
            }}
            onOpenAddModal={() => {
                setEditingSpecialty(null);
                setSpecialtyModalOpen(true);
            }}
            addModalLabel="إضافة تخصص طبي جديد"
        >
            <Head title={`الأقسام والتخصصات الطبية - ${group.name_ar}`} />

            <div className="space-y-6 font-['Tajawal']" dir="rtl">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MetricCard
                        title="إجمالي التخصصات الطبية"
                        value={specialties.length}
                        subtitle="أقسام وتخصصات معتمدة بالمجمع"
                        icon={<Stethoscope className="w-5 h-5 text-teal-600" />}
                        iconBg="bg-teal-50"
                    />
                    <MetricCard
                        title="المستشفيات والعيادات"
                        value={facilities.length}
                        subtitle="فروع مرتبطة بالتخصصات"
                        icon={<Hospital className="w-5 h-5 text-[#005ab5]" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="الأطباء والاستشاريون"
                        value={doctors.length}
                        subtitle="موزعون على الأقسام التخصصية"
                        icon={<Users className="w-5 h-5 text-purple-600" />}
                        iconBg="bg-purple-50"
                    />
                </div>

                {/* Section 1: Customize Specialties & Sectors Per Hospital */}
                <SurfaceCard padding="lg" rounded="3xl" className="space-y-4">
                    <SectionHeader
                        icon={<Layers className="w-5 h-5 text-[#005ab5]" />}
                        title="تخصيص الأقسام والقطاعات الطبية لكل مستشفى / عيادة"
                        description="حدد التخصصات والقطاعات والمهام التشغيلية الخاصة بكل مستشفى تابع للمجمع"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {facilities.map((fac) => {
                            const facSpecs = specialties.filter((s) =>
                                s.facility_ids?.includes(fac.id)
                            );
                            const facSectors =
                                fac.settings?.sectors && fac.settings.sectors.length > 0
                                    ? fac.settings.sectors
                                    : DEFAULT_HOSPITAL_SECTORS;

                            return (
                                <SurfaceCard
                                    key={fac.id}
                                    variant="muted"
                                    padding="md"
                                    rounded="2xl"
                                    className="flex flex-col justify-between space-y-4"
                                >
                                    <div className="space-y-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm font-['Cairo']">
                                                    {fac.name}
                                                </h3>
                                                <p className="text-[11px] text-slate-500">
                                                    {fac.city} - {fac.district}
                                                </p>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#005ab5] text-[10px] font-bold">
                                                {fac.type === 'hospital' ? 'مستشفى' : 'عيادة'}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-1 pt-1">
                                            {facSpecs.slice(0, 5).map((s) => (
                                                <span
                                                    key={s.id}
                                                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-bold"
                                                >
                                                    {s.name_ar}
                                                </span>
                                            ))}
                                            {facSpecs.length === 0 && (
                                                <span className="text-[11px] text-slate-400">
                                                    جميع التخصصات الافتراضية
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-[11px] text-emerald-700 font-bold">
                                            {facSectors.length} قطاعات وخدمات تشغيلية مفعلة
                                        </div>
                                    </div>

                                    <AppButton
                                        size="sm"
                                        variant="outline"
                                        fullWidth
                                        icon={<Edit3 className="w-3.5 h-3.5" />}
                                        onClick={() => handleOpenManageFacility(fac)}
                                    >
                                        تخصيص تخصصات ومهام المستشفى
                                    </AppButton>
                                </SurfaceCard>
                            );
                        })}
                    </div>
                </SurfaceCard>

                {/* Section 2: All Group Specialties Directory */}
                <SurfaceCard padding="lg" rounded="3xl" className="space-y-6">
                    <SectionHeader
                        icon={<Stethoscope className="w-5 h-5 text-teal-600" />}
                        title={`دليل الأقسام والتخصصات الطبية في ${group.name_ar}`}
                        description="إضافة تخصصات طبية جديدة أو تعديل الأقسام الحالية وتوزيعها على مستشفيات المجمع"
                        actions={
                            <div className="flex flex-wrap items-center gap-2">
                                <SearchBox
                                    size="sm"
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="بحث باسم التخصص..."
                                    containerClassName="w-56"
                                />
                                <AppButton
                                    size="sm"
                                    variant="primary"
                                    icon={<Plus className="w-4 h-4" />}
                                    onClick={() => {
                                        setEditingSpecialty(null);
                                        setSpecialtyModalOpen(true);
                                    }}
                                >
                                    + إضافة تخصص طبي جديد
                                </AppButton>
                            </div>
                        }
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredSpecialties.map((spec) => (
                            <SurfaceCard
                                key={spec.id}
                                padding="md"
                                rounded="3xl"
                                className="hover:border-teal-300 transition-colors flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                                            <Stethoscope className="w-5 h-5" />
                                        </div>
                                        <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold">
                                            {spec.badge_text || 'قسم معتمد'}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-slate-900 text-base font-['Cairo']">
                                        {spec.name_ar}
                                    </h3>
                                    {spec.name_en && (
                                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                            {spec.name_en}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                                        {spec.description || 'قسم تخصصي معتمد بالمجمع الطبي.'}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <div className="text-xs font-bold text-[#005ab5]">
                                        {spec.group_doctors_count ?? 0} طبيب •{' '}
                                        {spec.facility_ids?.length || facilities.length} فرع
                                    </div>

                                    <AppButton
                                        size="xs"
                                        variant="ghost"
                                        icon={<Edit3 className="w-3.5 h-3.5" />}
                                        onClick={() => {
                                            setEditingSpecialty(spec);
                                            setSpecialtyModalOpen(true);
                                        }}
                                    >
                                        تعديل
                                    </AppButton>
                                </div>
                            </SurfaceCard>
                        ))}
                    </div>
                </SurfaceCard>
            </div>

            <AddGroupSpecialtyModal
                isOpen={specialtyModalOpen}
                onClose={() => {
                    setSpecialtyModalOpen(false);
                    setEditingSpecialty(null);
                }}
                groupId={group.id}
                facilities={facilities}
                editingSpecialty={editingSpecialty}
            />

            {/* Modal: Manage Specific Hospital's Specialties & Operational Tasks */}
            <Modal
                isOpen={Boolean(managingFacility)}
                onClose={() => setManagingFacility(null)}
                title={`تخصيص أقسام ومهام: ${managingFacility?.name || ''}`}
                description="حدد التخصصات الطبية والقطاعات التشغيلية المتوفرة في هذه المنشأة"
                maxWidth="xl"
            >
                <div className="space-y-5">
                    <div className="space-y-2.5">
                        <label className="block text-xs font-bold text-slate-800 font-['Cairo']">
                            1. الأقسام والتخصصات الطبية المتوفرة في هذه المنشأة:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1">
                            {specialties.map((spec) => {
                                const checked = selectedSpecIds.includes(spec.id);
                                return (
                                    <button
                                        key={spec.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedSpecIds((prev) =>
                                                prev.includes(spec.id)
                                                    ? prev.filter((id) => id !== spec.id)
                                                    : [...prev, spec.id]
                                            )
                                        }
                                        className={cn(
                                            'p-2.5 rounded-xl border text-xs font-bold text-right flex items-center gap-2 cursor-pointer transition-colors',
                                            checked
                                                ? 'bg-blue-50 border-[#005ab5] text-[#005ab5]'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        )}
                                    >
                                        <CheckCircle2
                                            className={cn(
                                                'w-4 h-4 shrink-0',
                                            checked ? 'text-[#005ab5]' : 'text-slate-300'
                                            )}
                                        />
                                        <span className="truncate">{spec.name_ar}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-800 font-['Cairo']">
                            2. القطاعات والمهام والخدمات التشغيلية بالمستشفى:
                        </label>
                        <div className="flex items-center gap-2">
                            <FormInput
                                placeholder="أضف قطاعاً أو خدمة جديدة (مثال: طوارئ 24 ساعة، وحدة المناظير...)"
                                value={newSectorText}
                                onChange={(e) => setNewSectorText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const t = newSectorText.trim();
                                        if (t && !facilitySectors.includes(t)) {
                                            setFacilitySectors((prev) => [...prev, t]);
                                            setNewSectorText('');
                                        }
                                    }
                                }}
                            />
                            <AppButton
                                type="button"
                                variant="emerald"
                                icon={<Plus className="w-4 h-4" />}
                                onClick={() => {
                                    const t = newSectorText.trim();
                                    if (t && !facilitySectors.includes(t)) {
                                        setFacilitySectors((prev) => [...prev, t]);
                                        setNewSectorText('');
                                    }
                                }}
                            >
                                إضافة
                            </AppButton>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                            {facilitySectors.map((sec, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                                >
                                    <span className="truncate">{sec}</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFacilitySectors((prev) =>
                                                prev.filter((item) => item !== sec)
                                            )
                                        }
                                        className="text-slate-400 hover:text-red-600 cursor-pointer p-1"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <ModalFooter
                        onCancel={() => setManagingFacility(null)}
                        loading={savingFacilityConfig}
                        loadingText="جارٍ الحفظ..."
                        submitText="حفظ واعتماد تخصصات ومهام المستشفى"
                        submitType="button"
                        onSubmitClick={handleSaveFacilityConfig}
                    />
                </div>
            </Modal>
        </GroupDashboardLayout>
    );
}
