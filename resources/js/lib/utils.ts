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
