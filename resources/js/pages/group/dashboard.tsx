import React, { useState, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import { GroupDashboardLayout } from '@/layouts/group-dashboard-layout';
import {
    Facility,
    Doctor,
    StaffAssignment,
    GroupInfo,
    GroupMetrics,
    SpecialtyOption,
    AddFacilityModal,
    AssignStaffModal,
    AddDoctorModal,
    AddGroupSpecialtyModal,
} from '@/components/group';
import {
    GroupOverviewHero,
    GroupOverviewMetrics,
    GroupOverviewSnapshots,
} from '@/components/group/overview/group-dashboard-sections';

interface Props {
    group: GroupInfo;
    groups?: Array<{ id: number; name_ar: string }>;
    metrics: GroupMetrics;
    facilities: Facility[];
    doctors: Doctor[];
    specialties?: SpecialtyOption[];
    staffAssignments: StaffAssignment[];
}

export default function GroupDashboard({
    group,
    metrics,
    facilities = [],
    doctors = [],
    specialties = [],
    staffAssignments = [],
}: Props) {
    const [facilityModalOpen, setFacilityModalOpen] = useState(false);
    const [staffModalOpen, setStaffModalOpen] = useState(false);
    const [doctorModalOpen, setDoctorModalOpen] = useState(false);
    const [specialtyModalOpen, setSpecialtyModalOpen] = useState(false);

    const openFacilityModal = useCallback(() => setFacilityModalOpen(true), []);
    const openDoctorModal = useCallback(() => setDoctorModalOpen(true), []);
    const openStaffModal = useCallback(() => setStaffModalOpen(true), []);
    const openSpecialtyModal = useCallback(() => setSpecialtyModalOpen(true), []);

    return (
        <GroupDashboardLayout
            activeTab="overview"
            group={group}
            counts={{
                facilities: facilities.length,
                doctors: doctors.length,
                specialties: specialties.length,
                staff: staffAssignments.length,
            }}
            onOpenAddModal={openFacilityModal}
            addModalLabel="إضافة منشأة طبية"
        >
            <Head title={`طبيبي - لوحة إدارة ${group.name_ar}`} />

            <div className="space-y-8 font-['Tajawal']" dir="rtl">
                <GroupOverviewHero
                    group={group}
                    onAddFacility={openFacilityModal}
                    onAddDoctor={openDoctorModal}
                    onAddSpecialty={openSpecialtyModal}
                    onAssignStaff={openStaffModal}
                />

                <GroupOverviewMetrics metrics={metrics} />

                <GroupOverviewSnapshots
                    facilities={facilities}
                    staffAssignments={staffAssignments}
                    doctors={doctors}
                    specialties={specialties}
                    onAssignStaff={openStaffModal}
                    onAddSpecialty={openSpecialtyModal}
                />
            </div>

            <AddFacilityModal
                isOpen={facilityModalOpen}
                onClose={() => setFacilityModalOpen(false)}
                groupId={group.id}
                groupName={group.name_ar}
                specialties={specialties}
            />

            <AssignStaffModal
                isOpen={staffModalOpen}
                onClose={() => setStaffModalOpen(false)}
                groupId={group.id}
                facilities={facilities}
            />

            <AddDoctorModal
                isOpen={doctorModalOpen}
                onClose={() => setDoctorModalOpen(false)}
                groupId={group.id}
                facilities={facilities}
                specialties={specialties}
            />

            <AddGroupSpecialtyModal
                isOpen={specialtyModalOpen}
                onClose={() => setSpecialtyModalOpen(false)}
                groupId={group.id}
                facilities={facilities}
            />
        </GroupDashboardLayout>
    );
}
