import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { showAlert } from '@/components/common/toast';
import { parseTimeTo24Hour } from '@/lib/utils';
import {
    Doctor,
    PRESET_DAYS,
    BookingHeader,
    BookingDateSelector,
    BookingTimeSelector,
    BookingPatientForm,
    BookingSummarySidebar,
    BookingFooter,
} from './booking';
import type { PatientFormValues } from './booking/booking-patient-form';

interface BookingModalProps {
    doctor: Doctor | null;
    selectedSlot?: { date?: string; time: string } | string | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function BookingModal(props: BookingModalProps) {
    if (!props.isOpen || !props.doctor) return null;
    return <BookingModalContent {...props} doctor={props.doctor} />;
}

function BookingModalContent({
    doctor,
    selectedSlot,
    onClose,
}: {
    doctor: Doctor;
    selectedSlot?: { date?: string; time: string } | string | null;
    isOpen: boolean;
    onClose: () => void;
}) {
    const { auth } = usePage<{ auth?: { user?: { name?: string; phone?: string; national_id?: string } } }>().props;
    const authUser = auth?.user;

    const initialSlotTime =
        typeof selectedSlot === 'string'
            ? selectedSlot
            : selectedSlot?.time || '05:40 م';
    const initialSlotDate =
        typeof selectedSlot === 'object' && selectedSlot?.date
            ? selectedSlot.date
            : PRESET_DAYS[0].fullFormatted;

    const [selectedDayIso, setSelectedDayIso] = useState<string>(PRESET_DAYS[0].iso);
    const [selectedDayLabel, setSelectedDayLabel] = useState<string>(initialSlotDate);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(initialSlotTime);
    const [timePeriod, setTimePeriod] = useState<'all' | 'morning' | 'evening'>('all');
    const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(false);

    // Isolated refs for text inputs so typing never triggers parent modal re-renders
    const initialPatientValues = useMemo<PatientFormValues>(
        () => ({
            patientName: authUser?.name || '',
            patientPhone: authUser?.phone || '+966',
            patientNationalId: authUser?.national_id || '',
            patientNotes: '',
        }),
        [authUser?.name, authUser?.phone, authUser?.national_id]
    );
    const patientValuesRef = useRef<PatientFormValues>({ ...initialPatientValues });

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (typeof selectedSlot === 'string') {
            setSelectedTimeSlot(selectedSlot);
        } else if (selectedSlot) {
            if (selectedSlot.time) setSelectedTimeSlot(selectedSlot.time);
            if (selectedSlot.date) setSelectedDayLabel(selectedSlot.date);
        }
    }, [selectedSlot]);

    const fee = Number(doctor.consultation_fee) || 250;
    const vat = fee * 0.15;
    const totalAmount = fee + vat;

    const handleSelectDay = useCallback((iso: string, formattedLabel: string) => {
        setSelectedDayIso(iso);
        setSelectedDayLabel(formattedLabel);
    }, []);

    const handleToggleCustomPicker = useCallback(() => {
        setShowCustomDatePicker((prev) => !prev);
    }, []);

    const handleCustomDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (submitting) return;

        const { patientName, patientPhone, patientNationalId, patientNotes } = patientValuesRef.current;

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
                appointment_time: parseTimeTo24Hour(selectedTimeSlot),
                payment_method: 'at_clinic',
                insurance_provider: null,
                insurance_policy_number: null,
                patient_notes: patientNotes,
                notify_whatsapp: true,
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
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 overflow-y-auto font-['Tajawal']"
            dir="rtl"
        >
            <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto">
                <BookingHeader
                    doctor={doctor}
                    selectedDayLabel={selectedDayLabel}
                    selectedTimeSlot={selectedTimeSlot}
                    onClose={onClose}
                />

                <form id="booking-modal-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 overscroll-contain">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-8 space-y-6">
                            <BookingDateSelector
                                selectedDayIso={selectedDayIso}
                                onSelectDay={handleSelectDay}
                                showCustomDatePicker={showCustomDatePicker}
                                onToggleCustomPicker={handleToggleCustomPicker}
                                onCustomDateChange={handleCustomDateChange}
                            />

                            <BookingTimeSelector
                                selectedTimeSlot={selectedTimeSlot}
                                onSelectTime={setSelectedTimeSlot}
                                timePeriod={timePeriod}
                                setTimePeriod={setTimePeriod}
                            />

                            <BookingPatientForm
                                initialValues={initialPatientValues}
                                valuesRef={patientValuesRef}
                                errors={errors}
                            />
                        </div>

                        <BookingSummarySidebar
                            doctor={doctor}
                            selectedDayLabel={selectedDayLabel}
                            selectedTimeSlot={selectedTimeSlot}
                            fee={fee}
                            vat={vat}
                            totalAmount={totalAmount}
                            isInsurance={false}
                        />
                    </div>
                </form>

                <BookingFooter
                    isInsurance={false}
                    totalAmount={totalAmount}
                    submitting={submitting}
                    onClose={onClose}
                    formId="booking-modal-form"
                />
            </div>
        </div>
    );
}
