import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { AdminDashboardLayout } from '@/layouts/admin-dashboard-layout';
import { MetricCard } from '@/components/common/metric-card';
import { Settings2, Building2, Hospital, Users } from 'lucide-react';
import { RoleAssignmentItem, Group, Clinic, UserSimple } from '@/components/admin/types';
import { AdminsTab } from '@/components/admin/tabs/admins-tab';
import { RoleModal } from '@/components/admin/modals/role-modal';

interface AdminsPageProps {
    roleAssignments: RoleAssignmentItem[];
    groups: Group[];
    clinics: Clinic[];
    allUsers: UserSimple[];
    metrics: {
        total: number;
        groupAdmins: number;
        facilityAdmins: number;
        receptionists: number;
    };
}

export default function AdminsPage({
    roleAssignments,
    groups,
    clinics,
    allUsers,
    metrics,
}: AdminsPageProps) {
    const [search, setSearch] = useState('');
    const [roleModalOpen, setRoleModalOpen] = useState(false);

    return (
        <AdminDashboardLayout activeTab="admins">
            <Head title="المشرفون وصلاحيات الاستقبال - الإدارة العليا" />

            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <MetricCard
                        title="إجمالي الكادر الإداري"
                        value={metrics.total}
                        subtitle="مشرفون ومسؤولون تنفيذيون"
                        icon={<Settings2 className="w-5 h-5 text-amber-600" />}
                        iconBg="bg-amber-50"
                    />
                    <MetricCard
                        title="مدراء المجمعات"
                        value={metrics.groupAdmins}
                        subtitle="إشراف شامل على المجموعات الطبية"
                        icon={<Building2 className="w-5 h-5 text-[#005ab5]" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="مدراء المستشفيات والمنشآت"
                        value={metrics.facilityAdmins}
                        subtitle="إدارة تشغيلية للفروع والعيادات"
                        icon={<Hospital className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="موظفو الاستقبال والتذاكر"
                        value={metrics.receptionists}
                        subtitle="إدارة صفوف الانتظار والاستقبال"
                        icon={<Users className="w-5 h-5 text-purple-600" />}
                        iconBg="bg-purple-50"
                    />
                </div>

                {/* Admins Table */}
                <AdminsTab
                    roleAssignments={roleAssignments}
                    groups={groups}
                    clinics={clinics}
                    search={search}
                    onSearchChange={setSearch}
                    onOpenAddModal={() => setRoleModalOpen(true)}
                />
            </div>

            {/* Modal */}
            <RoleModal
                isOpen={roleModalOpen}
                onClose={() => setRoleModalOpen(false)}
                groups={groups}
                clinics={clinics}
                allUsers={allUsers}
            />
        </AdminDashboardLayout>
    );
}

