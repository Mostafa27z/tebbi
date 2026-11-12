import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { DoctorDashboardLayout } from '@/layouts/doctor-dashboard-layout';
import { MetricCard } from '@/components/common/metric-card';
import { ActiveSession } from '@/components/doctor/active-session';
import { AppointmentsQueueTable } from '@/components/doctor/appointments-queue-table';
import { PrescriptionModal } from '@/components/doctor/prescription-modal';
import { AvailabilityDialog } from '@/components/doctor/availability-dialog';
import { 
    Users, 
    CheckCircle2, 
    Clock, 
    Stethoscope, 
    AlertCircle, 
    ShieldCheck
} from 'lucide-react';

interface DoctorDashboardProps {
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
    };
    todayAppointments: any[];
    currentSession: any | null;
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

export default function DoctorDashboard({
    doctor,
    todayAppointments,
    currentSession,
    stats,
}: DoctorDashboardProps) {
    const [callingNext, setCallingNext] = useState(false);
    const [rxModalOpen, setRxModalOpen] = useState(false);
    const [selectedApptForRx, setSelectedApptForRx] = useState<any | null>(null);
    const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);

    const handleCallNext = () => {
        setCallingNext(true);
        router.post('/doctor/queue/call-next', {}, {
            onFinish: () => setCallingNext(false),
        });
    };

    return (
        <DoctorDashboardLayout
            doctor={doctor}
            counts={{
                waiting: stats.waitingCount,
                inConsultation: stats.inConsultationCount,
                completed: stats.completedCount,
            }}
            onToggleAvailability={() => setAvailabilityDialogOpen(true)}
            onCallNext={handleCallNext}
            callingNext={callingNext}
        >
            <Head title={`طبيبي - لوحة تحكم الطبيب (${doctor.user.name})`} />

            <div className="space-y-6 font-['Tajawal']" dir="rtl">
                {/* Synchronized Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    <MetricCard
                        title="إجمالي جدول اليوم"
                        value={stats.totalPatients}
                        subtitle="المسجلين بالجدول"
                        icon={<Users className="w-5 h-5 text-gray-500" />}
                        iconBg="bg-gray-100"
                    />
                    <MetricCard
                        title="في صالة الانتظار"
                        value={stats.waitingCount}
                        subtitle="حضروا الاستقبال بالخارج"
                        icon={<Clock className="w-5 h-5 text-amber-600" />}
                        iconBg="bg-amber-50"
                    />
                    <MetricCard
                        title="قيد الكشف بالعيادة"
                        value={stats.inConsultationCount}
                        subtitle="داخل غرفة الفحص الآن"
                        icon={<Stethoscope className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="لم يحضروا بعد"
                        value={stats.notArrivedCount}
                        subtitle="بانتظار وصولهم"
                        icon={<AlertCircle className="w-5 h-5 text-blue-600" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="كشوفات مكتملة"
                        value={stats.completedCount}
                        subtitle="تم إنهاء كشفهم بنجاح"
                        icon={<CheckCircle2 className="w-5 h-5 text-teal-600" />}
                        iconBg="bg-teal-50"
                    />
                    <MetricCard
                        title="تأمين معتمد"
                        value={stats.insuranceCount}
                        subtitle="تغطية بنسبة 100%"
                        icon={<ShieldCheck className="w-5 h-5 text-purple-600" />}
                        iconBg="bg-purple-50"
                    />
                </div>

                {/* Active Examining Session */}
                {currentSession ? (
                    <div>
                        <ActiveSession
                            session={currentSession}
                            onCallNext={handleCallNext}
                            callingNext={callingNext}
                            onOpenPrescriptionModal={() => {
                                setSelectedApptForRx(currentSession);
                                setRxModalOpen(true);
                            }}
                        />
                    </div>
                ) : (
                    <div className="p-8 rounded-3xl bg-white border border-gray-200/80 text-center shadow-xs">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                        <h3 className="font-bold text-lg text-gray-900 font-['Cairo']">
                            لا توجد حالة كشف نشطة داخل العيادة حالياً
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                            {stats.waitingCount > 0
                                ? `يوجد ${stats.waitingCount} مرضى في صالة الانتظار بانتظار استدعائك.`
                                : 'لا يوجد مرضى في صالة الانتظار حالياً.'}
                        </p>
                        {stats.waitingCount > 0 && (
                            <button
                                type="button"
                                onClick={handleCallNext}
                                disabled={callingNext}
                                className="mt-4 px-6 py-2.5 rounded-xl bg-[#005ab5] hover:bg-[#00458e] text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-500/20"
                            >
                                {callingNext ? 'جارٍ الاستدعاء...' : 'استدعاء المريض الأول بالانتظار'}
                            </button>
                        )}
                    </div>
                )}

                {/* Appointments Queue Table with Search & Status Select */}
                <AppointmentsQueueTable
                    appointments={todayAppointments}
                    onOpenPrescriptionModal={(appt) => {
                        setSelectedApptForRx(appt);
                        setRxModalOpen(true);
                    }}
                />
            </div>

            {/* Prescription Modal */}
            <PrescriptionModal
                isOpen={rxModalOpen}
                onClose={() => {
                    setRxModalOpen(false);
                    setSelectedApptForRx(null);
                }}
                currentSession={selectedApptForRx || currentSession}
            />

            {/* Availability Dialog */}
            <AvailabilityDialog
                isOpen={availabilityDialogOpen}
                onClose={() => setAvailabilityDialogOpen(false)}
                isAvailable={doctor.is_available_today}
            />
        </DoctorDashboardLayout>
    );
}
