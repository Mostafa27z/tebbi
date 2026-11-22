import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Formats "2026-11-08T00:00:00.000000Z" or "2026-11-08" to clean date "2026/11/08"
export function formatArabicDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    try {
        const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const [year, month, day] = clean.split('-');
        if (year && month && day) {
            return `${year}/${month}/${day}`;
        }
        return clean;
    } catch {
        return dateStr ? dateStr.split('T')[0] : '—';
    }
}

// Formats 24h "17:40:00" to clean 12-hour Arabic format "05:40 م"
export function format12HourTime(timeStr?: string | null): string {
    if (!timeStr) return '—';
    try {
        const parts = timeStr.trim().split(':');
        if (parts.length >= 2) {
            let hours = parseInt(parts[0], 10);
            const minutes = parts[1];
            const period = hours >= 12 ? 'م' : 'ص';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
            return `${formattedHours}:${minutes} ${period}`;
        }
        return timeStr;
    } catch {
        return timeStr || '—';
    }
}

// Converts 12-hour Arabic or English time "05:40 م" or "09:30 ص" to standard 24-hour format "17:40:00"
export function parseTimeTo24Hour(timeStr?: string | null): string {
    if (!timeStr) return '09:00:00';
    const trimmed = timeStr.trim();
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
        return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
    }
    const westernNumerals = trimmed.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    const isPm = westernNumerals.includes('م') || /pm/i.test(westernNumerals);
    const isAm = westernNumerals.includes('ص') || /am/i.test(westernNumerals);
    const digitsOnly = westernNumerals.replace(/[^\d:]/g, '').trim();
    const parts = digitsOnly.split(':');
    let hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    if (isPm && hours < 12) hours += 12;
    if (isAm && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

export function formatDurationArabic(minutes?: number | null, compact = false): string {
    const mins = Math.max(1, Math.round(Number(minutes) || 20));
    if (mins < 60) {
        return compact ? `${mins} د` : `${mins} دقيقة`;
    }

    const hours = Math.floor(mins / 60);
    const rem = mins % 60;

    if (compact) {
        if (rem === 0) {
            if (hours === 1) return 'ساعة';
            if (hours === 2) return 'ساعتان';
            if (hours <= 10) return `${hours} ساعات`;
            return `${hours} س`;
        }
        return `${hours} س ${rem} د`;
    }

    let hoursText = '';
    if (hours === 1) hoursText = 'ساعة واحدة';
    else if (hours === 2) hoursText = 'ساعتان';
    else if (hours >= 3 && hours <= 10) hoursText = `${hours} ساعات`;
    else hoursText = `${hours} ساعة`;

    if (rem === 0) {
        return `${hoursText} (${mins} دقيقة)`;
    }
    return `${hoursText} و${rem} دقيقة`;
}

export function timeToMinutes(timeStr: string): number {
    const t24 = parseTimeTo24Hour(timeStr);
    const [hStr, mStr] = t24.split(':');
    return parseInt(hStr || '0', 10) * 60 + parseInt(mStr || '0', 10);
}

export function minutesToArabicTime(totalMinutes: number): string {
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const h24 = Math.floor(normalized / 60);
    const mins = normalized % 60;
    const period = h24 >= 12 ? 'م' : 'ص';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${String(h12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
}
