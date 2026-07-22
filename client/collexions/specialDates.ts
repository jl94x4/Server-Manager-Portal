export type SpecialDateFormat = 'MM-DD' | 'DD-MM';

const PAD = (n: number) => String(n).padStart(2, '0');

/** Days in month (1–12). Uses non-leap Feb (29 rejected) — year-agnostic specials. */
const daysInMonth = (month: number): number => {
    if (month === 2) return 28;
    if ([4, 6, 9, 11].includes(month)) return 30;
    return 31;
};

const parseParts = (raw: string): { a: number; b: number } | null => {
    const m = String(raw || '').trim().match(/^(\d{1,2})\D+(\d{1,2})$/);
    if (!m) return null;
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return { a, b };
};

const isValidMonthDay = (month: number, day: number): boolean => {
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > daysInMonth(month)) return false;
    return true;
};

/** Format canonical MM-DD for the UI. */
export function mmDdToDisplay(stored: string, format: SpecialDateFormat): string {
    const parts = parseParts(stored);
    if (!parts) return stored || '';
    // Stored is always MM-DD
    const month = parts.a;
    const day = parts.b;
    if (!isValidMonthDay(month, day)) return stored || '';
    if (format === 'DD-MM') return `${PAD(day)}-${PAD(month)}`;
    return `${PAD(month)}-${PAD(day)}`;
}

/**
 * Convert a user-typed date in the selected display format to canonical MM-DD.
 * Returns null if the input is incomplete or invalid.
 */
export function displayToMmDd(input: string, format: SpecialDateFormat): string | null {
    const parts = parseParts(input);
    if (!parts) return null;
    const month = format === 'DD-MM' ? parts.b : parts.a;
    const day = format === 'DD-MM' ? parts.a : parts.b;
    if (!isValidMonthDay(month, day)) return null;
    return `${PAD(month)}-${PAD(day)}`;
}

export function specialDateFormatLabel(format: SpecialDateFormat): string {
    return format === 'DD-MM' ? 'DD-MM' : 'MM-DD';
}

export function normalizeSpecialDateFormat(raw: unknown): SpecialDateFormat {
    return raw === 'DD-MM' ? 'DD-MM' : 'MM-DD';
}
