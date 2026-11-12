import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { MapPin, ShieldCheck, ToggleLeft, ToggleRight, Edit3, Plus } from 'lucide-react';
import { Clinic, Group } from '../types';
import { TableToolbar } from '@/components/common/table-toolbar';
import { ConfirmStatusModal } from '@/components/common/confirm-status-modal';
import { Pagination } from '@/components/common/pagination';

interface ClinicsTabProps {
    clinics: Clinic[];
    groups: Group[];
    search: string;
    onSearchChange: (value: string) => void;
    groupFilter: string;
    onGroupFilterChange: (value: string) => void;
    onOpenAddModal: () => void;
    onOpenEditModal: (clinic: Clinic) => void;
}

export const ClinicsTab: React.FC<ClinicsTabProps> = ({
    clinics,
    groups,
    search,
    onSearchChange,
    groupFilter,
    onGroupFilterChange,
    onOpenAddModal,
    onOpenEditModal,
}) => {
    // Additional Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');

    // Confirm Status Modal State
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        clinic: Clinic | null;
        type: 'active' | 'verification';
        loading: boolean;
    }>({
        isOpen: false,
        clinic: null,
        type: 'active',
        loading: false,
    });

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const handleConfirmStatusChange = () => {
        if (!statusModal.clinic) return;
        setStatusModal((prev) => ({ ...prev, loading: true }));

        const endpoint =
            statusModal.type === 'active'
                ? `/admin/clinics/${statusModal.clinic.id}/toggle`
                : `/admin/clinics/${statusModal.clinic.id}/toggle-verify`;

        router.post(
            endpoint,
            {},
            {
                onFinish: () => {
                    setStatusModal({
                        isOpen: false,
                        clinic: null,
                        type: 'active',
                        loading: false,
                    });
                },
            }
        );
    };

    // Filter Logic
    const filtered = clinics.filter((c) => {
        const matchesSearch =
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.city.toLowerCase().includes(search.toLowerCase()) ||
            c.district.toLowerCase().includes(search.toLowerCase());

        const matchesGroup =
            groupFilter === 'all'
                ? true
                : groupFilter === 'independent'
                ? !c.group_id
                : c.group_id === Number(groupFilter);

        const matchesStatus =
            statusFilter === 'all'
                ? true
                : statusFilter === 'active'
                ? c.is_active
                : !c.is_active;

        const matchesVerification =
            verificationFilter === 'all'
                ? true
                : verificationFilter === 'verified'
                ? c.is_verified
                : !c.is_verified;

        return matchesSearch && matchesGroup && matchesStatus && matchesVerification;
    });

    const paginatedClinics = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="space-y-6">
            {/* Unified Reusable Toolbar Component */}
            <TableToolbar
                search={search}
                onSearchChange={onSearchChange}
                searchPlaceholder="ابحث باسم المنشأة، المدينة، أو الحي..."
                filters={[
                    {
                        id: 'status',
                        value: statusFilter,
                        onChange: (val) => {
                            setStatusFilter(val as any);
                            setPage(1);
                        },
                        options: [
                            { value: 'all', label: 'كافة الحالات التشغيلية' },
                            { value: 'active', label: 'نشط فقط' },
                            { value: 'inactive', label: 'معطّل فقط' },
                        ],
                    },
                    {
                        id: 'verification',
                        value: verificationFilter,
                        onChange: (val) => {
                            setVerificationFilter(val as any);
                            setPage(1);
                        },
                        options: [
                            { value: 'all', label: 'كافة التوثيقات' },
                            { value: 'verified', label: 'معتمد وموثق' },
                            { value: 'unverified', label: 'قيد التدقيق' },
                        ],
                    },
                    {
                        id: 'group',
                        value: groupFilter,
                        onChange: (val) => {
                            onGroupFilterChange(val);
                            setPage(1);
                        },
                        options: [
                            { value: 'all', label: 'كافة المجمعات الطبية' },
                            { value: 'independent', label: 'منشآت مستقلة (بدون مجمع)' },
                            ...groups.map((g) => ({
                                value: String(g.id),
                                label: g.name_ar,
                            })),
                        ],
                    },
                ]}
                actionLabel="إضافة مستشفى / عيادة"
                onAction={onOpenAddModal}
                actionIcon={<Plus className="w-4 h-4" />}
            />

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                            <tr>
                                <th className="py-3.5 px-4">المنشأة الطبية</th>
                                <th className="py-3.5 px-4">المجمع التابع له</th>
                                <th className="py-3.5 px-4">المدينة والحي</th>
                                <th className="py-3.5 px-4">الأطباء</th>
                                <th className="py-3.5 px-4">حالة التوثيق</th>
                                <th className="py-3.5 px-4">الحالة التشغيلية</th>
                                <th className="py-3.5 px-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedClinics.length > 0 ? (
                                paginatedClinics.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-gray-900 font-['Cairo'] text-sm">{c.name}</div>
                                            <div className="text-[11px] text-gray-400">{c.branch_name}</div>
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-gray-700">
                                            {c.group ? c.group.name_ar : <span className="text-gray-400">مستقل</span>}
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{c.city} - {c.district}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-[#005ab5]">
                                            {c.doctor_profiles_count || 0} طبيب
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setStatusModal({
                                                        isOpen: true,
                                                        clinic: c,
                                                        type: 'verification',
                                                        loading: false,
                                                    })
                                                }
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                                    c.is_verified
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                                }`}
                                            >
                                                <ShieldCheck className="w-3 h-3" />
                                                <span>{c.is_verified ? 'معتمد وموثق' : 'قيد التدقيق'}</span>
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setStatusModal({
                                                        isOpen: true,
                                                        clinic: c,
                                                        type: 'active',
                                                        loading: false,
                                                    })
                                                }
                                                className="flex items-center gap-1.5 text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity"
                                            >
                                                {c.is_active ? (
                                                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                                                ) : (
                                                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                                                )}
                                                <span className={c.is_active ? 'text-emerald-700' : 'text-gray-500'}>
                                                    {c.is_active ? 'نشط' : 'معطّل'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <button
                                                type="button"
                                                onClick={() => onOpenEditModal(c)}
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-[#005ab5] hover:bg-blue-50 transition-colors cursor-pointer"
                                                title="تعديل بيانات المنشأة"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">
                                        لا توجد منشآت طبية تطابق معايير البحث والفلترة المحددة
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Component */}
            {filtered.length > 0 && (
                <Pagination
                    currentPage={page}
                    totalItems={filtered.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setPage(1);
                    }}
                    pageSizeOptions={[5, 10, 25, 50]}
                />
            )}

            {/* Status Change Confirmation Modal */}
            <ConfirmStatusModal
                isOpen={statusModal.isOpen}
                onClose={() =>
                    setStatusModal({
                        isOpen: false,
                        clinic: null,
                        type: 'active',
                        loading: false,
                    })
                }
                onConfirm={handleConfirmStatusChange}
                entityName={statusModal.clinic ? `${statusModal.clinic.name} (${statusModal.clinic.city})` : ''}
                currentStatus={
                    statusModal.clinic
                        ? statusModal.type === 'active'
                            ? statusModal.clinic.is_active
                            : statusModal.clinic.is_verified
                        : false
                }
                statusType={statusModal.type}
                loading={statusModal.loading}
            />
        </div>
    );
};
