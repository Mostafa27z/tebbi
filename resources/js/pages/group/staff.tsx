import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { GroupDashboardLayout } from '@/layouts/group-dashboard-layout';
import {
    Facility,
    Doctor,
    StaffAssignment,
    GroupInfo,
    GroupMetrics,
    StaffTab,
    AssignStaffModal,
    SpecialtyOption,
} from '@/components/group';

interface Props {
    group: GroupInfo;
    groups?: Array<{ id: number; name_ar: string }>;
    metrics: GroupMetrics;
    facilities: Facility[];
    doctors: Doctor[];
    specialties?: SpecialtyOption[];
    staffAssignments: StaffAssignment[];
}

export default function GroupStaff({
    group,
    facilities = [],
    doctors = [],
    specialties = [],
    staffAssignments = [],
}: Props) {
    const [staffModalOpen, setStaffModalOpen] = useState(false);

    return (
        <GroupDashboardLayout
            activeTab="staff"
            group={group}
            counts={{
                facilities: facilities.length,
                doctors: doctors.length,
                staff: staffAssignments.length,
            }}
            onOpenAddModal={() => setStaffModalOpen(true)}
            addModalLabel="تعيين مشرف أو استقبال"
        >
            <Head title={`المشرفون والصلاحيات - ${group.name_ar}`} />

            <div className="space-y-6 font-['Tajawal']" dir="rtl">
                {/* Page Intro Banner */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-gray-500 font-['Cairo']">
                                حوكمة الصلاحيات والكوادر الإدارية
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-['Cairo']">
                            المشرفون وموظفو الاستقبال - {group.name_ar}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            إدارة صلاحيات الوصول للفروع، تعيين مدراء المنشآت الطبية، وموظفي الاستقبال اليومي.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-2xl bg-amber-50 text-amber-800 text-xs font-bold font-mono">
                            {staffAssignments.length} موظف ومسؤول
                        </div>
                    </div>
                </div>

                {/* Staff List & Toolbar */}
                <StaffTab
                    staffAssignments={staffAssignments}
                    onOpenAddModal={() => setStaffModalOpen(true)}
                />
            </div>

            {/* Modal */}
            <AssignStaffModal
                isOpen={staffModalOpen}
                onClose={() => setStaffModalOpen(false)}
                groupId={group.id}
                facilities={facilities}
            />
        </GroupDashboardLayout>
    );
}
