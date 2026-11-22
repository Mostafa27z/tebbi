import React, { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { DoctorDashboardLayout } from '@/layouts/doctor-dashboard-layout';
import { MetricCard } from '@/components/common/metric-card';
import { ActiveSession } from '@/components/doctor/active-session';
import { AppointmentsQueueTable } from '@/components/doctor/appointments-queue-table';
import { PrescriptionModal } from '@/components/doctor/prescription-modal';
import { AvailabilityDialog } from '@/components/doctor/availability-dialog';
import { notify } from '@/components/common/toast';
import { useInertiaLiveSync } from '@/hooks/use-live-sync';
import { playCallChime } from '@/lib/chime';
import { format12HourTime } from '@/lib/utils';
import {
    Users,
    CheckCircle2,
    Clock,
    Stethoscope,
    AlertCircle,
    ShieldCheck,
    BellRing,
    UserCheck,
    X,
} from 'lucide-react';

interface DoctorDashboardProps {
    doctor: {
        id: number;
        title_ar: string;
        is_available_today: boolean;
        consultation_fee: number;
        waiting_time_minutes: number;
        user: {
            name: string;
            email: string;
            avatar: string;
        };
        specialty: {
            name_ar: string;
        };
        clinic: {
            name: string;
            district: string;
        };
    };
    todayAppointments: any[];
    currentSession: any | null;
    stats: {
        totalPatients: number;
        waitingCount: number;
        inConsultationCount: number;
        completedCount: number;
        notArrivedCount: number;
        insuranceCount: number;
        currentTicketNum: number | null;
        servicesCount?: number;
    };
}

interface DoctorArrivalAlert {
    id: string;
    patientName: string;
    ticketNumber?: number | null;
    appointmentTime: string;
    message: string;
}

export default function DoctorDashboard({
    doctor,
    todayAppointments,
    currentSession,
    stats,
}: DoctorDashboardProps) {
    const [callingNext, setCallingNext] = useState(false);
    const [rxModalOpen, setRxModalOpen] = useState(false);
    const [selectedApptForRx, setSelectedApptForRx] = useState<any | null>(null);
    const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
    const [liveArrivalAlerts, setLiveArrivalAlerts] = useState<DoctorArrivalAlert[]>([]);

    const liveSync = useInertiaLiveSync({
        intervalMs: 3000,
        only: ['doctor', 'todayAppointments', 'currentSession', 'stats'],
        paused: rxModalOpen || availabilityDialogOpen,
    });

    const prevApptMapRef = useRef<Map<number, { status: string }>>(
        new Map(todayAppointments.map((a) => [a.id, { status: a.status }]))
    );
    const hasInitializedRef = useRef(false);

    useEffect(() => {
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;
            prevApptMapRef.current = new Map(todayAppointments.map((a) => [a.id, { status: a.status }]));
            return;
        }

        const nextMap = new Map<number, { status: string }>();
        const newArrivals: DoctorArrivalAlert[] = [];
        let chimePlayed = false;

        for (const appt of todayAppointments) {
            nextMap.set(appt.id, { status: appt.status });
            const prev = prevApptMapRef.current.get(appt.id);
            const patientName = appt.patient?.name || 'مريض';
            const ticketNumber = appt.queueTicket?.ticket_number ?? appt.queue_ticket?.ticket_number ?? null;

            if ((!prev || prev.status !== 'waiting') && appt.status === 'waiting') {
                if (!chimePlayed) {
                    chimePlayed = true;
                    playCallChime();
                }

                const ticketText = ticketNumber ? ` (تذكرة #${ticketNumber})` : '';
                const msg = `حضر المريض (${patientName}) إلى صالة الانتظار${ticketText} وهو جاهز للاستدعاء الآن.`;

                newArrivals.push({
                    id: `arr_${appt.id}_${Date.now()}`,
                    patientName,
                    ticketNumber,
                    appointmentTime: format12HourTime(appt.appointment_time),
                    message: msg,
                });

                notify.clinicCall({
                    title: 'وصول مريض لصالة الانتظار',
                    message: msg,
                    badge: ticketNumber ? `تذكرة #${ticketNumber}` : 'صالة الانتظار',
                    onReplaySound: playCallChime,
                });
            } else if (!prev && (appt.status === 'confirmed' || appt.status === 'booked')) {
                notify.info(
                    `حجز جديد اليوم: ${patientName} — الساعة ${format12HourTime(appt.appointment_time)}`,
                    'حجز جديد بالعيادة'
                );
            }
        }

        prevApptMapRef.current = nextMap;

        if (newArrivals.length > 0) {
            setLiveArrivalAlerts((prev) => [...newArrivals, ...prev].slice(0, 3));
        }
    }, [todayAppointments]);

    const handleCallNext = () => {
        setCallingNext(true);
        router.post('/doctor/queue/call-next', {}, {
            onFinish: () => setCallingNext(false),
        });
    };

    return (
        <DoctorDashboardLayout
            doctor={doctor}
            counts={{
                waiting: stats.waitingCount,
                inConsultation: stats.inConsultationCount,
                completed: stats.completedCount,
                services: stats.servicesCount,
            }}
            onToggleAvailability={() => setAvailabilityDialogOpen(true)}
            onCallNext={handleCallNext}
            callingNext={callingNext}
            liveSync={liveSync}
        >
            <Head title={`طبيبي - لوحة تحكم الطبيب (${doctor.user.name})`} />

            <div className="space-y-6 font-['Tajawal']" dir="rtl">
                {/* Real-Time Patient Arrival Banners */}
                {liveArrivalAlerts.length > 0 && (
                    <div className="space-y-3">
                        {liveArrivalAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="p-4 sm:p-5 rounded-3xl bg-white shadow-md border border-slate-200/80 border-r-4 border-r-emerald-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2"
                            >
                                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                    <div className="relative w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80 flex items-center justify-center shrink-0">
                                        <UserCheck className="w-5 h-5" />
                                        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white" />
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black border bg-emerald-50 text-emerald-700 border-emerald-200">
                                                وصول مريض لصالة الانتظار
                                            </span>
                                            {alert.ticketNumber && (
                                                <span className="text-xs font-bold font-mono text-slate-600">
                                                    تذكرة #{alert.ticketNumber}
                                                </span>
                                            )}
                                            <span className="text-xs text-slate-500 font-medium">
                                                موعد: {alert.appointmentTime}
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm font-bold text-slate-900 font-['Cairo'] mt-1 leading-relaxed">
                                            {alert.message}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                    <button
                                        type="button"
                                        onClick={playCallChime}
                                        className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                                    >
                                        <BellRing className="w-3.5 h-3.5" />
                                        <span>إعادة التنبيه</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setLiveArrivalAlerts((prev) => prev.filter((item) => item.id !== alert.id))
                                        }
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                                        title="إغلاق التنبيه"
                                        aria-label="إغلاق التنبيه"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Synchronized Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    <MetricCard
                        title="إجمالي جدول اليوم"
                        value={stats.totalPatients}
                        subtitle="المسجلين بالجدول"
                        icon={<Users className="w-5 h-5 text-gray-500" />}
                        iconBg="bg-gray-100"
                    />
                    <MetricCard
                        title="في صالة الانتظار"
                        value={stats.waitingCount}
                        subtitle="حضروا الاستقبال بالخارج"
                        icon={<Clock className="w-5 h-5 text-amber-600" />}
                        iconBg="bg-amber-50"
                    />
                    <MetricCard
                        title="قيد الكشف بالعيادة"
                        value={stats.inConsultationCount}
                        subtitle="داخل غرفة الفحص الآن"
                        icon={<Stethoscope className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="لم يحضروا بعد"
                        value={stats.notArrivedCount}
                        subtitle="بانتظار وصولهم"
                        icon={<AlertCircle className="w-5 h-5 text-blue-600" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="كشوفات مكتملة"
                        value={stats.completedCount}
                        subtitle="تم إنهاء كشفهم بنجاح"
                        icon={<CheckCircle2 className="w-5 h-5 text-teal-600" />}
                        iconBg="bg-teal-50"
                    />
                    <MetricCard
                        title="تأمين معتمد"
                        value={stats.insuranceCount}
                        subtitle="تغطية بنسبة 100%"
                        icon={<ShieldCheck className="w-5 h-5 text-purple-600" />}
                        iconBg="bg-purple-50"
                    />
                </div>

                {/* Active Examining Session */}
                {currentSession ? (
                    <div>
                        <ActiveSession
                            session={currentSession}
                            onCallNext={handleCallNext}
                            callingNext={callingNext}
                            onOpenPrescriptionModal={() => {
                                setSelectedApptForRx(currentSession);
                                setRxModalOpen(true);
                            }}
                        />
                    </div>
                ) : (
                    <div className="p-8 rounded-3xl bg-white border border-gray-200/80 text-center shadow-xs">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                        <h3 className="font-bold text-lg text-gray-900 font-['Cairo']">
                            لا توجد حالة كشف نشطة داخل العيادة حالياً
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                            {stats.waitingCount > 0
                                ? `يوجد ${stats.waitingCount} مرضى في صالة الانتظار بانتظار استدعائك.`
                                : 'لا يوجد مرضى في صالة الانتظار حالياً.'}
                        </p>
                        {stats.waitingCount > 0 && (
                            <button
                                type="button"
                                onClick={handleCallNext}
                                disabled={callingNext}
                                className="mt-4 px-6 py-2.5 rounded-xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-500/20"
                            >
                                {callingNext ? 'جارٍ الاستدعاء...' : 'استدعاء المريض الأول بالانتظار'}
                            </button>
                        )}
                    </div>
                )}

                {/* Appointments Queue Table with Search & Status Select */}
                <AppointmentsQueueTable
                    appointments={todayAppointments}
                    onOpenPrescriptionModal={(appt) => {
                        setSelectedApptForRx(appt);
                        setRxModalOpen(true);
                    }}
                />
            </div>

            {/* Prescription Modal */}
            <PrescriptionModal
                isOpen={rxModalOpen}
                onClose={() => {
                    setRxModalOpen(false);
                    setSelectedApptForRx(null);
                }}
                currentSession={selectedApptForRx || currentSession}
            />

            {/* Availability Dialog */}
            <AvailabilityDialog
                isOpen={availabilityDialogOpen}
                onClose={() => setAvailabilityDialogOpen(false)}
                isAvailable={doctor.is_available_today}
            />
        </DoctorDashboardLayout>
    );
}
