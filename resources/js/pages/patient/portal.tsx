import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
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
    ArrowUpRight
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

    return (
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title="طبيبي - حسابي ومواعيدي وسجلي الطبي" />

            <TebibyHeader />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Patient Profile Header Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <img
                                src={patient.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces'}
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
                                        {patient.phone}
                                    </span>
                                    <span className="flex items-center gap-1 text-[#006b5c] font-bold">
                                        <ShieldCheck className="w-3.5 h-3.5 text-[#006b5c]" />
                                        {patient.insurance}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick CTA */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Link
                                href="/"
                                className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold shadow-md shadow-blue-500/20 text-center transition-all"
                            >
                                + حجز موعد جديد
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Upcoming Active Appointment (Live Queue Highlight) */}
                {upcomingAppointments.length > 0 && (
                    <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 to-[#005ab5] text-white shadow-lg mb-8 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-3 backdrop-blur-xs">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    موعد اليوم النشط - تتبع الدور المباشر
                                </span>
                                <h3 className="text-xl font-black font-['Cairo'] mb-1">
                                    {upcomingAppointments[0].doctor.user.name} - {upcomingAppointments[0].doctor.specialty.name_ar}
                                </h3>
                                <p className="text-xs text-blue-100 mb-2">
                                    {upcomingAppointments[0].doctor.clinic.name} - {upcomingAppointments[0].doctor.clinic.district}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-blue-200">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {upcomingAppointments[0].appointment_date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {upcomingAppointments[0].appointment_time}
                                    </span>
                                </div>
                            </div>

                            <Link
                                href={`/queue/${upcomingAppointments[0].booking_reference}`}
                                className="px-6 py-3.5 rounded-2xl bg-white text-[#005ab5] hover:bg-blue-50 font-black text-xs shadow-lg flex items-center gap-2 group transition-all"
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                <span>تتبع دورك الحي الآن (تذكرة رقم #{upcomingAppointments[0].queueTicket?.ticket_number || 4})</span>
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Section Navigation Tabs */}
                <div className="flex items-center gap-2 p-1.5 bg-gray-200/60 rounded-2xl w-fit mb-8 text-xs font-bold">
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`px-5 py-2.5 rounded-xl transition-all ${
                            activeTab === 'appointments' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        المواعيد السابقة ({pastAppointments.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('prescriptions')}
                        className={`px-5 py-2.5 rounded-xl transition-all ${
                            activeTab === 'prescriptions' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        الروشتات والوصفات الطبية ({prescriptions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('records')}
                        className={`px-5 py-2.5 rounded-xl transition-all ${
                            activeTab === 'records' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        التحاليل المخبرية والأشعة ({medicalRecords.length})
                    </button>
                </div>

                {/* Tab 1: Past Appointments */}
                {activeTab === 'appointments' && (
                    <div className="space-y-4">
                        {pastAppointments.map((appt) => (
                            <div
                                key={appt.id}
                                className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4">
                                    <img
                                        src={appt.doctor.user.avatar || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120&h=120&fit=crop&crop=faces'}
                                        alt={appt.doctor.user.name}
                                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-gray-100"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 text-base font-['Cairo']">{appt.doctor.user.name}</h3>
                                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                                                زيارة مكتملة
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#005ab5] font-semibold">{appt.doctor.specialty.name_ar}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{appt.doctor.clinic.name} - تاريخ الكشف: {appt.appointment_date}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {appt.prescription && (
                                        <button
                                            onClick={() => setActiveTab('prescriptions')}
                                            className="px-4 py-2 rounded-xl bg-blue-50 text-[#005ab5] hover:bg-blue-100 text-xs font-bold transition-colors"
                                        >
                                            عرض الوصفة الطبية
                                        </button>
                                    )}
                                    <Link
                                        href="/"
                                        className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                                    >
                                        حجز كشف دوري
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab 2: Digital Prescriptions */}
                {activeTab === 'prescriptions' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {prescriptions.map((rx) => (
                            <div key={rx.id} className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                            <Pill className="w-4 h-4 text-[#005ab5]" />
                                            <span>رقم الوصفة: {rx.prescription_code}</span>
                                        </div>
                                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                                            معتمدة وصالحة للصرف
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-gray-900 text-sm mb-1 font-['Cairo']">
                                        التشخيص: {rx.diagnosis}
                                    </h4>
                                    <p className="text-xs text-gray-500 mb-4">الطبيب: {rx.doctor.user.name} ({rx.doctor.specialty.name_ar})</p>

                                    {/* Medication list */}
                                    <div className="space-y-3 mb-4">
                                        {rx.medications && Array.isArray(rx.medications) && rx.medications.map((m: any, idx: number) => (
                                            <div key={idx} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                                                <div className="font-bold text-gray-900 mb-0.5">{m.name}</div>
                                                <div className="text-gray-600 text-[11px]">{m.dose} • {m.frequency}</div>
                                                <div className="text-gray-400 text-[10px] mt-1">{m.instructions}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {rx.doctor_notes && (
                                        <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200/60 mb-4">
                                            ملاحظات الاستشاري: {rx.doctor_notes}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => alert(`تم تحميل ملف الوصفة الطبية رقم ${rx.prescription_code} كـ PDF`)}
                                    className="w-full py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>تحميل الوصفة بصيغة PDF</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab 3: Medical Records & Lab/Radiology */}
                {activeTab === 'records' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {medicalRecords.map((rec) => (
                            <div key={rec.id} className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                            <Microscope className="w-4 h-4 text-[#006b5c]" />
                                            <span>{rec.record_type === 'radiology' ? 'تقرير أشعة تصويرية' : 'فحص مخبري شامل'}</span>
                                        </div>
                                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                            {rec.status}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-gray-900 text-base mb-1 font-['Cairo']">
                                        {rec.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 mb-4">جهة الإصدار: {rec.issuer} • التاريخ: {rec.record_date}</p>

                                    {/* Metrics summary */}
                                    {rec.summary_data && (
                                        <div className="space-y-2 mb-4 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs">
                                            {Object.entries(rec.summary_data).map(([key, value]) => (
                                                <div key={key} className="flex items-center justify-between">
                                                    <span className="text-gray-500">{key}:</span>
                                                    <span className="font-bold text-gray-800">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => alert(`جارٍ تحميل تقرير ${rec.title} بصيغة طبية مشفرة`)}
                                    className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#005ab5] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>تحميل التقرير والصور الشعاعية</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <TebibyFooter />
        </div>
    );
}

