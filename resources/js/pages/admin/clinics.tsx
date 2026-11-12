import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { AdminDashboardLayout } from '@/layouts/admin-dashboard-layout';
import { MetricCard } from '@/components/common/metric-card';
import { Hospital, Building2, Stethoscope, ShieldCheck } from 'lucide-react';
import { Clinic, Group } from '@/components/admin/types';
import { ClinicsTab } from '@/components/admin/tabs/clinics-tab';
import { ClinicModal } from '@/components/admin/modals/clinic-modal';

interface ClinicsPageProps {
    clinics: Clinic[];
    groups: Group[];
    metrics: {
        total: number;
        hospitals: number;
        clinics: number;
        verified: number;
    };
}

export default function ClinicsPage({
    clinics,
    groups,
    metrics,
}: ClinicsPageProps) {
    const [search, setSearch] = useState('');
    const [groupFilter, setGroupFilter] = useState('all');
    const [clinicModalOpen, setClinicModalOpen] = useState(false);
    const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);

    return (
        <AdminDashboardLayout activeTab="clinics">
            <Head title="المستشفيات والعيادات - الإدارة العليا" />

            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <MetricCard
                        title="إجمالي المنشآت الطبية"
                        value={metrics.total}
                        subtitle="المستشفيات والمراكز المسجلة"
                        icon={<Hospital className="w-5 h-5 text-[#005ab5]" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="المستشفيات العامة والتخصصية"
                        value={metrics.hospitals}
                        subtitle="منشآت رعاية طبية متقدمة"
                        icon={<Building2 className="w-5 h-5 text-indigo-600" />}
                        iconBg="bg-indigo-50"
                    />
                    <MetricCard
                        title="العيادات والمجمعات اليومية"
                        value={metrics.clinics}
                        subtitle="فروع ومراكز عيادات خارجية"
                        icon={<Stethoscope className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="منشآت موثقة ومعتمدة"
                        value={metrics.verified}
                        subtitle="اعتماد وزارة الصحة والجهات الرقابية"
                        icon={<ShieldCheck className="w-5 h-5 text-teal-600" />}
                        iconBg="bg-teal-50"
                    />
                </div>

                {/* Clinics Tab Table */}
                <ClinicsTab
                    clinics={clinics}
                    groups={groups}
                    search={search}
                    onSearchChange={setSearch}
                    groupFilter={groupFilter}
                    onGroupFilterChange={setGroupFilter}
                    onOpenAddModal={() => {
                        setEditingClinic(null);
                        setClinicModalOpen(true);
                    }}
                    onOpenEditModal={(clinic) => {
                        setEditingClinic(clinic);
                        setClinicModalOpen(true);
                    }}
                />
            </div>

            {/* Modal */}
            <ClinicModal
                isOpen={clinicModalOpen}
                onClose={() => {
                    setClinicModalOpen(false);
                    setEditingClinic(null);
                }}
                groups={groups}
                clinic={editingClinic}
            />
        </AdminDashboardLayout>
    );
}

