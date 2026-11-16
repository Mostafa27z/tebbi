import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { CheckCircle2, ToggleRight, ToggleLeft } from 'lucide-react';
import { Modal, SurfaceCard, ModalFooter } from '@/components/common';

interface AvailabilityDialogProps {
    isOpen: boolean;
    onClose: () => void;
    isAvailable: boolean;
}

export const AvailabilityDialog: React.FC<AvailabilityDialogProps> = React.memo(({
    isOpen,
    onClose,
    isAvailable,
}) => {
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        setSubmitting(true);
        router.post(
            '/doctor/toggle-availability',
            {},
            {
                onFinish: () => {
                    setSubmitting(false);
                    onClose();
                },
            }
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="تأكيد تغيير حالة استقبال العيادة"
            description={isAvailable ? 'تعليق استقبال الحالات مؤقتاً' : 'تفعيل استقبال المرضى لليوم'}
            headerIcon={
                isAvailable ? (
                    <ToggleLeft className="w-6 h-6 text-amber-600" />
                ) : (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                )
            }
            maxWidth="md"
        >
            <div className="space-y-5">
                <SurfaceCard
                    variant={isAvailable ? 'amber' : 'emerald'}
                    padding="sm"
                    rounded="2xl"
                    className="text-xs leading-relaxed"
                >
                    {isAvailable ? (
                        <>
                            هل أنت متأكد من <span className="font-bold text-amber-800">تعليق استقبال الحالات</span> في العيادة لليوم؟ لن يتمكن موظفو الاستقبال من إدخال حالات جديدة إلى صالة الانتظار.
                        </>
                    ) : (
                        <>
                            هل أنت متأكد من <span className="font-bold text-emerald-800">تفعيل جاهزية العيادة</span> لاستقبال المرضى لليوم؟ ستظهر عيادتك متاحة فوراً في نظام الطابور ومكتب الاستقبال.
                        </>
                    )}
                </SurfaceCard>

                <ModalFooter
                    onCancel={onClose}
                    loading={submitting}
                    loadingText="جارٍ الحفظ..."
                    submitText={isAvailable ? 'تأكيد التعليق المؤقت' : 'تأكيد تفعيل العيادة'}
                    submitVariant={isAvailable ? 'amber' : 'emerald'}
                    submitIcon={<CheckCircle2 className="w-4 h-4" />}
                    submitType="button"
                    onSubmitClick={handleConfirm}
                />
            </div>
        </Modal>
    );
});
AvailabilityDialog.displayName = 'AvailabilityDialog';
