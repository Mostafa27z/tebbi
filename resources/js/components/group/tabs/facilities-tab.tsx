import React, { useState, useMemo } from 'react';
import { Facility } from '../types';
import { Pagination } from '@/components/common/pagination';
import { TableToolbar } from '@/components/common/table-toolbar';
import {
    MapPin,
    Phone,
    ShieldCheck,
    Plus,
    Building2,
} from 'lucide-react';

interface FacilitiesTabProps {
    facilities: Facility[];
    onOpenAddModal: () => void;
}

export const FacilitiesTab: React.FC<FacilitiesTabProps> = ({
    facilities,
    onOpenAddModal,
}) => {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'hospital' | 'clinic'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);

    const filteredFacilities = useMemo(() => {
        const query = search.trim().toLowerCase();
        return facilities.filter((f) => {
            const matchesSearch =
                !query ||
                f.name.toLowerCase().includes(query) ||
                f.city.toLowerCase().includes(query) ||
                f.district.toLowerCase().includes(query) ||
                (f.branch_name && f.branch_name.toLowerCase().includes(query));

            const matchesType = typeFilter === 'all' ? true : f.type === typeFilter;
            const matchesStatus =
                statusFilter === 'all'
                    ? true
                    : statusFilter === 'active'
                    ? f.is_active
                    : !f.is_active;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [facilities, search, typeFilter, statusFilter]);

    const paginatedFacilities = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredFacilities.slice(start, start + pageSize);
    }, [filteredFacilities, currentPage, pageSize]);

    return (
        <div className="space-y-6">
            {/* Unified Reusable Toolbar Component */}
            <TableToolbar
                search={search}
                onSearchChange={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                }}
                searchPlaceholder="البحث عن مستشفى أو عيادة أو مدينة أو حي..."
                filters={[
                    {
                        id: 'type',
                        value: typeFilter,
                        onChange: (val) => {
                            setTypeFilter(val as any);
                            setCurrentPage(1);
                        },
                        options: [
                            { value: 'all', label: 'كافة أنواع المنشآت' },
                            { value: 'hospital', label: 'مستشفيات رئيسية' },
                            { value: 'clinic', label: 'عيادات تخصصية' },
                        ],
                    },
                    {
                        id: 'status',
                        value: statusFilter,
                        onChange: (val) => {
                            setStatusFilter(val as any);
                            setCurrentPage(1);
                        },
                        options: [
                            { value: 'all', label: 'كافة الحالات' },
                            { value: 'active', label: 'نشط فقط' },
                            { value: 'inactive', label: 'معطّل فقط' },
                        ],
                    },
                ]}
                actionLabel="إضافة مستشفى أو عيادة تابعة"
                onAction={onOpenAddModal}
                actionIcon={<Plus className="w-4 h-4" />}
            />

            {/* Grid */}
            {paginatedFacilities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedFacilities.map((f) => (
                        <div
                            key={f.id}
                            className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div>
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block mb-1.5 ${
                                                f.type === 'hospital'
                                                    ? 'bg-blue-50 text-[#005ab5]'
                                                    : 'bg-purple-50 text-purple-700'
                                            }`}
                                        >
                                            {f.type === 'hospital' ? 'مستشفى رئيسي' : 'عيادة تخصصية'}
                                        </span>
                                        <h3 className="font-bold text-gray-900 font-['Cairo'] text-base group-hover:text-[#005ab5] transition-colors">
                                            {f.name}
                                        </h3>
                                        {f.branch_name && (
                                            <p className="text-xs text-gray-500 font-medium">{f.branch_name}</p>
                                        )}
                                    </div>
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                                            f.is_active
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-red-50 text-red-600'
                                        }`}
                                    >
                                        {f.is_active ? 'نشط' : 'معطل'}
                                    </span>
                                </div>

                                <div className="space-y-2 text-xs text-gray-600 my-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <span>
                                            {f.city} - {f.district}
                                        </span>
                                    </div>
                                    {f.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span dir="ltr" className="font-mono">
                                                {f.phone}
                                            </span>
                                        </div>
                                    )}
                                    {f.moh_license_no && (
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5 text-[#006b5c] shrink-0" />
                                            <span className="font-mono">MOH: {f.moh_license_no}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                <span className="font-bold text-gray-700">
                                    {f.doctor_profiles_count ?? 0} استشاري مسجل
                                </span>
                                <span
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                                        f.is_verified
                                            ? 'bg-blue-50 text-[#005ab5]'
                                            : 'bg-amber-50 text-amber-700'
                                    }`}
                                >
                                    {f.is_verified ? 'معتمد رسمياً' : 'قيد التدقيق'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-gray-200/80">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-base font-bold text-gray-800 font-['Cairo']">لا توجد منشآت مطابقة</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        لم نعثر على أي منشأة تطابق معايير البحث والفلترة المحددة
                    </p>
                </div>
            )}

            {/* Pagination */}
            {filteredFacilities.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredFacilities.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                    pageSizeOptions={[6, 9, 18, 36]}
                />
            )}
        </div>
    );
};
