import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Edit3, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';
import { Doctor } from '../types';
import { TableToolbar } from '@/components/common/table-toolbar';
import { ConfirmStatusModal } from '@/components/common/confirm-status-modal';
import { Pagination } from '@/components/common/pagination';

interface DoctorsTabProps {
    doctors: Doctor[];
    search: string;
    onSearchChange: (value: string) => void;
    onOpenAddModal: () => void;
    onOpenEditModal: (doctor: Doctor) => void;
    onOpenAssignFacilityModal: (doctor: Doctor) => void;
}

export const DoctorsTab: React.FC<DoctorsTabProps> = ({
    doctors,
    search,
    onSearchChange,
    onOpenAddModal,
    onOpenEditModal,
    onOpenAssignFacilityModal,
}) => {
    const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all');

    // Confirm Status Modal
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        doctor: Doctor | null;
        loading: boolean;
    }>({
        isOpen: false,
        doctor: null,
        loading: false,
    });

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const handleConfirmToggle = () => {
        if (!statusModal.doctor) return;
        setStatusModal((prev) => ({ ...prev, loading: true }));

        router.post(
            `/admin/doctors/${statusModal.doctor.id}/toggle-approval`,
            {},
            {
                onFinish: () => {
                    setStatusModal({
                        isOpen: false,
                        doctor: null,
                        loading: false,
                    });
                },
            }
        );
    };

    const filtered = doctors.filter((d) => {
        const matchesSearch =
            d.user.name.toLowerCase().includes(search.toLowerCase()) ||
            d.specialty.name_ar.toLowerCase().includes(search.toLowerCase()) ||
            (d.title_ar && d.title_ar.toLowerCase().includes(search.toLowerCase())) ||
            (d.clinic && d.clinic.name.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus =
            statusFilter === 'all'
                ? true
                : statusFilter === 'available'
                ? d.is_available_today
                : !d.is_available_today;

        return matchesSearch && matchesStatus;
    });

    const paginatedDoctors = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="space-y-6">
            {/* Unified Reusable Toolbar Component */}
            <TableToolbar
                search={search}
                onSearchChange={onSearchChange}
                searchPlaceholder="ابحث باسم الطبيب، التخصص، أو المستشفى..."
                filters={[
                    {
                        id: 'status',
                        value: statusFilter,
                        onChange: (val) => {
                            setStatusFilter(val as any);
                            setPage(1);
                        },
                        options: [
                            { value: 'all', label: 'كافة حالات الاستقبال' },
                            { value: 'available', label: 'مفعل ويستقبل فقط' },
                            { value: 'unavailable', label: 'معلّق مؤقتًا فقط' },
                        ],
                    },
                ]}
                actionLabel="إضافة طبيب جديد"
                onAction={onOpenAddModal}
                actionIcon={<Plus className="w-4 h-4" />}
            />

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                            <tr>
                                <th className="py-3.5 px-4">الطبيب</th>
                                <th className="py-3.5 px-4">التخصص والدرجة</th>
                                <th className="py-3.5 px-4">المنشأة الأساسية والفرعية</th>
                                <th className="py-3.5 px-4">رسوم الكشف</th>
                                <th className="py-3.5 px-4">متوسط الانتظار</th>
                                <th className="py-3.5 px-4">حالة الاستقبال</th>
                                <th className="py-3.5 px-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedDoctors.length > 0 ? (
                                paginatedDoctors.map((d) => (
                                    <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={
                                                        d.user.avatar ||
                                                        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&h=100&fit=crop&crop=faces'
                                                    }
                                                    alt={d.user.name}
                                                    className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100"
                                                />
                                                <div>
                                                    <div className="font-bold text-gray-900 font-['Cairo'] text-sm">
                                                        {d.user.name}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 font-mono" dir="ltr">
                                                        {d.user.phone || d.user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-[#005ab5]">{d.specialty.name_ar}</div>
                                            <div className="text-[11px] text-gray-500">{d.title_ar}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-col gap-1.5 min-w-[200px] max-w-[280px]">
                                                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span className="truncate">{d.clinic ? d.clinic.name : '—'}</span>
                                                </div>
                                                {d.doctor_facilities && d.doctor_facilities.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        {d.doctor_facilities.map((df, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-purple-50/80 border border-purple-100 text-purple-900 text-[10.5px]"
                                                            >
                                                                <span className="truncate">{df.facility.name}</span>
                                                                <span className="font-mono font-bold text-purple-700 shrink-0 text-[10px]">
                                                                    {df.consultation_fee} ر.س
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-emerald-600 font-mono">
                                            {d.consultation_fee} ر.س
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-600 font-bold">
                                            {d.waiting_time_minutes} دقيقة
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setStatusModal({
                                                        isOpen: true,
                                                        doctor: d,
                                                        loading: false,
                                                    })
                                                }
                                                className="flex items-center gap-1.5 text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity"
                                            >
                                                {d.is_available_today ? (
                                                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                                                ) : (
                                                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                                                )}
                                                <span className={d.is_available_today ? 'text-emerald-700' : 'text-gray-500'}>
                                                    {d.is_available_today ? 'مفعل ويستقبل' : 'معلّق'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenAssignFacilityModal(d)}
                                                    className="px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                                                    title="تعيين في منشأة أخرى"
                                                >
                                                    <Building2 className="w-3.5 h-3.5" />
                                                    <span>منشأة إضافية</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenEditModal(d)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-[#005ab5] hover:bg-blue-50 transition-colors cursor-pointer"
                                                    title="تعديل بيانات الطبيب"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">
                                        لا يوجد أطباء مطابقين لمعايير البحث المحددة
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

            {/* Reception Status Change Confirmation Modal */}
            <ConfirmStatusModal
                isOpen={statusModal.isOpen}
                onClose={() =>
                    setStatusModal({
                        isOpen: false,
                        doctor: null,
                        loading: false,
                    })
                }
                onConfirm={handleConfirmToggle}
                entityName={statusModal.doctor ? `${statusModal.doctor.user.name} (${statusModal.doctor.title_ar})` : ''}
                currentStatus={statusModal.doctor ? statusModal.doctor.is_available_today : false}
                statusType="availability"
                loading={statusModal.loading}
            />
        </div>
    );
};
