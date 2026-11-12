import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Edit3, Trash2, Stethoscope } from 'lucide-react';
import { Specialty } from '../types';
import { TableToolbar } from '@/components/common/table-toolbar';
import { ConfirmDeleteModal } from '@/components/common/confirm-delete-modal';
import { Pagination } from '@/components/common/pagination';

interface SpecialtiesTabProps {
    specialties: Specialty[];
    onOpenAddModal: () => void;
    onOpenEditModal: (specialty: Specialty) => void;
}

export const SpecialtiesTab: React.FC<SpecialtiesTabProps> = ({
    specialties,
    onOpenAddModal,
    onOpenEditModal,
}) => {
    const [search, setSearch] = useState('');
    const [deletingSpecialty, setDeletingSpecialty] = useState<Specialty | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = () => {
        if (!deletingSpecialty) return;
        router.delete(`/admin/specialties/${deletingSpecialty.id}`, {
            onStart: () => setIsDeleting(true),
            onFinish: () => {
                setIsDeleting(false);
                setDeletingSpecialty(null);
            },
        });
    };

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    const filtered = specialties.filter((s) =>
        s.name_ar.toLowerCase().includes(search.toLowerCase()) ||
        (s.name_en && s.name_en.toLowerCase().includes(search.toLowerCase())) ||
        (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
    );

    const paginatedSpecialties = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="space-y-6">
            <TableToolbar
                search={search}
                onSearchChange={(val) => {
                    setSearch(val);
                    setPage(1);
                }}
                searchPlaceholder="ابحث باسم القسم أو التخصص الطبي..."
                actionLabel="إضافة تخصص طبي جديد"
                onAction={onOpenAddModal}
                actionIcon={<Plus className="w-4 h-4" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedSpecialties.map((s) => (
                    <div
                        key={s.id}
                        className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-all"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#005ab5] flex items-center justify-center">
                                    <Stethoscope className="w-5 h-5" />
                                </div>
                                {s.badge_text && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#005ab5]">
                                        {s.badge_text}
                                    </span>
                                )}
                            </div>

                            <h4 className="font-bold text-gray-900 text-base font-['Cairo'] mb-1">
                                {s.name_ar}
                            </h4>
                            {s.name_en && (
                                <p className="text-xs text-gray-400 font-medium mb-2">{s.name_en}</p>
                            )}
                            <p className="text-xs text-gray-500 line-clamp-2">
                                {s.description || 'تخصص طبي معتمد بالمنصة'}
                            </p>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-4">
                            <span className="text-xs font-bold text-[#005ab5]">
                                {s.doctor_profiles_count || 0} طبيب
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => onOpenEditModal(s)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#005ab5] hover:bg-blue-50 transition-colors cursor-pointer"
                                    title="تعديل"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeletingSpecialty(s)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="حذف"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
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
                    pageSizeOptions={[4, 8, 16, 32]}
                />
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={Boolean(deletingSpecialty)}
                onClose={() => setDeletingSpecialty(null)}
                onConfirm={handleConfirmDelete}
                title="تأكيد حذف التخصص الطبي"
                message={
                    <span>
                        هل أنت متأكد من حذف قسم{' '}
                        <strong className="text-gray-900">"{deletingSpecialty?.name_ar}"</strong>؟
                    </span>
                }
                loading={isDeleting}
            />
        </div>
    );
};
