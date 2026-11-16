import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { User, Mail, Phone, IdCard } from 'lucide-react';
import { Modal, FormInput, PasswordInput, ModalFooter } from '@/components/common';
import { ReceptionistItem } from './types';

interface EditReceptionistModalProps {
    receptionist: ReceptionistItem | null;
    onClose: () => void;
}

export const EditReceptionistModal: React.FC<EditReceptionistModalProps> = React.memo(({
    receptionist,
    onClose,
}) => {
    const editForm = useForm({
        name: '',
        email: '',
        phone: '',
        national_id: '',
        password: '',
    });

    useEffect(() => {
        if (!receptionist) return;
        editForm.setData({
            name: receptionist.name,
            email: receptionist.email,
            phone: receptionist.phone || '',
            national_id: receptionist.national_id || '',
            password: '',
        });
        editForm.clearErrors();
    }, [receptionist]);

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!receptionist) return;

        editForm.put(`/facility/receptionists/${receptionist.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                editForm.reset();
            },
        });
    };

    return (
        <Modal
            isOpen={Boolean(receptionist)}
            onClose={onClose}
            title="تعديل بيانات موظف الاستقبال"
            description={`تحديث بيانات حساب (${receptionist?.name || ''})`}
            maxWidth="lg"
        >
            {receptionist && (
                <form onSubmit={handleUpdate} className="space-y-4">
                    <FormInput
                        label="اسم الموظف بالكامل"
                        required
                        placeholder="الاسم الثلاثي"
                        value={editForm.data.name}
                        onChange={(e) => editForm.setData('name', e.target.value)}
                        error={editForm.errors.name}
                        icon={<User className="w-4 h-4" />}
                    />

                    <FormInput
                        label="البريد الإلكتروني للولوج"
                        type="email"
                        required
                        dir="ltr"
                        value={editForm.data.email}
                        onChange={(e) => editForm.setData('email', e.target.value)}
                        error={editForm.errors.email}
                        icon={<Mail className="w-4 h-4" />}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormInput
                            label="رقم الجوال"
                            placeholder="0501234567"
                            dir="ltr"
                            value={editForm.data.phone}
                            onChange={(e) => editForm.setData('phone', e.target.value)}
                            error={editForm.errors.phone}
                            icon={<Phone className="w-4 h-4" />}
                        />

                        <FormInput
                            label="رقم الهوية الوطنية"
                            placeholder="10XXXXXXXX"
                            dir="ltr"
                            value={editForm.data.national_id}
                            onChange={(e) => editForm.setData('national_id', e.target.value)}
                            error={editForm.errors.national_id}
                            icon={<IdCard className="w-4 h-4" />}
                        />
                    </div>

                    <PasswordInput
                        label="كلمة مرور جديدة (اختياري)"
                        placeholder="اترك هذا الحقل فارغاً للإبقاء على كلمة المرور الحالية"
                        helperText="اترك الحقل فارغاً إذا كنت لا ترغب بتغيير كلمة مرور الموظف."
                        value={editForm.data.password}
                        onChange={(e) => editForm.setData('password', e.target.value)}
                        error={editForm.errors.password}
                    />

                    <ModalFooter
                        onCancel={onClose}
                        loading={editForm.processing}
                        submitText="حفظ التعديلات"
                        submitVariant="emerald"
                    />
                </form>
            )}
        </Modal>
    );
});
EditReceptionistModal.displayName = 'EditReceptionistModal';
