import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Modal } from '@/components/common/modal';
import { FormInput } from '@/components/common/form-input';
import { Save } from 'lucide-react';

interface PrescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSession: any;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
    isOpen,
    onClose,
    currentSession,
}) => {
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!currentSession) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        router.post(
            `/doctor/appointments/${currentSession.id}/consultation`,
            {
                diagnosis: diagnosis || 'فحص سريري وعلاج تحفظي',
                notes: notes || 'تم إنهاء المعالجة وتقديم إرشادات العناية الطبية للمريض.',
                medications: [
                    {
                        name: 'Amoxicillin 500mg',
                        dose: 'كبسولة كل 8 ساعات',
                        frequency: 'بعد الوجبات',
                        duration: 'لمدة 5 أيام',
                        instructions: 'مضاد حيوي لمنع أي التهاب بكتيري',
                    },
                    {
                        name: 'Ibuprofen 400mg',
                        dose: 'قرص عند اللزوم',
                        frequency: 'بعد الأكل لتسكين الألم',
                        duration: 'عند الحاجة',
                        instructions: 'مسكن ومضاد للالتهاب',
                    },
                ],
            },
            {
                onFinish: () => {
                    setSubmitting(false);
                    onClose();
                    setDiagnosis('');
                    setNotes('');
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

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">تعليمات وتوصيات للمريض</label>
                    <textarea
                        rows={3}
                        placeholder="تعليمات ما بعد الكشف..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs">
                    <strong>الأدوية المعتمدة:</strong> Amoxicillin 500mg + Ibuprofen 400mg (سيتم إدراجها بالروشتة الإلكترونية آلياً).
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                    >
                        إلغاء
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{submitting ? 'جارٍ الحفظ...' : 'تأكيد وحفظ الكشف'}</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};

