import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Calendar, Clock } from 'lucide-react';
import { notify, showAlert } from '@/components/common/toast';
import { formatDurationArabic, parseTimeTo24Hour } from '@/lib/utils';
import {
    Doctor,
    BookedInterval,
    MORNING_SLOTS,
    EVENING_SLOTS,
    PRESET_DAYS,
    getSlotAvailability,
    BookingHeader,
    BookingStepper,
    BookingServiceSelector,
    BookingDateSelector,
    BookingTimeSelector,
    BookingPatientForm,
    BookingSummarySidebar,
    BookingFooter,
    type BookingStep,
} from './booking';
import type { PatientFormValues } from './booking/booking-patient-form';

interface BookingModalProps {
    doctor: Doctor | null;
    selectedSlot?: { iso?: string; date?: string; time?: string } | string | null;
    initialServiceId?: number | null;
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
    initialServiceId,
    onClose,
}: {
    doctor: Doctor;
    selectedSlot?: { iso?: string; date?: string; time?: string } | string | null;
    initialServiceId?: number | null;
    isOpen: boolean;
    onClose: () => void;
}) {
    const { auth } = usePage<{ auth?: { user?: { name?: string; phone?: string; national_id?: string } } }>().props;
    const authUser = auth?.user;

    const services = useMemo(() => doctor.active_services || [], [doctor.active_services]);

    const resolveInitialServiceId = useCallback((): number | null => {
        if (initialServiceId && services.some((s) => s.id === initialServiceId)) {
            return initialServiceId;
        }
        return services[0]?.id ?? null;
    }, [initialServiceId, services]);

    const initialSlotTime =
        typeof selectedSlot === 'string'
            ? selectedSlot
            : selectedSlot?.time || '05:30 م';
    const initialSlotIso =
        typeof selectedSlot === 'object' && selectedSlot?.iso
            ? selectedSlot.iso
            : PRESET_DAYS[0].iso;
    const initialSlotDate =
        typeof selectedSlot === 'object' && selectedSlot?.date
            ? selectedSlot.date
            : PRESET_DAYS[0].fullFormatted;

    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(resolveInitialServiceId);
    const [selectedDayIso, setSelectedDayIso] = useState<string>(initialSlotIso);
    const [selectedDayLabel, setSelectedDayLabel] = useState<string>(initialSlotDate);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(initialSlotTime);
    const [timePeriod, setTimePeriod] = useState<'all' | 'morning' | 'evening'>('all');
    const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(false);
    const [bookedIntervals, setBookedIntervals] = useState<BookedInterval[]>([]);
    const [autoConfirmLimit, setAutoConfirmLimit] = useState<number>(
        doctor.slot_auto_confirm_limit ?? 1
    );
    const [waitlistLimit, setWaitlistLimit] = useState<number>(
        doctor.slot_waitlist_limit ?? 1
    );
    const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
    const [currentStep, setCurrentStep] = useState<BookingStep>(1);
    const formBodyRef = useRef<HTMLFormElement | null>(null);

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
        setSelectedServiceId(resolveInitialServiceId());
        setAutoConfirmLimit(doctor.slot_auto_confirm_limit ?? 1);
        setWaitlistLimit(doctor.slot_waitlist_limit ?? 1);
    }, [resolveInitialServiceId, doctor.id, doctor.slot_auto_confirm_limit, doctor.slot_waitlist_limit]);

    useEffect(() => {
        setCurrentStep(1);
    }, [doctor.id]);

    useEffect(() => {
        formBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    useEffect(() => {
        if (typeof selectedSlot === 'string') {
            setSelectedTimeSlot(selectedSlot);
        } else if (selectedSlot) {
            if (selectedSlot.time) setSelectedTimeSlot(selectedSlot.time);
            if (selectedSlot.iso) setSelectedDayIso(selectedSlot.iso);
            if (selectedSlot.date) setSelectedDayLabel(selectedSlot.date);
        }
    }, [selectedSlot]);

    const selectedService = useMemo(
        () => services.find((s) => s.id === selectedServiceId) || null,
        [services, selectedServiceId]
    );

    const selectedServiceName = selectedService?.name || 'كشف استشاري عام';
    const selectedDurationMinutes =
        selectedService?.duration_minutes || doctor.waiting_time_minutes || 20;

    const fee = selectedService
        ? Number(selectedService.price)
        : Number(doctor.consultation_fee) || 250;
    const vat = fee * 0.15;
    const totalAmount = fee + vat;

    // Fetch booked intervals for the selected doctor + date
    useEffect(() => {
        if (!doctor?.id || !selectedDayIso) return;
        const controller = new AbortController();
        setLoadingSlots(true);

        fetch(`/api/doctors/${doctor.id}/booked-slots?date=${encodeURIComponent(selectedDayIso)}`, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
            .then((data) => {
                setBookedIntervals(Array.isArray(data.booked_intervals) ? data.booked_intervals : []);
                if (typeof data.slot_auto_confirm_limit === 'number') {
                    setAutoConfirmLimit(data.slot_auto_confirm_limit);
                }
                if (typeof data.slot_waitlist_limit === 'number') {
                    setWaitlistLimit(data.slot_waitlist_limit);
                }
            })
            .catch((err) => {
                if (err?.name !== 'AbortError') {
                    setBookedIntervals([]);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoadingSlots(false);
                }
            });

        return () => controller.abort();
    }, [doctor.id, selectedDayIso]);

    const selectedSlotInfo = useMemo(() => {
        if (!selectedTimeSlot) return null;
        return getSlotAvailability(
            selectedTimeSlot,
            selectedDurationMinutes,
            bookedIntervals,
            autoConfirmLimit,
            waitlistLimit
        );
    }, [selectedTimeSlot, selectedDurationMinutes, bookedIntervals, autoConfirmLimit, waitlistLimit]);

    // Auto-switch selected time slot ONLY if empty or 'full' (never override user's 'waitlist' choice)
    useEffect(() => {
        const allSlots = [...MORNING_SLOTS, ...EVENING_SLOTS];
        const currentStatus = selectedTimeSlot
            ? getSlotAvailability(
                  selectedTimeSlot,
                  selectedDurationMinutes,
                  bookedIntervals,
                  autoConfirmLimit,
                  waitlistLimit
              ).status
            : 'full';

        if (!selectedTimeSlot || currentStatus === 'full') {
            const firstGreen = allSlots.find(
                (slot) =>
                    getSlotAvailability(
                        slot,
                        selectedDurationMinutes,
                        bookedIntervals,
                        autoConfirmLimit,
                        waitlistLimit
                    ).status === 'available'
            );
            const firstYellow = allSlots.find(
                (slot) =>
                    getSlotAvailability(
                        slot,
                        selectedDurationMinutes,
                        bookedIntervals,
                        autoConfirmLimit,
                        waitlistLimit
                    ).status === 'waitlist'
            );
            setSelectedTimeSlot(firstGreen || firstYellow || '');
        }
    }, [bookedIntervals, selectedDurationMinutes, selectedTimeSlot, autoConfirmLimit, waitlistLimit]);

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

    const canProceedFromStep2 =
        Boolean(selectedTimeSlot) && selectedSlotInfo?.status !== 'full' && !loadingSlots;

    const validateStep2 = useCallback((): boolean => {
        if (!selectedTimeSlot || selectedSlotInfo?.status === 'full') {
            const msg = 'يرجى اختيار وقت متاح لا يتجاوز السعة القصوى للطبيب';
            setErrors((prev) => ({ ...prev, appointment_time: msg }));
            notify.error(msg);
            return false;
        }
        setErrors((prev) => {
            if (!prev.appointment_time) return prev;
            const next = { ...prev };
            delete next.appointment_time;
            return next;
        });
        return true;
    }, [selectedTimeSlot, selectedSlotInfo?.status]);

    const handleNextStep = useCallback(() => {
        if (currentStep === 1) {
            setErrors((prev) => {
                if (!prev.doctor_service_id) return prev;
                const next = { ...prev };
                delete next.doctor_service_id;
                return next;
            });
            setCurrentStep(2);
            return;
        }
        if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        }
    }, [currentStep, validateStep2]);

    const handlePrevStep = useCallback(() => {
        if (currentStep === 3) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(1);
        }
    }, [currentStep]);

    const handleStepClick = useCallback(
        (target: BookingStep) => {
            if (target <= currentStep) {
                setCurrentStep(target);
                return;
            }
            if (target === 2) {
                setCurrentStep(2);
                return;
            }
            if (target === 3 && validateStep2()) {
                setCurrentStep(3);
            }
        },
        [currentStep, validateStep2]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (currentStep < 3) {
            handleNextStep();
            return;
        }

        if (submitting) return;

        const { patientName, patientPhone, patientNationalId, patientNotes } = patientValuesRef.current;

        const errs: { [key: string]: string } = {};
        if (!selectedTimeSlot || selectedSlotInfo?.status === 'full') {
            errs.appointment_time = 'يرجى اختيار وقت متاح لا يتجاوز السعة القصوى للطبيب';
        }
        if (!patientName.trim()) errs.name = 'اسم المريض مطلوب';
        if (!patientPhone.trim() || patientPhone.length < 8) errs.phone = 'رقم الجوال غير صحيح أو ناقص';
        if (!patientNationalId.trim()) errs.nid = 'رقم الهوية الوطنية أو الإقامة مطلوب';

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            if (errs.appointment_time) {
                setCurrentStep(2);
            }
            notify.error(errs.appointment_time || 'يرجى التأكد من استكمال كافة البيانات الإلزامية');
            return;
        }

        setErrors({});
        setSubmitting(true);

        router.post(
            '/appointments/book',
            {
                doctor_id: doctor.id,
                doctor_service_id: selectedService?.id ?? null,
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
                    const wasWaitlist = selectedSlotInfo?.status === 'waitlist';
                    setSubmitting(false);
                    onClose();
                    showAlert({
                        title: wasWaitlist
                            ? 'تم تسجيل طلبك في قائمة الانتظار!'
                            : 'تم تأكيد حجز الموعد تلقائياً وتفعيل التتبع الحي!',
                        message: wasWaitlist
                            ? `تم تسجيل طلب حجزك (${selectedServiceName} - ${formatDurationArabic(selectedDurationMinutes)}) مع ${doctor.user.name} في (${doctor.clinic.name}) ليوم [${selectedDayLabel}] الساعة [${selectedTimeSlot}] ضمن قائمة الانتظار، وسيتم التواصل معك لتأكيد الموعد.`
                            : `تم تأكيد حجزك فورياً (${selectedServiceName} - ${formatDurationArabic(selectedDurationMinutes)}) مع ${doctor.user.name} في (${doctor.clinic.name}) ليوم [${selectedDayLabel}] الساعة [${selectedTimeSlot}]. تم إرسال تذكرة الحجز ورابط المتابعة الحية إلى رقم واتساب ${patientPhone}.`,
                        type: 'success',
                        confirmText: 'تم، شكراً لك',
                    });
                    notify.success(
                        wasWaitlist
                            ? 'تم تسجيل حجزك في قائمة الانتظار بنجاح!'
                            : 'تم تأكيد الحجز الفوري وإصدار التذكرة بنجاح!'
                    );
                },
                onError: (backendErrors) => {
                    setSubmitting(false);
                    const typedErrors = backendErrors as { [key: string]: string };
                    setErrors({
                        ...typedErrors,
                        ...(typedErrors.patient_name && !typedErrors.name
                            ? { name: typedErrors.patient_name }
                            : {}),
                        ...(typedErrors.patient_phone && !typedErrors.phone
                            ? { phone: typedErrors.patient_phone }
                            : {}),
                        ...(typedErrors.patient_national_id && !typedErrors.nid
                            ? { nid: typedErrors.patient_national_id }
                            : {}),
                    });
                    if (typedErrors.doctor_service_id) {
                        setCurrentStep(1);
                    } else if (typedErrors.appointment_time || typedErrors.appointment_date) {
                        setCurrentStep(2);
                    }
                    const firstMsg =
                        typedErrors.appointment_time ||
                        typedErrors.doctor_service_id ||
                        typedErrors.patient_name ||
                        typedErrors.patient_phone ||
                        typedErrors.patient_national_id ||
                        'تعذر إكمال الحجز، يرجى مراجعة البيانات المدخلة.';
                    notify.error(firstMsg);
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

    const scheduleStepSummary = selectedTimeSlot
        ? `${selectedDayLabel} • ${selectedTimeSlot}`
        : selectedDayLabel;

    return (
        <div
            role="dialog"
            aria-modal="true"
            data-live-sync-pause="true"
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
                    selectedTimeSlot={selectedTimeSlot || 'اختر الوقت'}
                    selectedServiceName={selectedServiceName}
                    selectedDurationMinutes={selectedDurationMinutes}
                    onClose={onClose}
                />

                <BookingStepper
                    currentStep={currentStep}
                    onStepClick={handleStepClick}
                    serviceSummary={`${selectedServiceName} • ${fee} ر.س`}
                    scheduleSummary={scheduleStepSummary}
                    canReachStep3={canProceedFromStep2}
                />

                <form
                    ref={formBodyRef}
                    id="booking-modal-form"
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-5 sm:p-7 overscroll-contain"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-8">
                            <div
                                key={currentStep}
                                className="animate-in fade-in slide-in-from-left-2 duration-200 space-y-5"
                            >
                                {currentStep === 1 && (
                                    <BookingServiceSelector
                                        stepNumber={1}
                                        services={services}
                                        selectedServiceId={selectedServiceId}
                                        onSelectService={setSelectedServiceId}
                                        fallbackFee={Number(doctor.consultation_fee) || 250}
                                        fallbackDurationMinutes={doctor.waiting_time_minutes || 20}
                                    />
                                )}

                                {currentStep === 2 && (
                                    <>
                                        <BookingDateSelector
                                            stepNumber={2}
                                            badgeIcon={<Calendar className="w-4 h-4" />}
                                            selectedDayIso={selectedDayIso}
                                            onSelectDay={handleSelectDay}
                                            showCustomDatePicker={showCustomDatePicker}
                                            onToggleCustomPicker={handleToggleCustomPicker}
                                            onCustomDateChange={handleCustomDateChange}
                                        />

                                        <BookingTimeSelector
                                            stepNumber={2}
                                            badgeIcon={<Clock className="w-4 h-4" />}
                                            selectedTimeSlot={selectedTimeSlot}
                                            onSelectTime={setSelectedTimeSlot}
                                            timePeriod={timePeriod}
                                            setTimePeriod={setTimePeriod}
                                            selectedDurationMinutes={selectedDurationMinutes}
                                            bookedIntervals={bookedIntervals}
                                            autoConfirmLimit={autoConfirmLimit}
                                            waitlistLimit={waitlistLimit}
                                            loadingSlots={loadingSlots}
                                            error={errors.appointment_time}
                                        />
                                    </>
                                )}

                                {currentStep === 3 && (
                                    <BookingPatientForm
                                        stepNumber={3}
                                        initialValues={initialPatientValues}
                                        valuesRef={patientValuesRef}
                                        errors={errors}
                                    />
                                )}
                            </div>
                        </div>

                        <BookingSummarySidebar
                            doctor={doctor}
                            selectedDayLabel={selectedDayLabel}
                            selectedTimeSlot={selectedTimeSlot}
                            selectedServiceName={selectedServiceName}
                            selectedDurationMinutes={selectedDurationMinutes}
                            slotStatus={selectedSlotInfo?.status ?? 'available'}
                            slotBookedCount={selectedSlotInfo?.bookedCount ?? 0}
                            fee={fee}
                            vat={vat}
                            totalAmount={totalAmount}
                            isInsurance={false}
                            currentStep={currentStep}
                            onJumpToStep={handleStepClick}
                            className={currentStep === 3 ? 'block' : 'hidden lg:block'}
                        />
                    </div>
                </form>

                <BookingFooter
                    currentStep={currentStep}
                    totalSteps={3}
                    onPrevStep={handlePrevStep}
                    onNextStep={handleNextStep}
                    canProceed={currentStep === 2 ? canProceedFromStep2 : true}
                    loadingSlots={loadingSlots}
                    isInsurance={false}
                    totalAmount={totalAmount}
                    selectedServiceName={selectedServiceName}
                    selectedDurationMinutes={selectedDurationMinutes}
                    slotStatus={selectedSlotInfo?.status ?? 'available'}
                    submitting={submitting}
                    onClose={onClose}
                    formId="booking-modal-form"
                />
            </div>
        </div>
    );
}
