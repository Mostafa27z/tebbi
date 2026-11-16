import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { FacilityDashboardLayout } from '@/layouts/facility-dashboard-layout';
import {
    Stethoscope,
    Users,
    Activity,
    Plus,
    Layers,
    CheckCircle2,
    Trash2,
    Sparkles,
} from 'lucide-react';
import {
    SurfaceCard,
    SectionHeader,
    SearchBox,
    AppButton,
    Modal,
    FormInput,
    FormTextarea,
    ModalFooter,
} from '@/components/common';
import { cn } from '@/lib/utils';

interface Doctor {
    id: number;
    title_ar: string;
    consultation_fee: number;
    waiting_time_minutes: number;
    is_available_today: boolean;
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    specialty: {
        id: number;
        name_ar: string;
    };
}

interface SpecialtyItem {
    id: number;
    name_ar: string;
    name_en?: string;
    badge_text?: string;
    description?: string;
}

interface Props {
    facility: {
        id: number;
        name: string;
        branch_name?: string;
        type?: 'hospital' | 'clinic';
        city: string;
        settings?: {
            specialty_ids?: number[];
            sectors?: string[];
        };
    };
    metrics: {
        doctorsCount: number;
        activeDoctorsCount: number;
        specialtiesCount: number;
        totalToday: number;
        waitingCount: number;
        inConsultationCount: number;
        completedCount: number;
        receptionistsCount?: number;
    };
    doctors: Doctor[];
    specialties: SpecialtyItem[];
    allSpecialties?: SpecialtyItem[];
}

const DEFAULT_HOSPITAL_SECTORS = [
    'قسم الطوارئ والرعاية الحرجة 24/7',
    'العيادات الخارجية والاستشارية',
    'المختبر المركزي والتحاليل الطبية',
    'قسم الأشعة التشخيصية والرنين',
    'وحدة جراحة اليوم الواحد والمناظير',
    'مكتب موافقات التأمين الطبي الفوري',
];

export default function FacilitySpecialtiesPage({
    facility,
    metrics,
    doctors = [],
    specialties = [],
    allSpecialties = [],
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddSpecialtyModalOpen, setIsAddSpecialtyModalOpen] = useState(false);
    const [isManageSectorsModalOpen, setIsManageSectorsModalOpen] = useState(false);

    const activeSpecialtyIds = useMemo(
        () => specialties.map((s) => s.id),
        [specialties]
    );

    const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<number[]>(activeSpecialtyIds);
    const [sectorsList, setSectorsList] = useState<string[]>(
        facility.settings?.sectors && facility.settings.sectors.length > 0
            ? facility.settings.sectors
            : DEFAULT_HOSPITAL_SECTORS
    );
    const [newSectorInput, setNewSectorInput] = useState('');
    const [savingConfig, setSavingConfig] = useState(false);

    const createSpecialtyForm = useForm({
        mode: 'create_specialty',
        facility_id: facility.id,
        name_ar: '',
        name_en: '',
        badge_text: 'قسم معتمد',
        description: '',
    });

    const filteredSpecialties = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return specialties;
        return specialties.filter(
            (spec) =>
                spec.name_ar.toLowerCase().includes(q) ||
                (spec.description && spec.description.toLowerCase().includes(q))
        );
    }, [specialties, searchQuery]);

    const handleCreateSpecialty = (e: React.FormEvent) => {
        e.preventDefault();
        createSpecialtyForm.post('/facility/specialties', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddSpecialtyModalOpen(false);
                createSpecialtyForm.reset();
            },
        });
    };

    const handleAddSectorItem = () => {
        const trimmed = newSectorInput.trim();
        if (!trimmed || sectorsList.includes(trimmed)) return;
        setSectorsList((prev) => [...prev, trimmed]);
        setNewSectorInput('');
    };

    const handleRemoveSectorItem = (sector: string) => {
        setSectorsList((prev) => prev.filter((item) => item !== sector));
    };

    const handleToggleSpecialtySelection = (id: number) => {
        setSelectedSpecialtyIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSaveHospitalConfig = () => {
        setSavingConfig(true);
        router.post(
            '/facility/specialties',
            {
                mode: 'sync',
                facility_id: facility.id,
                specialty_ids: selectedSpecialtyIds,
                sectors: sectorsList,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSavingConfig(false);
                    setIsManageSectorsModalOpen(false);
                },
                onFinish: () => {
                    setSavingConfig(false);
                },
            }
        );
    };

    return (
        <FacilityDashboardLayout
            activeTab="specialties"
            facilityName={facility.name}
            branchName={facility.branch_name}
            counts={{
                waiting: metrics.waitingCount,
                doctors: metrics.doctorsCount,
                specialties: specialties?.length || metrics.specialtiesCount,
                appointments: metrics.totalToday,
                receptionists: metrics.receptionistsCount,
            }}
        >
            <Head title={`الأقسام والتخصصات والقطاعات - ${facility.name}`} />

            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SurfaceCard padding="md" className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-500 block">
                                إجمالي الأقسام التخصصية
                            </span>
                            <span className="text-2xl font-black text-teal-600 font-mono mt-1 block">
                                {specialties.length}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">
                                تخصصات معتمدة بالمنشأة
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                            <Stethoscope className="w-6 h-6" />
                        </div>
                    </SurfaceCard>

                    <SurfaceCard padding="md" className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-500 block">
                                القطاعات والمهام التشغيلية
                            </span>
                            <span className="text-2xl font-black text-[#005ab5] font-mono mt-1 block">
                                {sectorsList.length}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">
                                وحدات وخدمات طبية نشطة
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#005ab5]">
                            <Layers className="w-6 h-6" />
                        </div>
                    </SurfaceCard>

                    <SurfaceCard padding="md" className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-500 block">
                                إجمالي الأطباء في الأقسام
                            </span>
                            <span className="text-2xl font-black text-purple-600 font-mono mt-1 block">
                                {doctors.length}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">
                                كوادر طبية واستشارية
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <Users className="w-6 h-6" />
                        </div>
                    </SurfaceCard>
                </div>

                {/* Hospital Sectors & Tasks Card */}
                <SurfaceCard padding="lg" rounded="3xl" className="space-y-4">
                    <SectionHeader
                        icon={<Layers className="w-5 h-5 text-[#005ab5]" />}
                        title={`القطاعات والخدمات التشغيلية في ${facility.name}`}
                        description="الوحدات والقطاعات والمهام الطبية المتوفرة داخل المستشفى والتي تظهر للمرضى في صفحة المجمع"
                        actions={
                            <AppButton
                                variant="blue-soft"
                                size="sm"
                                icon={<Sparkles className="w-4 h-4" />}
                                onClick={() => setIsManageSectorsModalOpen(true)}
                            >
                                إدارة قطاعات وتخصصات المستشفى
                            </AppButton>
                        }
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sectorsList.map((sector, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs font-bold text-slate-800"
                            >
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{sector}</span>
                            </div>
                        ))}
                    </div>
                </SurfaceCard>

                {/* Specialties Directory */}
                <SurfaceCard padding="lg" rounded="3xl" className="space-y-6">
                    <SectionHeader
                        icon={<Stethoscope className="w-5 h-5 text-teal-600" />}
                        title="دليل الأقسام والعيادات التخصصية المعتمدة"
                        description={`كافة التخصصات الطبية المتوفرة داخل ${facility.name} مع كادرها الطبي المقيد`}
                        actions={
                            <div className="flex flex-wrap items-center gap-2">
                                <SearchBox
                                    size="sm"
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="بحث باسم القسم الطبي..."
                                    containerClassName="w-56"
                                />
                                <AppButton
                                    variant="emerald"
                                    size="sm"
                                    icon={<Plus className="w-4 h-4" />}
                                    onClick={() => setIsAddSpecialtyModalOpen(true)}
                                >
                                    + إضافة تخصص جديد للمستشفى
                                </AppButton>
                            </div>
                        }
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredSpecialties.length > 0 ? (
                            filteredSpecialties.map((spec) => {
                                const specDoctors = doctors.filter(
                                    (d) => d.specialty?.id === spec.id || d.specialty?.name_ar === spec.name_ar
                                );

                                return (
                                    <SurfaceCard
                                        key={spec.id}
                                        padding="md"
                                        rounded="3xl"
                                        className="hover:border-teal-300 hover:shadow-md transition-colors flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                                                    <Stethoscope className="w-6 h-6" />
                                                </div>
                                                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50/80 px-2.5 py-1 rounded-full border border-teal-100">
                                                    {specDoctors.length}{' '}
                                                    {specDoctors.length === 1 ? 'طبيب' : 'أطباء'}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-base text-slate-900 font-['Cairo'] mb-1.5">
                                                {spec.name_ar}
                                            </h3>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {spec.description ||
                                                    'تخصص طبي معتمد يقدم خدمات تشخيصية وعلاجية متقدمة وفق المعايير الطبية المعتمدة.'}
                                            </p>
                                        </div>

                                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                                            <div className="text-[11px] font-bold text-slate-400">
                                                الأطباء بالقسم:
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {specDoctors.length > 0 ? (
                                                    specDoctors.map((doc) => (
                                                        <span
                                                            key={doc.id}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-[11px] font-medium"
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                                            <span>{doc.user.name}</span>
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 text-xs">
                                                        قسم مفعل بالمنشأة (جاهز لتعيين أطباء)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </SurfaceCard>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                                لا توجد تخصصات مطابقة للبحث.
                            </div>
                        )}
                    </div>
                </SurfaceCard>
            </div>

            {/* Modal 1: Add New Specialty to Hospital */}
            <Modal
                isOpen={isAddSpecialtyModalOpen}
                onClose={() => setIsAddSpecialtyModalOpen(false)}
                title={`إضافة قسم وتخصص طبي جديد لـ ${facility.name}`}
                description="إنشاء قسم تخصصي جديد وإدراجه مباشرة ضمن أقسام المستشفى"
                maxWidth="md"
            >
                <form onSubmit={handleCreateSpecialty} className="space-y-4">
                    <FormInput
                        label="اسم القسم / التخصص الطبي (بالعربية)"
                        required
                        placeholder="مثال: جراحة القلب والصدر"
                        value={createSpecialtyForm.data.name_ar}
                        onChange={(e) => createSpecialtyForm.setData('name_ar', e.target.value)}
                        error={createSpecialtyForm.errors.name_ar}
                    />

                    <FormInput
                        label="اسم التخصص (بالإنجليزية)"
                        dir="ltr"
                        placeholder="e.g. Cardiothoracic Surgery"
                        value={createSpecialtyForm.data.name_en}
                        onChange={(e) => createSpecialtyForm.setData('name_en', e.target.value)}
                    />

                    <FormInput
                        label="شارة التميز (Badge)"
                        placeholder="وحدة متقدمة، نخبة الاستشاريين..."
                        value={createSpecialtyForm.data.badge_text}
                        onChange={(e) => createSpecialtyForm.setData('badge_text', e.target.value)}
                    />

                    <FormTextarea
                        label="وصف الخدمات والمهام الإكلينيكية للقسم"
                        rows={3}
                        placeholder="اذكر أبرز الخدمات التشخيصية والعلاجية المتوفرة في هذا القسم..."
                        value={createSpecialtyForm.data.description}
                        onChange={(e) => createSpecialtyForm.setData('description', e.target.value)}
                    />

                    <ModalFooter
                        onCancel={() => setIsAddSpecialtyModalOpen(false)}
                        loading={createSpecialtyForm.processing}
                        submitText="حفظ وإدراج التخصص بالمستشفى"
                        submitVariant="emerald"
                    />
                </form>
            </Modal>

            {/* Modal 2: Manage Hospital Sectors, Tasks & Enabled Specialties */}
            <Modal
                isOpen={isManageSectorsModalOpen}
                onClose={() => setIsManageSectorsModalOpen(false)}
                title={`إدارة قطاعات وتخصصات ${facility.name}`}
                description="حدد الأقسام الطبية والقطاعات والمهام التشغيلية المتوفرة في هذه المنشأة"
                maxWidth="xl"
            >
                <div className="space-y-5">
                    {/* Add/Manage Sectors & Tasks */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-800 font-['Cairo']">
                            1. القطاعات والمهام التشغيلية بالمستشفى:
                        </label>
                        <div className="flex items-center gap-2">
                            <FormInput
                                placeholder="أضف قطاعاً أو خدمة جديدة (مثال: وحدة العناية المركزة، طوارئ الأطفال...)"
                                value={newSectorInput}
                                onChange={(e) => setNewSectorInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSectorItem();
                                    }
                                }}
                            />
                            <AppButton
                                type="button"
                                variant="emerald"
                                icon={<Plus className="w-4 h-4" />}
                                onClick={handleAddSectorItem}
                            >
                                إضافة
                            </AppButton>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1">
                            {sectorsList.map((sector, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                                >
                                    <span className="truncate">{sector}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSectorItem(sector)}
                                        className="text-slate-400 hover:text-red-600 cursor-pointer p-1"
                                        title="حذف القطاع"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Toggle Active Specialties */}
                    {allSpecialties.length > 0 && (
                        <div className="space-y-2.5 pt-3 border-t border-slate-100">
                            <label className="block text-xs font-bold text-slate-800 font-['Cairo']">
                                2. الأقسام والتخصصات الطبية المعتمدة بالمنشأة:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1">
                                {allSpecialties.map((spec) => {
                                    const checked = selectedSpecialtyIds.includes(spec.id);
                                    return (
                                        <button
                                            key={spec.id}
                                            type="button"
                                            onClick={() => handleToggleSpecialtySelection(spec.id)}
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
                    )}

                    <ModalFooter
                        onCancel={() => setIsManageSectorsModalOpen(false)}
                        loading={savingConfig}
                        loadingText="جارٍ الحفظ..."
                        submitText="حفظ واعتماد قطاعات وتخصصات المنشأة"
                        submitType="button"
                        onSubmitClick={handleSaveHospitalConfig}
                    />
                </div>
            </Modal>
        </FacilityDashboardLayout>
    );
}
