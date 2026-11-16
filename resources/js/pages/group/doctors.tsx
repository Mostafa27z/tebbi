import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { GroupDashboardLayout } from '@/layouts/group-dashboard-layout';
import {
    Facility,
    Doctor,
    StaffAssignment,
    GroupInfo,
    GroupMetrics,
    DoctorsTab,
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

export default function GroupDoctors({
    group,
    facilities = [],
    doctors = [],
    specialties = [],
    staffAssignments = [],
}: Props) {
    const [doctorModalOpen, setDoctorModalOpen] = useState(false);

    return (
        <GroupDashboardLayout
            activeTab="doctors"
            group={group}
            counts={{
                facilities: facilities.length,
                doctors: doctors.length,
                staff: staffAssignments.length,
            }}
            onOpenAddModal={() => setDoctorModalOpen(true)}
            addModalLabel="إضافة استشاري جديد"
        >
            <Head title={`الأطباء والاستشاريون - ${group.name_ar}`} />

            <div className="space-y-6 font-['Tajawal']" dir="rtl">
                {/* Page Intro Banner */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-gray-500 font-['Cairo']">
                                الكوادر الطبية المتخصصة
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-['Cairo']">
                            الأطباء والاستشاريون بمجموعة {group.name_ar}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            استعراض الأطباء المعتمدين، توزيعهم على فروع المستشفيات والعيادات، وتفاصيل رسوم الكشف والتخصصات.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-2xl bg-purple-50 text-purple-800 text-xs font-bold font-mono">
                            {doctors.length} استشاري معتمد
                        </div>
                    </div>
                </div>

                {/* Doctors List & Toolbar */}
                <DoctorsTab
                    doctors={doctors}
                    onOpenAddModal={() => setDoctorModalOpen(true)}
                />
            </div>

            {/* Modal */}
            <AddDoctorModal
                isOpen={doctorModalOpen}
                onClose={() => setDoctorModalOpen(false)}
                groupId={group.id}
                facilities={facilities}
                specialties={specialties}
            />
        </GroupDashboardLayout>
    );
}
