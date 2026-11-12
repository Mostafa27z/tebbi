import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { AdminDashboardLayout } from '@/layouts/admin-dashboard-layout';
import { MetricCard } from '@/components/common/metric-card';
import { Users, UserCheck, ShieldCheck, CreditCard } from 'lucide-react';
import { Doctor, Specialty, Clinic } from '@/components/admin/types';
import { DoctorsTab } from '@/components/admin/tabs/doctors-tab';
import { DoctorModal } from '@/components/admin/modals/doctor-modal';
import { DoctorFacilityModal } from '@/components/admin/modals/doctor-facility-modal';

interface DoctorsPageProps {
    doctors: Doctor[];
    specialties: Specialty[];
    clinics: Clinic[];
    metrics: {
        total: number;
        activeToday: number;
        acceptsInsurance: number;
        avgFee: number;
    };
}

export default function DoctorsPage({
    doctors,
    specialties,
    clinics,
    metrics,
}: DoctorsPageProps) {
    const [search, setSearch] = useState('');
    const [doctorModalOpen, setDoctorModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

    const [docFacilityModalOpen, setDocFacilityModalOpen] = useState(false);
    const [selectedDoctorForFacility, setSelectedDoctorForFacility] = useState<Doctor | null>(null);

    return (
        <AdminDashboardLayout activeTab="doctors">
            <Head title="الأطباء والاستشاريون - الإدارة العليا" />

            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <MetricCard
                        title="إجمالي الأطباء المعتمدين"
                        value={metrics.total}
                        subtitle="استشاريون وأطباء مسجلون"
                        icon={<Users className="w-5 h-5 text-purple-600" />}
                        iconBg="bg-purple-50"
                    />
                    <MetricCard
                        title="أطباء على رأس العمل اليوم"
                        value={metrics.activeToday}
                        subtitle="متاحون لاستقبال الكشوفات"
                        icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="أطباء يقبلون التأمين"
                        value={metrics.acceptsInsurance}
                        subtitle="متعاقدون مع شركات التأمين"
                        icon={<ShieldCheck className="w-5 h-5 text-teal-600" />}
                        iconBg="bg-teal-50"
                    />
                    <MetricCard
                        title="متوسط قيمة الاستشارة"
                        value={`${metrics.avgFee} ر.س`}
                        subtitle="متوسط رسوم الكشف"
                        icon={<CreditCard className="w-5 h-5 text-blue-600" />}
                        iconBg="bg-blue-50"
                    />
                </div>

                {/* Doctors Table */}
                <DoctorsTab
                    doctors={doctors}
                    search={search}
                    onSearchChange={setSearch}
                    onOpenAddModal={() => {
                        setEditingDoctor(null);
                        setDoctorModalOpen(true);
                    }}
                    onOpenEditModal={(doctor) => {
                        setEditingDoctor(doctor);
                        setDoctorModalOpen(true);
                    }}
                    onOpenAssignFacilityModal={(doctor) => {
                        setSelectedDoctorForFacility(doctor);
                        setDocFacilityModalOpen(true);
                    }}
                />
            </div>

            {/* Modals */}
            <DoctorModal
                isOpen={doctorModalOpen}
                onClose={() => {
                    setDoctorModalOpen(false);
                    setEditingDoctor(null);
                }}
                specialties={specialties}
                clinics={clinics}
                doctor={editingDoctor}
            />

            <DoctorFacilityModal
                isOpen={docFacilityModalOpen}
                onClose={() => {
                    setDocFacilityModalOpen(false);
                    setSelectedDoctorForFacility(null);
                }}
                doctor={selectedDoctorForFacility}
                clinics={clinics}
            />
        </AdminDashboardLayout>
    );
}

