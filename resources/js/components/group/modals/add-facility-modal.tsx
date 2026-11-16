import React from 'react';
import { useForm } from '@inertiajs/react';
import {
    Modal,
    FormInput,
    CustomSelect,
    InternationalPhoneInput,
    ModalFooter,
} from '@/components/common';
import { Building2, MapPin, ShieldCheck, Check, Stethoscope, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpecialtyOption } from '../types';

interface AddFacilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: number;
    groupName: string;
    specialties?: SpecialtyOption[];
}

const FACILITY_TYPES = [
    { value: 'hospital', label: 'مستشفى رئيسي (Hospital)' },
    { value: 'clinic', label: 'عيادة تخصصية (Clinic)' },
];

const COMMON_CITIES = [
    { value: 'الرياض', label: 'الرياض' },
    { value: 'جدة', label: 'جدة' },
    { value: 'الدمام', label: 'الدمام' },
    { value: 'مكة المكرمة', label: 'مكة المكرمة' },
    { value: 'المدينة المنورة', label: 'المدينة المنورة' },
    { value: 'الخبر', label: 'الخبر' },
    { value: 'الأحساء', label: 'الأحساء' },
    { value: 'تبوك', label: 'تبوك' },
    { value: 'أبها', label: 'أبها' },
    { value: 'بريدة', label: 'بريدة' },
];

export const AddFacilityModal: React.FC<AddFacilityModalProps> = React.memo(({
    isOpen,
    onClose,
    groupId,
    groupName,
    specialties = [],
}) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        branch_name: '',
        type: 'hospital' as 'hospital' | 'clinic',
        moh_license_no: '',
        city: 'الرياض',
        district: '',
        address: '',
        phone: '',
        specialty_ids: specialties.slice(0, 4).map((s) => s.id) as number[],
    });

    const toggleSpecialty = (specId: number) => {
        setData((prev) => {
            const exists = prev.specialty_ids.includes(specId);
            return {
                ...prev,
                specialty_ids: exists
                    ? prev.specialty_ids.filter((id) => id !== specId)
                    : [...prev.specialty_ids, specId],
            };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/group/${groupId}/facilities`, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`إضافة منشأة طبية تابعة لـ ${groupName}`}
            description="إضافة مستشفى أو مركز عيادات وتحديد الأقسام والتخصصات الطبية المتوفرة بها"
            maxWidth="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <CustomSelect
                    label="نوع المنشأة"
                    value={data.type}
                    onChange={(val) => setData('type', val as 'hospital' | 'clinic')}
                    options={FACILITY_TYPES}
                    error={errors.type}
                />

                <FormInput
                    label="اسم المنشأة الطبية"
                    required
                    placeholder="مثال: مستشفى د. سليمان الحبيب - فرع النرجس"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    error={errors.name}
                    icon={<Building2 className="w-4 h-4 text-slate-400" />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormInput
                        label="اسم الفرع / التوصيف"
                        placeholder="فرع طريق التخصصي"
                        value={data.branch_name}
                        onChange={(e) => setData('branch_name', e.target.value)}
                        error={errors.branch_name}
                    />

                    <FormInput
                        label="رقم ترخيص وزارة الصحة (MOH)"
                        placeholder="MOH-RYD-9988"
                        value={data.moh_license_no}
                        onChange={(e) => setData('moh_license_no', e.target.value)}
                        error={errors.moh_license_no}
                        icon={<ShieldCheck className="w-4 h-4 text-slate-400" />}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <CustomSelect
                        label="المدينة"
                        value={data.city}
                        onChange={(val) => setData('city', String(val))}
                        options={COMMON_CITIES}
                        error={errors.city}
                    />

                    <FormInput
                        label="الحي"
                        required
                        placeholder="حي الصحافة"
                        value={data.district}
                        onChange={(e) => setData('district', e.target.value)}
                        error={errors.district}
                        icon={<MapPin className="w-4 h-4 text-slate-400" />}
                    />
                </div>

                <FormInput
                    label="العنوان بالتفصيل"
                    required
                    placeholder="طريق الملك فهد، مقابل برج المملكة"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    error={errors.address}
                />

                <InternationalPhoneInput
                    label="هاتف التواصل الرسمي"
                    value={data.phone}
                    onChange={(fullPhone) => setData('phone', fullPhone)}
                    error={errors.phone}
                />

                {specialties.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-700 font-['Cairo'] flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-[#005ab5]" />
                            <span>الأقسام والتخصصات الطبية المتوفرة بالمنشأة:</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                            {specialties.map((spec) => {
                                const selected = data.specialty_ids.includes(spec.id);
                                return (
                                    <button
                                        key={spec.id}
                                        type="button"
                                        onClick={() => toggleSpecialty(spec.id)}
                                        className={cn(
                                            'p-2 rounded-xl border text-xs font-bold text-right flex items-center gap-1.5 cursor-pointer transition-colors',
                                            selected
                                                ? 'bg-blue-50 border-[#005ab5] text-[#005ab5]'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        )}
                                    >
                                        <CheckCircle2
                                            className={cn(
                                                'w-3.5 h-3.5 shrink-0',
                                                selected ? 'text-[#005ab5]' : 'text-slate-300'
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
                    onCancel={onClose}
                    loading={processing}
                    loadingText="جاري الحفظ..."
                    submitText="حفظ المنشأة وتخصصاتها"
                    submitIcon={<Check className="w-4 h-4" />}
                />
            </form>
        </Modal>
    );
});
AddFacilityModal.displayName = 'AddFacilityModal';
