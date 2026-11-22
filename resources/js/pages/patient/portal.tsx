import React, { useState, useRef, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { notify } from '@/components/common/toast';
import { LiveSyncIndicator } from '@/components/common/live-sync-indicator';
import { LIVE_SYNC_HEADER, usePollingLiveSync } from '@/hooks/use-live-sync';
import { Clock, Volume2, BellRing, CalendarClock } from 'lucide-react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import { playCallChime } from '@/lib/chime';
import { QrCheckinModal } from '@/components/patient/qr-checkin-modal';
import { PatientTicketModal } from '@/components/patient/patient-ticket-modal';
import {
    PatientWelcomeBanner,
    ActiveAppointmentCard,
    PatientMapNavigator,
    PatientRecordsTabs,
} from '@/components/patient/portal';

interface PatientPortalProps {
    patient: {
        id: number;
        name: string;
        email: string;
        phone: string;
        national_id: string;
        avatar: string;
        insurance: string;
        membership_id: string;
        national_address: string;
    };
    upcomingAppointments: any[];
    pastAppointments: any[];
    prescriptions: any[];
    medicalRecords: any[];
}

export default function PatientPortal({
    patient,
    upcomingAppointments,
    pastAppointments,
    prescriptions,
    medicalRecords,
}: PatientPortalProps) {
    const [activeTab, setActiveTab] = useState<'appointments' | 'prescriptions' | 'records'>('appointments');
    const [checkinModalOpen, setCheckinModalOpen] = useState(false);
    const [ticketQrModalOpen, setTicketQrModalOpen] = useState(false);

    const activeAppt = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

    const [liveQueueData, setLiveQueueData] = useState<{
        ticketNumber: number | null;
        currentServingNumber: number | null;
        patientsAhead: number;
        estimatedWaitMinutes: number;
        delayMinutes: number;
        delayReason: string | null;
        status: string;
        isCalled: boolean;
        minutesRemaining: number | null;
        expectedTime: string | null;
    } | null>(null);

    const wasCalledRef = useRef(false);
    const prevDelayRef = useRef<number>(Number(activeAppt?.delay_minutes || 0));
    const prevStatusRef = useRef<string>(activeAppt?.status || '');
    const lastPayloadJsonRef = useRef('');

    const pollStatus = useCallback(async (): Promise<boolean> => {
        if (!activeAppt?.booking_reference) return true;
        try {
            const res = await fetch(`/api/queue/${activeAppt.booking_reference}/status`, {
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) return false;

            const data = await res.json();
            const nextJson = JSON.stringify(data);
            if (nextJson !== lastPayloadJsonRef.current) {
                lastPayloadJsonRef.current = nextJson;
                setLiveQueueData(data);
            }

            if (data.isCalled && !wasCalledRef.current) {
                wasCalledRef.current = true;
                playCallChime();
                notify.clinicCall({
                    title: 'حان دورك الآن',
                    message: `يرجى الدخول لغرفة الفحص مع د. ${activeAppt.doctor.user.name}.`,
                    onReplaySound: playCallChime,
                    duration: 10000,
                });
            }

            const newDelay = Number(data.delayMinutes || 0);
            if (newDelay > prevDelayRef.current) {
                const diff = newDelay - prevDelayRef.current;
                prevDelayRef.current = newDelay;
                playCallChime();
                notify.clinicDelay({
                    title: 'تمديد وقت الكشف',
                    message: `قام د. ${activeAppt.doctor.user.name} بتمديد وقت الكشف (+${diff} دقيقة). موعدك المحدّث: ${data.expectedTime}`,
                    badge: `+${diff} دقيقة`,
                    duration: 10000,
                });
            }

            if (data.appointmentStatus === 'completed' && prevStatusRef.current !== 'completed') {
                prevStatusRef.current = 'completed';
                router.reload({
                    only: ['upcomingAppointments', 'pastAppointments', 'prescriptions', 'medicalRecords'],
                    async: true,
                    showProgress: false,
                    headers: { [LIVE_SYNC_HEADER]: '1' },
                });
            } else if (data.appointmentStatus) {
                prevStatusRef.current = data.appointmentStatus;
            }

            return true;
        } catch {
            return false;
        }
    }, [activeAppt?.booking_reference, activeAppt?.doctor?.user?.name]);

    const liveSync = usePollingLiveSync(pollStatus, {
        enabled: Boolean(activeAppt?.booking_reference),
        intervalMs: 3000,
        immediate: true,
    });

    const clinicLoc = activeAppt?.clinic_location || activeAppt?.doctor?.clinic || {
        name: '',
        city: '',
        district: '',
        phone: '',
        latitude: 24.7136,
        longitude: 46.6753,
    };

    const handleOpenCheckin = useCallback(() => setCheckinModalOpen(true), []);
    const handleCloseCheckin = useCallback(() => setCheckinModalOpen(false), []);
    const handleOpenTicketQr = useCallback(() => setTicketQrModalOpen(true), []);
    const handleCloseTicketQr = useCallback(() => setTicketQrModalOpen(false), []);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title="طبيبي - حسابي ومواعيدي وسجلي الطبي" />

            <TebibyHeader />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
                <PatientWelcomeBanner patient={patient} />

                {activeAppt && (
                    <div className="space-y-4 mb-8">
                        <LiveSyncIndicator
                            variant="bar"
                            sync={liveSync}
                            title="المتابعة المباشرة لموعدك النشط وحالة الدور"
                        />

                        {liveQueueData?.isCalled && (
                            <div className="p-4 sm:p-5 rounded-3xl bg-white shadow-md border border-slate-200/80 border-r-4 border-r-emerald-500 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5 text-center sm:text-right">
                                    <div className="relative w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80 flex items-center justify-center shrink-0">
                                        <Volume2 className="w-6 h-6" />
                                        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white" />
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-black text-slate-900 font-['Cairo']">
                                            حان دورك الآن! تفضل بالدخول للعيادة
                                        </h3>
                                        <p className="text-xs text-slate-600 mt-0.5">
                                            د. {activeAppt.doctor.user.name} بانتظارك الآن داخل غرفة الفحص السريري.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={playCallChime}
                                    className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors shrink-0 flex items-center gap-2 cursor-pointer"
                                >
                                    <BellRing className="w-4 h-4 text-emerald-600" />
                                    <span>رنين التنبيه</span>
                                </button>
                            </div>
                        )}

                        {liveQueueData && liveQueueData.delayMinutes > 0 && (
                            <div className="p-4 sm:p-5 rounded-3xl bg-white shadow-xs border border-slate-200/80 border-r-4 border-r-amber-500 flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/80 flex items-center justify-center shrink-0">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h4 className="font-black font-['Cairo'] text-sm text-slate-900">
                                            تنويه من العيادة: تم تمديد وقت الانتظار (+{liveQueueData.delayMinutes} دقيقة)
                                        </h4>
                                        {liveQueueData.expectedTime && (
                                            <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 font-mono font-bold text-amber-900 text-xs inline-flex items-center gap-1.5">
                                                <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                                                <span>موعدك الجديد المتوقع: {liveQueueData.expectedTime}</span>
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                        {liveQueueData.delayReason ||
                                            'نعتذر عن التأخير: تستدعي الحالة الحالية وقتاً إضافياً لتقديم العناية الطبية اللازمة.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <ActiveAppointmentCard
                                activeAppt={activeAppt}
                                clinicLoc={clinicLoc}
                                liveQueueData={liveQueueData}
                                onOpenCheckin={handleOpenCheckin}
                                onOpenTicketQr={handleOpenTicketQr}
                            />

                            <PatientMapNavigator clinicLoc={clinicLoc} />
                        </div>
                    </div>
                )}

                <PatientRecordsTabs
                    activeTab={activeTab}
                    onChangeTab={setActiveTab}
                    pastAppointments={pastAppointments}
                    prescriptions={prescriptions}
                    medicalRecords={medicalRecords}
                />

                {activeAppt && (
                    <>
                        <QrCheckinModal
                            isOpen={checkinModalOpen}
                            onClose={handleCloseCheckin}
                            appointmentId={activeAppt.id}
                            facilityId={clinicLoc.id}
                            facilityName={clinicLoc.name}
                            expectedFacilityCode={clinicLoc.checkin_code || `TEBBY-FAC-${clinicLoc.id || 1}`}
                        />
                        <PatientTicketModal
                            isOpen={ticketQrModalOpen}
                            onClose={handleCloseTicketQr}
                            appointment={activeAppt}
                            facilityName={clinicLoc.name}
                        />
                    </>
                )}
            </main>

            <TebibyFooter />
        </div>
    );
}
