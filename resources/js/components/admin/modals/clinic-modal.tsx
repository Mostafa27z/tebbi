import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal } from '@/components/common/modal';
import { FormInput } from '@/components/common/form-input';
import { CustomSelect } from '@/components/common/custom-select';
import { InternationalPhoneInput } from '@/components/common/international-phone-input';
import { LoadingButton } from '@/components/common/loading-button';
import { Clinic, Group } from '../types';
import { Building2, MapPin, Building, Phone } from 'lucide-react';

interface ClinicModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingClinic: Clinic | null;
    defaultGroupId?: number;
    groups: Group[];
}

export const ClinicModal: React.FC<ClinicModalProps> = ({
    isOpen,
    onClose,
    editingClinic,
    defaultGroupId,
    groups,
}) => {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        branch_name: '',
        group_id: (defaultGroupId || groups[0]?.id || '') as string | number,
        type: 'hospital' as 'hospital' | 'clinic',
        moh_license_no: '',
        city: 'الرياض',
        district: '',
        address: '',
        phone: '',
    });

    useEffect(() => {
        if (editingClinic) {
            setData({
                name: editingClinic.name,
                branch_name: editingClinic.branch_name,
                group_id: editingClinic.group_id || '',
                type: editingClinic.type || 'hospital',
                moh_license_no: editingClinic.moh_license_no || '',
                city: editingClinic.city,
                district: editingClinic.district,
                address: editingClinic.address,
                phone: editingClinic.phone,
            });
        } else {
            reset();
            if (defaultGroupId) {
                setData('group_id', defaultGroupId);
            }
        }
    }, [editingClinic, defaultGroupId, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingClinic) {
            put(`/admin/clinics/${editingClinic.id}`, {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post('/admin/clinics', {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        }
    };

    const groupOptions = [
        { value: '', label: 'منشأة مستقلة (بدون مجمع طبي)' },
        ...groups.map((g) => ({
            value: g.id,
            label: g.name_ar,
            sublabel: g.cr_number ? `سجل: ${g.cr_number}` : undefined,
        })),
    ];

    const typeOptions = [
        { value: 'hospital', label: 'مستشفى متكامل', sublabel: 'طوارئ، تنويم، عمليات' },
        { value: 'clinic', label: 'مجمع عيادات / مركز طبي', sublabel: 'عيادات خارجية تخصصية' },
    ];

    const cityOptions = [
        { value: 'الرياض', label: 'الرياض' },
        { value: 'جدة', label: 'جدة' },
        { value: 'الدمام', label: 'الدمام' },
        { value: 'مكة المكرمة', label: 'مكة المكرمة' },
        { value: 'المدينة المنورة', label: 'المدينة المنورة' },
        { value: 'الخبر', label: 'الخبر' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingClinic ? `تعديل المنشأة (${editingClinic.name})` : 'إضافة مستشفى أو عيادة جديدة'}
            description="إضافة منشأة طبية وربطها بالمجمع الطبي المناسب وتحديد تفاصيل الموقع"
            maxWidth="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <FormInput
                        label="اسم المنشأة الطبية"
                        required
                        placeholder="مستشفى المواساة الحديث"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        error={errors.name}
                    />

                    <FormInput
                        label="اسم الفرع / التوصيف"
                        placeholder="فرع قرطبة"
                        value={data.branch_name}
                        onChange={(e) => setData('branch_name', e.target.value)}
                        error={errors.branch_name}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <CustomSelect
                        label="المجمع الطبي التابع له"
                        value={data.group_id}
                        onChange={(val) => setData('group_id', val)}
                        options={groupOptions}
                        error={errors.group_id}
                        placeholder="اختر المجمع الطبي..."
                    />

                    <CustomSelect
                        label="تصنيف المنشأة"
                        value={data.type}
                        onChange={(val) => setData('type', val as 'hospital' | 'clinic')}
                        options={typeOptions}
                        error={errors.type}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <CustomSelect
                        label="المدينة"
                        value={data.city}
                        onChange={(val) => setData('city', String(val))}
                        options={cityOptions}
                        error={errors.city}
                    />

                    <FormInput
                        label="الحي"
                        required
                        placeholder="حي العليا"
                        value={data.district}
                        onChange={(e) => setData('district', e.target.value)}
                        error={errors.district}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <InternationalPhoneInput
                        label="رقم الهاتف والتواصل"
                        value={data.phone}
                        onChange={(val) => setData('phone', val)}
                        error={errors.phone}
                    />

                    <FormInput
                        label="العنوان التفصيلي"
                        required
                        placeholder="طريق الملك فهد، مقابل برج المملكة"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        error={errors.address}
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                        إلغاء
                    </button>
                    <LoadingButton
                        type="submit"
                        loading={processing}
                        className="font-['Cairo']"
                    >
                        {editingClinic ? 'تحديث بيانات المنشأة' : 'حفظ واعتماد المنشأة'}
                    </LoadingButton>
                </div>
            </form>
        </Modal>
    );
};
