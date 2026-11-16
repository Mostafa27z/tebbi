import React from 'react';
import {
    Stethoscope,
    Sparkles,
    Eye,
    HeartPulse,
    Activity,
    Pill,
    Smile,
    Baby,
    Zap,
} from 'lucide-react';
import { SpecialtyVisualStyle } from './types';

export function resolveSpecialtyStyle(iconSlug?: string, nameAr: string = ''): SpecialtyVisualStyle {
    const slug = (iconSlug || '').toLowerCase();

    if (slug.includes('dent') || slug.includes('tooth') || nameAr.includes('أسنان')) {
        return {
            icon: <Smile className="w-6 h-6" />,
            colorClass: 'text-cyan-600',
            bgClass: 'bg-cyan-50/80 group-hover:bg-cyan-600 group-hover:text-white',
            borderClass: 'border-cyan-100 hover:border-cyan-300',
            badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
        };
    }

    if (slug.includes('derm') || slug.includes('skin') || nameAr.includes('جلدية') || nameAr.includes('تجميل')) {
        return {
            icon: <Sparkles className="w-6 h-6" />,
            colorClass: 'text-pink-600',
            bgClass: 'bg-pink-50/80 group-hover:bg-pink-600 group-hover:text-white',
            borderClass: 'border-pink-100 hover:border-pink-300',
            badgeBg: 'bg-pink-50 text-pink-700 border-pink-200/80',
        };
    }

    if (slug.includes('ped') || slug.includes('baby') || nameAr.includes('أطفال') || nameAr.includes('ولادة')) {
        return {
            icon: <Baby className="w-6 h-6" />,
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-50/80 group-hover:bg-amber-600 group-hover:text-white',
            borderClass: 'border-amber-100 hover:border-amber-300',
            badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        };
    }

    if (slug.includes('intern') || slug.includes('gastro') || nameAr.includes('باطنة') || nameAr.includes('هضمي')) {
        return {
            icon: <Pill className="w-6 h-6" />,
            colorClass: 'text-emerald-600',
            bgClass: 'bg-emerald-50/80 group-hover:bg-emerald-600 group-hover:text-white',
            borderClass: 'border-emerald-100 hover:border-emerald-300',
            badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        };
    }

    if (slug.includes('ortho') || slug.includes('bone') || nameAr.includes('عظام') || nameAr.includes('مفاصل')) {
        return {
            icon: <Activity className="w-6 h-6" />,
            colorClass: 'text-indigo-600',
            bgClass: 'bg-indigo-50/80 group-hover:bg-indigo-600 group-hover:text-white',
            borderClass: 'border-indigo-100 hover:border-indigo-300',
            badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        };
    }

    if (slug.includes('eye') || slug.includes('ophth') || nameAr.includes('عيون') || nameAr.includes('ليزر')) {
        return {
            icon: <Eye className="w-6 h-6" />,
            colorClass: 'text-[#005ab5]',
            bgClass: 'bg-blue-50/80 group-hover:bg-[#005ab5] group-hover:text-white',
            borderClass: 'border-blue-100 hover:border-blue-300',
            badgeBg: 'bg-blue-50 text-[#005ab5] border-blue-200/80',
        };
    }

    if (slug.includes('neuro') || slug.includes('brain') || nameAr.includes('مخ') || nameAr.includes('أعصاب')) {
        return {
            icon: <Zap className="w-6 h-6" />,
            colorClass: 'text-purple-600',
            bgClass: 'bg-purple-50/80 group-hover:bg-purple-600 group-hover:text-white',
            borderClass: 'border-purple-100 hover:border-purple-300',
            badgeBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
        };
    }

    if (slug.includes('cardio') || slug.includes('heart') || nameAr.includes('قلب') || nameAr.includes('أوعية')) {
        return {
            icon: <HeartPulse className="w-6 h-6" />,
            colorClass: 'text-rose-600',
            bgClass: 'bg-rose-50/80 group-hover:bg-rose-600 group-hover:text-white',
            borderClass: 'border-rose-100 hover:border-rose-300',
            badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/80',
        };
    }

    return {
        icon: <Stethoscope className="w-6 h-6" />,
        colorClass: 'text-[#005ab5]',
        bgClass: 'bg-blue-50 group-hover:bg-[#005ab5] group-hover:text-white',
        borderClass: 'border-gray-200 hover:border-blue-200',
        badgeBg: 'bg-gray-100 text-gray-700 border-gray-200',
    };
}
