import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { RefreshCw, Volume2, Clock, BellRing } from 'lucide-react';
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
    const [lastUpdated, setLastUpdated] = useState<string>('الآن');
    const [isPolling, setIsPolling] = useState(false);
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

    const fetchLatestStatus = useCallback(async () => {
        try {
            setIsPolling(true);
            const res = await fetch(`/api/queue/${appointment.booking_reference}/status`, {
                headers: { Accept: 'application/json' },
            });
            if (res.ok) {
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
                        title: '🔔 دورك الآن! تفضل بالدخول إلى غرفة الفحص 🩺',
                        message: callMsg,
                    });
                    toast.success(`🔔 دورك الآن! ${callMsg}`, { duration: 10000 });
                }

                if (newDelayMinutes > prevDelayMinutesRef.current) {
                    const addedDiff = newDelayMinutes - prevDelayMinutesRef.current;
                    prevDelayMinutesRef.current = newDelayMinutes;
                    playCallChime();
                    const remainingText = formatRemainingArabic(data.minutesRemaining ?? 15, Boolean(data.isCalled));
                    const delayMsg = `قام ${displayDocName} بتمديد وقت الكشف الحالي بمقدار (+${addedDiff} دقيقة). تم تعديل وقت موعدك المتوقع تلقائياً إلى الساعة ${data.expectedTime} (${remainingText}).`;
                    setLiveAlertBanner({
                        type: 'delay',
                        title: `⏰ تنبيه فوري من العيادة: تم تمديد الوقت (+${addedDiff} دقيقة)`,
                        message: delayMsg,
                    });
                    toast(delayMsg, {
                        icon: '⏰',
                        duration: 10000,
                        style: {
                            background: '#fffbeb',
                            color: '#78350f',
                            border: '2px solid #f59e0b',
                            fontWeight: 'bold',
                        },
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

                const d = new Date();
                setLastUpdated(
                    `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
                );
            }
        } catch {
            // ignore transient errors
        } finally {
            setIsPolling(false);
        }
    }, [appointment.booking_reference, displayDocName]);

    useEffect(() => {
        const interval = setInterval(fetchLatestStatus, 3000);
        return () => clearInterval(interval);
    }, [fetchLatestStatus]);

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
                      ? '🔔 دورك الآن داخل العيادة مع الطبيب'
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
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-black text-slate-900 font-['Cairo']">
                                مرحباً {appointment.patient.name} — شاشة التتبع المباشر للدور والمسار
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                                (مزامنة تلقائية كل 3 ثوانٍ • آخر فحص: {lastUpdated})
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={fetchLatestStatus}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin text-[#005ab5]' : ''}`} />
                        <span>تحديث فوري</span>
                    </button>
                </div>

                {/* 2. Real-Time Alert Popup Banner (When Doctor Calls or Extends Time) */}
                {liveAlertBanner && (
                    <div
                        className={`p-5 rounded-3xl shadow-lg border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                            liveAlertBanner.type === 'call'
                                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-300'
                                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-amber-300'
                        }`}
                    >
                        <div className="flex items-start sm:items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                                {liveAlertBanner.type === 'call' ? (
                                    <Volume2 className="w-6 h-6 text-white animate-bounce" />
                                ) : (
                                    <Clock className="w-6 h-6 text-white animate-pulse" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-black font-['Cairo']">
                                    {liveAlertBanner.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-white/95 mt-0.5 leading-relaxed">
                                    {liveAlertBanner.message}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <button
                                type="button"
                                onClick={playCallChime}
                                className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                                <BellRing className="w-4 h-4" />
                                <span>إعادة التنبيه</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleDismissAlert}
                                className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                            >
                                حسناً
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
