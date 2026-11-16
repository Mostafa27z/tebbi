import React from 'react';
import { Users, CheckCircle2, AlertCircle, Stethoscope } from 'lucide-react';

interface FacilityDoctorsStatsProps {
    totalDoctors: number;
    activeDoctorsCount: number;
    specialtiesCount: number;
}

export const FacilityDoctorsStats: React.FC<FacilityDoctorsStatsProps> = React.memo(({
    totalDoctors,
    activeDoctorsCount,
    specialtiesCount,
}) => {
    const inactiveCount = Math.max(0, totalDoctors - activeDoctorsCount);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold text-gray-500 block">إجمالي أطباء المنشأة</span>
                    <span className="text-2xl font-black text-gray-900 font-mono mt-1 block">
                        {totalDoctors}
                    </span>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">أطباء واستشاريون معتمدون</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Users className="w-6 h-6" />
                </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold text-gray-500 block">الأطباء المتاحون اليوم</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                        {activeDoctorsCount}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">حاضرون ويستقبلون المرضى</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold text-gray-500 block">أطباء غير حاضرين</span>
                    <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">
                        {inactiveCount}
                    </span>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">عيادات معلقة مؤقتاً</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <AlertCircle className="w-6 h-6" />
                </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold text-gray-500 block">التخصصات الطبية</span>
                    <span className="text-2xl font-black text-teal-600 font-mono mt-1 block">
                        {specialtiesCount}
                    </span>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">أقسام استشارية وعلاجية</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                    <Stethoscope className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
});
FacilityDoctorsStats.displayName = 'FacilityDoctorsStats';
