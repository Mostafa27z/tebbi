import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal } from '@/components/common/modal';
import { FormInput } from '@/components/common/form-input';
import { LoadingButton } from '@/components/common/loading-button';
import { Specialty } from '../types';

interface SpecialtyModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingSpecialty: Specialty | null;
}

export const SpecialtyModal: React.FC<SpecialtyModalProps> = ({
    isOpen,
    onClose,
    editingSpecialty,
}) => {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name_ar: '',
        name_en: '',
        icon_slug: 'dentistry',
        badge_text: '',
        description: '',
    });

    useEffect(() => {
        if (editingSpecialty) {
            setData({
                name_ar: editingSpecialty.name_ar,
                name_en: editingSpecialty.name_en || '',
                icon_slug: editingSpecialty.icon_slug,
                badge_text: editingSpecialty.badge_text || '',
                description: editingSpecialty.description || '',
            });
        } else {
            reset();
        }
    }, [editingSpecialty, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSpecialty) {
            put(`/admin/specialties/${editingSpecialty.id}`, {
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
            title={editingSpecialty ? `تعديل التخصص (${editingSpecialty.name_ar})` : 'إضافة تخصص طبي جديد'}
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

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">وصف مختصر للقسم</label>
                    <textarea
                        rows={3}
                        placeholder="نبذة عن الحالات والإجراءات المشمولة..."
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#005ab5] focus:outline-hidden"
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
                        {editingSpecialty ? 'تحديث التخصص' : 'حفظ واعتماد التخصص'}
                    </LoadingButton>
                </div>
            </form>
        </Modal>
    );
};

