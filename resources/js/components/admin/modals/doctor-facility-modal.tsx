import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal } from '@/components/common/modal';
import { FormInput } from '@/components/common/form-input';
import { CustomSelect } from '@/components/common/custom-select';
import { LoadingButton } from '@/components/common/loading-button';
import { Doctor, Clinic } from '../types';

interface DoctorFacilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDoctor: Doctor | null;
    clinics: Clinic[];
}

export const DoctorFacilityModal: React.FC<DoctorFacilityModalProps> = ({
    isOpen,
    onClose,
    selectedDoctor,
    clinics,
}) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        doctor_profile_id: (selectedDoctor?.id || 0) as number,
        facility_id: (clinics[0]?.id || 0) as number,
        consultation_fee: 200,
        default_slot_minutes: 20,
        accepts_insurance: true as boolean,
        is_active: true as boolean,
    });

    useEffect(() => {
        if (selectedDoctor) {
            setData((prev) => ({
                ...prev,
                doctor_profile_id: selectedDoctor.id,
                consultation_fee: selectedDoctor.consultation_fee,
                default_slot_minutes: selectedDoctor.waiting_time_minutes || 20,
            }));
        }
    }, [selectedDoctor, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/doctor-facilities', {
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    const clinicOptions = clinics.map((c) => ({
        value: c.id,
        label: c.name,
        sublabel: `${c.city} - ${c.district || ''}`,
    }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`تعيين الطبيب (${selectedDoctor?.user.name}) في منشأة إضافية`}
            description="إتاحة حجز مواعيد لهذا الطبيب في فرع أو مستشفى إضافي"
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <CustomSelect
                    label="المنشأة الطبية الإضافية"
                    value={data.facility_id}
                    onChange={(val) => setData('facility_id', Number(val))}
                    options={clinicOptions}
                    error={errors.facility_id}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <FormInput
                        label="سعر الكشفية في هذا الفرع (ر.س)"
                        type="number"
                        required
                        value={data.consultation_fee}
                        onChange={(e) => setData('consultation_fee', Number(e.target.value))}
                        error={errors.consultation_fee}
                    />

                    <FormInput
                        label="مدة الموعد (دقيقة)"
                        type="number"
                        required
                        value={data.default_slot_minutes}
                        onChange={(e) => setData('default_slot_minutes', Number(e.target.value))}
                        error={errors.default_slot_minutes}
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
                        تعيين المنشأة الإضافية
                    </LoadingButton>
                </div>
            </form>
        </Modal>
    );
};
