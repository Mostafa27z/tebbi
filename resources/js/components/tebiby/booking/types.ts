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

export function generatePresetDays(): PresetDay[] {
    const days: PresetDay[] = [];
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const arabicMonths = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const now = new Date();

    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const iso = `${year}-${month}-${day}`;

        const dayName = arabicDays[d.getDay()];
        const monthName = arabicMonths[d.getMonth()];
        const dateStr = `${d.getDate()} ${monthName}`;

        let label = dayName;
        let fullFormatted = `${dayName} ${dateStr}`;

        if (i === 0) {
            label = 'اليوم';
            fullFormatted = `اليوم - ${dayName} ${dateStr}`;
        } else if (i === 1) {
            label = 'غداً';
            fullFormatted = `غداً - ${dayName} ${dateStr}`;
        }

        days.push({
            label,
            dayName,
            dateStr,
            fullFormatted,
            iso,
        });
    }

    return days;
}

export const PRESET_DAYS: PresetDay[] = generatePresetDays();

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

