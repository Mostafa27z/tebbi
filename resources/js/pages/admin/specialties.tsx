import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { AdminDashboardLayout } from '@/layouts/admin-dashboard-layout';
import { MetricCard } from '@/components/common/metric-card';
import { Stethoscope, Sparkles, CheckCircle2, Users } from 'lucide-react';
import { Specialty } from '@/components/admin/types';
import { SpecialtiesTab } from '@/components/admin/tabs/specialties-tab';
import { SpecialtyModal } from '@/components/admin/modals/specialty-modal';

interface SpecialtiesPageProps {
    specialties: Specialty[];
    metrics: {
        total: number;
        badged: number;
        active: number;
        totalDoctors: number;
    };
}

export default function SpecialtiesPage({
    specialties,
    metrics,
}: SpecialtiesPageProps) {
    const [search, setSearch] = useState('');
    const [specialtyModalOpen, setSpecialtyModalOpen] = useState(false);
    const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);

    return (
        <AdminDashboardLayout activeTab="specialties">
            <Head title="الأقسام والتخصصات الطبية - الإدارة العليا" />

            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <MetricCard
                        title="إجمالي الأقسام والتخصصات"
                        value={metrics.total}
                        subtitle="تخصصات عامة ودقيقة"
                        icon={<Stethoscope className="w-5 h-5 text-teal-600" />}
                        iconBg="bg-teal-50"
                    />
                    <MetricCard
                        title="تخصصات مميزة بشارات"
                        value={metrics.badged}
                        subtitle="تخصصات ذات وسوم بارزة"
                        icon={<Sparkles className="w-5 h-5 text-amber-600" />}
                        iconBg="bg-amber-50"
                    />
                    <MetricCard
                        title="تخصصات مفعلة بأطباء"
                        value={metrics.active}
                        subtitle="تخصصات يعمل بها أطباء حالياً"
                        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="إجمالي الأطباء الموزعين"
                        value={metrics.totalDoctors}
                        subtitle="كوادر طبية عبر كافة التخصصات"
                        icon={<Users className="w-5 h-5 text-[#005ab5]" />}
                        iconBg="bg-blue-50"
                    />
                </div>

                {/* Specialties Table */}
                <SpecialtiesTab
                    specialties={specialties}
                    search={search}
                    onSearchChange={setSearch}
                    onOpenAddModal={() => {
                        setEditingSpecialty(null);
                        setSpecialtyModalOpen(true);
                    }}
                    onOpenEditModal={(specialty) => {
                        setEditingSpecialty(specialty);
                        setSpecialtyModalOpen(true);
                    }}
                />
            </div>

            {/* Modal */}
            <SpecialtyModal
                isOpen={specialtyModalOpen}
                onClose={() => {
                    setSpecialtyModalOpen(false);
                    setEditingSpecialty(null);
                }}
                specialty={editingSpecialty}
            />
        </AdminDashboardLayout>
    );
}

