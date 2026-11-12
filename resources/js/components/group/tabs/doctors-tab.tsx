import React, { useState, useMemo } from 'react';
import { Doctor } from '../types';
import { Pagination } from '@/components/common/pagination';
import { TableToolbar } from '@/components/common/table-toolbar';
import { UserPlus, Users, Building2 } from 'lucide-react';

interface DoctorsTabProps {
    doctors: Doctor[];
    onOpenAddModal: () => void;
}

export const DoctorsTab: React.FC<DoctorsTabProps> = ({
    doctors,
    onOpenAddModal,
}) => {
    const [search, setSearch] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Extract unique specialties
    const uniqueSpecialties = useMemo(() => {
        const map = new Map<string, string>();
        doctors.forEach((d) => {
            if (d.specialty?.name_ar) {
                map.set(d.specialty.name_ar, d.specialty.name_ar);
            }
        });
        return Array.from(map.values());
    }, [doctors]);

    const filteredDoctors = useMemo(() => {
        const query = search.trim().toLowerCase();
        return doctors.filter((d) => {
            const matchesSearch =
                !query ||
                d.user.name.toLowerCase().includes(query) ||
                (d.specialty?.name_ar && d.specialty.name_ar.toLowerCase().includes(query)) ||
                (d.title_ar && d.title_ar.toLowerCase().includes(query)) ||
                (d.subspecialty && d.subspecialty.toLowerCase().includes(query));

            const matchesSpecialty =
                specialtyFilter === 'all' ? true : d.specialty?.name_ar === specialtyFilter;

            return matchesSearch && matchesSpecialty;
        });
    }, [doctors, search, specialtyFilter]);

    const paginatedDoctors = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredDoctors.slice(start, start + pageSize);
    }, [filteredDoctors, currentPage, pageSize]);

    return (
        <div className="space-y-6">
            {/* Unified Reusable Toolbar Component */}
            <TableToolbar
                search={search}
                onSearchChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                }}
                searchPlaceholder="البحث عن طبيب بالاسم أو التخصص الطبي أو اللقب..."
                filters={[
                    {
                        id: 'specialty',
                        value: specialtyFilter,
                        onChange: (val) => {
                            setSpecialtyFilter(val);
                            setCurrentPage(1);
                        },
                        options: [
                            { value: 'all', label: 'كافة التخصصات الطبية' },
                            ...uniqueSpecialties.map((s) => ({ value: s, label: s })),
                        ],
                    },
                ]}
                actionLabel="إضافة استشاري جديد"
                onAction={onOpenAddModal}
                actionIcon={<UserPlus className="w-4 h-4" />}
            />

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                            <tr>
                                <th className="py-3.5 px-4">الطبيب</th>
                                <th className="py-3.5 px-4">التخصص العام والدقيق</th>
                                <th className="py-3.5 px-4">الفروع المتاح بها</th>
                                <th className="py-3.5 px-4">سعر الكشف</th>
                                <th className="py-3.5 px-4">حالة الاعتماد</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedDoctors.length > 0 ? (
                                paginatedDoctors.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-gray-900 font-['Cairo'] text-sm">
                                                {doc.user.name}
                                            </div>
                                            <div className="text-[11px] text-gray-400 mt-0.5">{doc.title_ar}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-bold text-[#005ab5] block">
                                                {doc.specialty?.name_ar || 'غير محدد'}
                                            </span>
                                            {doc.subspecialty && (
                                                <span className="text-[11px] text-gray-400 block mt-0.5">
                                                    {doc.subspecialty}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-col gap-1.5 min-w-[190px] max-w-[260px]">
                                                {doc.doctor_facilities && doc.doctor_facilities.length > 0 ? (
                                                    doc.doctor_facilities.map((df, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200/80 text-gray-800 text-[11px]"
                                                        >
                                                            <div className="flex items-center gap-1.5 truncate">
                                                                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                                <span className="truncate font-medium">{df.facility.name}</span>
                                                            </div>
                                                            <span className="font-mono font-bold text-emerald-700 shrink-0 text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-100">
                                                                {df.consultation_fee} ر.س
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span>{doc.clinic?.name || 'الفرع الرئيسي للمجمع'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 font-black text-emerald-600 font-mono text-sm">
                                            {doc.consultation_fee} ر.س
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold inline-block">
                                                مرخص ومفعل
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center">
                                        <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 font-bold font-['Cairo']">لا يوجد أطباء مطابقين للبحث</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {filteredDoctors.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredDoctors.length}
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
