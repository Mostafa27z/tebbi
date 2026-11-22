import React, { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { AdminDashboardLayout } from '@/layouts/admin-dashboard-layout';
import { MetricCard } from '@/components/common/metric-card';
import { Calendar, Clock, CheckCircle2, Stethoscope } from 'lucide-react';
import { Appointment } from '@/components/admin/types';
import { AppointmentsTab } from '@/components/admin/tabs/appointments-tab';
import { notify } from '@/components/common/toast';

interface AppointmentsPageProps {
    appointments: Appointment[];
    metrics: {
        total: number;
        waiting: number;
        completed: number;
        inConsultation: number;
    };
}

export default function AppointmentsPage({
    appointments,
    metrics,
}: AppointmentsPageProps) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const prevIdsRef = useRef<Set<number>>(new Set(appointments.map((a) => a.id)));
    const hasMountedRef = useRef(false);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            prevIdsRef.current = new Set(appointments.map((a) => a.id));
            return;
        }

        const newItems = appointments.filter((a) => !prevIdsRef.current.has(a.id));
        if (newItems.length === 1) {
            const appt = newItems[0];
            notify.info(
                `حجز جديد: ${appt.patient.name} لدى ${appt.doctor.user.name} (${appt.booking_reference})`,
                'حجز جديد بالمنصة'
            );
        } else if (newItems.length > 1) {
            notify.info(
                `تم تسجيل ${newItems.length} حجوزات جديدة على المنصة`,
                'تحديث مباشر للحجوزات'
            );
        }

        prevIdsRef.current = new Set(appointments.map((a) => a.id));
    }, [appointments]);

    return (
        <AdminDashboardLayout activeTab="appointments">
            <Head title="سجل الحجوزات والتذاكر - الإدارة العليا" />

            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <MetricCard
                        title="إجمالي الحجوزات المسجلة"
                        value={metrics.total}
                        subtitle="عبر كافة العيادات والمراكز"
                        icon={<Calendar className="w-5 h-5 text-rose-600" />}
                        iconBg="bg-rose-50"
                    />
                    <MetricCard
                        title="في قائمة الانتظار"
                        value={metrics.waiting}
                        subtitle="مرضى بانتظار الدخول للطبيب"
                        icon={<Clock className="w-5 h-5 text-amber-600" />}
                        iconBg="bg-amber-50"
                    />
                    <MetricCard
                        title="كشوفات مكتملة ومنفذة"
                        value={metrics.completed}
                        subtitle="فحوصات طبية تمت بنجاح"
                        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="حالات قيد الكشف الآن"
                        value={metrics.inConsultation}
                        subtitle="مرضى داخل غرف الفحص"
                        icon={<Stethoscope className="w-5 h-5 text-blue-600" />}
                        iconBg="bg-blue-50"
                    />
                </div>

                {/* Appointments Table */}
                <AppointmentsTab
                    appointments={appointments}
                    search={search}
                    onSearchChange={setSearch}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                />
            </div>
        </AdminDashboardLayout>
    );
}

