import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { DoctorDashboardLayout } from '@/layouts/doctor-dashboard-layout';
import { AvailabilityDialog } from '@/components/doctor/availability-dialog';
import { 
    Clock, 
    Building2, 
    ToggleLeft, 
    ToggleRight, 
    Calendar, 
    CheckCircle2, 
    AlertCircle, 
    ShieldCheck, 
    MapPin, 
    DollarSign, 
    UserCheck,
    Stethoscope
} from 'lucide-react';

interface DoctorScheduleProps {
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
        doctor_facilities?: any[];
    };
    stats: {
        totalPatients: number;
        waitingCount: number;
        inConsultationCount: number;
        completedCount: number;
        notArrivedCount: number;
        insuranceCount: number;
        currentTicketNum: number | null;
    };
}

export default function DoctorSchedule({
    doctor,
    stats,
}: DoctorScheduleProps) {
    const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);

    const weeklySchedule = [
        { day: 'الأحد', hours: '04:00 م - 10:00 م', period: 'الفترة المسائية', status: 'متاح للاستقبال' },
        { day: 'الإثنين', hours: '04:00 م - 10:00 م', period: 'الفترة المسائية', status: 'متاح للاستقبال' },
        { day: 'الثلاثاء', hours: '04:00 م - 10:00 م', period: 'الفترة المسائية', status: 'متاح للاستقبال' },
        { day: 'الأربعاء', hours: '04:00 م - 10:00 م', period: 'الفترة المسائية', status: 'متاح للاستقبال' },
        { day: 'الخميس', hours: '02:00 م - 08:00 م', period: 'الفترة المسائية', status: 'متاح للاستقبال' },
        { day: 'الجمعة', hours: 'إجازة أسبوعية', period: 'مغلق', status: 'عطلة' },
        { day: 'السبت', hours: 'إجازة أسبوعية', period: 'مغلق', status: 'عطلة' },
    ];

    return (
        <DoctorDashboardLayout
            doctor={doctor}
            counts={{
                waiting: stats?.waitingCount,
                inConsultation: stats?.inConsultationCount,
                completed: stats?.completedCount,
            }}
            onToggleAvailability={() => setAvailabilityModalOpen(true)}
        >
            <Head title={`جدول وتواجد الطبيب - د. ${doctor.user.name}`} />

            <div className="space-y-6 font-['Tajawal']" dir="rtl">
                {/* Header Information Card */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                                <Clock className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-gray-900 font-['Cairo']">
                                    جدول التواجد ومواعيد استقبال العيادة
                                </h1>
                                <p className="text-xs text-gray-500 mt-1">
                                    إدارة الجاهزية التشغيلية للعيادة، متابعة ساعات العمل، ومراجعة الفروع الطبية المعتمدة
                                </p>
                            </div>
                        </div>

                        {/* Availability Trigger with Dialog */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setAvailabilityModalOpen(true)}
                                className={`flex items-center gap-3 px-5 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                                    doctor.is_available_today
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-emerald-500/10'
                                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 shadow-amber-500/10'
                                }`}
                            >
                                {doctor.is_available_today ? (
                                    <>
                                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                                        <div className="text-right">
                                            <span className="block font-black">العيادة متاحة وتستقبل الحالات</span>
                                            <span className="text-[10px] text-emerald-600 font-normal">انقر لتغيير الحالة أو التعليق</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <ToggleLeft className="w-6 h-6 text-amber-600" />
                                        <div className="text-right">
                                            <span className="block font-black">العيادة معلّقة مؤقتاً لليوم</span>
                                            <span className="text-[10px] text-amber-600 font-normal">انقر لتفعيل استقبال المرضى</span>
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Weekly Schedule Table (Left 2 cols) */}
                    <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                        <div className="mb-4">
                            <h3 className="font-bold text-sm text-gray-900 font-['Cairo'] flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#005ab5]" />
                                <span>جدول أوقات العمل الأسبوعي</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                ساعات الحضور المعتمدة في النظام للعيادات الخارجية
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                                    <tr>
                                        <th className="py-3 px-4">اليوم</th>
                                        <th className="py-3 px-4">ساعات العمل</th>
                                        <th className="py-3 px-4">الفترة</th>
                                        <th className="py-3 px-4 text-center">حالة الدوام</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {weeklySchedule.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="py-3 px-4 font-bold text-gray-900">
                                                {row.day}
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-gray-700">
                                                {row.hours}
                                            </td>
                                            <td className="py-3 px-4 text-gray-500">
                                                {row.period}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {row.status === 'عطلة' ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500">
                                                        إجازة
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                                                        {row.status}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Clinic & Profile Summary (Right 1 col) */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                            <h3 className="font-bold text-sm text-gray-900 font-['Cairo'] flex items-center gap-2 mb-4">
                                <Building2 className="w-4 h-4 text-emerald-600" />
                                <span>بيانات المنشأة والتخصص</span>
                            </h3>

                            <div className="space-y-3.5 text-xs">
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-400">المنشأة الطبية الرئيسية:</span>
                                    <span className="font-bold text-gray-900">
                                        {doctor.clinic?.name || 'مستشفى د. سليمان الحبيب'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-400">التخصص الطبي:</span>
                                    <span className="font-bold text-[#005ab5]">
                                        {doctor.specialty?.name_ar || 'استشاري'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-400">سعر كشف الاستشاري:</span>
                                    <span className="font-bold text-gray-900 font-mono">
                                        {doctor.consultation_fee || 250} ر.س
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-gray-400">متوسط وقت الفحص:</span>
                                    <span className="font-semibold text-gray-700">
                                        {doctor.waiting_time_minutes || 15} دقيقة لكل حالة
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Associated Facilities Card */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                            <h3 className="font-bold text-sm text-gray-900 font-['Cairo'] flex items-center gap-2 mb-3">
                                <MapPin className="w-4 h-4 text-purple-600" />
                                <span>الفروع والمجمعات التابعة</span>
                            </h3>
                            <p className="text-xs text-gray-400 mb-4">
                                الفروع الطبية المسجل بها جدول دوام الطبيب
                            </p>

                            <div className="space-y-2.5">
                                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                                    <div>
                                        <span className="font-bold text-gray-900 block">
                                            {doctor.clinic?.name || 'مستشفى د. سليمان الحبيب'}
                                        </span>
                                        <span className="text-[11px] text-gray-400">الفرع الرئيسي - الرياض</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#005ab5] font-bold text-[10px]">
                                        الفرع المباشر
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Availability Dialog */}
            <AvailabilityDialog
                isOpen={availabilityModalOpen}
                onClose={() => setAvailabilityModalOpen(false)}
                isAvailable={doctor.is_available_today}
            />
        </DoctorDashboardLayout>
    );
}

