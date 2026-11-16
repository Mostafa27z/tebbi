import React from 'react';
import { Link } from '@inertiajs/react';
import { CheckCircle2, User, Phone, ShieldCheck } from 'lucide-react';
import { LiveClockBadge } from './live-clock-badge';

interface PatientWelcomeBannerProps {
    patient: {
        id: number;
        name: string;
        email: string;
        phone: string;
        national_id: string;
        avatar: string;
        insurance: string;
    };
}

export const PatientWelcomeBanner: React.FC<PatientWelcomeBannerProps> = React.memo(({ patient }) => {
    return (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                        <img
                            src={
                                patient.avatar ||
                                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces'
                            }
                            alt={patient.name}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-[#005ab5]/20 shadow-xs"
                        />
                        <span
                            className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"
                            title="حساب نشط"
                        />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-['Cairo']">
                                {patient.name}
                            </h1>
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                مريض معتمد
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                            {patient.national_id && (
                                <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                    رقم الهوية:{' '}
                                    <strong className="text-gray-700 font-mono">{patient.national_id}</strong>
                                </span>
                            )}
                            {patient.phone && (
                                <span className="flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                    <span dir="ltr" className="text-gray-700">
                                        {patient.phone}
                                    </span>
                                </span>
                            )}
                            {patient.insurance && (
                                <span className="flex items-center gap-1 text-[#006b5c] font-bold">
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#006b5c]" />
                                    {patient.insurance}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <LiveClockBadge />

                    <Link
                        href="/"
                        className="px-5 py-2.5 rounded-2xl bg-[#005ab5] hover:bg-[#00458e] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                        <span>+ حجز موعد جديد</span>
                    </Link>
                </div>
            </div>
        </div>
    );
});
PatientWelcomeBanner.displayName = 'PatientWelcomeBanner';
