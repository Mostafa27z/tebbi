import React from 'react';
import { Eye, Edit3, Trash2, ToggleRight, ToggleLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FacilityDoctor } from './types';

interface FacilityDoctorCardProps {
    doctor: FacilityDoctor;
    isManager: boolean;
    onView: (doctor: FacilityDoctor) => void;
    onEdit: (doctor: FacilityDoctor) => void;
    onDelete: (doctor: FacilityDoctor) => void;
    onTogglePresence: (doctor: FacilityDoctor) => void;
}

export const FacilityDoctorCard: React.FC<FacilityDoctorCardProps> = React.memo(({
    doctor,
    isManager,
    onView,
    onEdit,
    onDelete,
    onTogglePresence,
}) => {
    const isAvailable = doctor.is_available_today;
    const consultationFee = doctor.facility_consultation_fee ?? doctor.consultation_fee;
    const waitingMinutes = doctor.facility_slot_minutes ?? doctor.waiting_time_minutes ?? 15;
    const acceptsInsurance =
        doctor.facility_accepts_insurance !== undefined
            ? doctor.facility_accepts_insurance
            : (doctor.accepts_insurance ?? true);

    return (
        <div className="p-5 rounded-3xl border border-gray-200/80 bg-white hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={
                                    doctor.user.avatar ||
                                    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&h=120&fit=crop&crop=faces'
                                }
                                alt={doctor.user.name}
                                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-100"
                            />
                            <span
                                className={cn(
                                    'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
                                    isAvailable ? 'bg-emerald-500' : 'bg-gray-400'
                                )}
                                title={isAvailable ? 'متاح' : 'معلّق'}
                            />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm font-['Cairo']">
                                {doctor.user.name}
                            </h4>
                            <p className="text-xs text-purple-700 font-bold">
                                {doctor.specialty.name_ar}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                {doctor.title_ar}
                            </p>
                        </div>
                    </div>

                    <span
                        className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0',
                            isAvailable
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600'
                        )}
                    >
                        {isAvailable ? 'حاضر ومتاح' : 'معلّق / غائب'}
                    </span>
                </div>

                <div className="p-3 bg-gray-50/80 rounded-2xl text-xs space-y-1.5 mb-4">
                    <div className="flex justify-between text-gray-600">
                        <span>قيمة الكشف بالمنشأة:</span>
                        <span className="font-bold font-mono text-emerald-700">
                            {consultationFee} ر.س
                        </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>متوسط وقت الكشف:</span>
                        <span className="font-mono text-gray-700 font-semibold">
                            {waitingMinutes} دقيقة
                        </span>
                    </div>
                    {doctor.license_no && (
                        <div className="flex justify-between text-gray-600">
                            <span>رقم الترخيص الطبي:</span>
                            <span className="font-mono text-gray-700 font-semibold">
                                {doctor.license_no}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                        <span>قبول التأمين:</span>
                        <span className={cn('font-bold', acceptsInsurance ? 'text-emerald-600' : 'text-gray-400')}>
                            {acceptsInsurance ? 'معتمد' : 'غير معتمد'}
                        </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>البريد الإلكتروني:</span>
                        <span className="font-mono text-gray-500 truncate max-w-[150px]">
                            {doctor.user.email}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 justify-between">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => onView(doctor)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-colors border border-gray-200 cursor-pointer"
                            title="عرض كامل التفاصيل"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            <span>تفاصيل</span>
                        </button>
                        {isManager && (
                            <button
                                type="button"
                                onClick={() => onEdit(doctor)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors border border-blue-200 bg-blue-50/50 cursor-pointer"
                                title="تعديل بيانات الطبيب"
                            >
                                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                <span>تعديل</span>
                            </button>
                        )}
                    </div>

                    {isManager && (
                        <button
                            type="button"
                            onClick={() => onDelete(doctor)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors border border-rose-200 bg-rose-50/40 cursor-pointer"
                            title="إلغاء التعيين / حذف من المنشأة"
                        >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>إلغاء تعيين</span>
                        </button>
                    )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-600">
                        حالة التواجد لليوم:
                    </span>
                    <button
                        type="button"
                        onClick={() => onTogglePresence(doctor)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs',
                            isAvailable
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                        )}
                    >
                        {isAvailable ? (
                            <>
                                <ToggleRight className="w-4 h-4 text-emerald-600" />
                                <span>متاح بالعيادة</span>
                            </>
                        ) : (
                            <>
                                <ToggleLeft className="w-4 h-4 text-gray-400" />
                                <span>معلّق / غائب</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
});
FacilityDoctorCard.displayName = 'FacilityDoctorCard';
