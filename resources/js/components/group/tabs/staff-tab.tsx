import React, { useState, useMemo } from 'react';
import { StaffAssignment } from '../types';
import { Pagination } from '@/components/common/pagination';
import { TableToolbar } from '@/components/common/table-toolbar';
import { UserPlus, ShieldCheck } from 'lucide-react';

interface StaffTabProps {
    staffAssignments: StaffAssignment[];
    onOpenAddModal: () => void;
}

export const StaffTab: React.FC<StaffTabProps> = ({
    staffAssignments,
    onOpenAddModal,
}) => {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filteredStaff = useMemo(() => {
        const query = search.trim().toLowerCase();
        return staffAssignments.filter((s) => {
            const matchesSearch =
                !query ||
                s.user_name.toLowerCase().includes(query) ||
                s.user_email.toLowerCase().includes(query) ||
                s.user_phone.toLowerCase().includes(query) ||
                s.scope_name.toLowerCase().includes(query);

            const matchesRole = roleFilter === 'all' ? true : s.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [staffAssignments, search, roleFilter]);

    const paginatedStaff = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredStaff.slice(start, start + pageSize);
    }, [filteredStaff, currentPage, pageSize]);

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'facility_admin':
                return {
                    label: 'مدير منشأة',
                    className: 'bg-blue-50 text-[#005ab5] border-blue-100',
                };
            case 'receptionist':
                return {
                    label: 'موظف استقبال',
                    className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                };
            default:
                return {
                    label: 'مدير مجمع',
                    className: 'bg-purple-50 text-purple-700 border-purple-100',
                };
        }
    };

    return (
        <div className="space-y-6">
            {/* Unified Reusable Toolbar Component */}
            <TableToolbar
                search={search}
                onSearchChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                }}
                searchPlaceholder="البحث عن مشرف بالاسم، البريد أو الفرع المخصص..."
                filters={[
                    {
                        id: 'role',
                        value: roleFilter,
                        onChange: (val) => {
                            setRoleFilter(val);
                            setCurrentPage(1);
                        },
                        options: [
                            { value: 'all', label: 'كافة الأدوار الإدارية' },
                            { value: 'facility_admin', label: 'مدير منشأة' },
                            { value: 'receptionist', label: 'موظف استقبال' },
                            { value: 'group_admin', label: 'مدير مجمع' },
                        ],
                    },
                ]}
                actionLabel="تعيين مدير فرع أو استقبال"
                onAction={onOpenAddModal}
                actionIcon={<UserPlus className="w-4 h-4" />}
            />

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                            <tr>
                                <th className="py-3.5 px-4">المشرف / الموظف</th>
                                <th className="py-3.5 px-4">البريد الإلكتروني للولوج</th>
                                <th className="py-3.5 px-4">رقم الهاتف</th>
                                <th className="py-3.5 px-4">الدور والصلاحية</th>
                                <th className="py-3.5 px-4">الفرع المخصص</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedStaff.length > 0 ? (
                                paginatedStaff.map((s) => {
                                    const badge = getRoleBadge(s.role);
                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="py-3.5 px-4 font-bold text-gray-900 font-['Cairo'] text-sm">
                                                {s.user_name}
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-600 font-mono text-xs" dir="ltr">
                                                {s.user_email}
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-600 font-mono text-xs" dir="ltr">
                                                {s.user_phone || '—'}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold border ${badge.className}`}
                                                >
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-gray-800">
                                                {s.scope_name}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center">
                                        <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 font-bold font-['Cairo']">لا يوجد مشرفون معينون مطابقون للبحث</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {filteredStaff.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredStaff.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                    pageSizeOptions={[10, 25, 50]}
                />
            )}
        </div>
    );
};
