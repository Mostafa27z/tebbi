import React from 'react';
import { Link } from '@inertiajs/react';
import { Users, Building2, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpecialtyItem } from './types';
import { resolveSpecialtyStyle } from './specialty-theme';

interface SpecialtyCardProps {
    specialty: SpecialtyItem;
}

export const SpecialtyCard: React.FC<SpecialtyCardProps> = React.memo(({ specialty }) => {
    const style = resolveSpecialtyStyle(specialty.icon_slug, specialty.name_ar);

    return (
        <Link
            href={`/doctors?specialty_id=${specialty.id}`}
            className={cn(
                'group bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 relative',
                style.borderClass
            )}
        >
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div
                        className={cn(
                            'w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xs',
                            style.bgClass,
                            style.colorClass
                        )}
                    >
                        {style.icon}
                    </div>

                    {specialty.badge_text && (
                        <span
                            className={cn(
                                'text-[10px] font-bold px-2.5 py-1 rounded-full border',
                                style.badgeBg
                            )}
                        >
                            {specialty.badge_text}
                        </span>
                    )}
                </div>

                <h3 className="font-black text-lg text-gray-900 font-['Cairo'] group-hover:text-[#005ab5] transition-colors leading-snug">
                    {specialty.name_ar}
                </h3>

                {specialty.name_en && (
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5 mb-2.5">
                        {specialty.name_en}
                    </p>
                )}

                {specialty.description && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mt-2 mb-4 font-normal">
                        {specialty.description}
                    </p>
                )}
            </div>

            <div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 font-bold mb-3">
                    <span className="flex items-center gap-1.5 bg-blue-50/70 text-[#005ab5] px-2.5 py-1 rounded-lg">
                        <Users className="w-3.5 h-3.5" />
                        <span>{specialty.doctors_count} استشاري</span>
                    </span>

                    <span className="flex items-center gap-1.5 bg-purple-50/70 text-purple-700 px-2.5 py-1 rounded-lg">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{specialty.facilities_count} منشأة</span>
                    </span>
                </div>

                <div className="w-full py-2.5 px-3 rounded-xl bg-gray-50 group-hover:bg-[#005ab5] text-gray-700 group-hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <span>تصفح الأطباء والمواعيد</span>
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    );
});
SpecialtyCard.displayName = 'SpecialtyCard';
