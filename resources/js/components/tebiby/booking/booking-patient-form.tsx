import React from 'react';
import { User, CreditCard, Stethoscope, AlertCircle } from 'lucide-react';
import { InternationalPhoneInput } from '@/components/common/international-phone-input';

interface BookingPatientFormProps {
    patientName: string;
    setPatientName: (name: string) => void;
    patientNationalId: string;
    setPatientNationalId: (nid: string) => void;
    patientPhone: string;
    setPatientPhone: (phone: string) => void;
    patientNotes: string;
    setPatientNotes: (notes: string) => void;
    errors: { [key: string]: string };
}

export const BookingPatientForm: React.FC<BookingPatientFormProps> = ({
    patientName,
    setPatientName,
    patientNationalId,
    setPatientNationalId,
    patientPhone,
    setPatientPhone,
    patientNotes,
    setPatientNotes,
    errors,
}) => {
    return (
        <div className="bg-gray-50/70 p-4 sm:p-5 rounded-3xl border border-gray-200/80 space-y-4">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#005ab5] flex items-center justify-center font-black text-xs font-['Cairo'] shadow-xs">
                    3
                </div>
                <div>
                    <h4 className="text-xs sm:text-sm font-black text-gray-900 font-['Cairo']">
                        بيانات المريض
                    </h4>
                    <p className="text-[11px] text-gray-500">ستربط التذكرة الطبية وإشعارات الحضور بهذا المريض</p>
                </div>
            </div>

            <div className="space-y-3.5">
                {/* Patient Full Name */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 font-['Cairo']">
                        الاسم الثلاثي للمريض <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <User className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            required
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            placeholder="محمد فهد الدوسري"
                            className="w-full h-12 pr-11 pl-4 rounded-2xl border border-gray-200 hover:border-gray-300 text-xs sm:text-sm font-semibold bg-white focus:ring-2 focus:ring-[#005ab5]/20 focus:border-[#005ab5] focus:outline-hidden transition-all shadow-2xs"
                        />
                    </div>
                    {errors.name && (
                        <p className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{errors.name}</span>
                        </p>
                    )}
                </div>

                {/* National ID & International Phone Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 font-['Cairo']">
                            رقم الهوية الوطنية / الإقامة <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <CreditCard className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                required
                                value={patientNationalId}
                                onChange={(e) => setPatientNationalId(e.target.value)}
                                placeholder="10xxxxxxxx"
                                className="w-full h-12 pr-11 pl-4 rounded-2xl border border-gray-200 hover:border-gray-300 text-xs sm:text-sm font-mono text-left bg-white focus:ring-2 focus:ring-[#005ab5]/20 focus:border-[#005ab5] focus:outline-hidden transition-all shadow-2xs"
                                dir="ltr"
                            />
                        </div>
                        {errors.nid && (
                            <p className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{errors.nid}</span>
                            </p>
                        )}
                    </div>

                    <InternationalPhoneInput
                        label="رقم الجوال (تنبيهات الواتساب)"
                        required
                        value={patientPhone}
                        onChange={(fullNum) => setPatientPhone(fullNum)}
                        error={errors.phone}
                    />
                </div>

                {/* Optional Symptoms / Notes */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 font-['Cairo']">
                        ملاحظات أو أعراض طبية (اختياري)
                    </label>
                    <div className="relative">
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <Stethoscope className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            value={patientNotes}
                            onChange={(e) => setPatientNotes(e.target.value)}
                            placeholder="مثال: آلام في المفاصل منذ 3 أيام..."
                            className="w-full h-12 pr-11 pl-4 rounded-2xl border border-gray-200 hover:border-gray-300 text-xs sm:text-sm font-medium bg-white focus:ring-2 focus:ring-[#005ab5]/20 focus:border-[#005ab5] focus:outline-hidden transition-all shadow-2xs"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
