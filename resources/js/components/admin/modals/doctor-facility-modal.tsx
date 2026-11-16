import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal, FormInput, CustomSelect, ModalFooter } from '@/components/common';
import { Doctor, Clinic } from '../types';

interface DoctorFacilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDoctor?: Doctor | null;
    doctor?: Doctor | null;
    clinics: Clinic[];
}

export const DoctorFacilityModal: React.FC<DoctorFacilityModalProps> = React.memo(({
    isOpen,
    onClose,
    selectedDoctor,
    doctor,
    clinics,
}) => {
    const currentDoctor = selectedDoctor || doctor || null;

    const { data, setData, post, processing, errors, reset } = useForm({
        doctor_profile_id: (currentDoctor?.id || 0) as number,
        facility_id: (clinics[0]?.id || 0) as number,
        consultation_fee: 200,
        default_slot_minutes: 20,
        accepts_insurance: true as boolean,
        is_active: true as boolean,
    });

    useEffect(() => {
        if (currentDoctor) {
            setData((prev) => ({
                ...prev,
                doctor_profile_id: currentDoctor.id,
                consultation_fee: currentDoctor.consultation_fee,
                default_slot_minutes: currentDoctor.waiting_time_minutes || 20,
            }));
        }
    }, [currentDoctor, isOpen]);

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
            title={`تعيين الطبيب (${currentDoctor?.user.name || ''}) في منشأة إضافية`}
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

                <ModalFooter
                    onCancel={onClose}
                    loading={processing}
                    submitText="تعيين المنشأة الإضافية"
                />
            </form>
        </Modal>
    );
});
DoctorFacilityModal.displayName = 'DoctorFacilityModal';
