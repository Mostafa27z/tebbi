import React, { useState, useMemo, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { FacilityDashboardLayout } from '@/layouts/facility-dashboard-layout';
import {
    FacilityDoctor,
    FacilitySpecialtyItem,
    AvailableFacilityDoctor,
    FacilityDoctorsStats,
    FacilityDoctorsToolbar,
    FacilityDoctorCard,
    AddFacilityDoctorModal,
    EditFacilityDoctorModal,
    ViewFacilityDoctorModal,
    DeleteFacilityDoctorModal,
    TogglePresenceModal,
} from '@/components/facility/doctors';

interface Props {
    facility: {
        id: number;
        name: string;
        branch_name?: string;
        city: string;
    };
    metrics: {
        doctorsCount: number;
        activeDoctorsCount: number;
        specialtiesCount: number;
        totalToday: number;
        waitingCount: number;
        inConsultationCount: number;
        completedCount: number;
        receptionistsCount?: number;
    };
    doctors: FacilityDoctor[];
    specialties: FacilitySpecialtyItem[];
    allSpecialties?: FacilitySpecialtyItem[];
    availableDoctors?: AvailableFacilityDoctor[];
    canManageFacility?: boolean;
}

export default function FacilityDoctorsPage({
    facility,
    metrics,
    doctors,
    specialties,
    allSpecialties = [],
    availableDoctors = [],
    canManageFacility,
}: Props) {
    const { props } = usePage();
    const authUser = (props as any).auth?.user;
    const isManager =
        canManageFacility ??
        (authUser?.role === 'admin' || Boolean(authUser?.is_group_admin) || Boolean(authUser?.is_facility_admin));

    const [searchQuery, setSearchQuery] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
    const [presenceFilter, setPresenceFilter] = useState<'all' | 'available' | 'unavailable'>('all');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewDoctor, setViewDoctor] = useState<FacilityDoctor | null>(null);
    const [editDoctor, setEditDoctor] = useState<FacilityDoctor | null>(null);
    const [deleteDoctor, setDeleteDoctor] = useState<FacilityDoctor | null>(null);
    const [presenceDoctor, setPresenceDoctor] = useState<FacilityDoctor | null>(null);

    const filteredDoctors = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return doctors.filter((doc) => {
            const matchesSearch =
                !q ||
                doc.user.name.toLowerCase().includes(q) ||
                doc.specialty.name_ar.toLowerCase().includes(q) ||
                doc.title_ar.toLowerCase().includes(q) ||
                (doc.subspecialty && doc.subspecialty.toLowerCase().includes(q));

            const matchesSpecialty = specialtyFilter === 'all' || doc.specialty.id === Number(specialtyFilter);

            const matchesPresence =
                presenceFilter === 'all' ||
                (presenceFilter === 'available' ? doc.is_available_today : !doc.is_available_today);

            return matchesSearch && matchesSpecialty && matchesPresence;
        });
    }, [doctors, searchQuery, specialtyFilter, presenceFilter]);

    const handleOpenAddModal = useCallback(() => setIsAddModalOpen(true), []);
    const handleCloseAddModal = useCallback(() => setIsAddModalOpen(false), []);
    const handleCloseViewModal = useCallback(() => setViewDoctor(null), []);
    const handleCloseEditModal = useCallback(() => setEditDoctor(null), []);
    const handleCloseDeleteModal = useCallback(() => setDeleteDoctor(null), []);
    const handleClosePresenceModal = useCallback(() => setPresenceDoctor(null), []);

    return (
        <FacilityDashboardLayout
            activeTab="doctors"
            facilityName={facility.name}
            branchName={facility.branch_name}
            counts={{
                waiting: metrics.waitingCount,
                doctors: metrics.doctorsCount,
                specialties: specialties?.length || metrics.specialtiesCount,
                appointments: metrics.totalToday,
                receptionists: metrics.receptionistsCount,
            }}
        >
            <Head title={`إدارة أطباء المنشأة - ${facility.name}`} />

            <div className="space-y-6">
                <FacilityDoctorsStats
                    totalDoctors={doctors.length}
                    activeDoctorsCount={metrics.activeDoctorsCount}
                    specialtiesCount={specialties.length}
                />

                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                    <FacilityDoctorsToolbar
                        isManager={isManager}
                        filteredCount={filteredDoctors.length}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        specialtyFilter={specialtyFilter}
                        onSpecialtyChange={setSpecialtyFilter}
                        presenceFilter={presenceFilter}
                        onPresenceChange={setPresenceFilter}
                        specialties={specialties}
                        onOpenAddModal={handleOpenAddModal}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredDoctors.length > 0 ? (
                            filteredDoctors.map((doctor) => (
                                <FacilityDoctorCard
                                    key={doctor.id}
                                    doctor={doctor}
                                    isManager={isManager}
                                    onView={setViewDoctor}
                                    onEdit={setEditDoctor}
                                    onDelete={setDeleteDoctor}
                                    onTogglePresence={setPresenceDoctor}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-16 text-center text-gray-400 text-xs">
                                <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                لا توجد نتائج مطابقة لخيارات البحث.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddFacilityDoctorModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                facility={facility}
                allSpecialties={allSpecialties}
                availableDoctors={availableDoctors}
            />

            <EditFacilityDoctorModal
                doctor={editDoctor}
                onClose={handleCloseEditModal}
                facility={facility}
                allSpecialties={allSpecialties}
            />

            <ViewFacilityDoctorModal
                doctor={viewDoctor}
                facilityName={facility.name}
                isManager={isManager}
                onClose={handleCloseViewModal}
                onEdit={setEditDoctor}
            />

            <DeleteFacilityDoctorModal
                doctor={deleteDoctor}
                facility={facility}
                onClose={handleCloseDeleteModal}
            />

            <TogglePresenceModal
                doctor={presenceDoctor}
                onClose={handleClosePresenceModal}
            />
        </FacilityDashboardLayout>
    );
}
