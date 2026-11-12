import React from 'react';
import { useForm } from '@inertiajs/react';
import { Modal } from '@/components/common/modal';
import { FormInput } from '@/components/common/form-input';
import { CustomSelect } from '@/components/common/custom-select';
import { InternationalPhoneInput } from '@/components/common/international-phone-input';
import { LoadingButton } from '@/components/common/loading-button';
import { Building2, MapPin, ShieldCheck, Check } from 'lucide-react';

interface AddFacilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: number;
    groupName: string;
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

export const AddFacilityModal: React.FC<AddFacilityModalProps> = ({
    isOpen,
    onClose,
    groupId,
    groupName,
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
    });

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
            description="إضافة مستشفى أو مركز عيادات وربطه بالسجل الطبي للمجمع"
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
                    icon={<Building2 className="w-4 h-4 text-gray-400" />}
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
                        icon={<ShieldCheck className="w-4 h-4 text-gray-400" />}
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
                        icon={<MapPin className="w-4 h-4 text-gray-400" />}
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

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
                    >
                        إلغاء
                    </button>
                    <LoadingButton
                        type="submit"
                        loading={processing}
                        loadingText="جاري الحفظ..."
                        variant="primary"
                        icon={<Check className="w-4 h-4" />}
                    >
                        حفظ المنشأة
                    </LoadingButton>
                </div>
            </form>
        </Modal>
    );
};

