import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { Volume2, Clock, BellRing, X, Stethoscope } from 'lucide-react';
import { FacilityDashboardLayout } from '@/layouts/facility-dashboard-layout';
import { FacilityQrModal } from '@/components/facility/facility-qr-modal';
import { playCallChime } from '@/lib/chime';
import {
    ReceptionDoctor,
    ReceptionAppointment,
    ReceptionSpecialtyItem,
    ReceptionMetrics,
    ReceptionKpiCards,
    ReceptionQueueToolbar,
    ReceptionQueueTable,
    PaymentCollectionModal,
    WalkInTicketModal,
} from '@/components/facility/dashboard';

interface LiveClinicEvent {
    id: string;
    type: 'call_next' | 'delay_added';
    doctor_id: number;
    doctor_name: string;
    specialty_name?: string;
    patient_name: string;
    ticket_number?: number;
    booking_reference?: string;
    added_minutes?: number;
    total_delay_minutes?: number;
    delay_reason?: string;
    affected_count?: number;
    appointment_id: number;
    message: string;
    created_at: string;
    timestamp_ms: number;
}

interface Props {
    facility: {
        id: number;
        name: string;
        branch_name: string;
        type: 'hospital' | 'clinic';
        moh_license_no?: string;
        city: string;
        district: string;
        address: string;
        phone: string;
        group?: { name_ar: string };
    };
    facilities: Array<{ id: number; name: string }>;
    metrics: ReceptionMetrics;
    doctors: ReceptionDoctor[];
    specialties: ReceptionSpecialtyItem[];
    todayAppointments: ReceptionAppointment[];
    selectedDateFilter?: string;
    todayDate?: string;
    initialLiveEvents?: LiveClinicEvent[];
}

export default function FacilityDashboard({
    facility,
    metrics: initialMetrics,
    doctors = [],
    specialties = [],
    todayAppointments: initialAppointments = [],
    selectedDateFilter = 'today',
    todayDate = '',
    initialLiveEvents = [],
}: Props) {
    const { props } = usePage();
    const authUser = (props as any).auth?.user;
    const canManageStaff = Boolean(authUser?.role === 'admin' || authUser?.is_group_admin || authUser?.is_facility_admin);

    const [liveMetrics, setLiveMetrics] = useState<ReceptionMetrics>(initialMetrics);
    const [liveAppointments, setLiveAppointments] = useState<ReceptionAppointment[]>(initialAppointments);
    const [activeAlerts, setActiveAlerts] = useState<LiveClinicEvent[]>(() => initialLiveEvents.slice(0, 3));

    const seenEventIdsRef = useRef<Set<string>>(new Set(initialLiveEvents.map((e) => e.id)));
    const prevApptMapRef = useRef<Map<number, { status: string; delay: number }>>(
        new Map(initialAppointments.map((a) => [a.id, { status: a.status, delay: Number(a.delay_minutes || 0) }]))
    );

    useEffect(() => {
        setLiveMetrics(initialMetrics);
        setLiveAppointments(initialAppointments);
        prevApptMapRef.current = new Map(
            initialAppointments.map((a) => [a.id, { status: a.status, delay: Number(a.delay_minutes || 0) }])
        );
    }, [initialMetrics, initialAppointments]);

    // Real-time background sync every 3 seconds so Reception sees Doctor calls & delays immediately without refresh
    useEffect(() => {
        const pollLiveSync = async () => {
            try {
                const params = new URLSearchParams({
                    facility_id: String(facility.id),
                    date: selectedDateFilter || todayDate || 'today',
                });
                const res = await fetch(`/api/facility/live-sync?${params.toString()}`, {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) return;

                const data = await res.json();
                const incomingEvents: LiveClinicEvent[] = Array.isArray(data.events) ? data.events : [];
                const incomingAppointments: ReceptionAppointment[] = Array.isArray(data.todayAppointments)
                    ? data.todayAppointments
                    : [];

                let triggeredSound = false;
                const newlyArrivedEvents: LiveClinicEvent[] = [];

                // 1. Check explicit broadcast events from Doctor actions
                for (const evt of incomingEvents) {
                    if (!seenEventIdsRef.current.has(evt.id)) {
                        seenEventIdsRef.current.add(evt.id);
                        newlyArrivedEvents.push(evt);
                        if (!triggeredSound) {
                            triggeredSound = true;
                            playCallChime();
                        }
                        if (evt.type === 'call_next') {
                            toast.success(evt.message, { duration: 9000 });
                        } else if (evt.type === 'delay_added') {
                            toast(evt.message, {
                                icon: '⏰',
                                duration: 9000,
                                style: {
                                    background: '#fffbeb',
                                    color: '#78350f',
                                    border: '2px solid #f59e0b',
                                    fontWeight: 'bold',
                                },
                            });
                        }
                    }
                }

                // 2. Also detect any direct appointment state transitions (fallback if cache driver is array/reset)
                for (const appt of incomingAppointments) {
                    const prev = prevApptMapRef.current.get(appt.id);
                    const curDelay = Number(appt.delay_minutes || 0);

                    if (prev) {
                        if (prev.status !== 'in_consultation' && appt.status === 'in_consultation' && newlyArrivedEvents.length === 0) {
                            if (!triggeredSound) {
                                triggeredSound = true;
                                playCallChime();
                            }
                            const ticketNum = appt.queueTicket?.ticket_number || 1;
                            const fallbackCallEvt: LiveClinicEvent = {
                                id: `auto_call_${appt.id}_${Date.now()}`,
                                type: 'call_next',
                                doctor_id: appt.doctor.id,
                                doctor_name: appt.doctor.user.name,
                                specialty_name: appt.doctor.specialty?.name_ar,
                                patient_name: appt.patient.name,
                                ticket_number: ticketNum,
                                booking_reference: appt.booking_reference,
                                appointment_id: appt.id,
                                message: `🔔 نداء عيادة فوري: استدعى ${appt.doctor.user.name} المريض التالي (${appt.patient.name}) - تذكرة رقم #${ticketNum} للدخول إلى غرفة الفحص الآن!`,
                                created_at: new Date().toISOString(),
                                timestamp_ms: Date.now(),
                            };
                            newlyArrivedEvents.push(fallbackCallEvt);
                            toast.success(fallbackCallEvt.message, { duration: 9000 });
                        } else if (curDelay > prev.delay && newlyArrivedEvents.length === 0) {
                            const diff = curDelay - prev.delay;
                            if (!triggeredSound) {
                                triggeredSound = true;
                                playCallChime();
                            }
                            const fallbackDelayEvt: LiveClinicEvent = {
                                id: `auto_delay_${appt.id}_${curDelay}_${Date.now()}`,
                                type: 'delay_added',
                                doctor_id: appt.doctor.id,
                                doctor_name: appt.doctor.user.name,
                                specialty_name: appt.doctor.specialty?.name_ar,
                                patient_name: appt.patient.name,
                                added_minutes: diff,
                                total_delay_minutes: curDelay,
                                delay_reason: appt.delay_reason || undefined,
                                appointment_id: appt.id,
                                message: `⏰ تمديد وقت كشف: قام ${appt.doctor.user.name} بتمديد الكشف بمقدار (+${diff} دقيقة) وتم تحديث مواعيد الانتظار بالجدول تلقائياً.`,
                                created_at: new Date().toISOString(),
                                timestamp_ms: Date.now(),
                            };
                            newlyArrivedEvents.push(fallbackDelayEvt);
                            toast(fallbackDelayEvt.message, {
                                icon: '⏰',
                                duration: 9000,
                                style: {
                                    background: '#fffbeb',
                                    color: '#78350f',
                                    border: '2px solid #f59e0b',
                                    fontWeight: 'bold',
                                },
                            });
                        }
                    }

                    prevApptMapRef.current.set(appt.id, { status: appt.status, delay: curDelay });
                }

                if (newlyArrivedEvents.length > 0) {
                    setActiveAlerts((prev) => [...newlyArrivedEvents, ...prev].slice(0, 4));
                }

                if (data.metrics) {
                    setLiveMetrics(data.metrics);
                }
                setLiveAppointments(incomingAppointments);
            } catch {
                // ignore transient network errors
            }
        };

        const timer = setInterval(pollLiveSync, 3000);
        return () => clearInterval(timer);
    }, [facility.id, selectedDateFilter, todayDate]);

    const [ticketModalOpen, setTicketModalOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [paymentAppointment, setPaymentAppointment] = useState<ReceptionAppointment | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | number>('all');
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | number>('all');
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    const handleCheckIn = useCallback((appointmentId: number) => {
        setActionLoadingId(appointmentId);
        router.post(
            `/facility/appointments/${appointmentId}/check-in`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setActionLoadingId(null),
            }
        );
    }, []);

    const handleConfirmBooking = useCallback((appointmentId: number) => {
        setActionLoadingId(appointmentId);
        router.post(
            `/facility/appointments/${appointmentId}/confirm-booking`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setActionLoadingId(null),
            }
        );
    }, []);

    const handleStatusChange = useCallback((appointmentId: number, newStatus: string) => {
        setActionLoadingId(appointmentId);
        router.post(
            `/facility/appointments/${appointmentId}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                onFinish: () => setActionLoadingId(null),
            }
        );
    }, []);

    const filteredTodayAppointments = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return liveAppointments.filter((a) => {
            const matchesSearch =
                !q ||
                a.booking_reference.toLowerCase().includes(q) ||
                a.patient.name.toLowerCase().includes(q) ||
                a.doctor.user.name.toLowerCase().includes(q) ||
                (a.patient.phone && a.patient.phone.includes(q));

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'confirmed'
                    ? a.status === 'confirmed' || a.status === 'booked'
                    : a.status === statusFilter);

            const matchesDoctor = selectedDoctorId === 'all' || a.doctor.id === Number(selectedDoctorId);

            const matchesSpecialty =
                selectedSpecialtyId === 'all' ||
                a.doctor.specialty_id === Number(selectedSpecialtyId) ||
                a.doctor.specialty?.id === Number(selectedSpecialtyId);

            return matchesSearch && matchesStatus && matchesDoctor && matchesSpecialty;
        });
    }, [liveAppointments, searchQuery, statusFilter, selectedDoctorId, selectedSpecialtyId]);

    const activeConsultations = useMemo(
        () => liveAppointments.filter((a) => a.status === 'in_consultation'),
        [liveAppointments]
    );

    const handleOpenWalkIn = useCallback(() => setTicketModalOpen(true), []);
    const handleCloseWalkIn = useCallback(() => setTicketModalOpen(false), []);
    const handleOpenQr = useCallback(() => setQrModalOpen(true), []);
    const handleCloseQr = useCallback(() => setQrModalOpen(false), []);
    const handleClosePayment = useCallback(() => setPaymentAppointment(null), []);
    const dismissAlert = useCallback((id: string) => {
        setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
    }, []);

    return (
        <FacilityDashboardLayout
            activeTab="queue"
            facilityName={facility.name}
            branchName={facility.branch_name}
            counts={{
                waiting: liveMetrics.waitingCount,
                doctors: liveMetrics.doctorsCount,
                specialties: specialties?.length || liveMetrics.specialtiesCount,
                appointments: liveMetrics.totalToday,
                receptionists: liveMetrics.receptionistsCount,
            }}
            onOpenWalkInModal={handleOpenWalkIn}
            onOpenQrModal={handleOpenQr}
        >
            <Head title={`استقبال وطابور الحضور - ${facility.name}`} />

            <div className="space-y-6">
                {/* Real-Time Clinic Alerts (Doctor Call Next / Doctor Time Extension) */}
                {activeAlerts.length > 0 && (
                    <div className="space-y-3">
                        {activeAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-4 sm:p-5 rounded-3xl shadow-lg border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 ${
                                    alert.type === 'call_next'
                                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-300'
                                        : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-amber-300'
                                }`}
                            >
                                <div className="flex items-start sm:items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                                        {alert.type === 'call_next' ? (
                                            <Volume2 className="w-6 h-6 text-white animate-bounce" />
                                        ) : (
                                            <Clock className="w-6 h-6 text-white animate-pulse" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-black">
                                                {alert.type === 'call_next' ? 'نداء عيادة مباشر' : 'تمديد وقت كشف'}
                                            </span>
                                            <span className="text-xs font-bold text-white/90">
                                                {alert.doctor_name} {alert.specialty_name ? `(${alert.specialty_name})` : ''}
                                            </span>
                                        </div>
                                        <p className="text-sm sm:text-base font-black font-['Cairo'] mt-1">
                                            {alert.message}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                    <button
                                        type="button"
                                        onClick={playCallChime}
                                        className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <BellRing className="w-3.5 h-3.5" />
                                        <span>جرس النداء</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => dismissAlert(alert.id)}
                                        className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                                        title="إغلاق التنبيه"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Live Now-Serving Strip for Receptionists */}
                {activeConsultations.length > 0 && (
                    <div className="p-4 rounded-3xl bg-emerald-50/90 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Stethoscope className="w-4.5 h-4.5" />
                            </span>
                            <div>
                                <span className="text-xs font-black text-emerald-950 block font-['Cairo']">
                                    حالات الفحص والمناداة الجارية الآن داخل العيادات ({activeConsultations.length})
                                </span>
                                <span className="text-[11px] text-emerald-700">
                                    مزامنة تلقائية فورية مع شاشات الأطباء والمرضى
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {activeConsultations.map((c) => (
                                <div
                                    key={c.id}
                                    className="px-3.5 py-2 rounded-2xl bg-white border border-emerald-200 shadow-2xs flex items-center gap-2.5 text-xs"
                                >
                                    <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black font-mono">
                                        #{c.queueTicket?.ticket_number || 1}
                                    </span>
                                    <div>
                                        <span className="font-bold text-gray-900 block">{c.patient.name}</span>
                                        <span className="text-[10px] text-gray-500">
                                            عند {c.doctor.user.name}
                                            {c.delay_minutes && c.delay_minutes > 0 ? ` • ممدد (+${c.delay_minutes} د)` : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <ReceptionKpiCards metrics={liveMetrics} />

                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                    <ReceptionQueueToolbar
                        canManageStaff={canManageStaff}
                        receptionistsCount={liveMetrics.receptionistsCount ?? 0}
                        filteredCount={filteredTodayAppointments.length}
                        totalAppointmentsCount={liveAppointments.length}
                        selectedDateFilter={selectedDateFilter}
                        todayDate={todayDate}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                        selectedDoctorId={selectedDoctorId}
                        onDoctorChange={setSelectedDoctorId}
                        selectedSpecialtyId={selectedSpecialtyId}
                        onSpecialtyChange={setSelectedSpecialtyId}
                        appointments={liveAppointments}
                        doctors={doctors}
                        specialties={specialties}
                    />

                    <ReceptionQueueTable
                        appointments={filteredTodayAppointments}
                        actionLoadingId={actionLoadingId}
                        onStatusChange={handleStatusChange}
                        onConfirmBooking={handleConfirmBooking}
                        onCheckIn={handleCheckIn}
                        onOpenPayment={setPaymentAppointment}
                    />
                </div>
            </div>

            <PaymentCollectionModal
                appointment={paymentAppointment}
                onClose={handleClosePayment}
            />

            <WalkInTicketModal
                isOpen={ticketModalOpen}
                onClose={handleCloseWalkIn}
                facilityId={facility.id}
                doctors={doctors}
            />

            <FacilityQrModal
                isOpen={qrModalOpen}
                onClose={handleCloseQr}
                facility={facility}
            />
        </FacilityDashboardLayout>
    );
}
