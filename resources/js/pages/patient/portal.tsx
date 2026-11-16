import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { Clock, Volume2, BellRing } from 'lucide-react';
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
    const lastPayloadJsonRef = useRef('');

    useEffect(() => {
        if (!activeAppt?.booking_reference) return;

        const pollStatus = async () => {
            try {
                const res = await fetch(`/api/queue/${activeAppt.booking_reference}/status`, {
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) {
                    const data = await res.json();
                    const nextJson = JSON.stringify(data);
                    if (nextJson !== lastPayloadJsonRef.current) {
                        lastPayloadJsonRef.current = nextJson;
                        setLiveQueueData(data);
                    }

                    if (data.isCalled && !wasCalledRef.current) {
                        wasCalledRef.current = true;
                        playCallChime();
                        toast.success(
                            `🔔 حان دورك الآن! يرجى الدخول لغرفة الفحص مع د. ${activeAppt.doctor.user.name} 🩺`,
                            { duration: 10000 }
                        );
                    }

                    const newDelay = Number(data.delayMinutes || 0);
                    if (newDelay > prevDelayRef.current) {
                        const diff = newDelay - prevDelayRef.current;
                        prevDelayRef.current = newDelay;
                        playCallChime();
                        toast(
                            `⏰ تنبيه من العيادة: قام د. ${activeAppt.doctor.user.name} بتمديد وقت الكشف (+${diff} دقيقة). موعدك المحدّث: ${data.expectedTime}`,
                            {
                                icon: '⏰',
                                duration: 10000,
                                style: {
                                    background: '#fffbeb',
                                    color: '#78350f',
                                    border: '2px solid #f59e0b',
                                    fontWeight: 'bold',
                                },
                            }
                        );
                    }
                }
            } catch {
                // ignore transient network errors
            }
        };

        pollStatus();
        const interval = setInterval(pollStatus, 3000);
        return () => clearInterval(interval);
    }, [activeAppt?.booking_reference, activeAppt?.doctor?.user?.name]);

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
                        {liveQueueData?.isCalled && (
                            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-emerald-300">
                                <div className="flex items-center gap-3.5 text-center sm:text-right">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                                        <Volume2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-black font-['Cairo']">
                                            🔔 حان دورك الآن! تفضل بالدخول للعيادة
                                        </h3>
                                        <p className="text-xs text-emerald-100 mt-0.5">
                                            د. {activeAppt.doctor.user.name} بانتظارك الآن داخل غرفة الفحص السريري.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={playCallChime}
                                    className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors shrink-0 flex items-center gap-2 cursor-pointer shadow-sm"
                                >
                                    <BellRing className="w-4 h-4 text-emerald-600" />
                                    <span>رنين التنبيه 🔔</span>
                                </button>
                            </div>
                        )}

                        {liveQueueData && liveQueueData.delayMinutes > 0 && (
                            <div className="p-4 sm:p-4.5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-xs flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h4 className="font-black font-['Cairo'] text-sm text-amber-900">
                                            تنويه من العيادة: تم تمديد وقت الانتظار (+{liveQueueData.delayMinutes} دقيقة)
                                        </h4>
                                        {liveQueueData.expectedTime && (
                                            <span className="px-2.5 py-1 rounded-xl bg-amber-200/90 font-mono font-bold text-amber-950 text-xs">
                                                موعدك الجديد المتوقع: {liveQueueData.expectedTime}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs leading-relaxed text-amber-800">
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
