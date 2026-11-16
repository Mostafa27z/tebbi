import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Stethoscope, CheckCircle2, Hospital } from 'lucide-react';
import {
    Modal,
    FormInput,
    FormTextarea,
    ModalFooter,
} from '@/components/common';
import { cn } from '@/lib/utils';
import { Facility, SpecialtyOption } from '../types';

interface AddGroupSpecialtyModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: number;
    facilities: Facility[];
    editingSpecialty?: SpecialtyOption | null;
}

export const AddGroupSpecialtyModal: React.FC<AddGroupSpecialtyModalProps> = React.memo(({
    isOpen,
    onClose,
    groupId,
    facilities = [],
    editingSpecialty,
}) => {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name_ar: '',
        name_en: '',
        badge_text: 'قسم معتمد',
        description: '',
        facility_ids: facilities.map((f) => f.id) as number[],
    });

    useEffect(() => {
        if (editingSpecialty) {
            setData({
                name_ar: editingSpecialty.name_ar || '',
                name_en: editingSpecialty.name_en || '',
                badge_text: editingSpecialty.badge_text || 'قسم معتمد',
                description: editingSpecialty.description || '',
                facility_ids:
                    editingSpecialty.facility_ids && editingSpecialty.facility_ids.length > 0
                        ? editingSpecialty.facility_ids
                        : facilities.map((f) => f.id),
            });
        } else {
            reset();
            setData('facility_ids', facilities.map((f) => f.id));
        }
    }, [editingSpecialty, isOpen, facilities.length]);

    const toggleFacility = (facId: number) => {
        setData((prev) => {
            const exists = prev.facility_ids.includes(facId);
            return {
                ...prev,
                facility_ids: exists
                    ? prev.facility_ids.filter((id) => id !== facId)
                    : [...prev.facility_ids, facId],
            };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSpecialty) {
            put(`/group/${groupId}/specialties/${editingSpecialty.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post(`/group/${groupId}/specialties`, {
                preserveScroll: true,
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
            title={
                editingSpecialty
                    ? `تعديل التخصص الطبي (${editingSpecialty.name_ar})`
                    : 'إضافة قسم وتخصص طبي جديد للمجمع'
            }
            description="إضافة التخصص الطبي وتحديد المستشفيات والفروع التي يتوفر بها هذا القسم"
            headerIcon={<Stethoscope className="w-5 h-5" />}
            maxWidth="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="اسم القسم / التخصص الطبي (بالعربية)"
                    required
                    placeholder="مثال: جراحة القلب والأوعية الدموية"
                    value={data.name_ar}
                    onChange={(e) => setData('name_ar', e.target.value)}
                    error={errors.name_ar}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <FormInput
                        label="اسم التخصص (بالإنجليزية)"
                        dir="ltr"
                        placeholder="e.g. Cardiology & Vascular"
                        value={data.name_en}
                        onChange={(e) => setData('name_en', e.target.value)}
                        error={errors.name_en}
                    />

                    <FormInput
                        label="شارة التميز (Badge)"
                        placeholder="نخبة الاستشاريين، تقنيات حديثة..."
                        value={data.badge_text}
                        onChange={(e) => setData('badge_text', e.target.value)}
                        error={errors.badge_text}
                    />
                </div>

                <FormTextarea
                    label="وصف الخدمات الإكلينيكية للقسم"
                    rows={3}
                    placeholder="اذكر أبرز الحالات والخدمات التشخيصية والعلاجية في هذا القسم..."
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    error={errors.description}
                />

                {facilities.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-700 font-['Cairo'] flex items-center gap-1.5">
                            <Hospital className="w-3.5 h-3.5 text-[#005ab5]" />
                            <span>المستشفيات والفروع المتاح بها هذا التخصص:</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {facilities.map((fac) => {
                                const selected = data.facility_ids.includes(fac.id);
                                return (
                                    <button
                                        key={fac.id}
                                        type="button"
                                        onClick={() => toggleFacility(fac.id)}
                                        className={cn(
                                            'p-2.5 rounded-xl border text-xs font-bold text-right flex items-center gap-2 cursor-pointer transition-colors',
                                            selected
                                                ? 'bg-blue-50 border-[#005ab5] text-[#005ab5]'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        )}
                                    >
                                        <CheckCircle2
                                            className={cn(
                                                'w-4 h-4 shrink-0',
                                                selected ? 'text-[#005ab5]' : 'text-slate-300'
                                            )}
                                        />
                                        <div className="min-w-0 truncate">
                                            <div className="truncate">{fac.name}</div>
                                            <div className="text-[10px] font-normal opacity-75">
                                                {fac.city} - {fac.district}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <ModalFooter
                    onCancel={onClose}
                    loading={processing}
                    submitText={editingSpecialty ? 'حفظ تعديلات التخصص' : 'حفظ واعتماد التخصص بالمجمع'}
                />
            </form>
        </Modal>
    );
});
AddGroupSpecialtyModal.displayName = 'AddGroupSpecialtyModal';
