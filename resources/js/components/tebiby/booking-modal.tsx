import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { showAlert } from '@/components/common/toast';
import { 
    Doctor,
    PRESET_DAYS,
    INSURANCE_COMPANIES,
    BookingHeader,
    BookingDateSelector,
    BookingTimeSelector,
    BookingPatientForm,
    BookingPaymentSelector,
    BookingSummarySidebar,
    BookingFooter,
} from './booking';

interface BookingModalProps {
    doctor: Doctor | null;
    selectedSlot: { date: string; time: string } | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function BookingModal({ doctor, selectedSlot, isOpen, onClose }: BookingModalProps) {
    if (!isOpen || !doctor) return null;

    // Appointment Schedule State
    const [selectedDayIso, setSelectedDayIso] = useState<string>(PRESET_DAYS[0].iso);
    const [selectedDayLabel, setSelectedDayLabel] = useState<string>(selectedSlot?.date || PRESET_DAYS[0].fullFormatted);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(selectedSlot?.time || '05:40 م');
    const [timePeriod, setTimePeriod] = useState<'all' | 'morning' | 'evening'>('all');
    const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(false);

    // Patient Form State
    const [patientName, setPatientName] = useState('محمد فهد الدوسري');
    const [patientPhone, setPatientPhone] = useState('+966555123456');
    const [patientNationalId, setPatientNationalId] = useState('1098765432');
    const [patientNotes, setPatientNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'insurance' | 'at-clinic' | 'online'>('insurance');
    const [insuranceProvider, setInsuranceProvider] = useState(INSURANCE_COMPANIES[0]);
    const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('BUP-8491023');
    const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Sync when selectedSlot prop changes
    useEffect(() => {
        if (selectedSlot?.time) {
            setSelectedTimeSlot(selectedSlot.time);
        }
        if (selectedSlot?.date) {
            setSelectedDayLabel(selectedSlot.date);
        }
    }, [selectedSlot]);

    const fee = Number(doctor.consultation_fee) || 250;
    const isInsurance = paymentMethod === 'insurance';
    const vat = isInsurance ? 0 : fee * 0.15;
    const totalAmount = isInsurance ? 0 : fee + vat;

    const handleSelectDay = (iso: string, formattedLabel: string) => {
        setSelectedDayIso(iso);
        setSelectedDayLabel(formattedLabel);
    };

    const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!val) return;
        setSelectedDayIso(val);

        try {
            const dateObj = new Date(val);
            const formatted = dateObj.toLocaleDateString('ar-SA-u-ca-gregory', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            });
            setSelectedDayLabel(formatted);
        } catch {
            setSelectedDayLabel(val);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (submitting) return;

        // Validation
        const errs: { [key: string]: string } = {};
        if (!patientName.trim()) errs.name = 'اسم المريض مطلوب';
        if (!patientPhone.trim() || patientPhone.length < 8) errs.phone = 'رقم الجوال غير صحيح أو ناقص';
        if (!patientNationalId.trim()) errs.nid = 'رقم الهوية الوطنية أو الإقامة مطلوب';

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error('يرجى التأكد من استكمال كافة البيانات الإلزامية');
            return;
        }

        setErrors({});
        setSubmitting(true);

        router.post(
            '/appointments/book',
            {
                doctor_id: doctor.id,
                patient_name: patientName,
                patient_phone: patientPhone,
                patient_national_id: patientNationalId,
                appointment_date: selectedDayIso,
                appointment_time: selectedTimeSlot,
                payment_method: paymentMethod === 'at-clinic' ? 'at_clinic' : paymentMethod,
                insurance_provider: isInsurance ? insuranceProvider : null,
                insurance_policy_number: isInsurance ? insurancePolicyNumber : null,
                patient_notes: patientNotes,
                notify_whatsapp: notifyWhatsapp,
            },
            {
                onSuccess: () => {
                    setSubmitting(false);
                    onClose();
                    showAlert({
                        title: 'تم تأكيد حجز الموعد وتفعيل التتبع الحي!',
                        message: `تم حجز موعدك بنجاح مع ${doctor.user.name} في (${doctor.clinic.name}) ليوم [${selectedDayLabel}] الساعة [${selectedTimeSlot}]. تم إرسال تذكرة الحجز ورابط المتابعة الحية إلى رقم واتساب ${patientPhone}.`,
                        type: 'success',
                        confirmText: 'تم، شكراً لك',
                    });
                    toast.success('تم إصدار تذكرة الحجز وتفعيل التتبع الحي بنجاح!');
                },
                onError: (backendErrors) => {
                    setSubmitting(false);
                    setErrors(backendErrors as any);
                    toast.error('تعذر إكمال الحجز، يرجى مراجعة البيانات المدخلة.');
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            }
        );
    };

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto font-['Tajawal']"
            dir="rtl"
        >
            <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                {/* 1. FIXED MODAL HEADER */}
                <BookingHeader
                    doctor={doctor}
                    selectedDayLabel={selectedDayLabel}
                    selectedTimeSlot={selectedTimeSlot}
                    onClose={onClose}
                />

                {/* 2. SCROLLABLE FORM BODY (2-Column Grid on Laptop/Desktop) */}
                <form id="booking-modal-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 overscroll-contain">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* RIGHT COLUMN (8 cols): Interactive Step-by-Step Selection Flow */}
                        <div className="lg:col-span-8 space-y-6">
                            <BookingDateSelector
                                selectedDayIso={selectedDayIso}
                                onSelectDay={handleSelectDay}
                                showCustomDatePicker={showCustomDatePicker}
                                onToggleCustomPicker={() => setShowCustomDatePicker(!showCustomDatePicker)}
                                onCustomDateChange={handleCustomDateChange}
                            />

                            <BookingTimeSelector
                                selectedTimeSlot={selectedTimeSlot}
                                onSelectTime={setSelectedTimeSlot}
                                timePeriod={timePeriod}
                                setTimePeriod={setTimePeriod}
                            />

                            <BookingPatientForm
                                patientName={patientName}
                                setPatientName={setPatientName}
                                patientNationalId={patientNationalId}
                                setPatientNationalId={setPatientNationalId}
                                patientPhone={patientPhone}
                                setPatientPhone={setPatientPhone}
                                patientNotes={patientNotes}
                                setPatientNotes={setPatientNotes}
                                errors={errors}
                            />

                            <BookingPaymentSelector
                                paymentMethod={paymentMethod}
                                setPaymentMethod={setPaymentMethod}
                                insuranceProvider={insuranceProvider}
                                setInsuranceProvider={setInsuranceProvider}
                                insurancePolicyNumber={insurancePolicyNumber}
                                setInsurancePolicyNumber={setInsurancePolicyNumber}
                                notifyWhatsapp={notifyWhatsapp}
                                setNotifyWhatsapp={setNotifyWhatsapp}
                            />
                        </div>

                        {/* LEFT COLUMN (4 cols): Sticky Summary Card on Desktop */}
                        <BookingSummarySidebar
                            doctor={doctor}
                            selectedDayLabel={selectedDayLabel}
                            selectedTimeSlot={selectedTimeSlot}
                            fee={fee}
                            vat={vat}
                            totalAmount={totalAmount}
                            isInsurance={isInsurance}
                        />
                    </div>
                </form>

                {/* 3. FIXED BOTTOM ACTION BAR (Never cut off, always visible) */}
                <BookingFooter
                    isInsurance={isInsurance}
                    totalAmount={totalAmount}
                    submitting={submitting}
                    onClose={onClose}
                    formId="booking-modal-form"
                />
            </div>
        </div>
    );
}
