import type { AppConfig } from './types';

const SECRET_KEYS = new Set([
    'plex_token',
    'tmdb_api_key',
    'trakt_client_id',
    'mdblist_api_key',
]);

const FIELD_LABELS: Record<string, string> = {
    plex_url: 'Plex URL',
    plex_token: 'Plex token',
    collexions_label: 'Collection label',
    dry_run: 'Dry run mode',
    pinning_interval: 'Check interval (min)',
    repeat_block_hours: 'Repeat block (hours)',
    min_items_for_pinning: 'Min items in collection',
    discord_webhook_url: 'Discord webhook',
    use_random_category_mode: 'Random category mode',
    random_category_skip_percent: 'Random category skip %',
    exclusion_list: 'Exclusion list',
    regex_exclusion_patterns: 'Regex exclusions',
    special_collections: 'Special events',
    special_date_format: 'Special date format',
    library_names: 'Libraries',
    number_of_collections_to_pin: 'Pin limits',
    categories: 'Categories',
    tmdb_api_key: 'TMDb API key',
    trakt_client_id: 'Trakt Client ID',
    mdblist_api_key: 'MDBList API key',
    enable_trending_pinning: 'Smart pinning',
};

export type ConfigDiffEntry = {
    key: keyof AppConfig;
    label: string;
    before: string;
    after: string;
    secret: boolean;
};

const stableStringify = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};
        Object.keys(obj).sort().forEach(k => { sorted[k] = obj[k]; });
        return JSON.stringify(sorted, null, 2);
    }
    return String(value);
};

const maskSecret = (value: unknown): string => {
    const s = String(value ?? '');
    if (!s) return '(empty)';
    if (s.length <= 4) return '••••';
    return `${'•'.repeat(Math.min(12, s.length - 4))}${s.slice(-4)}`;
};

const formatDisplay = (key: string, value: unknown, asSecret: boolean): string => {
    if (asSecret) return maskSecret(value);
    if (typeof value === 'boolean') return value ? 'On' : 'Off';
    if (Array.isArray(value)) {
        if (value.length === 0) return '(empty)';
        if (value.every(v => typeof v === 'string' || typeof v === 'number')) {
            return value.map(String).join(', ');
        }
        return stableStringify(value);
    }
    if (value && typeof value === 'object') {
        return stableStringify(value);
    }
    const s = String(value ?? '');
    return s || '(empty)';
};

const valuesEqual = (a: unknown, b: unknown): boolean =>
    stableStringify(a) === stableStringify(b);

/** Top-level field diffs between saved config and the dirty draft. */
export function diffAppConfig(original: AppConfig, draft: AppConfig): ConfigDiffEntry[] {
    const keys = new Set<keyof AppConfig>([
        ...(Object.keys(original) as (keyof AppConfig)[]),
        ...(Object.keys(draft) as (keyof AppConfig)[]),
    ]);

    const entries: ConfigDiffEntry[] = [];
    for (const key of Array.from(keys).sort()) {
        if (!(key in FIELD_LABELS) && !(key in draft) && !(key in original)) continue;
        const beforeVal = original[key];
        const afterVal = draft[key];
        if (valuesEqual(beforeVal, afterVal)) continue;
        const secret = SECRET_KEYS.has(key);
        entries.push({
            key,
            label: FIELD_LABELS[key] || String(key),
            before: formatDisplay(key, beforeVal, secret),
            after: formatDisplay(key, afterVal, secret),
            secret,
        });
    }
    return entries;
}

/** Restore a single top-level key from original into draft. */
export function revertConfigField(draft: AppConfig, original: AppConfig, key: keyof AppConfig): AppConfig {
    return {
        ...draft,
        [key]: original[key] !== undefined
            ? JSON.parse(JSON.stringify(original[key]))
            : undefined,
    };
}
