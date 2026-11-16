import React, { useMemo } from 'react';
import { Calendar, CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { cn, formatArabicDate, format12HourTime } from '@/lib/utils';
import {
    CustomSelect,
    ConfirmationStagesBadge,
    SearchBox,
    SurfaceCard,
    SectionHeader,
} from '@/components/common';
import { FacilityAppointmentRecord, FacilityAppointmentDoctor } from './types';

function resolveStatusBadge(status: string): { label: string; bg: string } {
    switch (status) {
        case 'completed':
            return { label: 'مكتمل (المرحلة 3: إنهاء الكشف)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
        case 'in_consultation':
            return { label: 'قيد الكشف الآن', bg: 'bg-blue-50 text-[#005ab5] border-blue-200' };
        case 'waiting':
            return { label: 'في صالة الانتظار (المرحلة 2: تأكيد الحضور)', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
        case 'confirmed':
            return { label: 'مؤكد من الإدارة (المرحلة 1: تأكيد الحجز)', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
        case 'booked':
            return { label: 'حجز جديد (بانتظار تأكيد الإدارة)', bg: 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse' };
        case 'cancelled':
            return { label: 'ملغي', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
        default:
            return { label: status, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
}

interface FacilityAppointmentsStatsProps {
    totalAppointments: number;
    completedCount: number;
    totalToday: number;
    cancelledCount: number;
}

export const FacilityAppointmentsStats: React.FC<FacilityAppointmentsStatsProps> = React.memo(({
    totalAppointments,
    completedCount,
    totalToday,
    cancelledCount,
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SurfaceCard padding="md" className="flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold text-slate-500 block">إجمالي سجل المواعيد</span>
                    <span className="text-2xl font-black text-[#005ab5] font-mono mt-1 block">
                        {totalAppointments}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">كافة الحجوزات المقيدة</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#005ab5]">
                    <Calendar className="w-6 h-6" />
                </div>
            </SurfaceCard>

            <SurfaceCard padding="md" className="flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold text-slate-500 block">كشوفات مكتملة</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                        {completedCount}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">تم إنهاء فحصها</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
            </SurfaceCard>

            <SurfaceCard padding="md" className="flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold text-slate-500 block">مواعيد اليوم النشطة</span>
                    <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">
                        {totalToday}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">حجوزات تاريخ اليوم</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Clock className="w-6 h-6" />
                </div>
            </SurfaceCard>

            <SurfaceCard padding="md" className="flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold text-slate-500 block">حالات ملغية / معتذرة</span>
                    <span className="text-2xl font-black text-rose-600 font-mono mt-1 block">
                        {cancelledCount}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">لم يتم الحضور</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                    <AlertCircle className="w-6 h-6" />
                </div>
            </SurfaceCard>
        </div>
    );
});
FacilityAppointmentsStats.displayName = 'FacilityAppointmentsStats';

interface FacilityAppointmentsToolbarProps {
    filteredCount: number;
    totalCount: number;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    statusFilter: string;
    onStatusChange: (val: string) => void;
    selectedDoctorId: string | number;
    onDoctorChange: (val: string | number) => void;
    selectedSpecialtyId: string | number;
    onSpecialtyChange: (val: string | number) => void;
    allAppointments: FacilityAppointmentRecord[];
    doctors: FacilityAppointmentDoctor[];
    specialties: Array<{ id: number; name_ar: string }>;
}

export const FacilityAppointmentsToolbar: React.FC<FacilityAppointmentsToolbarProps> = React.memo(({
    filteredCount,
    totalCount,
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    selectedDoctorId,
    onDoctorChange,
    selectedSpecialtyId,
    onSpecialtyChange,
    allAppointments,
    doctors,
    specialties,
}) => {
    const statusOptions = useMemo(
        () => [
            { value: 'all', label: `كافة الحالات (${allAppointments.length})` },
            { value: 'booked', label: `بانتظار تأكيد الإدارة (${allAppointments.filter((a) => a.status === 'booked').length})` },
            { value: 'confirmed', label: `مؤكد من الإدارة (${allAppointments.filter((a) => a.status === 'confirmed').length})` },
            { value: 'waiting', label: `في صالة الانتظار (${allAppointments.filter((a) => a.status === 'waiting').length})` },
            { value: 'in_consultation', label: `قيد الكشف (${allAppointments.filter((a) => a.status === 'in_consultation').length})` },
            { value: 'completed', label: `كشوفات مكتملة (${allAppointments.filter((a) => a.status === 'completed').length})` },
            { value: 'cancelled', label: `حجوزات ملغية (${allAppointments.filter((a) => a.status === 'cancelled').length})` },
        ],
        [allAppointments]
    );

    const doctorOptions = useMemo(
        () => [
            { value: 'all', label: 'جميع الأطباء بالمنشأة' },
            ...doctors.map((d) => ({
                value: d.id,
                label: `${d.user.name} (${d.specialty.name_ar})`,
            })),
        ],
        [doctors]
    );

    const specialtyOptions = useMemo(
        () => [
            { value: 'all', label: 'جميع التخصصات الطبية' },
            ...specialties.map((s) => ({
                value: s.id,
                label: s.name_ar,
            })),
        ],
        [specialties]
    );

    return (
        <>
            <SectionHeader
                className="mb-6"
                icon={<Calendar className="w-5 h-5 text-[#005ab5]" />}
                title="سجل المواعيد والتذاكر التاريخي الكامل"
                description="استعراض كافة الحجوزات السابقة والجارية وتفاصيل سدادها والتذاكر المرتبطة"
                actions={
                    <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                        المعروض: <span className="font-mono text-[#005ab5] font-black">{filteredCount}</span> من أصل{' '}
                        <span className="font-mono">{totalCount}</span> موعد
                    </div>
                }
            />

            <SurfaceCard
                variant="muted"
                padding="sm"
                rounded="2xl"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
            >
                <SearchBox
                    size="sm"
                    value={searchQuery}
                    onChange={onSearchChange}
                    placeholder="بحث برقم الحجز، الاسم، الجوال..."
                />

                <CustomSelect
                    size="sm"
                    value={statusFilter}
                    onChange={(val) => onStatusChange(String(val))}
                    options={statusOptions}
                    placeholder="حالة الموعد"
                />

                <CustomSelect
                    size="sm"
                    value={selectedDoctorId}
                    onChange={onDoctorChange}
                    options={doctorOptions}
                    placeholder="جميع الأطباء"
                />

                <CustomSelect
                    size="sm"
                    value={selectedSpecialtyId}
                    onChange={onSpecialtyChange}
                    options={specialtyOptions}
                    placeholder="جميع التخصصات"
                />
            </SurfaceCard>
        </>
    );
});
FacilityAppointmentsToolbar.displayName = 'FacilityAppointmentsToolbar';

interface FacilityAppointmentsTableProps {
    appointments: FacilityAppointmentRecord[];
}

export const FacilityAppointmentsTable: React.FC<FacilityAppointmentsTableProps> = React.memo(({ appointments }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
                <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200/80">
                    <tr>
                        <th className="py-3.5 px-4 font-['Cairo']">رقم الحجز</th>
                        <th className="py-3.5 px-4 font-['Cairo']">بيانات المريض</th>
                        <th className="py-3.5 px-4 font-['Cairo']">الطبيب والتخصص</th>
                        <th className="py-3.5 px-4 font-['Cairo']">التاريخ والوقت</th>
                        <th className="py-3.5 px-4 font-['Cairo'] text-center">مسار التأكيد</th>
                        <th className="py-3.5 px-4 font-['Cairo']">حالة الحضور</th>
                        <th className="py-3.5 px-4 font-['Cairo']">الرسوم والسداد</th>
                        <th className="py-3.5 px-4 font-['Cairo'] text-center">التتبع المباشر</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {appointments.length > 0 ? (
                        appointments.map((appt) => {
                            const badge = resolveStatusBadge(appt.status);
                            return (
                                <tr key={appt.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">
                                            {appt.booking_reference}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 text-[#005ab5] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                {appt.patient.name ? appt.patient.name[0] : 'م'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-slate-900 text-xs truncate max-w-[140px]">
                                                    {appt.patient.name}
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
                                                    {appt.patient.phone}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <div className="font-bold text-slate-900 text-xs">{appt.doctor.user.name}</div>
                                        <div className="text-[11px] text-[#005ab5] font-medium mt-0.5">
                                            {appt.doctor.specialty?.name_ar || appt.doctor.title_ar}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <div className="font-bold text-slate-900 text-xs">
                                            {formatArabicDate(appt.appointment_date)}
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                            {format12HourTime(appt.appointment_time)}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <ConfirmationStagesBadge
                                            stages={appt.confirmation_stages}
                                            status={appt.status}
                                            compact={true}
                                        />
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block', badge.bg)}>
                                            {badge.label}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <span className="font-bold text-emerald-700 block">
                                            {appt.payment_method === 'insurance'
                                                ? 'تأمين طبي (معتمد)'
                                                : appt.payment_method === 'pos'
                                                  ? 'مدى (Mada)'
                                                  : appt.payment_method === 'card'
                                                    ? 'بطاقة دفع'
                                                    : 'نقداً بالعيادة'}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-500">
                                            {appt.total_amount} ر.س
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <a
                                            href={`/queue/${appt.booking_reference}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#005ab5] hover:bg-blue-50 transition-colors inline-block"
                                            title="عرض شاشة التتبع الحي"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                                لا توجد مواعيد مطابقة لخيارات الفلترة المحددة.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
});
FacilityAppointmentsTable.displayName = 'FacilityAppointmentsTable';
