import React, { useState, useMemo, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { UserCheck, Users, UserPlus, ShieldCheck, Hospital, CheckCircle2 } from 'lucide-react';
import { FacilityDashboardLayout } from '@/layouts/facility-dashboard-layout';
import {
    MetricCard,
    TableToolbar,
    ConfirmDeleteModal,
    Pagination,
    SurfaceCard,
    SectionHeader,
    AppButton,
} from '@/components/common';
import {
    ReceptionistItem,
    AvailableReceptionUser,
    ReceptionistsTable,
    AddReceptionistModal,
    EditReceptionistModal,
} from '@/components/facility/receptionists';

interface Props {
    facility: {
        id: number;
        name: string;
        branch_name?: string;
        city: string;
        district?: string;
        address?: string;
    };
    metrics: {
        doctorsCount: number;
        activeDoctorsCount: number;
        specialtiesCount: number;
        totalToday: number;
        waitingCount: number;
        inConsultationCount: number;
        completedCount: number;
        receptionistsCount?: number;
    };
    receptionists: ReceptionistItem[];
    availableUsers?: AvailableReceptionUser[];
}

export default function FacilityReceptionistsPage({
    facility,
    metrics,
    receptionists = [],
    availableUsers = [],
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editModalData, setEditModalData] = useState<ReceptionistItem | null>(null);
    const [deleteModalData, setDeleteModalData] = useState<ReceptionistItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredReceptionists = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return receptionists;

        return receptionists.filter((item) => {
            return (
                item.name.toLowerCase().includes(query) ||
                item.email.toLowerCase().includes(query) ||
                (item.phone && item.phone.includes(query)) ||
                (item.national_id && item.national_id.includes(query))
            );
        });
    }, [receptionists, searchQuery]);

    const paginatedReceptionists = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredReceptionists.slice(start, start + pageSize);
    }, [filteredReceptionists, currentPage, pageSize]);

    const handleSearchChange = useCallback((val: string) => {
        setSearchQuery(val);
        setCurrentPage(1);
    }, []);

    const handleOpenAdd = useCallback(() => setIsAddModalOpen(true), []);
    const handleCloseAdd = useCallback(() => setIsAddModalOpen(false), []);
    const handleCloseEdit = useCallback(() => setEditModalData(null), []);
    const handleCloseDelete = useCallback(() => setDeleteModalData(null), []);

    const handleConfirmDelete = useCallback(() => {
        if (!deleteModalData) return;
        setIsDeleting(true);

        router.delete(`/facility/receptionists/${deleteModalData.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteModalData(null);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    }, [deleteModalData]);

    return (
        <FacilityDashboardLayout
            activeTab="receptionists"
            facilityName={facility.name}
            branchName={facility.branch_name}
            counts={{
                waiting: metrics.waitingCount,
                doctors: metrics.doctorsCount,
                specialties: metrics.specialtiesCount,
                appointments: metrics.totalToday,
                receptionists: receptionists.length,
            }}
        >
            <Head title={`إدارة موظفي الاستقبال - ${facility.name}`} />

            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="إجمالي موظفي الاستقبال"
                        value={receptionists.length}
                        subtitle="كادر خدمة المراجعين والانتظار"
                        icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <MetricCard
                        title="الحسابات النشطة"
                        value={receptionists.length}
                        subtitle="مصرح لهم بالدخول للوحة الاستقبال"
                        icon={<CheckCircle2 className="w-5 h-5 text-[#005ab5]" />}
                        iconBg="bg-blue-50"
                    />
                    <MetricCard
                        title="المنشأة والفرع الحالي"
                        value={facility.branch_name || 'الفرع الرئيسي'}
                        subtitle={facility.city || 'الرياض'}
                        icon={<Hospital className="w-5 h-5 text-purple-600" />}
                        iconBg="bg-purple-50"
                    />
                    <MetricCard
                        title="صلاحيات الإدارة"
                        value="مدير المنشأة"
                        subtitle="تحكم كامل في موظفي الاستقبال"
                        icon={<ShieldCheck className="w-5 h-5 text-amber-600" />}
                        iconBg="bg-amber-50"
                    />
                </div>

                <SurfaceCard padding="lg" rounded="3xl" className="space-y-6">
                    <div className="flex flex-col gap-4">
                        <SectionHeader
                            className="border-b border-slate-100 pb-4"
                            icon={<Users className="w-5 h-5 text-[#005ab5]" />}
                            title="كادر موظفي الاستقبال وتذاكر الانتظار"
                            description="يمكنك إضافة موظف استقبال جديد، تحديث بيانات الدخول، أو سحب الصلاحية عند الحاجة"
                            actions={
                                <AppButton
                                    variant="emerald"
                                    icon={<UserPlus className="w-4 h-4" />}
                                    onClick={handleOpenAdd}
                                >
                                    إضافة موظف استقبال جديد
                                </AppButton>
                            }
                        />

                        <TableToolbar
                            search={searchQuery}
                            onSearchChange={handleSearchChange}
                            searchPlaceholder="البحث بالاسم، البريد الإلكتروني، رقم الجوال أو الهوية..."
                        />
                    </div>

                    <ReceptionistsTable
                        receptionists={paginatedReceptionists}
                        facilityName={facility.name}
                        searchQuery={searchQuery}
                        onEdit={setEditModalData}
                        onDelete={setDeleteModalData}
                        onOpenAdd={handleOpenAdd}
                    />

                    {filteredReceptionists.length > pageSize && (
                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredReceptionists.length}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </SurfaceCard>
            </div>

            <AddReceptionistModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAdd}
                facility={facility}
                availableUsers={availableUsers}
            />

            <EditReceptionistModal
                receptionist={editModalData}
                onClose={handleCloseEdit}
            />

            <ConfirmDeleteModal
                isOpen={Boolean(deleteModalData)}
                onClose={handleCloseDelete}
                onConfirm={handleConfirmDelete}
                loading={isDeleting}
                title="إلغاء تعيين موظف الاستقبال"
                message={
                    <span>
                        هل أنت متأكد من رغبتك في إلغاء تعيين موظف الاستقبال{' '}
                        <strong className="text-slate-900 font-bold font-['Cairo']">
                            ({deleteModalData?.name})
                        </strong>{' '}
                        من منشأة{' '}
                        <strong className="text-slate-900 font-bold">
                            {facility.name}
                        </strong>
                        ؟ سيتم سحب صلاحيات الدخول إلى لوحة الاستقبال فوراً.
                    </span>
                }
                confirmText="نعم، إلغاء التعيين"
                cancelText="تراجع"
            />
        </FacilityDashboardLayout>
    );
}
