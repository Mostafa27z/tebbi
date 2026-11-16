import React, { useMemo } from 'react';
import { Link, router } from '@inertiajs/react';
import { Clock, UserCheck, CalendarCheck2, Calendar } from 'lucide-react';
import {
    CustomSelect,
    SearchBox,
    AppButton,
    SurfaceCard,
    SectionHeader,
} from '@/components/common';
import { ReceptionAppointment, ReceptionDoctor, ReceptionSpecialtyItem } from './types';

interface ReceptionQueueToolbarProps {
    canManageStaff: boolean;
    receptionistsCount: number;
    filteredCount: number;
    totalAppointmentsCount: number;
    selectedDateFilter: string;
    todayDate: string;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    statusFilter: string;
    onStatusChange: (val: string) => void;
    selectedDoctorId: string | number;
    onDoctorChange: (val: string | number) => void;
    selectedSpecialtyId: string | number;
    onSpecialtyChange: (val: string | number) => void;
    appointments: ReceptionAppointment[];
    doctors: ReceptionDoctor[];
    specialties: ReceptionSpecialtyItem[];
}

export const ReceptionQueueToolbar: React.FC<ReceptionQueueToolbarProps> = React.memo(({
    canManageStaff,
    receptionistsCount,
    filteredCount,
    totalAppointmentsCount,
    selectedDateFilter,
    todayDate,
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    selectedDoctorId,
    onDoctorChange,
    selectedSpecialtyId,
    onSpecialtyChange,
    appointments,
    doctors,
    specialties,
}) => {
    const statusFilterOptions = useMemo(
        () => [
            { value: 'all', label: `كل الحالات (${appointments.length})` },
            {
                value: 'confirmed',
                label: `لم يحضروا بعد (${appointments.filter((a) => a.status === 'confirmed' || a.status === 'booked').length})`,
            },
            {
                value: 'waiting',
                label: `في صالة الانتظار (${appointments.filter((a) => a.status === 'waiting').length})`,
            },
            {
                value: 'in_consultation',
                label: `قيد الكشف (${appointments.filter((a) => a.status === 'in_consultation').length})`,
            },
            {
                value: 'completed',
                label: `مكتملة (${appointments.filter((a) => a.status === 'completed').length})`,
            },
            {
                value: 'cancelled',
                label: `ملغية (${appointments.filter((a) => a.status === 'cancelled').length})`,
            },
        ],
        [appointments]
    );

    const doctorFilterOptions = useMemo(
        () => [
            { value: 'all', label: 'جميع أطباء المنشأة' },
            ...doctors.map((d) => ({
                value: d.id,
                label: `${d.user.name} (${d.specialty.name_ar})`,
            })),
        ],
        [doctors]
    );

    const specialtyFilterOptions = useMemo(
        () => [
            { value: 'all', label: 'جميع التخصصات الطبية' },
            ...specialties.map((s) => ({
                value: s.id,
                label: s.name_ar,
            })),
        ],
        [specialties]
    );

    const isTodaySelected =
        selectedDateFilter !== 'all' && (selectedDateFilter === todayDate || !selectedDateFilter);

    return (
        <div className="flex flex-col gap-4 mb-6">
            <SectionHeader
                icon={<Clock className="w-5 h-5 text-[#005ab5]" />}
                title="طابور الحضور وإدارة عمليات الاستقبال المباشرة"
                description="يمكنك تعديل حالة الحضور فوراً، أو تحصيل رسوم الكشف ونوع السداد مباشرة من الجدول"
                actions={
                    <>
                        {canManageStaff && (
                            <Link
                                href="/facility/receptionists"
                                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors"
                            >
                                <UserCheck className="w-4 h-4 text-emerald-600" />
                                <span>موظفو الاستقبال ({receptionistsCount})</span>
                            </Link>
                        )}
                        <div className="text-xs font-bold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 flex items-center gap-2">
                            <span>المعروض بالجدول:</span>
                            <span className="font-mono font-black text-[#005ab5] text-sm">
                                {filteredCount}
                            </span>
                            <span className="text-slate-400">/</span>
                            <span className="font-mono text-slate-600">
                                {totalAppointmentsCount}
                            </span>
                            <span>موعد</span>
                        </div>
                    </>
                }
            />

            <SurfaceCard
                variant="blue"
                padding="sm"
                rounded="2xl"
                className="flex flex-wrap items-center justify-between gap-3"
            >
                <div className="flex flex-wrap items-center gap-2">
                    <AppButton
                        size="sm"
                        variant={isTodaySelected ? 'primary' : 'outline'}
                        icon={<Clock className="w-3.5 h-3.5" />}
                        onClick={() =>
                            router.get(
                                '/facility/dashboard',
                                { date: todayDate },
                                { preserveState: true, preserveScroll: true }
                            )
                        }
                    >
                        حالات اليوم المباشرة
                    </AppButton>

                    <AppButton
                        size="sm"
                        variant={selectedDateFilter === 'all' ? 'primary' : 'outline'}
                        icon={<CalendarCheck2 className="w-3.5 h-3.5" />}
                        onClick={() =>
                            router.get(
                                '/facility/dashboard',
                                { date: 'all' },
                                { preserveState: true, preserveScroll: true }
                            )
                        }
                    >
                        كافة المواعيد والتواريخ
                    </AppButton>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-[#005ab5]" />
                    <span className="text-[11px] font-bold text-slate-600">تاريخ مخصص:</span>
                    <input
                        type="date"
                        value={selectedDateFilter !== 'all' ? selectedDateFilter : ''}
                        onChange={(e) => {
                            if (e.target.value) {
                                router.get(
                                    '/facility/dashboard',
                                    { date: e.target.value },
                                    { preserveState: true, preserveScroll: true }
                                );
                            }
                        }}
                        className="text-xs font-bold bg-transparent border-0 focus:ring-0 p-0 text-slate-800 cursor-pointer"
                    />
                </div>
            </SurfaceCard>

            <SurfaceCard
                variant="muted"
                padding="sm"
                rounded="2xl"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
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
                    options={statusFilterOptions}
                    placeholder="حالة الموعد"
                />

                <CustomSelect
                    size="sm"
                    value={selectedDoctorId}
                    onChange={(val) => onDoctorChange(val)}
                    options={doctorFilterOptions}
                    placeholder="جميع الأطباء بالمنشأة"
                />

                <CustomSelect
                    size="sm"
                    value={selectedSpecialtyId}
                    onChange={(val) => onSpecialtyChange(val)}
                    options={specialtyFilterOptions}
                    placeholder="جميع التخصصات"
                />
            </SurfaceCard>
        </div>
    );
});
ReceptionQueueToolbar.displayName = 'ReceptionQueueToolbar';
