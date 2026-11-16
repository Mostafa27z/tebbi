import React from 'react';
import toast from 'react-hot-toast';
import { Pill, Check, Download, Microscope } from 'lucide-react';
import { formatArabicDate } from '@/lib/utils';

interface PatientRecordsTabsProps {
    activeTab: 'appointments' | 'prescriptions' | 'records';
    onChangeTab: (tab: 'appointments' | 'prescriptions' | 'records') => void;
    pastAppointments: any[];
    prescriptions: any[];
    medicalRecords: any[];
}

export const PatientRecordsTabs: React.FC<PatientRecordsTabsProps> = React.memo(({
    activeTab,
    onChangeTab,
    pastAppointments,
    prescriptions,
    medicalRecords,
}) => {
    return (
        <>
            <div className="flex items-center gap-2 p-1.5 bg-gray-200/60 rounded-2xl w-fit mb-6 text-xs font-bold">
                <button
                    type="button"
                    onClick={() => onChangeTab('appointments')}
                    className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'appointments'
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    المواعيد السابقة ({pastAppointments.length})
                </button>
                <button
                    type="button"
                    onClick={() => onChangeTab('prescriptions')}
                    className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'prescriptions'
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    الروشتات والوصفات الطبية ({prescriptions.length})
                </button>
                <button
                    type="button"
                    onClick={() => onChangeTab('records')}
                    className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'records'
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    التحاليل المخبرية والأشعة ({medicalRecords.length})
                </button>
            </div>

            {activeTab === 'appointments' && (
                <div className="space-y-4">
                    {pastAppointments.length > 0 ? (
                        pastAppointments.map((appt) => (
                            <div
                                key={appt.id}
                                className="p-5 sm:p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-blue-200 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <img
                                        src={
                                            appt.doctor?.user?.avatar ||
                                            'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120&h=120&fit=crop&crop=faces'
                                        }
                                        alt={appt.doctor?.user?.name || 'الطبيب'}
                                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-gray-100"
                                    />
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm font-['Cairo']">
                                            {appt.doctor?.user?.name}
                                        </h4>
                                        <p className="text-xs text-[#005ab5] font-semibold">
                                            {appt.doctor?.specialty?.name_ar} • {appt.doctor?.title_ar}
                                        </p>
                                        {appt.doctor?.clinic?.name && (
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                {appt.doctor.clinic.name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 text-xs text-gray-500">
                                    <div>
                                        <span className="block text-[10px] text-gray-400">تاريخ الكشف:</span>
                                        <span className="font-bold text-gray-800">
                                            {formatArabicDate(appt.appointment_date)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-400">حالة الكشف:</span>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                appt.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {appt.status === 'completed' ? 'كشف مكتمل' : 'ملغي / لم يحضر'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 bg-white rounded-3xl border border-gray-200/80 text-center text-gray-400 text-xs">
                            لا توجد مواعيد سابقة مسجلة.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'prescriptions' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prescriptions.length > 0 ? (
                        prescriptions.map((item) => (
                            <div
                                key={item.id}
                                className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005ab5] bg-blue-50 px-2.5 py-1 rounded-full">
                                            <Pill className="w-3.5 h-3.5" />
                                            وصفة طبية إلكترونية
                                        </span>
                                        <span className="text-[11px] text-gray-400">
                                            {formatArabicDate(item.created_at)}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-gray-900 text-sm font-['Cairo'] mb-1">
                                        التشخيص: {item.diagnosis || 'فحص عام واستشارة طبية'}
                                    </h4>
                                    <p className="text-xs text-gray-500 mb-4">
                                        الطبيب المعالج: {item.doctor?.user?.name} ({item.doctor?.specialty?.name_ar})
                                    </p>

                                    {item.medications && Array.isArray(item.medications) && item.medications.length > 0 && (
                                        <div className="space-y-1.5 p-3 rounded-2xl bg-gray-50 text-xs border border-gray-100 mb-4">
                                            <span className="font-bold text-gray-700 block text-[11px] mb-1">
                                                الأدوية الموصوفة:
                                            </span>
                                            {item.medications.map((m: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between text-gray-600">
                                                    <span>• {m.name || m}</span>
                                                    <span className="text-[11px] text-gray-400">{m.dosage || ''}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" />
                                        صادرة ومعتمدة رسمياً
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => toast.success('جارٍ تحميل الروشتة بصيغة PDF...')}
                                        className="text-[#005ab5] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>تحميل PDF</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 p-8 bg-white rounded-3xl border border-gray-200/80 text-center text-gray-400 text-xs">
                            لا توجد روشتات أو وصفات طبية حتى الآن.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'records' && (
                <div className="space-y-4">
                    {medicalRecords.length > 0 ? (
                        medicalRecords.map((rec) => (
                            <div
                                key={rec.id}
                                className="p-5 sm:p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                        <Microscope className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm font-['Cairo']">
                                            {rec.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {rec.record_type} • د. {rec.doctor?.user?.name || 'الاستشاري المشرف'}
                                        </p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            تاريخ الفحص: {formatArabicDate(rec.record_date)}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-emerald-700 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                    تمت المعاينة والاعتماد
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 bg-white rounded-3xl border border-gray-200/80 text-center text-gray-400 text-xs">
                            لا توجد سجلات مخبرية أو تقارير أشعة بعد.
                        </div>
                    )}
                </div>
            )}
        </>
    );
});
PatientRecordsTabs.displayName = 'PatientRecordsTabs';
