import React, { useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import { Modal, FormInput, CustomSelect, ModalFooter } from '@/components/common';
import { ReceptionDoctor } from './types';

interface WalkInTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    facilityId: number;
    doctors: ReceptionDoctor[];
}

export const WalkInTicketModal: React.FC<WalkInTicketModalProps> = React.memo(({
    isOpen,
    onClose,
    facilityId,
    doctors,
}) => {
    const walkInForm = useForm({
        doctor_profile_id: doctors[0]?.id || 0,
        patient_name: '',
        patient_phone: '',
        patient_national_id: '',
    });

    const doctorModalOptions = useMemo(
        () =>
            doctors.map((d) => {
                const fee = d.facility_consultation_fee ?? d.consultation_fee ?? 200;
                return {
                    value: d.id,
                    label: `${d.user?.name || 'د. طبيب'} (${d.specialty?.name_ar || ''})`,
                    sublabel: `${d.title_ar ? d.title_ar + ' • ' : ''}سعر الكشف: ${fee} ر.س`,
                };
            }),
        [doctors]
    );

    if (!isOpen) return null;

    const handleIssueTicket = (e: React.FormEvent) => {
        e.preventDefault();
        walkInForm.post(`/facility/${facilityId}/walkin-ticket`, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                walkInForm.reset();
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="قطع تذكرة فورية (Walk-in)"
            description="للمرضى الحاضرين مباشرة دون حجز مسبق عبر المنصة"
            maxWidth="md"
        >
            <form onSubmit={handleIssueTicket} className="space-y-4">
                <CustomSelect
                    label="اختر الطبيب المعالج"
                    value={walkInForm.data.doctor_profile_id}
                    onChange={(val) => walkInForm.setData('doctor_profile_id', Number(val))}
                    options={doctorModalOptions}
                    menuWidth="trigger"
                />

                <FormInput
                    label="اسم المريض الثلاثي"
                    required
                    value={walkInForm.data.patient_name}
                    onChange={(e) => walkInForm.setData('patient_name', e.target.value)}
                    placeholder="مثال: صالح محمد الرويلي"
                    error={walkInForm.errors.patient_name}
                />

                <FormInput
                    label="رقم الجوال"
                    type="tel"
                    required
                    value={walkInForm.data.patient_phone}
                    onChange={(e) => walkInForm.setData('patient_phone', e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="font-mono"
                    error={walkInForm.errors.patient_phone}
                />

                <FormInput
                    label="رقم الهوية الوطنية / الإقامة (اختياري)"
                    value={walkInForm.data.patient_national_id}
                    onChange={(e) => walkInForm.setData('patient_national_id', e.target.value)}
                    placeholder="10XXXXXXXX"
                    className="font-mono"
                    error={walkInForm.errors.patient_national_id}
                />

                <ModalFooter
                    loading={walkInForm.processing}
                    loadingText="جارٍ إصدار التذكرة..."
                    submitText="إصدار التذكرة وإلحاق المريض بالطابور"
                    submitVariant="emerald"
                    fullWidthSubmit
                />
            </form>
        </Modal>
    );
});
WalkInTicketModal.displayName = 'WalkInTicketModal';
