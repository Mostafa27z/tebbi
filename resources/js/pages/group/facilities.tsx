import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { GroupDashboardLayout } from '@/layouts/group-dashboard-layout';
import {
    Facility,
    Doctor,
    StaffAssignment,
    GroupInfo,
    GroupMetrics,
    FacilitiesTab,
    AddFacilityModal,
    AssignStaffModal,
    AddDoctorModal,
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

export default function GroupFacilities({
    group,
    facilities = [],
    doctors = [],
    specialties = [],
    staffAssignments = [],
}: Props) {
    const [facilityModalOpen, setFacilityModalOpen] = useState(false);

    return (
        <GroupDashboardLayout
            activeTab="facilities"
            group={group}
            counts={{
                facilities: facilities.length,
                doctors: doctors.length,
                staff: staffAssignments.length,
            }}
            onOpenAddModal={() => setFacilityModalOpen(true)}
            addModalLabel="إضافة منشأة طبية جديدة"
        >
            <Head title={`المستشفيات والعيادات التابعة - ${group.name_ar}`} />

            <div className="space-y-6 font-['Tajawal']" dir="rtl">
                {/* Page Intro Banner */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-gray-500 font-['Cairo']">
                                شبكة الفروع المعتمدة
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-['Cairo']">
                            المستشفيات والمراكز التابعة لمجموعة {group.name_ar}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            إدارة المنشآت الطبية، ترخيص وزارة الصحة، ومتابعة الأطباء والكوادر لكل فرع.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold font-mono">
                            {facilities.length} منشأة مسجلة
                        </div>
                    </div>
                </div>

                {/* Facilities List & Toolbar */}
                <FacilitiesTab
                    facilities={facilities}
                    onOpenAddModal={() => setFacilityModalOpen(true)}
                />
            </div>

            {/* Modal */}
            <AddFacilityModal
                isOpen={facilityModalOpen}
                onClose={() => setFacilityModalOpen(false)}
                groupId={group.id}
                groupName={group.name_ar}
            />
        </GroupDashboardLayout>
    );
}
