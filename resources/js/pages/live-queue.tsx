import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
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
    Volume2
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
    };
}

export default function LiveQueue({ appointment, queueData: initialQueueData, clinicLocation }: LiveQueueProps) {
    const [queueData, setQueueData] = useState(initialQueueData);
    const [lastUpdated, setLastUpdated] = useState<string>('الآن');
    const [isPolling, setIsPolling] = useState(false);

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

    const isYourTurn = queueData.patientsAhead === 0;

    return (
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title={`تتبع الدور الحي - تذكرة رقم ${queueData.ticketNumber}`} />
            
            <TebibyHeader />

            <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Live Pulse Bar */}
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
                        onClick={fetchLatestStatus}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin text-[#005ab5]' : ''}`} />
                        <span>تحديث فوري</span>
                    </button>
                </div>

                {/* Hero Ticket Status Card */}
                <div className={`p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden mb-8 transition-colors ${
                    isYourTurn 
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-800'
                        : 'bg-gradient-to-br from-[#005ab5] to-[#003d7a]'
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
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl text-center min-w-[140px] shrink-0 self-center md:self-auto">
                            <span className="text-xs uppercase tracking-wider text-blue-200 block font-bold">تذكرتك الحالية</span>
                            <span className="text-5xl font-black font-['Cairo'] block my-1">#{queueData.ticketNumber}</span>
                            <span className="text-[11px] font-semibold bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full">
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
                <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs mb-8">
                    <h3 className="font-bold text-gray-900 text-base mb-6 font-['Cairo'] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#005ab5] text-[20px]">timeline</span>
                        المسار التدفقي الحي لأدوار الانتظار
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                        {[
                            { title: 'تأكيد الحجز', status: 'done', desc: 'تم تثبيت الموعد إلكترونياً' },
                            { title: 'تسجيل الحضور', status: 'done', desc: 'تم إثبات وصولك للعيادة' },
                            { title: 'انتظار المناداة', status: 'active', desc: 'دورك الحالي في الصالة' },
                            { title: 'الكشف السريري', status: 'upcoming', desc: 'فحص استشاري الأسنان' },
                            { title: 'الوصفة والتقرير', status: 'upcoming', desc: 'إصدار الروشتة الرقمية' },
                        ].map((step, idx) => (
                            <div
                                key={step.title}
                                className={`p-4 rounded-2xl border text-center transition-all ${
                                    step.status === 'done'
                                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                                        : step.status === 'active'
                                        ? 'bg-blue-50 border-[#005ab5] ring-2 ring-[#005ab5]/20 text-[#005ab5]'
                                        : 'bg-gray-50 border-gray-200 text-gray-400'
                                }`}
                            >
                                <div className="text-xs font-black mb-1 font-['Cairo']">المرحلة {idx + 1}</div>
                                <div className="text-sm font-bold mb-1 text-gray-900">{step.title}</div>
                                <div className="text-[11px] text-gray-500">{step.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Doctor & Clinic Location Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Doctor Info */}
                    <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 font-['Cairo']">طبيبك المعالج</h4>
                        <div className="flex items-center gap-4">
                            <img
                                src={appointment.doctor.user.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=faces'}
                                alt={appointment.doctor.user.name}
                                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-100"
                            />
                            <div>
                                <h3 className="font-bold text-gray-900 text-base font-['Cairo']">{appointment.doctor.user.name}</h3>
                                <p className="text-xs text-[#005ab5] font-semibold">{appointment.doctor.title_ar}</p>
                                <p className="text-xs text-gray-500 mt-1">{appointment.doctor.specialty.name_ar}</p>
                            </div>
                        </div>
                    </div>

                    {/* Clinic Address & Map */}
                    <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-['Cairo']">مقر العيادة والتواصل</h4>
                            <h3 className="font-bold text-gray-900 text-sm font-['Cairo']">{clinicLocation.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{clinicLocation.branch} - {clinicLocation.address}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <a
                                href={clinicLocation.mapUrl || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-2 px-3 rounded-xl bg-blue-50 text-[#005ab5] hover:bg-blue-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>اتجاهات الموقع</span>
                            </a>
                            <a
                                href={`tel:${clinicLocation.phone}`}
                                className="py-2 px-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Phone className="w-3.5 h-3.5" />
                                <span>اتصال</span>
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <TebibyFooter />
        </div>
    );
}

