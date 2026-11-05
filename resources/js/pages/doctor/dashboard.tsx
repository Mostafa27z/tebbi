import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import { 
    Users, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Phone, 
    FileText, 
    Stethoscope, 
    ArrowRight, 
    Volume2, 
    Pill, 
    Save, 
    ChevronDown, 
    Building2,
    Calendar
} from 'lucide-react';

interface DoctorDashboardProps {
    doctor: {
        id: number;
        title_ar: string;
        user: {
            name: string;
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
        completedCount: number;
        waitingCount: number;
        currentTicketNum: number;
    };
}

export default function DoctorDashboard({
    doctor,
    todayAppointments,
    currentSession,
    stats
}: DoctorDashboardProps) {
    const [callingNext, setCallingNext] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [rxModalOpen, setRxModalOpen] = useState(false);

    const handleCallNext = () => {
        setCallingNext(true);
        router.post('/doctor/queue/call-next', {}, {
            onFinish: () => setCallingNext(false),
        });
    };

    const handleFinishConsultation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSession) return;
        setCompleting(true);

        router.post(`/doctor/appointments/${currentSession.id}/consultation`, {
            diagnosis: diagnosis || 'فحص سنّي سريري وعلاج تحفظي',
            notes: notes || 'تم إجراء المعالجة المطلوبة بنجاح وتقديم تعليمات العناية بالفم.',
            medications: [
                {
                    name: 'Amoxicillin 500mg',
                    dose: 'كبسولة كل 8 ساعات',
                    frequency: 'بعد الوجبات',
                    duration: 'لمدة 5 أيام',
                    instructions: 'مضاد حيوي لمنع أي التهاب بكتيري'
                },
                {
                    name: 'Ibuprofen 400mg',
                    dose: 'قرص عند اللزوم',
                    frequency: 'بعد الأكل لتسكين الألم',
                    duration: 'عند الحاجة',
                    instructions: 'مسكن ومضاد للالتهاب'
                }
            ]
        }, {
            onFinish: () => {
                setCompleting(false);
                setRxModalOpen(false);
                setDiagnosis('');
                setNotes('');
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title={`طبيبي - لوحة تحكم الطبيب (${doctor.user.name})`} />

            <TebibyHeader />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Doctor Welcome & Status Banner */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <img
                                src={doctor.user.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=faces'}
                                alt={doctor.user.name}
                                className="w-20 h-20 rounded-3xl object-cover ring-4 ring-[#005ab5]/20"
                            />
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 font-['Cairo'] mb-1">
                                    مرحباً {doctor.user.name} 👋
                                </h1>
                                <p className="text-xs text-[#005ab5] font-bold mb-1">{doctor.title_ar} - {doctor.specialty.name_ar}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5" />
                                    {doctor.clinic.name} - عيادة رقم (١٢)
                                </p>
                            </div>
                        </div>

                        {/* Clinic status indicator */}
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                العيادة نشطة وتستقبل المرضى
                            </span>
                        </div>
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
                        <span className="text-xs text-gray-500 font-bold block mb-1">إجمالي جدول اليوم</span>
                        <div className="text-3xl font-black text-gray-900 font-['Cairo']">{stats.totalPatients}</div>
                        <span className="text-[11px] text-gray-400">مواعيد مسجلة</span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
                        <span className="text-xs text-gray-500 font-bold block mb-1">الكشوفات المكتملة</span>
                        <div className="text-3xl font-black text-emerald-600 font-['Cairo']">{stats.completedCount}</div>
                        <span className="text-[11px] text-emerald-700 font-semibold">حالات غادرت العيادة</span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
                        <span className="text-xs text-gray-500 font-bold block mb-1">في صالة الانتظار</span>
                        <div className="text-3xl font-black text-[#005ab5] font-['Cairo']">{stats.waitingCount}</div>
                        <span className="text-[11px] text-blue-700 font-semibold">حالات جاهزة للدخول</span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
                        <span className="text-xs text-gray-500 font-bold block mb-1">الدور الفعلي الحالي</span>
                        <div className="text-3xl font-black text-amber-600 font-['Cairo']">#{stats.currentTicketNum}</div>
                        <span className="text-[11px] text-amber-700 font-semibold">تذكرة المريض الحالي</span>
                    </div>
                </div>

                {/* Current Active Examination Hero */}
                {currentSession ? (
                    <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-blue-200 shadow-md mb-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#005ab5] text-xs font-bold mb-2">
                                    <span className="w-2 h-2 rounded-full bg-[#005ab5] animate-pulse"></span>
                                    الحالة الحالية داخل غرفة الفحص السريري
                                </span>
                                <h3 className="text-2xl font-black text-gray-900 font-['Cairo'] mb-1">
                                    {currentSession.patient.name}
                                </h3>
                                <p className="text-xs text-gray-500 flex items-center gap-3">
                                    <span>رقم التذكرة: <strong>#{currentSession.queueTicket?.ticket_number || 2}</strong></span>
                                    <span>•</span>
                                    <span>الهاتف: <strong dir="ltr">{currentSession.patient.phone}</strong></span>
                                    <span>•</span>
                                    <span>طريقة الدفع: <strong>{currentSession.payment_method === 'insurance' ? 'تأمين بوبا (مغطى)' : 'نقدي'}</strong></span>
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => setRxModalOpen(true)}
                                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
                                >
                                    <Pill className="w-4 h-4" />
                                    <span>إنهاء الكشف وإصدار الوصفة</span>
                                </button>

                                <button
                                    onClick={handleCallNext}
                                    disabled={callingNext}
                                    className="px-5 py-3 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <Volume2 className="w-4 h-4" />
                                    <span>{callingNext ? 'جارٍ الاستدعاء...' : 'استدعاء المريض التالي'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Patient Complaint / Medical Notes */}
                        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                                <span className="block text-xs font-bold text-blue-900 mb-1">شكوى المريض وملاحظات الحجز:</span>
                                <p className="text-xs text-gray-700 leading-relaxed">
                                    {currentSession.patient_notes || 'كشف دوري سنّي وفحص سلامة التركيبات واللثة.'}
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                                <span className="block text-xs font-bold text-gray-800 mb-1">سجل التغطية التأمينية:</span>
                                <p className="text-xs text-gray-600">
                                    {currentSession.insurance_provider || 'تأمين شركة بوبا العربية'} - الفئة الماسية (موافقة الكشفية معتمدة آلياً).
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 rounded-3xl bg-white border border-gray-200 text-center mb-8">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                        <h3 className="font-bold text-lg text-gray-900 font-['Cairo']">لا توجد حالات كشف جارية حالياً</h3>
                        <p className="text-xs text-gray-500 mt-1">اضغط على زر استدعاء المريض التالي لبدء الجلسة التالية.</p>
                        <button
                            onClick={handleCallNext}
                            className="mt-4 px-6 py-2.5 rounded-xl bg-[#005ab5] text-white font-bold text-xs"
                        >
                            استدعاء أول مريض في الانتظار
                        </button>
                    </div>
                )}

                {/* Queue Schedule List */}
                <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 text-base font-['Cairo'] flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[#005ab5]" />
                            جدول حجوزات العيادة اليومية
                        </h3>
                        <span className="text-xs text-gray-500">اليوم - الجمعة 6 نوفمبر 2026</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                                    <th className="pb-3 pr-2">رقم التذكرة</th>
                                    <th className="pb-3">اسم المريض</th>
                                    <th className="pb-3">وقت الحجز</th>
                                    <th className="pb-3">طريقة السداد</th>
                                    <th className="pb-3">حالة الانتظار</th>
                                    <th className="pb-3 pl-2">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {todayAppointments.map((appt) => (
                                    <tr key={appt.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="py-4 pr-2 font-black text-sm font-['Cairo'] text-[#005ab5]">
                                            #{appt.queueTicket?.ticket_number || appt.id}
                                        </td>
                                        <td className="py-4">
                                            <span className="font-bold text-gray-900 block">{appt.patient.name}</span>
                                            <span className="text-[11px] text-gray-400" dir="ltr">{appt.patient.phone}</span>
                                        </td>
                                        <td className="py-4 text-gray-600 font-semibold">
                                            {appt.appointment_time}
                                        </td>
                                        <td className="py-4">
                                            <span className="text-gray-600">
                                                {appt.payment_method === 'insurance' ? 'تأمين بوبا' : 'عند الحضور'}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                appt.status === 'in_consultation'
                                                    ? 'bg-blue-100 text-[#005ab5]'
                                                    : appt.status === 'completed'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {appt.status === 'in_consultation'
                                                    ? 'في الكشف الآن'
                                                    : appt.status === 'completed'
                                                    ? 'كشف مكتمل'
                                                    : 'في الانتظار'}
                                            </span>
                                        </td>
                                        <td className="py-4 pl-2">
                                            <a
                                                href={`/queue/${appt.booking_reference}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[#005ab5] hover:underline font-bold"
                                            >
                                                عرض التتبع الحي
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Finish & Prescription Modal */}
            {rxModalOpen && currentSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-6 space-y-4">
                        <h3 className="text-lg font-bold font-['Cairo'] text-gray-900">
                            تسجيل التشخيص وإصدار الوصفة الطبية لـ ({currentSession.patient.name})
                        </h3>

                        <form onSubmit={handleFinishConsultation} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">التشخيص الطبي السريري</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="مثال: التهاب سنّي حاد مع تسوس سطحي"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">تعليمات وتوصيات للمريض</label>
                                <textarea
                                    rows={3}
                                    placeholder="تعليمات ما بعد الكشف..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                                />
                            </div>

                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800">
                                <strong>الأدوية المقترحة:</strong> Amoxicillin 500mg + Ibuprofen 400mg (سيتم إدراجها بالروشتة الإلكترونية آلياً).
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setRxModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={completing}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1.5"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{completing ? 'جارٍ الحفظ...' : 'تأكيد وحفظ الكشف'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <TebibyFooter />
        </div>
    );
}

