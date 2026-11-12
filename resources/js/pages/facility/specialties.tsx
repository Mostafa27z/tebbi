import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { FacilityDashboardLayout } from '@/layouts/facility-dashboard-layout';
import { 
    Stethoscope, 
    Users, 
    Activity, 
    Search, 
    ShieldCheck, 
    Building2, 
    ArrowUpRight 
} from 'lucide-react';
import { CustomSelect } from '@/components/common/custom-select';

interface Doctor {
    id: number;
    title_ar: string;
    consultation_fee: number;
    waiting_time_minutes: number;
    is_available_today: boolean;
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    specialty: {
        id: number;
        name_ar: string;
    };
}

interface SpecialtyItem {
    id: number;
    name_ar: string;
    description?: string;
}

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
    };
    doctors: Doctor[];
    specialties: SpecialtyItem[];
}

export default function FacilitySpecialtiesPage({
    facility,
    metrics,
    doctors,
    specialties,
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSpecialties = specialties.filter((spec) => {
        return (
            spec.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (spec.description && spec.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    });

    return (
        <FacilityDashboardLayout
            activeTab="specialties"
            facilityName={facility.name}
            branchName={facility.branch_name}
            counts={{
                waiting: metrics.waitingCount,
                doctors: metrics.doctorsCount,
                specialties: specialties?.length || metrics.specialtiesCount,
                appointments: metrics.totalToday,
            }}
        >
            <Head title={`الأقسام والتخصصات - ${facility.name}`} />

            <div className="space-y-6">
                {/* Specialties Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 block">إجمالي الأقسام الطبية</span>
                            <span className="text-2xl font-black text-teal-600 font-mono mt-1 block">
                                {specialties.length}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5 block">تخصصات معتمدة بالمنشأة</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                            <Stethoscope className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 block">إجمالي الأطباء في الأقسام</span>
                            <span className="text-2xl font-black text-purple-600 font-mono mt-1 block">
                                {doctors.length}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5 block">كوادر طبية واستشارية</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 block">معدل الأطباء لكل تخصص</span>
                            <span className="text-2xl font-black text-[#005ab5] font-mono mt-1 block">
                                {specialties.length > 0 ? (doctors.length / specialties.length).toFixed(1) : 0}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-0.5 block">طبيب لكل تخصص طبي</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#005ab5]">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Specialties Directory */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 font-['Cairo'] flex items-center gap-2">
                                <Stethoscope className="w-5 h-5 text-teal-600" />
                                <span>دليل الأقسام والعيادات التخصصية المعتمدة</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                كافة التخصصات الطبية المتوفرة داخل {facility.name} مع كادرها الطبي المقيد
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="بحث باسم القسم الطبي..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pr-10 pl-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Specialties Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredSpecialties.length > 0 ? (
                            filteredSpecialties.map((spec) => {
                                const specDoctors = doctors.filter((d) => d.specialty.id === spec.id);

                                return (
                                    <div
                                        key={spec.id}
                                        className="p-5 rounded-3xl border border-gray-200/80 bg-white hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                                                    <Stethoscope className="w-6 h-6" />
                                                </div>
                                                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50/80 px-2.5 py-1 rounded-full border border-teal-100">
                                                    {specDoctors.length} {specDoctors.length === 1 ? 'طبيب' : 'أطباء'}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-base text-gray-900 font-['Cairo'] mb-1.5">
                                                {spec.name_ar}
                                            </h3>
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                {spec.description || 'تخصص طبي معتمد يقدم خدمات تشخيصية وعلاجية متقدمة وفق المعايير الطبية المعتمدة.'}
                                            </p>
                                        </div>

                                        <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                                            <div className="text-[11px] font-bold text-gray-400">
                                                الأطباء بالقسم:
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {specDoctors.length > 0 ? (
                                                    specDoctors.map((doc) => (
                                                        <span
                                                            key={doc.id}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 text-[11px] font-medium"
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                                            <span>{doc.user.name}</span>
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">
                                                        لا يوجد أطباء معينون حالياً
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-12 text-center text-gray-400 text-xs">
                                لا توجد تخصصات مطابقة للبحث.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </FacilityDashboardLayout>
    );
}

