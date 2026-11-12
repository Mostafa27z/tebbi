import React from 'react';
import { Head } from '@inertiajs/react';
import { AdminDashboardLayout } from '@/layouts/admin-dashboard-layout';
import { MetricCard } from '@/components/common/metric-card';
import { 
    TrendingUp, 
    Users, 
    Building2, 
    ShieldCheck, 
    Clock, 
    CheckCircle2 
} from 'lucide-react';
import { AnalyticsTab } from '@/components/admin/tabs/analytics-tab';

interface AnalyticsPageProps {
    metrics: {
        totalBookings: number;
        completedBookings: number;
        activeDoctors: number;
        activeHospitals: number;
        complianceRate: string;
        avgWaitingTime: string;
    };
    chartData: Array<{
        day: string;
        date: string;
        bookings: number;
        confirmed: number;
        val1: number;
        val2: number;
    }>;
    specialtyDistribution: Array<{
        id: number;
        name: string;
        doctors_count: number;
        share_percentage: number;
    }>;
}

export default function AnalyticsPage({
    metrics,
    chartData,
    specialtyDistribution,
}: AnalyticsPageProps) {
    return (
        <AdminDashboardLayout activeTab="analytics">
            <Head title="تحليلات النمو والأداء - الإدارة العليا" />

            <div className="space-y-8">
                {/* 6 Top Platform Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
                    <MetricCard
                        title="إجمالي الحجوزات"
                        value={metrics.totalBookings}
                        subtitle="عبر كافة المنشآت والمراكز"
                        icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="الحالات المؤكدة والمنفذة"
                        value={metrics.completedBookings}
                        subtitle="كشوفات مكتملة ومنفذة فعلياً"
                        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="المنشآت النشطة"
                        value={metrics.activeHospitals}
                        subtitle="مستشفيات ومراكز طبية"
                        icon={<Building2 className="w-5 h-5 text-[#005ab5]" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="الأطباء على رأس العمل"
                        value={metrics.activeDoctors}
                        subtitle="استشاريون وأطباء معتمدون"
                        icon={<Users className="w-5 h-5 text-purple-600" />}
                        iconBg="bg-purple-50"
                    />
                    <MetricCard
                        title="نسبة التوثيق"
                        value={metrics.complianceRate}
                        subtitle="اعتماد وزارة الصحة والرقابة"
                        icon={<ShieldCheck className="w-5 h-5 text-[#006b5c]" />}
                        iconBg="bg-teal-50"
                    />
                    <MetricCard
                        title="متوسط الانتظار"
                        value={metrics.avgWaitingTime}
                        subtitle="عبر كافة العيادات والأقسام"
                        icon={<Clock className="w-5 h-5 text-amber-600" />}
                        iconBg="bg-amber-50"
                    />
                </div>

                {/* 7-Days Chart & Specialties Share */}
                <AnalyticsTab
                    chartData={chartData}
                    specialtyDistribution={specialtyDistribution}
                />
            </div>
        </AdminDashboardLayout>
    );
}
