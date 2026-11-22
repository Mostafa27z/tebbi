import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Receipt, CreditCard, Banknote, Globe, ShieldCheck } from 'lucide-react';
import {
    Modal,
    FormInput,
    SurfaceCard,
    ModalFooter,
    ChoicePillGroup,
} from '@/components/common';
import { ReceptionAppointment } from './types';

interface PaymentCollectionModalProps {
    appointment: ReceptionAppointment | null;
    onClose: () => void;
}

const PAYMENT_METHOD_OPTIONS = [
    {
        value: 'pos' as const,
        label: 'مدى (Mada / POS)',
        icon: <CreditCard className="w-4 h-4" />,
        activeTone: 'blue' as const,
    },
    {
        value: 'cash' as const,
        label: 'نقداً (كاش بالاستقبال)',
        icon: <Banknote className="w-4 h-4" />,
        activeTone: 'emerald' as const,
    },
    {
        value: 'card' as const,
        label: 'بطاقة ائتمانية (Visa / MC)',
        icon: <Globe className="w-4 h-4" />,
        activeTone: 'indigo' as const,
    },
    {
        value: 'insurance' as const,
        label: 'تأمين طبي معتمد',
        icon: <ShieldCheck className="w-4 h-4" />,
        activeTone: 'teal' as const,
    },
];

export const PaymentCollectionModal: React.FC<PaymentCollectionModalProps> = React.memo(({
    appointment,
    onClose,
}) => {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos' | 'card' | 'insurance'>('pos');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!appointment) return;
        const m = appointment.payment_method as 'cash' | 'pos' | 'card' | 'insurance';
        setPaymentMethod(m && ['cash', 'pos', 'card', 'insurance'].includes(m) ? m : 'pos');
        setPaymentNotes(appointment.payment_notes || '');
        setLoading(false);
    }, [appointment]);

    if (!appointment) return null;

    const amount = appointment.total_amount || 200;

    const handleConfirmPayment = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        router.post(
            `/facility/appointments/${appointment.id}/payment`,
            {
                payment_status: paymentMethod === 'insurance' ? 'pending_verification' : 'paid',
                payment_method: paymentMethod,
                payment_notes: paymentNotes,
                total_amount: amount,
                amount,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLoading(false);
                    onClose();
                },
                onFinish: () => {
                    setLoading(false);
                },
            }
        );
    };

    return (
        <Modal
            isOpen={Boolean(appointment)}
            onClose={onClose}
            title="تحصيل رسوم الكشف الطبي"
            description={
                <>
                    حجز رقم: <span className="font-mono font-bold">{appointment.booking_reference}</span>
                </>
            }
            headerIcon={<Receipt className="w-5 h-5 text-emerald-600" />}
            maxWidth="md"
        >
            <form onSubmit={handleConfirmPayment} className="space-y-4">
                <SurfaceCard variant="muted" padding="sm" rounded="2xl" className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-slate-500">اسم المريض:</span>
                        <span className="font-bold text-slate-900">{appointment.patient.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">الطبيب المعالج:</span>
                        <span className="font-bold text-slate-900">{appointment.doctor.user.name}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/60 pt-2 text-sm font-bold">
                        <span className="text-slate-900">المبلغ المطلوب سداده:</span>
                        <span className="font-mono text-emerald-600">{amount} ر.س</span>
                    </div>
                </SurfaceCard>

                <ChoicePillGroup
                    label="طريقة السداد والتحصيل:"
                    value={paymentMethod}
                    onChange={(val) => setPaymentMethod(val)}
                    options={PAYMENT_METHOD_OPTIONS}
                    columns={2}
                />

                <FormInput
                    label="ملاحظات السداد / رقم المعاملة البنكية / إيصال التأمين:"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="مثال: رقم إيصال مدى #58921 أو موافقة تأمين بوبا رقم #8201"
                />

                <ModalFooter
                    loading={loading}
                    loadingText="جارٍ تسجيل التحصيل..."
                    submitText="تأكيد جباية الرسوم وتوثيق السداد"
                    submitVariant="emerald"
                    fullWidthSubmit
                />
            </form>
        </Modal>
    );
});
PaymentCollectionModal.displayName = 'PaymentCollectionModal';
