import React from 'react';
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';
import { CustomSelect } from './custom-select';
import { cn } from '@/lib/utils';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50],
    className,
}) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(totalItems, currentPage * pageSize);

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div
            className={cn(
                'flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-3xl border border-gray-200/80 shadow-xs select-none',
                className
            )}
            dir="rtl"
        >
            {/* Info Text & Page Size Selector */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
                <span>
                    عرض <strong className="text-gray-900 font-bold font-mono">{startItem}</strong> إلى{' '}
                    <strong className="text-gray-900 font-bold font-mono">{endItem}</strong> من أصل{' '}
                    <strong className="text-gray-900 font-bold font-mono">{totalItems}</strong> نتيجة
                </span>

                {onPageSizeChange && (
                    <div className="flex items-center gap-1.5 mr-2">
                        <span className="text-[11px] text-gray-400">لكل صفحة:</span>
                        <div className="w-16">
                            <CustomSelect
                                size="sm"
                                menuWidth="trigger"
                                value={pageSize}
                                onChange={(val) => onPageSizeChange(Number(val))}
                                options={pageSizeOptions.map((opt) => ({
                                    value: opt,
                                    label: `${opt}`,
                                }))}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1">
                {/* First Page (in RTL, Right is Previous/First) */}
                <button
                    type="button"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="الصفحة الأولى"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>

                {/* Previous Page */}
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="الصفحة السابقة"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Page Number Pills */}
                <div className="flex items-center gap-1 px-1">
                    {getPageNumbers().map((page, idx) => {
                        if (page === '...') {
                            return (
                                <span key={`ellipsis-${idx}`} className="px-2 text-xs text-gray-400 font-bold">
                                    ...
                                </span>
                            );
                        }
                        const isCurrent = page === currentPage;
                        return (
                            <button
                                key={`page-${page}`}
                                type="button"
                                onClick={() => onPageChange(Number(page))}
                                className={cn(
                                    'w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono flex items-center justify-center',
                                    isCurrent
                                        ? 'bg-[#005ab5] text-white shadow-sm shadow-blue-500/20'
                                        : 'text-gray-700 hover:bg-gray-100'
                                )}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                {/* Next Page */}
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="الصفحة التالية"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                    type="button"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="الصفحة الأخيرة"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

