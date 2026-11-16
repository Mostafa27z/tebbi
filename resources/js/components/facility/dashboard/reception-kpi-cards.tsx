import React from 'react';
import { Activity, Clock, Stethoscope, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MetricCard } from '@/components/common/metric-card';
import { ReceptionMetrics } from './types';

interface ReceptionKpiCardsProps {
    metrics: ReceptionMetrics;
}

export const ReceptionKpiCards: React.FC<ReceptionKpiCardsProps> = React.memo(({ metrics }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <MetricCard
                title="إجمالي مواعيد اليوم"
                value={metrics.totalToday}
                subtitle="حجوزات مسجلة بالجدول"
                icon={<Activity className="w-5 h-5 text-[#005ab5]" />}
                iconBg="bg-blue-50"
            />
            <MetricCard
                title="في صالة الانتظار"
                value={metrics.waitingCount}
                subtitle="حضروا وينتظرون بالخارج"
                icon={<Clock className="w-5 h-5 text-amber-600" />}
                iconBg="bg-amber-50"
            />
            <MetricCard
                title="قيد الكشف بالعيادات"
                value={metrics.inConsultationCount}
                subtitle="داخل غرف الفحص الآن"
                icon={<Stethoscope className="w-5 h-5 text-emerald-600" />}
                iconBg="bg-emerald-50"
            />
            <MetricCard
                title="لم يحضروا بعد"
                value={metrics.notArrivedCount ?? 0}
                subtitle="مؤكد وبانتظار حضورهم"
                icon={<AlertCircle className="w-5 h-5 text-blue-600" />}
                iconBg="bg-blue-50"
            />
            <MetricCard
                title="كشوفات مكتملة"
                value={metrics.completedCount}
                subtitle="أنهوا الكشف وغادروا"
                icon={<CheckCircle2 className="w-5 h-5 text-teal-600" />}
                iconBg="bg-teal-50"
            />
        </div>
    );
});
ReceptionKpiCards.displayName = 'ReceptionKpiCards';
