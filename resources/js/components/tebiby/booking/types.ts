import { timeToMinutes } from '@/lib/utils';

export interface DoctorServiceItem {
    id: number;
    doctor_profile_id?: number;
    name: string;
    description?: string | null;
    price: number | string;
    duration_minutes: number;
    is_active?: boolean;
}

export interface BookedInterval {
    start_time: string;
    start_minutes: number;
    end_minutes: number;
    duration_minutes: number;
}

export interface Doctor {
    id: number;
    title_ar: string;
    consultation_fee: number;
    waiting_time_minutes?: number;
    slot_auto_confirm_limit?: number;
    slot_waitlist_limit?: number;
    active_services?: DoctorServiceItem[];
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
    '09:00 ص',
    '09:30 ص',
    '10:00 ص',
    '10:30 ص',
    '11:00 ص',
    '11:30 ص',
    '12:00 م',
    '12:30 م',
];

export const EVENING_SLOTS: string[] = [
    '04:00 م',
    '04:30 م',
    '05:00 م',
    '05:30 م',
    '06:00 م',
    '06:30 م',
    '07:00 م',
    '07:30 م',
    '08:00 م',
    '08:30 م',
    '09:00 م',
];

export type SlotAvailabilityStatus = 'available' | 'waitlist' | 'full';

export interface SlotAvailabilityInfo {
    status: SlotAvailabilityStatus;
    bookedCount: number;
    totalCapacity: number;
    remainingAutoConfirm: number;
    remainingWaitlist: number;
}

export function getSlotPeakBookedCount(
    slotStr: string,
    durationMinutes: number,
    bookedIntervals: BookedInterval[]
): number {
    if (!bookedIntervals.length) return 0;
    const newStart = timeToMinutes(slotStr);
    const newEnd = newStart + Math.max(5, durationMinutes || 20);
    const events: Array<[number, number]> = [];

    for (const b of bookedIntervals) {
        if (b.start_minutes < newEnd && b.end_minutes > newStart) {
            const clippedStart = Math.max(b.start_minutes, newStart);
            const clippedEnd = Math.min(b.end_minutes, newEnd);
            if (clippedStart < clippedEnd) {
                events.push([clippedStart, 1]);
                events.push([clippedEnd, -1]);
            }
        }
    }

    if (!events.length) return 0;

    events.sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));

    let current = 0;
    let peak = 0;
    for (const [, delta] of events) {
        current += delta;
        if (current > peak) peak = current;
    }
    return peak;
}

export function getSlotAvailability(
    slotStr: string,
    durationMinutes: number,
    bookedIntervals: BookedInterval[],
    autoConfirmLimit = 1,
    waitlistLimit = 1
): SlotAvailabilityInfo {
    const safeAuto = Math.max(0, Number(autoConfirmLimit) || 0);
    const safeWaitlist = Math.max(0, Number(waitlistLimit) || 0);
    const totalCapacity = Math.max(1, safeAuto + safeWaitlist);
    const bookedCount = getSlotPeakBookedCount(slotStr, durationMinutes, bookedIntervals);

    if (bookedCount >= totalCapacity) {
        return {
            status: 'full',
            bookedCount,
            totalCapacity,
            remainingAutoConfirm: 0,
            remainingWaitlist: 0,
        };
    }

    if (bookedCount >= safeAuto) {
        return {
            status: 'waitlist',
            bookedCount,
            totalCapacity,
            remainingAutoConfirm: 0,
            remainingWaitlist: Math.max(0, totalCapacity - bookedCount),
        };
    }

    return {
        status: 'available',
        bookedCount,
        totalCapacity,
        remainingAutoConfirm: Math.max(0, safeAuto - bookedCount),
        remainingWaitlist: safeWaitlist,
    };
}

export function isSlotConflicting(
    slotStr: string,
    durationMinutes: number,
    bookedIntervals: BookedInterval[]
): boolean {
    return getSlotAvailability(slotStr, durationMinutes, bookedIntervals, 1, 0).status === 'full';
}

export const INSURANCE_COMPANIES: string[] = [
    'شركة بوبا العربية للتأمين',
    'شركة التعاونية للتأمين',
    'شركة ميدغلف للتأمين',
    'تكافل الراجحي الصحي',
    'شركة ملاذ للتأمين',
];

