export const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    return dateString.split('T')[0];
};

export const getDaysUntilExpiry = (expiryDate: string | null): number | null => {
    if (!expiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const datePart = expiryDate.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const expiry = new Date(year, month - 1, day);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const addMonths = (date: Date, months: number): Date => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};

export const addYears = (date: Date, years: number): Date => {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
};

export const formatTime = (date: Date) => {
    try {
        const is24 = typeof window !== 'undefined' && (window as any).__USE_24_HOUR_CLOCK__ === true;
        const str = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24 });
        return is24 ? str : str.replace(/^0:/, '12:');
    } catch {
        return '--:--';
    }
};

export const formatEventName = (event: string): string => {
    return event.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const hexToRgb = (hex: string) => {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    return `${r} ${g} ${b}`;
};
