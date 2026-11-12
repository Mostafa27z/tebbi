import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Search, Plus, Edit3, Trash2, Hospital, Building2 } from 'lucide-react';
import { Group } from '../types';
import { TableToolbar } from '@/components/common/table-toolbar';
import { ConfirmDeleteModal } from '@/components/common/confirm-delete-modal';
import { Pagination } from '@/components/common/pagination';

interface GroupsTabProps {
    groups: Group[];
    search: string;
    onSearchChange: (value: string) => void;
    onOpenAddModal: () => void;
    onOpenEditModal: (group: Group) => void;
    onOpenAddClinicModal: (groupId: number) => void;
    onOpenAssignAdminModal: (groupId: number) => void;
}

export const GroupsTab: React.FC<GroupsTabProps> = ({
    groups,
    search,
    onSearchChange,
    onOpenAddModal,
    onOpenEditModal,
    onOpenAddClinicModal,
    onOpenAssignAdminModal,
}) => {
    const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = () => {
        if (!deletingGroup) return;
        router.delete(`/admin/groups/${deletingGroup.id}`, {
            onStart: () => setIsDeleting(true),
            onFinish: () => {
                setIsDeleting(false);
                setDeletingGroup(null);
            },
        });
    };

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);

    const filtered = groups.filter((g) =>
        g.name_ar.toLowerCase().includes(search.toLowerCase()) ||
        (g.name_en && g.name_en.toLowerCase().includes(search.toLowerCase())) ||
        (g.cr_number && g.cr_number.includes(search))
    );

    const paginatedGroups = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="space-y-6">
            <TableToolbar
                search={search}
                onSearchChange={onSearchChange}
                searchPlaceholder="ابحث باسم المجمع أو السجل التجاري..."
                actionLabel="إضافة مجمع طبي جديد"
                onAction={onOpenAddModal}
                actionIcon={<Plus className="w-4 h-4" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedGroups.map((group) => (
                    <div
                        key={group.id}
                        className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-all"
                    >
                        <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#005ab5]">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-base font-['Cairo']">
                                            {group.name_ar}
                                        </h4>
                                        <p className="text-[11px] text-gray-400 font-mono">{group.name_en || 'Medical Group'}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    group.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                }`}>
                                    {group.status === 'active' ? 'نشط' : 'معلّق'}
                                </span>
                            </div>

                            <div className="space-y-2 py-3 border-y border-gray-100 my-3 text-xs">
                                <div className="flex items-center justify-between text-gray-600">
                                    <span>السجل التجاري:</span>
                                    <span className="font-mono font-bold text-gray-900">{group.cr_number || 'غير مسجل'}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-600">
                                    <span>المنشآت التابعة:</span>
                                    <span className="font-bold text-[#005ab5]">{group.facilities_count || 0} منشأة</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-600">
                                    <span>مديرو المجمع:</span>
                                    <span className="font-bold text-gray-800">
                                        {group.admins && group.admins.length > 0
                                            ? group.admins.map((a) => a.name).join('، ')
                                            : 'لم يُعيّن مدير بعد'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <button
                                onClick={() => onOpenAddClinicModal(group.id)}
                                className="flex-1 py-2 px-3 rounded-xl bg-blue-50 text-[#005ab5] hover:bg-blue-100 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                                <Hospital className="w-3.5 h-3.5" />
                                <span>إضافة فرع</span>
                            </button>
                            <button
                                onClick={() => onOpenAssignAdminModal(group.id)}
                                className="py-2 px-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-colors"
                            >
                                تعيين مدير
                            </button>
                            <button
                                onClick={() => onOpenEditModal(group)}
                                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setDeletingGroup(group)}
                                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                title="حذف المجمع الطبي"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
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
                    pageSizeOptions={[6, 12, 24]}
                />
            )}

            {/* Centered Confirm Delete Dialog */}
            <ConfirmDeleteModal
                isOpen={!!deletingGroup}
                onClose={() => setDeletingGroup(null)}
                onConfirm={handleConfirmDelete}
                loading={isDeleting}
                title="حذف المجمع الطبي"
                message={
                    <span>
                        هل أنت متأكد من حذف المجمع الطبي{' '}
                        <strong className="text-gray-900 font-bold">"{deletingGroup?.name_ar}"</strong>؟
                        <br />
                        <span className="text-gray-500 mt-1 block">
                            سيتم حذف المجمع وكافة العيادات والمراكز التابعة له وجميع بياناتها المرتبطة.
                        </span>
                    </span>
                }
                confirmText="نعم، حذف المجمع"
            />
        </div>
    );
};

