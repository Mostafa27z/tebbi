import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Trash2, Users } from 'lucide-react';
import { Modal, SurfaceCard, ModalFooter } from '@/components/common';
import { FacilityDoctor } from './types';

interface DeleteFacilityDoctorModalProps {
    doctor: FacilityDoctor | null;
    facility: { id: number; name: string };
    onClose: () => void;
}

export const DeleteFacilityDoctorModal: React.FC<DeleteFacilityDoctorModalProps> = React.memo(({
    doctor,
    facility,
    onClose,
}) => {
    const [loading, setLoading] = useState(false);

    if (!doctor) return null;

    const handleConfirmDelete = () => {
        setLoading(true);
        router.delete(`/facility/doctors/${doctor.id}`, {
            data: { facility_id: facility.id },
            preserveScroll: true,
            onSuccess: () => {
                setLoading(false);
                onClose();
            },
            onError: () => {
                setLoading(false);
            },
        });
    };

    return (
        <Modal
            isOpen={Boolean(doctor)}
            onClose={onClose}
            title="إلغاء تعيين / استبعاد الطبيب"
            description={`${doctor.user.name} (${doctor.specialty.name_ar})`}
            headerIcon={<Trash2 className="w-5 h-5 text-red-600" />}
            maxWidth="md"
        >
            <div className="space-y-5">
                <SurfaceCard variant="danger" padding="sm" rounded="2xl" className="text-xs text-slate-700 leading-relaxed">
                    هل أنت متأكد من إلغاء تعيين هذا الطبيب من منشأة{' '}
                    <span className="font-bold text-slate-900">{facility.name}</span>؟ سيتم رفع كشوفاته من جدول المنشأة، وفي حال عدم ارتباطه بأي منشأة طبية أخرى لعدم وجود حجوزات سيتم حذف حسابه بالكامل.
                </SurfaceCard>

                <ModalFooter
                    onCancel={onClose}
                    cancelText="تراجع"
                    loading={loading}
                    loadingText="جارٍ التنفيذ..."
                    submitText="تأكيد الحذف / إلغاء التعيين"
                    submitVariant="danger"
                    submitType="button"
                    onSubmitClick={handleConfirmDelete}
                />
            </div>
        </Modal>
    );
});
DeleteFacilityDoctorModal.displayName = 'DeleteFacilityDoctorModal';

interface TogglePresenceModalProps {
    doctor: FacilityDoctor | null;
    onClose: () => void;
}

export const TogglePresenceModal: React.FC<TogglePresenceModalProps> = React.memo(({
    doctor,
    onClose,
}) => {
    const [loading, setLoading] = useState(false);

    if (!doctor) return null;

    const handleConfirmToggle = () => {
        setLoading(true);
        router.post(
            `/facility/doctors/${doctor.id}/toggle-presence`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLoading(false);
                    onClose();
                },
                onError: () => {
                    setLoading(false);
                },
            }
        );
    };

    return (
        <Modal
            isOpen={Boolean(doctor)}
            onClose={onClose}
            title={
                doctor.is_available_today
                    ? 'تعليق حضور الطبيب لليوم؟'
                    : 'تأكيد حضور الطبيب بالعيادة لليوم؟'
            }
            description={`${doctor.user.name} (${doctor.specialty.name_ar})`}
            headerIcon={<Users className="w-5 h-5" />}
            maxWidth="md"
        >
            <div className="space-y-5">
                <SurfaceCard
                    variant={doctor.is_available_today ? 'amber' : 'emerald'}
                    padding="sm"
                    rounded="2xl"
                    className="text-xs text-slate-700 leading-relaxed"
                >
                    {doctor.is_available_today
                        ? 'سيتم إيقاف استقبال الحالات الجديدة أو الفورية لهذا الطبيب مؤقتاً خلال اليوم حتى إعادة تفعيله.'
                        : 'سيتم تفعيل عيادة الطبيب لليوم وإتاحة قطع التذاكر الفورية واستقبال المواعيد المجدولة.'}
                </SurfaceCard>

                <ModalFooter
                    onCancel={onClose}
                    loading={loading}
                    loadingText="جارٍ التحديث..."
                    submitText={
                        doctor.is_available_today
                            ? 'تأكيد التعليق المؤقت'
                            : 'تأكيد التواجد والتفعيل'
                    }
                    submitVariant={doctor.is_available_today ? 'amber' : 'emerald'}
                    submitType="button"
                    onSubmitClick={handleConfirmToggle}
                />
            </div>
        </Modal>
    );
});
TogglePresenceModal.displayName = 'TogglePresenceModal';
