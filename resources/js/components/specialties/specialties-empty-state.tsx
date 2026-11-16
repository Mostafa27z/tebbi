import React from 'react';
import { Search } from 'lucide-react';

interface SpecialtiesEmptyStateProps {
    onReset: () => void;
}

export const SpecialtiesEmptyState: React.FC<SpecialtiesEmptyStateProps> = React.memo(({ onReset }) => {
    return (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-900 font-['Cairo'] text-base">لا توجد أقسام مطابقة للبحث</h3>
            <p className="text-xs text-gray-500 mt-1">جرب البحث بكلمات أخرى أو تغيير الفلتر المحدد.</p>
            <button
                type="button"
                onClick={onReset}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-50 text-[#005ab5] text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
            >
                إلغاء الفلترة وعرض الكل
            </button>
        </div>
    );
});
SpecialtiesEmptyState.displayName = 'SpecialtiesEmptyState';
