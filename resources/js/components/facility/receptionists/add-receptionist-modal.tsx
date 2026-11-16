import React, { useState, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import { User, Mail, Phone, IdCard, ShieldCheck, Hospital, AlertCircle } from 'lucide-react';
import {
    Modal,
    FormInput,
    PasswordInput,
    CustomSelect,
    ModalFooter,
    ChoicePillGroup,
    InfoBanner,
} from '@/components/common';
import { AvailableReceptionUser } from './types';

interface AddReceptionistModalProps {
    isOpen: boolean;
    onClose: () => void;
    facility: { id: number; name: string };
    availableUsers: AvailableReceptionUser[];
}

const TAB_OPTIONS = [
    { value: 'new' as const, label: 'إنشاء حساب موظف جديد', activeTone: 'emerald' as const },
    { value: 'existing' as const, label: 'تعيين مستخدم مسجل مسبقاً', activeTone: 'blue' as const },
];

export const AddReceptionistModal: React.FC<AddReceptionistModalProps> = React.memo(({
    isOpen,
    onClose,
    facility,
    availableUsers,
}) => {
    const [addTab, setAddTab] = useState<'new' | 'existing'>('new');

    const newForm = useForm({
        mode: 'new' as 'new' | 'existing',
        facility_id: facility.id,
        name: '',
        email: '',
        phone: '',
        national_id: '',
        password: '',
    });

    const assignForm = useForm({
        mode: 'existing' as 'new' | 'existing',
        facility_id: facility.id,
        user_id: availableUsers[0]?.id ? String(availableUsers[0].id) : '',
    });

    const userOptions = useMemo(
        () =>
            availableUsers.map((u) => ({
                value: u.id,
                label: `${u.name} (${u.email})`,
            })),
        [availableUsers]
    );

    const handleCreateNew = (e: React.FormEvent) => {
        e.preventDefault();
        newForm.post('/facility/receptionists', {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                newForm.reset();
            },
        });
    };

    const handleAssignExisting = (e: React.FormEvent) => {
        e.preventDefault();
        assignForm.post('/facility/receptionists', {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                assignForm.reset();
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="إضافة موظف استقبال للمنشأة"
            description={`تعيين حساب بصلاحية موظف استقبال في: ${facility.name}`}
            maxWidth="lg"
        >
            <div className="space-y-5">
                <ChoicePillGroup
                    value={addTab}
                    onChange={(val) => setAddTab(val)}
                    options={TAB_OPTIONS}
                    columns={2}
                />

                {addTab === 'new' ? (
                    <form onSubmit={handleCreateNew} className="space-y-4">
                        <FormInput
                            label="اسم الموظف بالكامل"
                            required
                            placeholder="مثال: عبدالله محمد الشهري"
                            value={newForm.data.name}
                            onChange={(e) => newForm.setData('name', e.target.value)}
                            error={newForm.errors.name}
                            icon={<User className="w-4 h-4" />}
                        />

                        <FormInput
                            label="البريد الإلكتروني لتسجيل الدخول"
                            type="email"
                            required
                            dir="ltr"
                            placeholder="reception.staff@tebiby.com"
                            value={newForm.data.email}
                            onChange={(e) => newForm.setData('email', e.target.value)}
                            error={newForm.errors.email}
                            icon={<Mail className="w-4 h-4" />}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormInput
                                label="رقم الجوال"
                                placeholder="0501234567"
                                dir="ltr"
                                value={newForm.data.phone}
                                onChange={(e) => newForm.setData('phone', e.target.value)}
                                error={newForm.errors.phone}
                                icon={<Phone className="w-4 h-4" />}
                            />

                            <FormInput
                                label="رقم الهوية الوطنية (اختياري)"
                                placeholder="10XXXXXXXX"
                                dir="ltr"
                                value={newForm.data.national_id}
                                onChange={(e) => newForm.setData('national_id', e.target.value)}
                                error={newForm.errors.national_id}
                                icon={<IdCard className="w-4 h-4" />}
                            />
                        </div>

                        <PasswordInput
                            label="كلمة المرور"
                            required
                            placeholder="6 أحرف أو أرقام على الأقل"
                            value={newForm.data.password}
                            onChange={(e) => newForm.setData('password', e.target.value)}
                            error={newForm.errors.password}
                        />

                        <InfoBanner
                            variant="emerald"
                            icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
                        >
                            سيتم منح الحساب صلاحية موظف استقبال رسمية خاصة بمنشأة ({facility.name}) لتمكينه من قطع التذاكر وإدارة حركة صالة الانتظار.
                        </InfoBanner>

                        <ModalFooter
                            onCancel={onClose}
                            loading={newForm.processing}
                            submitText="حفظ وتعيين الموظف"
                            submitVariant="emerald"
                        />
                    </form>
                ) : (
                    <form onSubmit={handleAssignExisting} className="space-y-4">
                        {availableUsers.length > 0 ? (
                            <CustomSelect
                                label="اختر المستخدم المسجل بالنظام"
                                value={assignForm.data.user_id}
                                onChange={(val) => assignForm.setData('user_id', String(val))}
                                options={userOptions}
                                error={assignForm.errors.user_id}
                            />
                        ) : (
                            <InfoBanner
                                variant="amber"
                                icon={<AlertCircle className="w-4 h-4 text-amber-600" />}
                            >
                                لا يوجد مستخدمون إضافيون متاحون للتعيين حالياً. يرجى اختيار تبويب &quot;إنشاء حساب موظف جديد&quot;.
                            </InfoBanner>
                        )}

                        <InfoBanner
                            variant="blue"
                            icon={<Hospital className="w-4 h-4 text-[#005ab5]" />}
                        >
                            سيتم إسناد دور موظف الاستقبال لهذا المستخدم في منشأة ({facility.name}) دون التأثير على بياناته الشخصية.
                        </InfoBanner>

                        <ModalFooter
                            onCancel={onClose}
                            loading={assignForm.processing}
                            disabled={availableUsers.length === 0}
                            submitText="إسناد الصلاحية للمستخدم"
                            submitVariant="primary"
                        />
                    </form>
                )}
            </div>
        </Modal>
    );
});
AddReceptionistModal.displayName = 'AddReceptionistModal';
