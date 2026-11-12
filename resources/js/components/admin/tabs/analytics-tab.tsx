import React from 'react';
import { Specialty } from '../types';

interface AnalyticsTabProps {
    chartData: Array<{
        day: string;
        date: string;
        bookings: number;
        confirmed: number;
        val1: number;
        val2: number;
    }>;
    specialtyDistribution: Array<{
        id: number;
        name: string;
        doctors_count: number;
        share_percentage: number;
    }>;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ chartData, specialtyDistribution }) => {
    return (
        <div className="space-y-8">
            {/* Chart and Specialty distribution grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 7-Days Chart */}
                <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-gray-900 text-base font-['Cairo']">
                                حركة الحجوزات اليومية (آخر 7 أيام)
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">مقارنة إجمالي الحجوزات بالحالات المؤكدة والمنفذة</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold">
                            <span className="flex items-center gap-1.5 text-blue-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#005ab5]"></span>
                                إجمالي الحجوزات
                            </span>
                            <span className="flex items-center gap-1.5 text-emerald-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#006b5c]"></span>
                                الحالات المؤكدة والمنفذة
                            </span>
                        </div>
                    </div>

                    {/* Chart Bars */}
                    <div className="h-64 flex items-end justify-between gap-3 pt-8 pb-2 px-2 border-b border-gray-100">
                        {chartData.map((item, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-gray-900 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                                    <div className="font-bold">{item.day} ({item.date})</div>
                                    <div>إجمالي الحجوزات: {item.bookings} موعد</div>
                                    <div>المؤكدة / المنفذة: {item.confirmed} كشف</div>
                                </div>

                                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                                    {/* Bookings Bar */}
                                    <div
                                        style={{ height: `${item.val1}%` }}
                                        className="w-4 sm:w-6 bg-gradient-to-t from-[#005ab5] to-blue-400 rounded-t-lg transition-all group-hover:brightness-110"
                                    ></div>
                                    {/* Confirmed Bar */}
                                    <div
                                        style={{ height: `${item.val2}%` }}
                                        className="w-4 sm:w-6 bg-gradient-to-t from-[#006b5c] to-emerald-400 rounded-t-lg transition-all group-hover:brightness-110"
                                    ></div>
                                </div>
                                <span className="text-[11px] text-gray-500 font-bold mt-2">{item.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Specialties Share */}
                <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 text-base font-['Cairo'] mb-1">
                            توزيع الأطباء حسب الأقسام
                        </h3>
                        <p className="text-xs text-gray-500 mb-6">الحصة النسبية لكل تخصص طبي</p>

                        <div className="space-y-4">
                            {specialtyDistribution.slice(0, 5).map((spec) => (
                                <div key={spec.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-gray-800">{spec.name}</span>
                                        <span className="text-gray-500 font-mono">
                                            {spec.doctors_count} طبيب ({spec.share_percentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className="h-full bg-[#005ab5] rounded-full"
                                            style={{ width: `${spec.share_percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-6">
                        <span className="text-[11px] text-gray-400">
                            يتم تحديث النسب آلياً بناءً على الأطباء المعتمدين النشطين.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

