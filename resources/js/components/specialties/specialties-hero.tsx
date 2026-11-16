import React from 'react';
import { Sparkles } from 'lucide-react';

interface SpecialtiesHeroProps {
    specialtiesCount: number;
    totalDoctors: number;
    totalFacilities: number;
}

export const SpecialtiesHero: React.FC<SpecialtiesHeroProps> = React.memo(({
    specialtiesCount,
    totalDoctors,
    totalFacilities,
}) => {
    return (
        <div className="bg-gradient-to-r from-white via-blue-50/30 to-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-sm mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#005ab5] text-xs font-bold border border-blue-100 mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>دليل الأقسام والعيادات المعتمدة</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-gray-900 font-['Cairo'] tracking-tight leading-tight">
                    اختر التخصص الطبي المناسب <br className="hidden sm:inline" />
                    <span className="text-[#005ab5]">واحجز كشفك مع نخبة الاستشاريين</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-2.5 leading-relaxed font-medium">
                    تصفح شبكة الأقسام السريرية المرتبطة مباشرة بقاعدة بيانات المنشآت والأطباء المعتمدين مع حجز تذكرة دور فورية.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
                <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs text-center">
                    <span className="block text-2xl sm:text-3xl font-black text-[#005ab5] font-['Cairo'] leading-none">
                        {specialtiesCount}
                    </span>
                    <span className="text-[11px] text-gray-500 font-bold mt-1 block">أقسام معتمدة</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs text-center">
                    <span className="block text-2xl sm:text-3xl font-black text-purple-700 font-['Cairo'] leading-none">
                        {totalDoctors}
                    </span>
                    <span className="text-[11px] text-gray-500 font-bold mt-1 block">استشاري متاح</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs text-center">
                    <span className="block text-2xl sm:text-3xl font-black text-[#006b5c] font-['Cairo'] leading-none">
                        {totalFacilities}
                    </span>
                    <span className="text-[11px] text-gray-500 font-bold mt-1 block">مستشفى ومركز</span>
                </div>
            </div>
        </div>
    );
});
SpecialtiesHero.displayName = 'SpecialtiesHero';
