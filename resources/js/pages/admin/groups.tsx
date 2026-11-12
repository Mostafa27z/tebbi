import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { AdminDashboardLayout } from '@/layouts/admin-dashboard-layout';
import { MetricCard } from '@/components/common/metric-card';
import { Building2, Hospital, ShieldCheck, BarChart3 } from 'lucide-react';
import { Group, Clinic, UserSimple } from '@/components/admin/types';
import { GroupsTab } from '@/components/admin/tabs/groups-tab';
import { GroupModal } from '@/components/admin/modals/group-modal';
import { ClinicModal } from '@/components/admin/modals/clinic-modal';
import { RoleModal } from '@/components/admin/modals/role-modal';

interface GroupsPageProps {
    groups: Group[];
    metrics: {
        totalGroups: number;
        totalFacilities: number;
        verifiedCr: number;
        avgPerGroup: number;
    };
    clinics?: Clinic[];
    allUsers?: UserSimple[];
}

export default function GroupsPage({
    groups,
    metrics,
    clinics = [],
    allUsers = [],
}: GroupsPageProps) {
    const [search, setSearch] = useState('');
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    const [clinicModalOpen, setClinicModalOpen] = useState(false);
    const [defaultClinicGroupId, setDefaultClinicGroupId] = useState<number | undefined>();

    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [defaultRoleConfig, setDefaultRoleConfig] = useState<{
        role: 'group_admin' | 'facility_admin' | 'receptionist';
        scopeType: 'group' | 'facility';
        scopeId?: number;
    }>({ role: 'group_admin', scopeType: 'group' });

    return (
        <AdminDashboardLayout activeTab="groups">
            <Head title="المجمعات الطبية - الإدارة العليا" />

            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <MetricCard
                        title="إجمالي المجمعات الطبية"
                        value={metrics.totalGroups}
                        subtitle="كيانات ومنظومات مسجلة"
                        icon={<Building2 className="w-5 h-5 text-[#005ab5]" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="الفروع والمستشفيات التابعة"
                        value={metrics.totalFacilities}
                        subtitle="منشآت تدار عبر المجمعات"
                        icon={<Hospital className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="سجلات تجارية موثقة"
                        value={metrics.verifiedCr}
                        subtitle="اعتماد السجل التجاري الرسمي"
                        icon={<ShieldCheck className="w-5 h-5 text-teal-600" />}
                        iconBg="bg-teal-50"
                    />
                    <MetricCard
                        title="معدل الفروع لكل مجمع"
                        value={metrics.avgPerGroup}
                        subtitle="توزيع المنشآت الطبية"
                        icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
                        iconBg="bg-purple-50"
                    />
                </div>

                {/* Groups Grid / Tab */}
                <GroupsTab
                    groups={groups}
                    search={search}
                    onSearchChange={setSearch}
                    onOpenAddModal={() => {
                        setEditingGroup(null);
                        setGroupModalOpen(true);
                    }}
                    onOpenEditModal={(group) => {
                        setEditingGroup(group);
                        setGroupModalOpen(true);
                    }}
                    onOpenAddClinicModal={(groupId) => {
                        setDefaultClinicGroupId(groupId);
                        setClinicModalOpen(true);
                    }}
                    onOpenAssignAdminModal={(groupId) => {
                        setDefaultRoleConfig({
                            role: 'group_admin',
                            scopeType: 'group',
                            scopeId: groupId,
                        });
                        setRoleModalOpen(true);
                    }}
                />
            </div>

            {/* Modals */}
            <GroupModal
                isOpen={groupModalOpen}
                onClose={() => {
                    setGroupModalOpen(false);
                    setEditingGroup(null);
                }}
                group={editingGroup}
            />

            <ClinicModal
                isOpen={clinicModalOpen}
                onClose={() => {
                    setClinicModalOpen(false);
                    setDefaultClinicGroupId(undefined);
                }}
                groups={groups}
                defaultGroupId={defaultClinicGroupId}
            />

            <RoleModal
                isOpen={roleModalOpen}
                onClose={() => setRoleModalOpen(false)}
                groups={groups}
                clinics={clinics}
                allUsers={allUsers}
                defaultRole={defaultRoleConfig.role}
                defaultScopeType={defaultRoleConfig.scopeType}
                defaultScopeId={defaultRoleConfig.scopeId}
            />
        </AdminDashboardLayout>
    );
}

