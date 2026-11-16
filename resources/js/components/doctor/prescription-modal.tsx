import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Modal, FormInput, FormTextarea, ModalFooter } from '@/components/common';
import { Save } from 'lucide-react';

interface PrescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSession: any;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = React.memo(({
    isOpen,
    onClose,
    currentSession,
}) => {
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [medicationsText, setMedicationsText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!currentSession) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const parsedMedications = medicationsText.trim()
            ? medicationsText
                  .split('\n')
                  .map((m) => m.trim())
                  .filter(Boolean)
                  .map((name) => ({
                      name,
                      dose: '',
                      frequency: '',
                      duration: '',
                      instructions: '',
                  }))
            : [];

        router.post(
            `/doctor/appointments/${currentSession.id}/consultation`,
            {
                diagnosis: diagnosis || 'فحص سريري وعلاج تحفظي',
                notes: notes || 'تم إنهاء المعالجة وتقديم إرشادات العناية الطبية للمريض.',
                medications: parsedMedications,
            },
            {
                onFinish: () => {
                    setSubmitting(false);
                    onClose();
                    setDiagnosis('');
                    setNotes('');
                    setMedicationsText('');
                },
            }
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`تسجيل التشخيص وإصدار الوصفة الطبية لـ (${currentSession.patient.name})`}
            description="إتمام الجلسة وكتابة التقرير الطبي والأدوية المقترحة"
            maxWidth="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="التشخيص الطبي السريري"
                    required
                    placeholder="مثال: التهاب لثة حاد وتسوس سطحي"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                />

                <FormTextarea
                    label="تعليمات وتوصيات للمريض"
                    rows={3}
                    placeholder="تعليمات ما بعد الكشف..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />

                <FormTextarea
                    label="الأدوية والوصفة الطبية (اختياري)"
                    rows={2}
                    placeholder="أدخل أسماء الأدوية الموصوفة والجرعات (اختياري)..."
                    value={medicationsText}
                    onChange={(e) => setMedicationsText(e.target.value)}
                />

                <ModalFooter
                    onCancel={onClose}
                    loading={submitting}
                    loadingText="جارٍ الحفظ..."
                    submitText="تأكيد وحفظ الكشف"
                    submitVariant="emerald"
                    submitIcon={<Save className="w-4 h-4" />}
                />
            </form>
        </Modal>
    );
});
PrescriptionModal.displayName = 'PrescriptionModal';
