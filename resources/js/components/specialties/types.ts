import React from 'react';

export interface SpecialtyItem {
    id: number;
    name_ar: string;
    name_en?: string;
    icon_slug: string;
    badge_text?: string;
    description?: string;
    doctors_count: number;
    facilities_count: number;
}

export type SpecialtyFilterCategory = 'all' | 'active_doctors' | 'top_demand';

export interface SpecialtyVisualStyle {
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    badgeBg: string;
}
