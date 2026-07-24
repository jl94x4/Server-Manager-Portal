/**
 * Autoscan-compatible path rewrite: first matching regexp `from` is replaced with `to`.
 * @param {{ from: string, to: string }[]} rules
 * @returns {(input: string) => string}
 */
export const createRewriter = (rules = []) => {
    const compiled = [];
    for (const rule of rules) {
        const from = String(rule?.from || '');
        if (!from) continue;
        try {
            compiled.push({ re: new RegExp(from), to: String(rule?.to ?? '') });
        } catch {
            // Skip invalid patterns rather than failing startup.
        }
    }
    return (input) => {
        const value = String(input || '');
        for (const { re, to } of compiled) {
            if (re.test(value)) return value.replace(re, to);
        }
        return value;
    };
};

/**
 * Parse durations like "30s", "1m", "5m", "1h" into milliseconds.
 * @param {string|number} value
 * @param {number} fallbackMs
 */
export const parseDurationMs = (value, fallbackMs = 60_000) => {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return fallbackMs;
    const match = raw.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)?$/);
    if (!match) return fallbackMs;
    const n = Number(match[1]);
    const unit = match[2] || 'ms';
    const mult = unit === 'ms' ? 1
        : unit === 's' ? 1000
            : unit === 'm' ? 60_000
                : unit === 'h' ? 3_600_000
                    : 86_400_000;
    return Math.max(0, Math.round(n * mult));
};

export const ensureTrailingSlash = (p) => {
    const s = String(p || '');
    if (!s) return s;
    return s.endsWith('/') || s.endsWith('\\') ? s : `${s}/`;
};

export const joinUrl = (base, ...parts) => {
    const root = String(base || '').replace(/\/+$/, '');
    const rest = parts
        .map((p) => String(p || '').replace(/^\/+|\/+$/g, ''))
        .filter(Boolean)
        .join('/');
    return rest ? `${root}/${rest}` : root;
};
