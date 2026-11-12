import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';
import { RoleAssignmentItem } from '../types';
import { TableToolbar } from '@/components/common/table-toolbar';
import { ConfirmDeleteModal } from '@/components/common/confirm-delete-modal';
import { Pagination } from '@/components/common/pagination';

interface AdminsTabProps {
    roleAssignments: RoleAssignmentItem[];
    search: string;
    onSearchChange: (value: string) => void;
    onOpenAddModal: () => void;
}

export const AdminsTab: React.FC<AdminsTabProps> = ({
    roleAssignments,
    search,
    onSearchChange,
    onOpenAddModal,
}) => {
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [deletingAssignment, setDeletingAssignment] = useState<RoleAssignmentItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = () => {
        if (!deletingAssignment) return;
        router.delete(`/admin/role-assignments/${deletingAssignment.id}`, {
            onStart: () => setIsDeleting(true),
            onFinish: () => {
                setIsDeleting(false);
                setDeletingAssignment(null);
            },
        });
    };

    const getRoleTitle = (role: string) => {
        switch (role) {
            case 'group_admin':
                return 'مدير مجمع طبي';
            case 'facility_admin':
                return 'مدير مستشفى / عيادة';
            case 'receptionist':
                return 'موظف استقبال';
            default:
                return role;
        }
    };

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filtered = roleAssignments.filter((a) => {
        const matchesSearch =
            a.user_name.toLowerCase().includes(search.toLowerCase()) ||
            a.user_email.toLowerCase().includes(search.toLowerCase()) ||
            a.scope_name.toLowerCase().includes(search.toLowerCase());

        const matchesRole = roleFilter === 'all' ? true : a.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const paginatedAdmins = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="space-y-6">
            <TableToolbar
                search={search}
                onSearchChange={onSearchChange}
                searchPlaceholder="ابحث باسم المشرف، البريد، أو المنشأة..."
                filters={[
                    {
                        id: 'role',
                        value: roleFilter,
                        onChange: (val) => {
                            setRoleFilter(val);
                            setPage(1);
                        },
                        options: [
                            { value: 'all', label: 'كافة الأدوار الإدارية' },
                            { value: 'group_admin', label: 'مدير مجمع طبي' },
                            { value: 'facility_admin', label: 'مدير منشأة / عيادة' },
                            { value: 'receptionist', label: 'موظف استقبال' },
                        ],
                    },
                ]}
                actionLabel="تعيين مشرف جديد"
                onAction={onOpenAddModal}
                actionIcon={<Plus className="w-4 h-4" />}
            />

            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                            <tr>
                                <th className="py-3.5 px-4">المستخدم / المشرف</th>
                                <th className="py-3.5 px-4">البريد الإلكتروني</th>
                                <th className="py-3.5 px-4">الدور والصلاحية</th>
                                <th className="py-3.5 px-4">النطاق والمنشأة المعينة</th>
                                <th className="py-3.5 px-4">تاريخ التعيين</th>
                                <th className="py-3.5 px-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedAdmins.length > 0 ? (
                                paginatedAdmins.map((a) => (
                                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#005ab5] flex items-center justify-center font-bold">
                                                    {a.user_name.charAt(0)}
                                                </div>
                                                <div className="font-bold text-gray-900 font-['Cairo'] text-sm">
                                                    {a.user_name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-500 font-mono" dir="ltr">
                                            {a.user_email}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    a.role === 'group_admin'
                                                        ? 'bg-purple-50 text-purple-700'
                                                        : a.role === 'facility_admin'
                                                        ? 'bg-blue-50 text-[#005ab5]'
                                                        : 'bg-emerald-50 text-emerald-700'
                                                }`}
                                            >
                                                {getRoleTitle(a.role)}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-gray-700">
                                            <div className="flex items-center gap-1">
                                                <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{a.scope_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                                            {a.assigned_at}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <button
                                                type="button"
                                                onClick={() => setDeletingAssignment(a)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                title="سحب الصلاحية"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400 font-bold">
                                        لا توجد تعيينات صلاحيات مطابقة للبحث
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

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={Boolean(deletingAssignment)}
                onClose={() => setDeletingAssignment(null)}
                onConfirm={handleConfirmDelete}
                title="سحب صلاحية المشرف"
                message={
                    <span>
                        هل أنت متأكد من سحب صلاحية{' '}
                        <strong className="text-gray-900">{deletingAssignment?.user_name}</strong> عن{' '}
                        <strong className="text-gray-900">{deletingAssignment?.scope_name}</strong>؟
                    </span>
                }
                confirmText="نعم، سحب الصلاحية"
                loading={isDeleting}
            />
        </div>
    );
};
