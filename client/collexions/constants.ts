import { AppConfig } from './types';

export const DEFAULT_CONFIG: AppConfig = {
    plex_url: '',
    plex_token: '',
    collexions_label: 'Collexions',
    dry_run: false,
    pinning_interval: 180,
    repeat_block_hours: 12,
    min_items_for_pinning: 10,
    discord_webhook_url: '',
    use_random_category_mode: false,
    random_category_skip_percent: 70,
    exclusion_list: [],
    regex_exclusion_patterns: [],
    special_collections: [],
    library_names: [],
    number_of_collections_to_pin: {},
    categories: {},
    tmdb_api_key: '',
    trakt_client_id: '',
    mdblist_api_key: '',
    enable_trending_pinning: false,
};
