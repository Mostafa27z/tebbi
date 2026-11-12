import React from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    iconBg?: string;
    trend?: string;
    className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    iconBg = 'bg-gray-50',
    trend,
    className,
}) => {
    return (
        <div className={cn('p-5 sm:p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between text-right relative overflow-hidden group', className)}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 font-['Cairo'] tracking-wide">{title}</span>
                {icon && (
                    <div className={cn('w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105', iconBg)}>
                        {icon}
                    </div>
                )}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 font-['Cairo'] tracking-tight my-1">
                {value}
            </div>
            {(subtitle || trend) && (
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2 border-t border-gray-100/80 mt-2">
                    {subtitle && <span className="truncate">{subtitle}</span>}
                    {trend && <span className="font-bold text-emerald-600 font-mono shrink-0 mr-1">{trend}</span>}
                </div>
            )}
        </div>
    );
};
