import React from 'react';
import { useForm } from '@inertiajs/react';
import { Modal } from '@/components/common/modal';
import { FormInput } from '@/components/common/form-input';
import { CustomSelect } from '@/components/common/custom-select';
import { InternationalPhoneInput } from '@/components/common/international-phone-input';
import { PasswordInput } from '@/components/common/password-input';
import { LoadingButton } from '@/components/common/loading-button';
import { Facility } from '../types';
import { User, Mail, ShieldCheck, Check } from 'lucide-react';

interface AssignStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: number;
    facilities: Facility[];
}

const STAFF_ROLES = [
    { value: 'facility_admin', label: 'مدير منشأة (Facility Admin)' },
    { value: 'receptionist', label: 'موظف استقبال (Receptionist)' },
];

export const AssignStaffModal: React.FC<AssignStaffModalProps> = ({
    isOpen,
    onClose,
    groupId,
    facilities,
}) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        facility_id: facilities[0]?.id || 0,
        role: 'facility_admin' as 'facility_admin' | 'receptionist',
        user_mode: 'new' as 'existing' | 'new',
        user_id: '',
        new_name: '',
        new_email: '',
        new_password: '',
        new_phone: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/group/${groupId}/staff`, {
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
            title="تعيين مشرف أو موظف استقبال"
            description="إنشاء حساب إداري جديد وتخصيص صلاحياته للمنشأة المختارة"
            maxWidth="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <CustomSelect
                    label="المنشأة المستهدفة"
                    value={data.facility_id}
                    onChange={(val) => setData('facility_id', Number(val))}
                    options={facilities.map((f) => ({
                        value: f.id,
                        label: `${f.name} (${f.city})`,
                    }))}
                    error={errors.facility_id}
                />

                <CustomSelect
                    label="المسمى والصلاحية الإدارية"
                    value={data.role}
                    onChange={(val) => setData('role', val as 'facility_admin' | 'receptionist')}
                    options={STAFF_ROLES}
                    error={errors.role}
                />

                <FormInput
                    label="اسم المشرف / الموظف بالكامل"
                    required
                    placeholder="سلطان عبدالكريم"
                    value={data.new_name}
                    onChange={(e) => setData('new_name', e.target.value)}
                    error={errors.new_name}
                    icon={<User className="w-4 h-4 text-gray-400" />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormInput
                        label="البريد الإلكتروني للولوج"
                        type="email"
                        required
                        dir="ltr"
                        placeholder="admin.olaya@tebiby.com"
                        value={data.new_email}
                        onChange={(e) => setData('new_email', e.target.value)}
                        error={errors.new_email}
                        icon={<Mail className="w-4 h-4 text-gray-400" />}
                    />

                    <PasswordInput
                        label="كلمة المرور المؤقتة"
                        required
                        placeholder="••••••••"
                        value={data.new_password}
                        onChange={(e) => setData('new_password', e.target.value)}
                        error={errors.new_password}
                    />
                </div>

                <InternationalPhoneInput
                    label="رقم الجوال للتواصل"
                    value={data.new_phone}
                    onChange={(fullPhone) => setData('new_phone', fullPhone)}
                    error={errors.new_phone}
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
                        loadingText="جاري التعيين..."
                        variant="primary"
                        icon={<Check className="w-4 h-4" />}
                    >
                        حفظ وتعيين المشرف
                    </LoadingButton>
                </div>
            </form>
        </Modal>
    );
};

