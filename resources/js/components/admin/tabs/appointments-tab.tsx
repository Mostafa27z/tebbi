import React from 'react';
import { Appointment } from '../types';
import { Pagination } from '@/components/common/pagination';
import { TableToolbar } from '@/components/common/table-toolbar';
import { Calendar, Clock, Stethoscope, Building2 } from 'lucide-react';

interface AppointmentsTabProps {
    appointments: Appointment[];
    search: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
    appointments,
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
}) => {
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
            const [year, month, day] = cleanDate.split('-');
            if (year && month && day) {
                return `${year}/${month}/${day}`;
            }
            return cleanDate;
        } catch {
            return dateStr;
        }
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        try {
            const parts = timeStr.split(':');
            if (parts.length >= 2) {
                let hours = parseInt(parts[0], 10);
                const minutes = parts[1];
                const isPm = hours >= 12;
                hours = hours % 12 || 12;
                const period = isPm ? 'م' : 'ص';
                return `${hours}:${minutes} ${period}`;
            }
            return timeStr;
        } catch {
            return timeStr;
        }
    };

    const filtered = appointments.filter((a) => {
        const matchesSearch =
            a.booking_reference.toLowerCase().includes(search.toLowerCase()) ||
            a.patient.name.toLowerCase().includes(search.toLowerCase()) ||
            a.doctor.user.name.toLowerCase().includes(search.toLowerCase()) ||
            (a.facility?.name && a.facility.name.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter === 'all' ? true : a.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const paginatedAppointments = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="space-y-6">
            {/* Unified Reusable Toolbar Component */}
            <TableToolbar
                search={search}
                onSearchChange={onSearchChange}
                searchPlaceholder="ابحث برقم الحجز، اسم المريض، الطبيب أو المنشأة..."
                filters={[
                    {
                        id: 'status',
                        value: statusFilter,
                        onChange: (val) => {
                            onStatusFilterChange(val);
                            setPage(1);
                        },
                        options: [
                            { value: 'all', label: 'كافة حالات الحجز' },
                            { value: 'waiting', label: 'في الانتظار (Waiting)' },
                            { value: 'in_consultation', label: 'قيد الكشف (In Consultation)' },
                            { value: 'completed', label: 'مكتمل (Completed)' },
                            { value: 'cancelled', label: 'ملغي (Cancelled)' },
                        ],
                    },
                ]}
            />

            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                            <tr>
                                <th className="py-3.5 px-4">رقم الحجز والتذكرة</th>
                                <th className="py-3.5 px-4">المريض</th>
                                <th className="py-3.5 px-4">الطبيب والتخصص</th>
                                <th className="py-3.5 px-4">المنشأة الطبية</th>
                                <th className="py-3.5 px-4">تاريخ ووقت الكشف</th>
                                <th className="py-3.5 px-4 text-center">حالة الحجز</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedAppointments.length > 0 ? (
                                paginatedAppointments.map((appt) => (
                                    <tr key={appt.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                                            <div className="text-sm text-[#005ab5]">{appt.booking_reference}</div>
                                            {appt.queueTicket && (
                                                <div className="text-[10px] text-gray-400 font-mono">
                                                    تذكرة انتظار #{appt.queueTicket.ticket_number}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-gray-900 font-['Cairo'] text-sm">
                                                {appt.patient.name}
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-mono" dir="ltr">
                                                {appt.patient.phone}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-gray-800 flex items-center gap-1.5">
                                                <Stethoscope className="w-3.5 h-3.5 text-[#005ab5]" />
                                                <span>{appt.doctor.user.name}</span>
                                            </div>
                                            <div className="text-[11px] text-gray-400 mr-5">
                                                {appt.doctor.specialty?.name_ar || 'عام'}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-gray-700 flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{appt.facility?.name || appt.doctor.clinic?.name || 'العيادة العامة'}</span>
                                            </div>
                                            {appt.facility?.city && (
                                                <div className="text-[11px] text-gray-400 mr-5">
                                                    {appt.facility.city}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-gray-800 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-[#005ab5]" />
                                                <span className="font-mono">{formatDate(appt.appointment_date)}</span>
                                            </div>
                                            <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                <span>{formatTime(appt.appointment_time)}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span
                                                className={`px-3 py-1 rounded-full text-[11px] font-bold inline-block ${
                                                    appt.status === 'completed'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : appt.status === 'in_consultation'
                                                        ? 'bg-blue-50 text-[#005ab5] border border-blue-200'
                                                        : appt.status === 'waiting'
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-red-50 text-red-600 border border-red-200'
                                                }`}
                                            >
                                                {appt.status === 'completed'
                                                    ? 'مكتمل'
                                                    : appt.status === 'in_consultation'
                                                    ? 'قيد الكشف'
                                                    : appt.status === 'waiting'
                                                    ? 'في الانتظار'
                                                    : 'ملغي'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400 font-bold">
                                        لا توجد حجوزات تطابق البحث المحدد
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
        </div>
    );
};
