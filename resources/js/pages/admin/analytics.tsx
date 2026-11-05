import React from 'react';
import { Head, Link } from '@inertiajs/react';
import TebibyHeader from '@/components/tebiby/header';
import TebibyFooter from '@/components/tebiby/footer';
import { 
    TrendingUp, 
    Users, 
    Building2, 
    CreditCard, 
    ShieldCheck, 
    Clock, 
    Award, 
    ArrowUpRight, 
    CheckCircle2, 
    Activity, 
    BarChart3, 
    Download
} from 'lucide-react';

interface AdminAnalyticsProps {
    metrics: {
        totalBookings: number;
        totalRevenue: string;
        activeDoctors: number;
        activeHospitals: number;
        complianceRate: string;
        avgWaitingTime: string;
    };
    specialtyDistribution: Array<{
        name: string;
        doctors_count: number;
        share_percentage: number;
    }>;
    recentHospitals: Array<{
        id: number;
        name: string;
        city: string;
        district: string;
        branch: string;
        status: string;
        doctors_count: number;
        compliance_score: string;
    }>;
}

export default function AdminAnalytics({ metrics, specialtyDistribution, recentHospitals }: AdminAnalyticsProps) {
    return (
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-['Tajawal']" dir="rtl">
            <Head title="طبيبي - لوحة القيادة المركزية والتحليلات البيانية" />

            <TebibyHeader />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Header Title & Date Range */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-gray-500">نظام التحليلات الذكي - منصة طبيبي المركزية</span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 font-['Cairo']">
                            لوحة القيادة المركزية والتحليلات البيانية
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => alert('تم تصدير التقرير التحليلي الشامل بصيغة Excel/PDF')}
                            className="px-4 py-2.5 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                        >
                            <Download className="w-4 h-4 text-gray-500" />
                            <span>تصدير التقرير الشامل</span>
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-bold">الحجوزات المنجزة</span>
                            <Activity className="w-4 h-4 text-[#005ab5]" />
                        </div>
                        <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.totalBookings.toLocaleString()}</div>
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                            <TrendingUp className="w-3 h-3" /> +18.4% هذا الشهر
                        </span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-bold">الإيرادات التراكمية</span>
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-xl font-black text-gray-900 font-['Cairo']">{metrics.totalRevenue}</div>
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                            <TrendingUp className="w-3 h-3" /> +24.1% نمو سنوي
                        </span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-bold">الأطباء المعتمدون</span>
                            <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.activeDoctors}</div>
                        <span className="text-[11px] text-gray-400 font-semibold">استشاري وأخصائي</span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-bold">المستشفيات الشريكة</span>
                            <Building2 className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-2xl font-black text-gray-900 font-['Cairo']">{metrics.activeHospitals}</div>
                        <span className="text-[11px] text-gray-400 font-semibold">مجمع ومستشفى</span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-bold">نسبة الامتثال الصحي</span>
                            <ShieldCheck className="w-4 h-4 text-[#006b5c]" />
                        </div>
                        <div className="text-2xl font-black text-[#006b5c] font-['Cairo']">{metrics.complianceRate}</div>
                        <span className="text-[11px] text-gray-400 font-semibold">مجلس الضمان الصحي</span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-bold">متوسط وقت الانتظار</span>
                            <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-black text-blue-600 font-['Cairo']">{metrics.avgWaitingTime}</div>
                        <span className="text-[11px] text-emerald-600 font-bold">تحسن بنسبة ٣٢٪</span>
                    </div>
                </div>

                {/* Visual Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Growth Chart Simulation */}
                    <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base font-['Cairo']">
                                        منحنى نمو الحجوزات اليومية والإيرادات التراكمية
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">تتبع مؤشرات التدفق السريري عبر كافة الفروع</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="flex items-center gap-1.5 font-bold text-gray-600">
                                        <span className="w-3 h-3 rounded-full bg-[#005ab5]"></span>
                                        الحجوزات
                                    </span>
                                    <span className="flex items-center gap-1.5 font-bold text-gray-600">
                                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                        الإيرادات
                                    </span>
                                </div>
                            </div>

                            {/* Stylized CSS Bar Graph */}
                            <div className="h-48 flex items-end gap-3 sm:gap-6 pt-8 pb-2 border-b border-gray-100">
                                {[
                                    { day: 'السبت', val1: 65, val2: 50 },
                                    { day: 'الأحد', val1: 85, val2: 70 },
                                    { day: 'الإثنين', val1: 95, val2: 90 },
                                    { day: 'الثلاثاء', val1: 75, val2: 65 },
                                    { day: 'الأربعاء', val1: 90, val2: 85 },
                                    { day: 'الخميس', val1: 100, val2: 95 },
                                    { day: 'الجمعة', val1: 45, val2: 40 },
                                ].map((bar) => (
                                    <div key={bar.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                        <div className="w-full flex items-end justify-center gap-1 h-full">
                                            <div
                                                style={{ height: `${bar.val1}%` }}
                                                className="w-full max-w-[18px] bg-[#005ab5] rounded-t-lg group-hover:bg-[#00458e] transition-all"
                                            ></div>
                                            <div
                                                style={{ height: `${bar.val2}%` }}
                                                className="w-full max-w-[18px] bg-emerald-400 rounded-t-lg group-hover:bg-emerald-500 transition-all"
                                            ></div>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-bold">{bar.day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between text-xs text-gray-500">
                            <span>ذروة الإشغال الأسبوعي: يوم الخميس (٩٥٠ حجز مؤكد)</span>
                            <span className="text-[#005ab5] font-bold">نسبة الحضور المباشر: ٩٤.٢٪</span>
                        </div>
                    </div>

                    {/* Specialty Distribution */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 text-base mb-1 font-['Cairo']">
                                أكثر التخصصات كثافة وإقبالاً
                            </h3>
                            <p className="text-xs text-gray-500 mb-6">توزيع الحالات حسب الأقسام السريرية</p>

                            <div className="space-y-4">
                                {specialtyDistribution.slice(0, 5).map((spec) => (
                                    <div key={spec.name} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-gray-800">{spec.name}</span>
                                            <span className="font-semibold text-gray-500">{spec.share_percentage}%</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                style={{ width: `${spec.share_percentage * 3.5}%` }}
                                                className="h-full bg-gradient-to-r from-[#005ab5] to-[#0072e2] rounded-full"
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 text-center">
                            <span className="text-xs text-[#005ab5] font-bold">قسم الأسنان والجلدية يشكلان ٤٨٪ من إجمالي الحجوزات</span>
                        </div>
                    </div>
                </div>

                {/* Onboarded Hospitals & Compliance Table */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-gray-900 text-base font-['Cairo']">
                                كبرى المستشفيات والمراكز الطبية المنضمة حديثاً والامتثال التنظيمي
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">تتبع التزام الفروع بمعايير الجودة والربط مع نظام الدور الحي</p>
                        </div>
                        <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                            امتثال شامل
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                                    <th className="pb-3 pr-2">اسم المجمع / المستشفى</th>
                                    <th className="pb-3">المدينة والفرع</th>
                                    <th className="pb-3">عدد الاستشاريين</th>
                                    <th className="pb-3">درجة الامتثال</th>
                                    <th className="pb-3">حالة الاعتماد</th>
                                    <th className="pb-3 pl-2">إجراءات المراجعة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentHospitals.map((hosp) => (
                                    <tr key={hosp.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="py-4 pr-2 font-bold text-sm text-gray-900 font-['Cairo'] flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-[#005ab5]" />
                                            <span>{hosp.name}</span>
                                        </td>
                                        <td className="py-4 text-gray-600 font-medium">
                                            {hosp.city} - {hosp.branch}
                                        </td>
                                        <td className="py-4 font-bold text-gray-800">
                                            {hosp.doctors_count} طبيب معتمد
                                        </td>
                                        <td className="py-4 font-bold text-emerald-600">
                                            {hosp.compliance_score}
                                        </td>
                                        <td className="py-4">
                                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                {hosp.status}
                                            </span>
                                        </td>
                                        <td className="py-4 pl-2">
                                            <button
                                                onClick={() => alert(`مراجعة سجلات ${hosp.name}`)}
                                                className="text-[#005ab5] hover:underline font-bold"
                                            >
                                                عرض سجل التدقيق
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <TebibyFooter />
        </div>
    );
}

