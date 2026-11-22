import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { notify } from '@/components/common/toast';
import { LiveSyncIndicator } from '@/components/common/live-sync-indicator';
import { usePollingLiveSync } from '@/hooks/use-live-sync';
import { Volume2, Clock, BellRing, X } from 'lucide-react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import { playCallChime } from '@/lib/chime';
import { QrCheckinModal } from '@/components/patient/qr-checkin-modal';
import {
    QueueHeroBanner,
    QueueTimelineStepper,
    QueueRouteMapCard,
    formatRemainingArabic,
    formatDoctorName,
} from '@/components/queue';

interface LiveQueueProps {
    appointment: {
        id: number;
        booking_reference: string;
        appointment_date: string;
        appointment_time: string;
        service_name?: string | null;
        duration_minutes?: number | null;
        delay_minutes?: number;
        delay_reason?: string | null;
        status: string;
        payment_method: string;
        facility_id?: number;
        patient: {
            name: string;
            phone: string;
        };
        doctor: {
            title_ar: string;
            waiting_time_minutes: number;
            user: {
                name: string;
                avatar: string;
            };
            specialty: {
                name_ar: string;
            };
            clinic: {
                id?: number;
                name: string;
                branch_name: string;
                district: string;
                city: string;
                address: string;
                phone: string;
                map_url: string;
            };
        };
    };
    queueData: {
        ticketNumber: number;
        currentServingNumber: number;
        patientsAhead: number;
        estimatedWaitMinutes: number;
        queueStatus: string;
        appointmentStatus: string;
        isYourTurn?: boolean;
        isCalled?: boolean;
        delayMinutes?: number;
        delayReason?: string | null;
        scheduledTime?: string;
        expectedTime?: string;
        minutesRemaining?: number;
        targetTimestampMs?: number;
    };
    clinicLocation: {
        name: string;
        branch: string;
        district: string;
        city: string;
        address: string;
        phone: string;
        mapUrl: string;
        latitude?: number;
        longitude?: number;
    };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    const speedKmH = 35;
    const mins = Math.round((d / speedKmH) * 60) + 4;
    return { km: Number(d.toFixed(1)), minutes: Math.max(5, mins) };
}

export default function LiveQueue({ appointment, queueData: initialQueueData, clinicLocation }: LiveQueueProps) {
    const [queueData, setQueueData] = useState<any>(initialQueueData);
    const [liveAlertBanner, setLiveAlertBanner] = useState<{
        type: 'call' | 'delay';
        title: string;
        message: string;
    } | null>(null);

    const wasCalledRef = useRef(Boolean(initialQueueData.isCalled || initialQueueData.isYourTurn || appointment.status === 'in_consultation'));
    const prevDelayMinutesRef = useRef<number>(Number(initialQueueData.delayMinutes ?? appointment.delay_minutes ?? 0));
    const prevCallCountRef = useRef<number>(Number((initialQueueData as any).callCount ?? 0));

    const clinicLat = Number(clinicLocation.latitude) || 24.6978;
    const clinicLng = Number(clinicLocation.longitude) || 46.6841;

    const [userLocation, setUserLocation] = useState(() => ({
        lat: Number((clinicLat + 0.052).toFixed(4)),
        lng: Number((clinicLng - 0.031).toFixed(4)),
        label: `موقعك الحالي (${clinicLocation.city || 'الرياض'})`,
        isLiveGps: false,
    }));
    const [distanceInfo, setDistanceInfo] = useState(() =>
        calculateDistance(clinicLat + 0.052, clinicLng - 0.031, clinicLat, clinicLng)
    );
    const [checkinModalOpen, setCheckinModalOpen] = useState(false);
    const [locating, setLocating] = useState(false);

    const handleRefreshGps = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error('المتصفح لا يدعم تحديد الموقع الجغرافي.');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const rawLat = pos.coords.latitude;
                const rawLng = pos.coords.longitude;
                const rawDist = calculateDistance(rawLat, rawLng, clinicLat, clinicLng);

                // If user is within 80km of the clinic city, use exact GPS; otherwise use a realistic local city offset so the map stays zoomed in on the city roads
                if (rawDist.km <= 80) {
                    setUserLocation({
                        lat: rawLat,
                        lng: rawLng,
                        label: 'موقعك الفعلي المباشر (GPS)',
                        isLiveGps: true,
                    });
                    setDistanceInfo(rawDist);
                    toast.success(`تم تحديث موقعك! المسافة إلى المستشفى: ${rawDist.km} كم (~${rawDist.minutes} دقيقة بالسيارة).`);
                } else {
                    const localLat = Number((clinicLat + 0.044).toFixed(4));
                    const localLng = Number((clinicLng - 0.027).toFixed(4));
                    const localDist = calculateDistance(localLat, localLng, clinicLat, clinicLng);
                    setUserLocation({
                        lat: localLat,
                        lng: localLng,
                        label: `موقعك المحدث (${clinicLocation.city || 'الرياض'})`,
                        isLiveGps: true,
                    });
                    setDistanceInfo(localDist);
                    toast.success(`تم ضبط مسار الملاحة داخل ${clinicLocation.city || 'الرياض'} (${localDist.km} كم • ~${localDist.minutes} دقيقة).`);
                }
                setLocating(false);
            },
            () => {
                setLocating(false);
                toast.error('تعذر تحديد الموقع الفعلي، يرجى تفعيل الـ GPS في المتصفح.');
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }, [clinicLat, clinicLng, clinicLocation.city]);

    const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${clinicLat},${clinicLng}`;
    const displayDocName = formatDoctorName(appointment.doctor?.user?.name);

    const fetchLatestStatus = useCallback(async (): Promise<boolean> => {
        try {
            const res = await fetch(`/api/queue/${appointment.booking_reference}/status`, {
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) return false;

            const data = await res.json();
            const newDelayMinutes = Number(data.delayMinutes || 0);
            const newCallCount = Number(data.callCount || 0);

            if (
                (data.isCalled && !wasCalledRef.current) ||
                (data.isCalled && newCallCount > prevCallCountRef.current)
            ) {
                wasCalledRef.current = true;
                prevCallCountRef.current = newCallCount;
                playCallChime();
                const callMsg = `قام ${displayDocName} باستدعائك الآن! تفضل بالدخول فوراً إلى غرفة الفحص (تذكرة #${data.ticketNumber}).`;
                setLiveAlertBanner({
                    type: 'call',
                    title: 'دورك الآن — تفضل بالدخول إلى غرفة الفحص',
                    message: callMsg,
                });
                notify.clinicCall({
                    title: 'حان دورك الآن',
                    message: callMsg,
                    badge: `تذكرة #${data.ticketNumber}`,
                    onReplaySound: playCallChime,
                    duration: 10000,
                });
            }

            if (newDelayMinutes > prevDelayMinutesRef.current) {
                const addedDiff = newDelayMinutes - prevDelayMinutesRef.current;
                prevDelayMinutesRef.current = newDelayMinutes;
                playCallChime();
                const remainingText = formatRemainingArabic(data.minutesRemaining ?? 15, Boolean(data.isCalled));
                const delayMsg = `قام ${displayDocName} بتمديد وقت الكشف الحالي بمقدار (+${addedDiff} دقيقة). تم تعديل وقت موعدك المتوقع تلقائياً إلى الساعة ${data.expectedTime} (${remainingText}).`;
                setLiveAlertBanner({
                    type: 'delay',
                    title: `تنبيه فوري من العيادة: تم تمديد الوقت (+${addedDiff} دقيقة)`,
                    message: delayMsg,
                });
                notify.clinicDelay({
                    title: 'تمديد وقت الكشف',
                    message: delayMsg,
                    badge: `+${addedDiff} دقيقة`,
                    duration: 10000,
                });
            }

            setQueueData((prev: any) => ({
                ...prev,
                ticketNumber: data.ticketNumber,
                currentServingNumber: data.currentServingNumber,
                patientsAhead: data.patientsAhead,
                estimatedWaitMinutes: data.estimatedWaitMinutes,
                queueStatus: data.status,
                appointmentStatus: data.appointmentStatus || prev.appointmentStatus,
                isYourTurn: Boolean(data.isYourTurn || data.isCalled),
                isCalled: Boolean(data.isCalled),
                delayMinutes: newDelayMinutes,
                delayReason: data.delayReason,
                scheduledTime: data.scheduledTime || prev.scheduledTime,
                expectedTime: data.expectedTime || prev.expectedTime,
                minutesRemaining: data.minutesRemaining,
                targetTimestampMs: data.targetTimestampMs,
            }));

            return true;
        } catch {
            return false;
        }
    }, [appointment.booking_reference, displayDocName]);

    const liveSync = usePollingLiveSync(fetchLatestStatus, {
        intervalMs: 3000,
    });

    const currentApptStatus = queueData.appointmentStatus || appointment.status;
    const isYourTurn = Boolean(queueData.isCalled || queueData.isYourTurn || currentApptStatus === 'in_consultation');
    const isStage3Done = currentApptStatus === 'completed';
    const isStage2Done = ['waiting', 'in_consultation', 'completed'].includes(currentApptStatus) || isStage3Done;
    const isStage1Done = currentApptStatus !== 'booked' || isStage2Done;

    const timelineSteps = useMemo(
        () => [
            {
                title: 'تأكيد الحجز (الإدارة)',
                status: isStage1Done ? 'done' : 'active',
                desc: isStage1Done ? 'تم اعتماد الحجز وتأكيده' : 'حجز نشط ومتاح للتأكيد المباشر',
            },
            {
                title: 'تأكيد الحضور (الاستقبال أو QR)',
                status: isStage2Done ? 'done' : 'active',
                desc: isStage2Done
                    ? 'تم إثبات وصولك بالاستقبال وإدراجك في الطابور'
                    : 'امسح كود QR بالاستقبال لتسجيل الحضور فوراً',
            },
            {
                title: 'انتظار دور الكشف',
                status:
                    isYourTurn || isStage3Done
                        ? 'done'
                        : currentApptStatus === 'waiting'
                          ? 'active'
                          : 'upcoming',
                desc: isYourTurn
                    ? 'حان دورك الآن للدخول للعيادة!'
                    : queueData.patientsAhead === 0
                      ? 'أنت المريض التالي مباشرة بالانتظار'
                      : `باقي ${queueData.patientsAhead} مرضى قبل دورك`,
            },
            {
                title: 'دخول العيادة والفحص',
                status:
                    isStage3Done
                        ? 'done'
                        : isYourTurn
                          ? 'active'
                          : 'upcoming',
                desc: isStage3Done
                    ? 'تم إنهاء الكشف الطبي واعتماده'
                    : isYourTurn
                      ? 'دورك الآن داخل العيادة مع الطبيب'
                      : `كشف ${displayDocName}`,
            },
            {
                title: 'الوصفة والتقرير الطبي',
                status: isStage3Done ? 'done' : 'upcoming',
                desc: isStage3Done ? 'تم إصدار الروشتة الرقمية بنجاح' : 'تُصدر فور إنهاء الطبيب للكشف',
            },
        ],
        [
            isStage1Done,
            isStage2Done,
            isStage3Done,
            isYourTurn,
            currentApptStatus,
            displayDocName,
            queueData.patientsAhead,
        ]
    );

    const handleOpenCheckin = useCallback(() => setCheckinModalOpen(true), []);
    const handleCloseCheckin = useCallback(() => setCheckinModalOpen(false), []);
    const handleDismissAlert = useCallback(() => setLiveAlertBanner(null), []);

    return (
        <div className="min-h-screen bg-[#f4f7fb] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title={`تتبع الدور الحي - تذكرة رقم #${queueData.ticketNumber}`} />

            <TebibyHeader />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-6">
                {/* 1. Top Compact Live Sync Header Bar */}
                <LiveSyncIndicator
                    variant="bar"
                    sync={liveSync}
                    title={`مرحباً ${appointment.patient.name} — شاشة التتبع المباشر للدور والمسار`}
                />

                {/* 2. Real-Time Alert Popup Banner (When Doctor Calls or Extends Time) */}
                {liveAlertBanner && (
                    <div
                        className={`p-5 rounded-3xl bg-white shadow-md border border-slate-200/80 border-r-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 ${
                            liveAlertBanner.type === 'call' ? 'border-r-emerald-500' : 'border-r-amber-500'
                        }`}
                    >
                        <div className="flex items-start sm:items-center gap-3.5">
                            <div
                                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ring-1 ${
                                    liveAlertBanner.type === 'call'
                                        ? 'bg-emerald-50 text-emerald-600 ring-emerald-200/80'
                                        : 'bg-amber-50 text-amber-600 ring-amber-200/80'
                                }`}
                            >
                                {liveAlertBanner.type === 'call' ? (
                                    <>
                                        <Volume2 className="w-6 h-6" />
                                        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white" />
                                        </span>
                                    </>
                                ) : (
                                    <Clock className="w-6 h-6" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-black text-slate-900 font-['Cairo']">
                                    {liveAlertBanner.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                                    {liveAlertBanner.message}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <button
                                type="button"
                                onClick={playCallChime}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                                    liveAlertBanner.type === 'call'
                                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                }`}
                            >
                                <BellRing className="w-4 h-4" />
                                <span>إعادة التنبيه</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleDismissAlert}
                                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>إغلاق</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. Main 2-Column Split Grid: Right (Digital Ticket + Countdown + Doctor) | Left (Live Route Map) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-5">
                        <QueueHeroBanner
                            bookingReference={appointment.booking_reference}
                            patientName={appointment.patient.name}
                            doctor={appointment.doctor}
                            clinicName={clinicLocation.name}
                            ticketNumber={queueData.ticketNumber}
                            currentServingNumber={queueData.currentServingNumber}
                            patientsAhead={queueData.patientsAhead}
                            estimatedWaitMinutes={queueData.estimatedWaitMinutes}
                            minutesRemaining={queueData.minutesRemaining}
                            targetTimestampMs={queueData.targetTimestampMs}
                            scheduledTime={queueData.scheduledTime}
                            expectedTime={queueData.expectedTime}
                            delayMinutes={queueData.delayMinutes}
                            delayReason={queueData.delayReason}
                            serviceName={appointment.service_name}
                            durationMinutes={appointment.duration_minutes}
                            isYourTurn={isYourTurn}
                            isStage2Done={isStage2Done}
                            onOpenCheckin={handleOpenCheckin}
                        />
                    </div>

                    <div className="lg:col-span-7">
                        <QueueRouteMapCard
                            clinicLocation={clinicLocation}
                            userLocation={userLocation}
                            distanceInfo={distanceInfo}
                            locating={locating}
                            onRefreshGps={handleRefreshGps}
                            googleMapsNavUrl={googleMapsNavUrl}
                        />
                    </div>
                </div>

                {/* 4. Full-Width 5-Stage Live Stepper */}
                <QueueTimelineStepper steps={timelineSteps} />
            </main>

            <QrCheckinModal
                isOpen={checkinModalOpen}
                onClose={handleCloseCheckin}
                appointmentId={appointment.id}
                facilityId={appointment.facility_id || appointment.doctor?.clinic?.id}
                facilityName={clinicLocation.name}
                onSuccess={(newNum) => {
                    setQueueData((prev: any) => ({ ...prev, ticketNumber: newNum }));
                    router.reload();
                }}
            />

            <TebibyFooter />
        </div>
    );
}
