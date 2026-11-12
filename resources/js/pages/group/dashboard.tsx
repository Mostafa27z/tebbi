import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import { MetricCard } from '@/components/common/metric-card';
import {
    Facility,
    Doctor,
    StaffAssignment,
    GroupInfo,
    GroupMetrics,
    SpecialtyOption,
    FacilitiesTab,
    DoctorsTab,
    StaffTab,
    AddFacilityModal,
    AssignStaffModal,
    AddDoctorModal,
} from '@/components/group';
import {
    Building2,
    Users,
    Calendar,
    CreditCard,
    Plus,
    UserPlus,
    ShieldCheck,
} from 'lucide-react';

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
    const [activeTab, setActiveTab] = useState<'facilities' | 'doctors' | 'staff'>('facilities');
    const [facilityModalOpen, setFacilityModalOpen] = useState(false);
    const [staffModalOpen, setStaffModalOpen] = useState(false);
    const [doctorModalOpen, setDoctorModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title={`طبيبي - لوحة إدارة ${group.name_ar}`} />
            <TebibyHeader />

            <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                            <span className="text-xs font-bold text-gray-500 font-['Cairo']">
                                إدارة المنظومة الطبية والمجمعات
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-['Cairo'] tracking-tight">
                            {group.name_ar}
                        </h1>
                        {group.cr_number && (
                            <p className="text-xs text-gray-500 mt-1 font-mono">
                                السجل التجاري: {group.cr_number}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {activeTab === 'facilities' && (
                            <button
                                onClick={() => setFacilityModalOpen(true)}
                                className="px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>إضافة منشأة طبية تابعة</span>
                            </button>
                        )}
                        {activeTab === 'doctors' && (
                            <button
                                onClick={() => setDoctorModalOpen(true)}
                                className="px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>إضافة استشاري جديد</span>
                            </button>
                        )}
                        {activeTab === 'staff' && (
                            <button
                                onClick={() => setStaffModalOpen(true)}
                                className="px-4 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>تعيين مشرف أو استقبال</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <MetricCard
                        title="إجمالي المنشآت الطبية"
                        value={metrics.facilitiesCount}
                        subtitle={`${metrics.hospitalsCount} مستشفى • ${metrics.clinicsCount} عيادة`}
                        icon={<Building2 className="w-4 h-4 text-[#005ab5]" />}
                        iconBg="bg-blue-50"
                    />

                    <MetricCard
                        title="الأطباء والاستشاريون"
                        value={metrics.doctorsCount}
                        subtitle="استشاري معتمد بالمجمع"
                        icon={<Users className="w-4 h-4 text-purple-600" />}
                        iconBg="bg-purple-50"
                    />

                    <MetricCard
                        title="حجوزات اليوم"
                        value={metrics.todayAppointments}
                        subtitle="حالة مجدولة لليوم"
                        icon={<Calendar className="w-4 h-4 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />

                    <MetricCard
                        title="الإيرادات الفعلية للمجمع"
                        value={metrics.totalRevenue}
                        subtitle="مدفوعات مؤكدة"
                        icon={<CreditCard className="w-4 h-4 text-teal-600" />}
                        iconBg="bg-teal-50"
                    />
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar pb-2">
                    <button
                        onClick={() => setActiveTab('facilities')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'facilities'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        <span>المستشفيات والعيادات التابعة ({facilities.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('doctors')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'doctors'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>الأطباء والاستشاريون ({doctors.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('staff')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                            activeTab === 'staff'
                                ? 'bg-[#005ab5] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>المشرفون وموظفو الاستقبال ({staffAssignments.length})</span>
                    </button>
                </div>

                {/* Tabs Content */}
                {activeTab === 'facilities' && (
                    <FacilitiesTab
                        facilities={facilities}
                        onOpenAddModal={() => setFacilityModalOpen(true)}
                    />
                )}

                {activeTab === 'doctors' && (
                    <DoctorsTab
                        doctors={doctors}
                        onOpenAddModal={() => setDoctorModalOpen(true)}
                    />
                )}

                {activeTab === 'staff' && (
                    <StaffTab
                        staffAssignments={staffAssignments}
                        onOpenAddModal={() => setStaffModalOpen(true)}
                    />
                )}
            </main>

            {/* Modals */}
            <AddFacilityModal
                isOpen={facilityModalOpen}
                onClose={() => setFacilityModalOpen(false)}
                groupId={group.id}
                groupName={group.name_ar}
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

            <TebibyFooter />
        </div>
    );
}
