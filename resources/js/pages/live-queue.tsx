import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import toast from 'react-hot-toast';
import { 
    Clock, 
    Users, 
    MapPin, 
    ShieldCheck, 
    Calendar, 
    RefreshCw, 
    CheckCircle2, 
    AlertCircle, 
    Building2, 
    Phone, 
    Navigation, 
    Share2, 
    Volume2,
    Car,
    Compass,
    X,
    ExternalLink,
    Stethoscope,
    Sparkles,
    Check
} from 'lucide-react';

interface LiveQueueProps {
    appointment: {
        id: number;
        booking_reference: string;
        appointment_date: string;
        appointment_time: string;
        status: string;
        payment_method: string;
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

export default function LiveQueue({ appointment, queueData: initialQueueData, clinicLocation }: LiveQueueProps) {
    const [queueData, setQueueData] = useState(initialQueueData);
    const [lastUpdated, setLastUpdated] = useState<string>('الآن');
    const [isPolling, setIsPolling] = useState(false);

    // Destination coordinates (Clinic / Hospital)
    const clinicLat = Number(clinicLocation.latitude) || 24.6978;
    const clinicLng = Number(clinicLocation.longitude) || 46.6841;

    // Haversine distance calculation
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in km
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
        const speedKmH = 35; // City driving speed
        const mins = Math.round((d / speedKmH) * 60) + 4;
        return { km: Number(d.toFixed(1)), minutes: Math.max(5, mins) };
    };

    // Realistic patient location in Riyadh
    const initialPatientLocation = {
        lat: Number((clinicLat + 0.052).toFixed(4)),
        lng: Number((clinicLng - 0.031).toFixed(4)),
        label: 'موقعك التقديري (الرياض)',
        isLiveGps: false,
    };

    const [userLocation, setUserLocation] = useState(initialPatientLocation);
    const [distanceInfo, setDistanceInfo] = useState(() =>
        calculateDistance(initialPatientLocation.lat, initialPatientLocation.lng, clinicLat, clinicLng)
    );
    const [directionsModalOpen, setDirectionsModalOpen] = useState(false);
    const [locating, setLocating] = useState(false);

    const handleOpenDirections = () => {
        setDirectionsModalOpen(true);
        // Automatically attempt high-accuracy GPS update if not updated yet
        if (!userLocation.isLiveGps && navigator.geolocation) {
            setLocating(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const uLat = pos.coords.latitude;
                    const uLng = pos.coords.longitude;
                    setUserLocation({
                        lat: uLat,
                        lng: uLng,
                        label: 'موقعك الفعلي المباشر (GPS)',
                        isLiveGps: true,
                    });
                    const dist = calculateDistance(uLat, uLng, clinicLat, clinicLng);
                    setDistanceInfo(dist);
                    setLocating(false);
                    toast.success(`تم حساب المسار بدقة! المسافة إلى المستشفى: ${dist.km} كم (${dist.minutes} دقيقة).`);
                },
                () => {
                    setLocating(false);
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        }
    };

    const handleRefreshGps = () => {
        if (!navigator.geolocation) {
            toast.error('المتصفح لا يدعم تحديد الموقع الجغرافي.');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const uLat = pos.coords.latitude;
                const uLng = pos.coords.longitude;
                setUserLocation({
                    lat: uLat,
                    lng: uLng,
                    label: 'موقعك الفعلي المباشر (GPS)',
                    isLiveGps: true,
                });
                const dist = calculateDistance(uLat, uLng, clinicLat, clinicLng);
                setDistanceInfo(dist);
                setLocating(false);
                toast.success(`تم تحديث موقعك! المسافة إلى المستشفى: ${dist.km} كم (~${dist.minutes} دقيقة بالسيارة).`);
            },
            () => {
                setLocating(false);
                toast.error('تعذر تحديد الموقع الفعلي، يرجى تفعيل الـ GPS في المتصفح.');
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${clinicLat},${clinicLng}`;
    const mapEmbedUrl = `https://maps.google.com/maps?saddr=${userLocation.lat},${userLocation.lng}&daddr=${clinicLat},${clinicLng}&output=embed&hl=ar`;

    // Auto-polling for real-time queue sync
    const fetchLatestStatus = async () => {
        try {
            setIsPolling(true);
            const res = await fetch(`/api/queue/${appointment.booking_reference}/status`);
            if (res.ok) {
                const data = await res.json();
                setQueueData(prev => ({
                    ...prev,
                    ticketNumber: data.ticketNumber,
                    currentServingNumber: data.currentServingNumber,
                    patientsAhead: data.patientsAhead,
                    estimatedWaitMinutes: data.estimatedWaitMinutes,
                    queueStatus: data.status,
                }));
                const d = new Date();
                setLastUpdated(`${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`);
            }
        } catch (e) {
            console.error('Polling error', e);
        } finally {
            setIsPolling(false);
        }
    };

    useEffect(() => {
        const interval = setInterval(fetchLatestStatus, 5000);
        return () => clearInterval(interval);
    }, [appointment.booking_reference]);

    const isYourTurn = queueData.patientsAhead === 0 || appointment.status === 'in_consultation';

    // Dynamic timeline stages based on live status
    const timelineSteps = [
        { 
            title: 'تأكيد الحجز', 
            status: 'done', 
            desc: 'تم تثبيت الموعد إلكترونياً' 
        },
        { 
            title: 'تسجيل الحضور', 
            status: appointment.status === 'confirmed' ? 'active' : 'done', 
            desc: appointment.status === 'confirmed' ? 'يرجى مراجعة موظف الاستقبال' : 'تم إثبات وصولك للعيادة' 
        },
        { 
            title: 'انتظار المناداة', 
            status: isYourTurn || appointment.status === 'completed' ? 'done' : (appointment.status === 'waiting' ? 'active' : 'upcoming'), 
            desc: isYourTurn ? 'انتهت فترة الانتظار' : `باقي ${queueData.patientsAhead} قبل دورك` 
        },
        { 
            title: 'الكشف السريري', 
            status: appointment.status === 'completed' ? 'done' : (isYourTurn ? 'active' : 'upcoming'), 
            desc: isYourTurn ? 'تفضل بالدخول لغرفة الطبيب' : `فحص استشاري ${appointment.doctor.specialty.name_ar}` 
        },
        { 
            title: 'الوصفة والتقرير', 
            status: appointment.status === 'completed' ? 'done' : 'upcoming', 
            desc: appointment.status === 'completed' ? 'تم إصدار الروشتة' : 'إصدار الروشتة الرقمية' 
        },
    ];

    return (
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title={`تتبع الدور الحي - تذكرة رقم ${queueData.ticketNumber}`} />
            
            <TebibyHeader />

            <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Live Pulse Header Bar */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs mb-6">
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                        </span>
                        <div>
                            <span className="text-xs font-bold text-gray-900 block font-['Cairo']">
                                شاشة تتبع الدور المباشر - محدثة لحظياً
                            </span>
                            <span className="text-[11px] text-gray-500">آخر فحص: {lastUpdated}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={fetchLatestStatus}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin text-[#005ab5]' : ''}`} />
                        <span>تحديث فوري</span>
                    </button>
                </div>

                {/* Hero Ticket Status Card */}
                <div className={`p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden mb-8 transition-colors ${
                    isYourTurn 
                        ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 shadow-emerald-500/20'
                        : 'bg-gradient-to-br from-[#005ab5] via-[#004f9f] to-[#003d7a] shadow-blue-500/20'
                }`}>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-3 backdrop-blur-xs">
                                <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
                                <span>رقم الحجز: {appointment.booking_reference}</span>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-black font-['Cairo'] leading-tight mb-2">
                                {isYourTurn ? (
                                    <span>حان الآن دورك للكشف الطبي! تفضل بالدخول 🩺</span>
                                ) : (
                                    <span>أنت المريض رقم {queueData.ticketNumber} في تسلسل الاستقبال</span>
                                )}
                            </h1>
                            <p className="text-sm text-blue-100 max-w-xl">
                                مرحباً {appointment.patient.name}، يرجى التواجد بالقرب من عيادة رقم (١٢) بالدور الأول.
                            </p>
                        </div>

                        {/* Huge Ticket Badge */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl text-center min-w-[140px] shrink-0 self-center md:self-auto shadow-inner">
                            <span className="text-xs uppercase tracking-wider text-blue-200 block font-bold">تذكرتك الحالية</span>
                            <span className="text-5xl font-black font-['Cairo'] block my-1">#{queueData.ticketNumber}</span>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                                isYourTurn ? 'bg-emerald-400 text-emerald-950 animate-pulse' : 'bg-white/20 text-white'
                            }`}>
                                {isYourTurn ? 'ادخل للعيادة' : 'مؤكد في الطابور'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4 Interactive KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {/* Serving Now */}
                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <span className="text-xs text-gray-500 font-semibold mb-2">يُفحص الآن داخل العيادة</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-900 font-['Cairo']">#{queueData.currentServingNumber}</span>
                            <span className="text-xs text-emerald-600 font-bold">جلسة جارية</span>
                        </div>
                    </div>

                    {/* Patients ahead */}
                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <span className="text-xs text-gray-500 font-semibold mb-2">المرضى المتبقون قبلك</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-[#005ab5] font-['Cairo']">{queueData.patientsAhead}</span>
                            <span className="text-xs text-gray-600 font-medium">حالات في الانتظار</span>
                        </div>
                    </div>

                    {/* Estimated wait time */}
                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <span className="text-xs text-gray-500 font-semibold mb-2">الوقت المتوقع للدخول</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-amber-600 font-['Cairo']">~{queueData.estimatedWaitMinutes}</span>
                            <span className="text-xs text-gray-600 font-medium">دقيقة</span>
                        </div>
                    </div>

                    {/* Notification Channel */}
                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <span className="text-xs text-gray-500 font-semibold mb-2">قناة التنبيهات الفورية</span>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>واتساب + SMS</span>
                        </div>
                    </div>
                </div>

                {/* Queue Timeline Flow */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white border border-gray-200/80 shadow-xs mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 text-base font-['Cairo'] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#005ab5] text-[20px]">timeline</span>
                            <span>المسار التدفقي الحي لأدوار الانتظار</span>
                        </h3>
                        <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                            تحديث تلقائي لمراحل الموعد
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3 relative">
                        {timelineSteps.map((step, idx) => (
                            <div
                                key={step.title}
                                className={`p-4 rounded-2xl border text-center transition-all ${
                                    step.status === 'done'
                                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 shadow-xs'
                                        : step.status === 'active'
                                        ? 'bg-blue-50 border-[#005ab5] ring-2 ring-[#005ab5]/20 text-[#005ab5] shadow-xs'
                                        : 'bg-gray-50/70 border-gray-200 text-gray-400'
                                }`}
                            >
                                <div className="text-[11px] font-black mb-1 font-['Cairo'] flex items-center justify-center gap-1">
                                    {step.status === 'done' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                    <span>المرحلة {idx + 1}</span>
                                </div>
                                <div className="text-sm font-bold mb-1 text-gray-900">{step.title}</div>
                                <div className="text-[11px] text-gray-500">{step.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Doctor & Clinic Navigation Cards (Better layout & styling) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Doctor Info Card */}
                    <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-['Cairo']">
                                    طبيبك المعالج
                                </span>
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span>متواجد بالعيادة</span>
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                <img
                                    src={appointment.doctor.user.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=faces'}
                                    alt={appointment.doctor.user.name}
                                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-100 shrink-0"
                                />
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base font-['Cairo']">
                                        {appointment.doctor.user.name}
                                    </h3>
                                    <p className="text-xs text-[#005ab5] font-semibold mt-0.5">
                                        {appointment.doctor.title_ar}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        تخصص: {appointment.doctor.specialty.name_ar}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1 text-gray-600">
                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                <span>عيادة رقم (١٢) - الدور الأول</span>
                            </span>
                            <span className="font-mono text-gray-400">
                                وقت الكشف: {appointment.appointment_time}
                            </span>
                        </div>
                    </div>

                    {/* Clinic Address, Distance & Immediate Route Card */}
                    <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-['Cairo']">
                                    مقر العيادة والتواصل
                                </span>
                                {/* Distance Live Badge */}
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#005ab5] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                    <Car className="w-3 h-3 text-[#005ab5]" />
                                    <span>المسافة: {distanceInfo.km} كم (~{distanceInfo.minutes} دقيقة)</span>
                                </span>
                            </div>

                            <h3 className="font-black text-gray-900 text-base font-['Cairo']">
                                {clinicLocation.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {clinicLocation.branch} • {clinicLocation.address}
                            </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-3">
                            {/* Instant Directions Button */}
                            <button
                                type="button"
                                onClick={handleOpenDirections}
                                className="flex-1 py-3 px-4 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                            >
                                <Navigation className="w-4 h-4" />
                                <span>اتجاهات الموقع والمسار المباشر</span>
                            </button>

                            <a
                                href={`tel:${clinicLocation.phone}`}
                                className="py-3 px-4 rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                title="اتصال مباشر بالاستقبال"
                            >
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span>اتصال</span>
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            {/* Interactive Route & Distance Modal */}
            {directionsModalOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Tajawal']" 
                    dir="rtl"
                >
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setDirectionsModalOpen(false)}
                            className="absolute top-4 left-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Modal Header */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#005ab5] flex items-center justify-center shrink-0">
                                <Navigation className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-gray-900 font-['Cairo']">
                                    مسار الملاحة وحساب المسافة للمستشفى
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {clinicLocation.name} - {clinicLocation.branch}
                                </p>
                            </div>
                        </div>

                        {/* Dual Locations & Live Metrics Dashboard */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/80 mb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 mb-3 border-b border-blue-200/60">
                                {/* Point A: User */}
                                <div className="flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-black text-xs">
                                        أ
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-md">
                                                نقطة الانطلاق (موقعك)
                                            </span>
                                            {userLocation.isLiveGps && (
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="GPS مباشر" />
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-gray-900 truncate mt-1">
                                            {userLocation.label}
                                        </p>
                                    </div>
                                </div>

                                {/* Point B: Clinic */}
                                <div className="flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 font-black text-xs">
                                        ب
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded-md">
                                            الوجهة (المستشفى)
                                        </span>
                                        <p className="text-xs font-bold text-gray-900 truncate mt-1">
                                            {clinicLocation.name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Distance & Time Highlights */}
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <Car className="w-4 h-4 text-[#005ab5]" />
                                        <span className="text-gray-600 font-medium">المسافة:</span>
                                        <span className="font-black text-gray-900 font-mono text-sm bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
                                            {distanceInfo.km} كم
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-emerald-600" />
                                        <span className="text-gray-600 font-medium">الوقت المقدر:</span>
                                        <span className="font-black text-emerald-800 font-mono text-sm bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                            ~{distanceInfo.minutes} دقيقة بالسيارة
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleRefreshGps}
                                    disabled={locating}
                                    className="px-3 py-1 rounded-xl bg-white hover:bg-blue-50 text-[#005ab5] border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Compass className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                                    <span>{locating ? 'جارٍ التحديث...' : 'تحديث GPS'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Interactive Google Map with Route Path */}
                        <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative bg-gray-100 mb-5">
                            <iframe
                                title="مسار الملاحة على خرائط جوجل"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={mapEmbedUrl}
                            ></iframe>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <a
                                href={googleMapsNavUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 w-full py-3.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>فتح الملاحة خطوة بخطوة في تطبيق Google Maps</span>
                            </a>
                            <button
                                type="button"
                                onClick={() => setDirectionsModalOpen(false)}
                                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <TebibyFooter />
        </div>
    );
}
