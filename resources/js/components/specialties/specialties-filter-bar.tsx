import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpecialtyFilterCategory } from './types';

interface SpecialtiesFilterBarProps {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    selectedCategory: SpecialtyFilterCategory;
    onCategoryChange: (cat: SpecialtyFilterCategory) => void;
    totalCount: number;
    activeDoctorsSpecCount: number;
    topDemandSpecCount: number;
}

export const SpecialtiesFilterBar: React.FC<SpecialtiesFilterBarProps> = React.memo(({
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    totalCount,
    activeDoctorsSpecCount,
    topDemandSpecCount,
}) => {
    return (
        <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="ابحث باسم القسم أو الوصف الطبي..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full h-11 pr-11 pl-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#005ab5]/20 focus:border-[#005ab5] focus:bg-white transition-all"
                />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                <button
                    type="button"
                    onClick={() => onCategoryChange('all')}
                    className={cn(
                        'px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                        selectedCategory === 'all'
                            ? 'bg-[#005ab5] text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    )}
                >
                    كل الأقسام ({totalCount})
                </button>

                <button
                    type="button"
                    onClick={() => onCategoryChange('active_doctors')}
                    className={cn(
                        'px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                        selectedCategory === 'active_doctors'
                            ? 'bg-[#005ab5] text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    )}
                >
                    أقسام بأطباء متاحين ({activeDoctorsSpecCount})
                </button>

                <button
                    type="button"
                    onClick={() => onCategoryChange('top_demand')}
                    className={cn(
                        'px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                        selectedCategory === 'top_demand'
                            ? 'bg-[#005ab5] text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    )}
                >
                    الأعلى تغطية ({topDemandSpecCount})
                </button>
            </div>
        </div>
    );
});
SpecialtiesFilterBar.displayName = 'SpecialtiesFilterBar';
