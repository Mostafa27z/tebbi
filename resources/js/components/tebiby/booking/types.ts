export interface Doctor {
    id: number;
    title_ar: string;
    consultation_fee: number;
    user: {
        name: string;
        avatar: string;
    };
    clinic: {
        name: string;
        district: string;
        city: string;
    };
    specialty?: {
        name_ar: string;
    };
}

export interface PresetDay {
    label: string;
    dayName: string;
    dateStr: string;
    fullFormatted: string;
    iso: string;
}

export const PRESET_DAYS: PresetDay[] = [
    { label: 'اليوم', dayName: 'الجمعة', dateStr: '6 نوفمبر', fullFormatted: 'اليوم - الجمعة 6 نوفمبر', iso: '2026-11-06' },
    { label: 'غداً', dayName: 'السبت', dateStr: '7 نوفمبر', fullFormatted: 'السبت 7 نوفمبر', iso: '2026-11-07' },
    { label: 'الأحد', dayName: 'الأحد', dateStr: '8 نوفمبر', fullFormatted: 'الأحد 8 نوفمبر', iso: '2026-11-08' },
    { label: 'الإثنين', dayName: 'الإثنين', dateStr: '9 نوفمبر', fullFormatted: 'الإثنين 9 نوفمبر', iso: '2026-11-09' },
    { label: 'الثلاثاء', dayName: 'الثلاثاء', dateStr: '10 نوفمبر', fullFormatted: 'الثلاثاء 10 نوفمبر', iso: '2026-11-10' },
    { label: 'الأربعاء', dayName: 'الأربعاء', dateStr: '11 نوفمبر', fullFormatted: 'الأربعاء 11 نوفمبر', iso: '2026-11-11' },
];

export const MORNING_SLOTS: string[] = [
    '09:30 ص',
    '10:00 ص',
    '10:30 ص',
    '11:15 ص',
];

export const EVENING_SLOTS: string[] = [
    '04:30 م',
    '05:00 م',
    '05:20 م',
    '05:40 م',
    '06:00 م',
    '06:30 م',
    '07:00 م',
    '07:30 م',
];

export const INSURANCE_COMPANIES: string[] = [
    'شركة بوبا العربية للتأمين',
    'شركة التعاونية للتأمين',
    'شركة ميدغلف للتأمين',
    'تكافل الراجحي الصحي',
    'شركة ملاذ للتأمين',
];

