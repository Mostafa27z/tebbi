import React, { useState, useMemo, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import { FacilityDashboardLayout } from '@/layouts/facility-dashboard-layout';
import { SurfaceCard, Pagination } from '@/components/common';
import {
    FacilityAppointmentRecord,
    FacilityAppointmentDoctor,
    FacilityAppointmentsStats,
    FacilityAppointmentsToolbar,
    FacilityAppointmentsTable,
} from '@/components/facility/appointments';

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
    doctors: FacilityAppointmentDoctor[];
    specialties: Array<{ id: number; name_ar: string }>;
    allAppointments: FacilityAppointmentRecord[];
}

export default function FacilityAppointmentsPage({
    facility,
    metrics,
    doctors = [],
    specialties = [],
    allAppointments = [],
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | number>('all');
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | number>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    const completedCount = useMemo(
        () => allAppointments.filter((a) => a.status === 'completed').length,
        [allAppointments]
    );
    const cancelledCount = useMemo(
        () => allAppointments.filter((a) => a.status === 'cancelled').length,
        [allAppointments]
    );

    const filteredAppointments = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return allAppointments.filter((a) => {
            const matchesSearch =
                !q ||
                a.booking_reference.toLowerCase().includes(q) ||
                a.patient.name.toLowerCase().includes(q) ||
                a.doctor.user.name.toLowerCase().includes(q) ||
                (a.patient.phone && a.patient.phone.includes(q));

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'confirmed'
                    ? a.status === 'confirmed' || a.status === 'booked'
                    : a.status === statusFilter);

            const matchesDoctor = selectedDoctorId === 'all' || a.doctor.id === Number(selectedDoctorId);

            const matchesSpecialty =
                selectedSpecialtyId === 'all' ||
                a.doctor.specialty_id === Number(selectedSpecialtyId) ||
                a.doctor.specialty?.id === Number(selectedSpecialtyId);

            return matchesSearch && matchesStatus && matchesDoctor && matchesSpecialty;
        });
    }, [allAppointments, searchQuery, statusFilter, selectedDoctorId, selectedSpecialtyId]);

    const paginatedAppointments = useMemo(
        () => filteredAppointments.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [filteredAppointments, currentPage, pageSize]
    );

    const handleSearchChange = useCallback((val: string) => {
        setSearchQuery(val);
        setCurrentPage(1);
    }, []);

    const handleStatusChange = useCallback((val: string) => {
        setStatusFilter(val);
        setCurrentPage(1);
    }, []);

    const handleDoctorChange = useCallback((val: string | number) => {
        setSelectedDoctorId(val);
        setCurrentPage(1);
    }, []);

    const handleSpecialtyChange = useCallback((val: string | number) => {
        setSelectedSpecialtyId(val);
        setCurrentPage(1);
    }, []);

    return (
        <FacilityDashboardLayout
            activeTab="appointments"
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
            <Head title={`سجل المواعيد والتذاكر - ${facility.name}`} />

            <div className="space-y-6">
                <FacilityAppointmentsStats
                    totalAppointments={allAppointments.length}
                    completedCount={completedCount}
                    totalToday={metrics.totalToday}
                    cancelledCount={cancelledCount}
                />

                <SurfaceCard padding="lg" rounded="3xl">
                    <FacilityAppointmentsToolbar
                        filteredCount={filteredAppointments.length}
                        totalCount={allAppointments.length}
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchChange}
                        statusFilter={statusFilter}
                        onStatusChange={handleStatusChange}
                        selectedDoctorId={selectedDoctorId}
                        onDoctorChange={handleDoctorChange}
                        selectedSpecialtyId={selectedSpecialtyId}
                        onSpecialtyChange={handleSpecialtyChange}
                        allAppointments={allAppointments}
                        doctors={doctors}
                        specialties={specialties}
                    />

                    <FacilityAppointmentsTable appointments={paginatedAppointments} />

                    {filteredAppointments.length > pageSize && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalItems={filteredAppointments.length}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </SurfaceCard>
            </div>
        </FacilityDashboardLayout>
    );
}
