import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import { formatArabicDate, format12HourTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { 
    Calendar, 
    Clock, 
    FileText, 
    Activity, 
    Download, 
    ChevronLeft, 
    ShieldCheck, 
    User, 
    Phone, 
    MapPin, 
    CheckCircle2, 
    Pill, 
    Microscope, 
    ArrowUpRight,
    Navigation,
    Compass,
    Car,
    AlertCircle,
    Ticket
} from 'lucide-react';

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
    medicalRecords
}: PatientPortalProps) {
    const [activeTab, setActiveTab] = useState<'appointments' | 'prescriptions' | 'records'>('appointments');

    // Live clock for current time
    const [currentTime, setCurrentTime] = useState<string>('');
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setCurrentTime(timeStr);
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    const activeAppt = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
    const clinicLoc = activeAppt?.clinic_location || {
        name: 'مستشفى د. سليمان الحبيب - العليا',
        branch_name: 'الفرع الرئيسي',
        address: 'طريق الملك فهد، حي العليا',
        city: 'الرياض',
        district: 'العليا',
        phone: '+966112833333',
        latitude: 24.6978,
        longitude: 46.6841,
    };

    const cLat = Number(clinicLoc.latitude) || 24.6978;
    const cLng = Number(clinicLoc.longitude) || 46.6841;

    // Calculate Haversine distance
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const nLat1 = Number(lat1) || 0;
        const nLon1 = Number(lon1) || 0;
        const nLat2 = Number(lat2) || 0;
        const nLon2 = Number(lon2) || 0;
        const R = 6371; // Earth's radius in km
        const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
        const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((nLat1 * Math.PI) / 180) *
                Math.cos((nLat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        const speedKmH = 35; // Average city driving speed
        const mins = Math.round((d / speedKmH) * 60) + 4;
        return { km: Number(d.toFixed(1)), minutes: Math.max(5, mins) };
    };

    // Default patient location (approx ~7 km in north Riyadh)
    const initialPatientLocation = {
        lat: Number((cLat + 0.054).toFixed(4)),
        lng: Number((cLng - 0.032).toFixed(4)),
        label: 'موقعك التقديري (شمال الرياض)',
        isLiveGps: false,
    };

    // Geolocation and Route calculation state
    const [userLocation, setUserLocation] = useState(initialPatientLocation);
    const [distanceInfo, setDistanceInfo] = useState(() =>
        calculateDistance(initialPatientLocation.lat, initialPatientLocation.lng, cLat, cLng)
    );
    const [locating, setLocating] = useState(false);
    const [locError, setLocError] = useState<string | null>(null);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setLocError('المتصفح لا يدعم تحديد الموقع الجغرافي.');
            toast.error('المتصفح لا يدعم خدمة تحديد الموقع.');
            return;
        }
        setLocating(true);
        setLocError(null);
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
                const dist = calculateDistance(uLat, uLng, cLat, cLng);
                setDistanceInfo(dist);
                setLocating(false);
                toast.success(`تم تحديد موقعك بدقة! المسافة إلى المستشفى: ${dist.km} كم (${dist.minutes} دقيقة).`);
            },
            (err) => {
                setLocating(false);
                setLocError('تعذر تحديد موقعك الفعلي بدقة. يرجى تفعيل إذن الموقع (GPS) في المتصفح.');
                toast.error('تعذر تحديد الموقع الفعلي، يرجى السماح بصلاحية الـ GPS.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${cLat},${cLng}`;
    const mapEmbedUrl = `https://maps.google.com/maps?saddr=${userLocation.lat},${userLocation.lng}&daddr=${cLat},${cLng}&output=embed&hl=ar`;

    return (
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title="طبيبي - حسابي ومواعيدي وسجلي الطبي" />

            <TebibyHeader />

            <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Patient Profile Header Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <img
                                src={
                                    patient.avatar ||
                                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces'
                                }
                                alt={patient.name}
                                className="w-20 h-20 rounded-3xl object-cover ring-4 ring-[#005ab5]/20"
                            />
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-2xl font-black text-gray-900 font-['Cairo']">{patient.name}</h1>
                                    <span className="bg-blue-100 text-[#005ab5] text-xs font-bold px-2.5 py-0.5 rounded-full">
                                        مريض معتمد
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500 font-medium">
                                    <span className="flex items-center gap-1">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                        رقم الهوية: {patient.national_id}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        <span dir="ltr">{patient.phone}</span>
                                    </span>
                                    <span className="flex items-center gap-1 text-[#006b5c] font-bold">
                                        <ShieldCheck className="w-3.5 h-3.5 text-[#006b5c]" />
                                        {patient.insurance}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Live Clock & Action */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                            <div className="px-4 py-2.5 bg-blue-50/80 border border-blue-100 rounded-2xl flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#005ab5]" />
                                <div>
                                    <span className="text-[10px] text-gray-500 block font-bold">الوقت الحالي:</span>
                                    <span className="text-xs font-mono font-black text-[#005ab5]">{currentTime || '...'}</span>
                                </div>
                            </div>

                            <Link
                                href="/"
                                className="px-6 py-3 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold shadow-md shadow-blue-500/20 text-center transition-all cursor-pointer"
                            >
                                + حجز موعد جديد
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Live Active Appointment & Interactive Clinic Map Section */}
                {activeAppt && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                        {/* Live Ticket & Queue Status Card */}
                        <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#003875] via-[#005ab5] to-[#0070e0] text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-xs">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        تتبع مباشر للدور والطابور
                                    </span>
                                    <span className="font-mono text-xs text-blue-200">#{activeAppt.booking_reference}</span>
                                </div>

                                <div className="text-center py-4 bg-white/10 rounded-2xl backdrop-blur-xs mb-5 border border-white/15">
                                    <span className="text-xs text-blue-100 block font-bold mb-1">رقم تذكرتك في العيادة</span>
                                    <div className="text-4xl sm:text-5xl font-black font-['Cairo'] tracking-wider text-amber-300 drop-shadow-sm">
                                        #{activeAppt.queueTicket?.ticket_number || '01'}
                                    </div>
                                    <div className="mt-2 text-xs font-bold">
                                        {activeAppt.status === 'in_consultation' ? (
                                            <span className="text-emerald-300 animate-pulse">
                                                🎉 دورك الآن بالعيادة! تفضل بالدخول إلى غرفة الطبيب
                                            </span>
                                        ) : activeAppt.status === 'waiting' ? (
                                            <span className="text-amber-200">
                                                أنت في صالة الانتظار • باقي{' '}
                                                <strong className="underline text-white font-mono">
                                                    {activeAppt.people_ahead ?? 0}
                                                </strong>{' '}
                                                مرضى قبل دورك
                                            </span>
                                        ) : (
                                            <span className="text-blue-100">
                                                موعدك مؤكد اليوم • تفضل بالتوجه للاستقبال لتسجيل الوصول
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 text-xs text-blue-100">
                                    <div className="flex items-center justify-between py-1 border-b border-white/10">
                                        <span className="text-blue-200">الطبيب المعالج:</span>
                                        <span className="font-bold text-white">
                                            {activeAppt.doctor.user.name} ({activeAppt.doctor.specialty.name_ar})
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-white/10">
                                        <span className="text-blue-200">وقت الكشف المحدد:</span>
                                        <span className="font-bold text-white">
                                            {format12HourTime(activeAppt.appointment_time)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-blue-200">المنشأة الطبية:</span>
                                        <span className="font-bold text-white">{clinicLoc.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-5 mt-4 border-t border-white/15">
                                <Link
                                    href={`/queue/${activeAppt.booking_reference}`}
                                    className="w-full py-3.5 rounded-2xl bg-white text-[#005ab5] hover:bg-blue-50 font-black text-xs shadow-lg flex items-center justify-center gap-2 group transition-all"
                                >
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                    <span>فتح شاشة الطابور الحي المباشر</span>
                                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* Google Maps & Dual-Location Navigation Card */}
                        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h3 className="font-black text-gray-900 text-base font-['Cairo'] flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-red-500" />
                                            <span>مسار الوصول والملاحة بينك وبين المستشفى</span>
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {clinicLoc.name} • {clinicLoc.address}
                                        </p>
                                    </div>

                                    {/* Location calculation button */}
                                    <button
                                        type="button"
                                        onClick={handleGetLocation}
                                        disabled={locating}
                                        className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#005ab5] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                                        title="تحديث موقعك الفعلي باستخدام GPS"
                                    >
                                        <Compass className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
                                        <span>
                                            {locating
                                                ? 'جارٍ تحديد موقعك...'
                                                : userLocation.isLiveGps
                                                ? 'موقعك محدد بدقة (GPS)'
                                                : 'تحديد موقعي الفعلي (GPS)'}
                                        </span>
                                    </button>
                                </div>

                                {/* Dual Locations & Live Route Dashboard (نقطة الانطلاق + الوجهة + المسافة + المدة) */}
                                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-100/90">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 mb-3 border-b border-blue-200/60">
                                        {/* Location 1: User / Patient */}
                                        <div className="flex items-start gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-xs">
                                                أ
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-md">
                                                        نقطة الانطلاق (موقعك)
                                                    </span>
                                                    {userLocation.isLiveGps && (
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="موقعك المباشر" />
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-gray-900 truncate mt-1">
                                                    {userLocation.label}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Location 2: Hospital / Clinic */}
                                        <div className="flex items-start gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-xs">
                                                ب
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[10px] font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded-md">
                                                    الوجهة (المستشفى)
                                                </span>
                                                <p className="text-xs font-bold text-gray-900 truncate mt-1">
                                                    {clinicLoc.name} ({clinicLoc.district})
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Distance & Duration Live Badges */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <Car className="w-4 h-4 text-[#005ab5]" />
                                                <span className="text-gray-600 font-medium">المسافة بينكما:</span>
                                                <span className="font-black text-gray-900 font-mono text-sm bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                                                    {distanceInfo.km} كم
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-emerald-600" />
                                                <span className="text-gray-600 font-medium">الوقت المقدر:</span>
                                                <span className="font-black text-emerald-800 font-mono text-sm bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                                                    ~{distanceInfo.minutes} دقيقة بالسيارة
                                                </span>
                                            </div>
                                        </div>

                                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-xl">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span>حركة السير سالكة</span>
                                        </div>
                                    </div>
                                </div>

                                {locError && (
                                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                                        <span>{locError}</span>
                                    </div>
                                )}

                                {/* Google Maps Embed with Directions Route (saddr & daddr) */}
                                <div className="w-full h-56 rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative bg-gray-100">
                                    <iframe
                                        title="مسار الوصول بين موقعك والمستشفى على الخريطة"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={mapEmbedUrl}
                                    ></iframe>
                                </div>
                            </div>

                            {/* Direct Navigation Action */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 mt-4 border-t border-gray-100">
                                <a
                                    href={googleMapsNavUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 w-full py-3 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                                >
                                    <Navigation className="w-4 h-4" />
                                    <span>فتح مسار الملاحة خطوة بخطوة على Google Maps</span>
                                </a>

                                <a
                                    href={`tel:${clinicLoc.phone}`}
                                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    <span>اتصال بالاستقبال</span>
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section Navigation Tabs */}
                <div className="flex items-center gap-2 p-1.5 bg-gray-200/60 rounded-2xl w-fit mb-8 text-xs font-bold">
                    <button
                        type="button"
                        onClick={() => setActiveTab('appointments')}
                        className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                            activeTab === 'appointments'
                                ? 'bg-white text-gray-900 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        المواعيد السابقة ({pastAppointments.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('prescriptions')}
                        className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                            activeTab === 'prescriptions'
                                ? 'bg-white text-gray-900 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        الروشتات والوصفات الطبية ({prescriptions.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('records')}
                        className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                            activeTab === 'records'
                                ? 'bg-white text-gray-900 shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        التحاليل المخبرية والأشعة ({medicalRecords.length})
                    </button>
                </div>

                {/* Tab 1: Past Appointments */}
                {activeTab === 'appointments' && (
                    <div className="space-y-4">
                        {pastAppointments.length > 0 ? (
                            pastAppointments.map((appt) => (
                                <div
                                    key={appt.id}
                                    className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-blue-200 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={
                                                appt.doctor.user.avatar ||
                                                'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120&h=120&fit=crop&crop=faces'
                                            }
                                            alt={appt.doctor.user.name}
                                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-gray-100"
                                        />
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm font-['Cairo']">
                                                {appt.doctor.user.name}
                                            </h4>
                                            <p className="text-xs text-[#005ab5] font-semibold">
                                                {appt.doctor.specialty.name_ar} • {appt.doctor.title_ar}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                {appt.doctor.clinic?.name || 'المنشأة الطبية'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-xs text-gray-500">
                                        <div>
                                            <span className="block text-[10px] text-gray-400">تاريخ الكشف:</span>
                                            <span className="font-bold text-gray-800">
                                                {formatArabicDate(appt.appointment_date)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-gray-400">حالة الكشف:</span>
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    appt.status === 'completed'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {appt.status === 'completed' ? 'كشف مكتمل' : 'ملغي'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 bg-white rounded-3xl border border-gray-200/80 text-center text-gray-400 text-xs">
                                لا توجد مواعيد سابقة مسجلة.
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Prescriptions */}
                {activeTab === 'prescriptions' && (
                    <div className="space-y-4">
                        {prescriptions.length > 0 ? (
                            prescriptions.map((rx) => (
                                <div
                                    key={rx.id}
                                    className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                                            <Pill className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 text-sm font-['Cairo']">
                                                    {rx.diagnosis || 'وصفة طبية علاجية'}
                                                </h4>
                                                <span className="text-[10px] font-mono font-bold bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">
                                                    {rx.prescription_code}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                وصفها: {rx.doctor.user.name} ({rx.doctor.specialty.name_ar})
                                            </p>
                                            {rx.doctor_notes && (
                                                <p className="text-xs text-gray-400 mt-0.5 italic">
                                                    ملاحظات: {rx.doctor_notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => window.print()}
                                            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            <span>طباعة الوصفة</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 bg-white rounded-3xl border border-gray-200/80 text-center text-gray-400 text-xs">
                                لا توجد وصفات طبية مسجلة بعد.
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: Medical Records */}
                {activeTab === 'records' && (
                    <div className="space-y-4">
                        {medicalRecords.length > 0 ? (
                            medicalRecords.map((rec) => (
                                <div
                                    key={rec.id}
                                    className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                            <Microscope className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm font-['Cairo']">
                                                {rec.title}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {rec.record_type} • د. {rec.doctor?.user?.name || 'الاستشاري المشرف'}
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                تاريخ الفحص: {formatArabicDate(rec.record_date)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-emerald-700 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                        تمت المعاينة والاعتماد
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 bg-white rounded-3xl border border-gray-200/80 text-center text-gray-400 text-xs">
                                لا توجد سجلات مخبرية أو تقارير أشعة بعد.
                            </div>
                        )}
                    </div>
                )}
            </main>

            <TebibyFooter />
        </div>
    );
}
