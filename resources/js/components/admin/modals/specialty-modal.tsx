import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal, FormInput, FormTextarea, ModalFooter } from '@/components/common';
import { Specialty } from '../types';

interface SpecialtyModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingSpecialty?: Specialty | null;
    specialty?: Specialty | null;
}

export const SpecialtyModal: React.FC<SpecialtyModalProps> = React.memo(({
    isOpen,
    onClose,
    editingSpecialty,
    specialty,
}) => {
    const currentSpecialty = editingSpecialty || specialty || null;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name_ar: '',
        name_en: '',
        icon_slug: 'dentistry',
        badge_text: '',
        description: '',
    });

    useEffect(() => {
        if (currentSpecialty) {
            setData({
                name_ar: currentSpecialty.name_ar,
                name_en: currentSpecialty.name_en || '',
                icon_slug: currentSpecialty.icon_slug,
                badge_text: currentSpecialty.badge_text || '',
                description: currentSpecialty.description || '',
            });
        } else {
            reset();
        }
    }, [currentSpecialty, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentSpecialty) {
            put(`/admin/specialties/${currentSpecialty.id}`, {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post('/admin/specialties', {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={currentSpecialty ? `تعديل التخصص (${currentSpecialty.name_ar})` : 'إضافة تخصص طبي جديد'}
            description="إدارة أقسام وتصنيفات العيادات في المنصة"
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="اسم التخصص (بالعربية)"
                    required
                    placeholder="مثال: جراحة العظام والمفاصل"
                    value={data.name_ar}
                    onChange={(e) => setData('name_ar', e.target.value)}
                    error={errors.name_ar}
                />

                <FormInput
                    label="اسم التخصص (بالإنجليزية)"
                    placeholder="e.g. Orthopedics"
                    value={data.name_en}
                    onChange={(e) => setData('name_en', e.target.value)}
                    error={errors.name_en}
                    dir="ltr"
                />

                <FormInput
                    label="شارة مميزة (Badge)"
                    placeholder="أكثر طلباً، معتمد..."
                    value={data.badge_text}
                    onChange={(e) => setData('badge_text', e.target.value)}
                    error={errors.badge_text}
                />

                <FormTextarea
                    label="وصف مختصر للقسم"
                    rows={3}
                    placeholder="نبذة عن الحالات والإجراءات المشمولة..."
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    error={errors.description}
                />

                <ModalFooter
                    onCancel={onClose}
                    loading={processing}
                    submitText={editingSpecialty ? 'تحديث التخصص' : 'حفظ واعتماد التخصص'}
                />
            </form>
        </Modal>
    );
});
SpecialtyModal.displayName = 'SpecialtyModal';
