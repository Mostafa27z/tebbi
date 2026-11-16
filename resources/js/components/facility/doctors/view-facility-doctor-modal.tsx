import React from 'react';
import { ShieldCheck, X, Mail, Phone, Building2 } from 'lucide-react';
import { FacilityDoctor } from './types';

interface ViewFacilityDoctorModalProps {
    doctor: FacilityDoctor | null;
    facilityName: string;
    isManager: boolean;
    onClose: () => void;
    onEdit: (doctor: FacilityDoctor) => void;
}

export const ViewFacilityDoctorModal: React.FC<ViewFacilityDoctorModalProps> = React.memo(({
    doctor,
    facilityName,
    isManager,
    onClose,
    onEdit,
}) => {
    if (!doctor) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100">
                <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                        <img
                            src={
                                doctor.user.avatar ||
                                'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&h=120&fit=crop&crop=faces'
                            }
                            alt={doctor.user.name}
                            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-100"
                        />
                        <div>
                            <h3 className="text-base font-bold text-gray-900 font-['Cairo'] flex items-center gap-1.5">
                                <span>{doctor.user.name}</span>
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            </h3>
                            <p className="text-xs text-purple-700 font-bold">
                                {doctor.specialty.name_ar}
                            </p>
                            <p className="text-[11px] text-gray-500">
                                {doctor.title_ar} {doctor.subspecialty ? `• ${doctor.subspecialty}` : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                            <span className="text-gray-400 block text-[11px]">سعر الكشف بالمنشأة</span>
                            <span className="text-sm font-bold font-mono text-emerald-700">
                                {doctor.facility_consultation_fee ?? doctor.consultation_fee} ر.س
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400 block text-[11px]">مدة الكشف المقدرة</span>
                            <span className="text-sm font-bold font-mono text-gray-800">
                                {doctor.facility_slot_minutes ?? doctor.waiting_time_minutes ?? 15} دقيقة
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400 block text-[11px]">سنوات الخبرة</span>
                            <span className="text-sm font-bold text-gray-800">
                                {doctor.experience_years || 5} سنوات
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400 block text-[11px]">رقم ترخيص الهيئة</span>
                            <span className="text-sm font-bold font-mono text-gray-800">
                                {doctor.license_no || 'معتمد نظامياً'}
                            </span>
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="font-mono">{doctor.user.email}</span>
                        </div>
                        {doctor.user.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="font-mono">{doctor.user.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>المنشأة الحالية: {facilityName}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 mt-5">
                    {isManager && (
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onEdit(doctor);
                            }}
                            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                            تعديل بيانات الطبيب
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
});
ViewFacilityDoctorModal.displayName = 'ViewFacilityDoctorModal';
