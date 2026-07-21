import { DEFAULT_CONFIG } from './constants';
import type { AppConfig } from './types';

/** Keys we accept from a standalone Collexions config.json. */
const CONFIG_KEYS: (keyof AppConfig)[] = [
    'plex_url',
    'plex_token',
    'collexions_label',
    'dry_run',
    'pinning_interval',
    'repeat_block_hours',
    'min_items_for_pinning',
    'discord_webhook_url',
    'use_random_category_mode',
    'random_category_skip_percent',
    'exclusion_list',
    'regex_exclusion_patterns',
    'special_collections',
    'library_names',
    'number_of_collections_to_pin',
    'categories',
    'tmdb_api_key',
    'trakt_client_id',
    'mdblist_api_key',
    'enable_trending_pinning',
];

/** Portal SSO does not use Collexions password hashes — drop on import. */
const STRIP_ON_IMPORT = new Set([
    'admin_password_hash',
    'admin_password',
    'password',
    'jwt_secret',
]);

export type ParsedCollexionsConfig = {
    config: AppConfig;
    importedKeys: string[];
    skippedKeys: string[];
};

export const parseCollexionsConfigJson = (raw: unknown): ParsedCollexionsConfig => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new Error('Config must be a JSON object (your Collexions config.json).');
    }
    const incoming = raw as Record<string, unknown>;
    const next: AppConfig = { ...DEFAULT_CONFIG };
    const importedKeys: string[] = [];
    const skippedKeys: string[] = [];

    for (const [key, value] of Object.entries(incoming)) {
        if (STRIP_ON_IMPORT.has(key)) {
            skippedKeys.push(key);
            continue;
        }
        if ((CONFIG_KEYS as string[]).includes(key)) {
            (next as any)[key] = value;
            importedKeys.push(key);
            continue;
        }
        // Keep unknown keys out of AppConfig state, but remember them for the message.
        skippedKeys.push(key);
    }

    if (importedKeys.length === 0) {
        throw new Error('No recognized Collexions settings found in that JSON.');
    }

    // Normalize a few common shapes so the form stays usable.
    if (!Array.isArray(next.library_names)) next.library_names = [];
    if (!Array.isArray(next.exclusion_list)) next.exclusion_list = [];
    if (!Array.isArray(next.regex_exclusion_patterns)) next.regex_exclusion_patterns = [];
    if (!Array.isArray(next.special_collections)) next.special_collections = [];
    if (!next.number_of_collections_to_pin || typeof next.number_of_collections_to_pin !== 'object') {
        next.number_of_collections_to_pin = {};
    }
    if (!next.categories || typeof next.categories !== 'object') {
        next.categories = {};
    }

    return { config: next, importedKeys, skippedKeys };
};

export const parseCollexionsConfigText = (text: string): ParsedCollexionsConfig => {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error('Invalid JSON — check that you uploaded a valid config.json.');
    }
    return parseCollexionsConfigJson(parsed);
};

export const buildExportableConfig = (config: AppConfig): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const key of CONFIG_KEYS) {
        out[key] = (config as any)[key];
    }
    return out;
};
