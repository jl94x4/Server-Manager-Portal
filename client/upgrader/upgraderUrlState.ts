import { portalUrl } from '../shared/basePath';

export type UpgraderTab = 'browse' | 'history' | 'exclusions' | 'profiles';

export type UpgraderBrowseUrlState = {
    codecs: string[];
    resolutions: string[];
    features: string[];
    qualities: string[];
    library: string;
    type: string;
    sort: string;
    search: string;
    page: number;
};

export type UpgraderProfilesUrlState = {
    instance: string;
    formatPage: number;
    profilePage: number;
};

export type UpgraderUrlState = {
    tab: UpgraderTab;
    browse: UpgraderBrowseUrlState;
    profiles: UpgraderProfilesUrlState;
};

const VALID_TABS = new Set<UpgraderTab>(['browse', 'history', 'exclusions', 'profiles']);

const splitList = (raw: string | null) => (raw ? raw.split(',').map((v) => v.trim()).filter(Boolean) : []);

export const defaultBrowseUrlState = (): UpgraderBrowseUrlState => ({
    codecs: [],
    resolutions: [],
    features: [],
    qualities: [],
    library: 'all',
    type: 'all',
    sort: 'sizeGB',
    search: '',
    page: 1,
});

export const defaultProfilesUrlState = (): UpgraderProfilesUrlState => ({
    instance: '',
    formatPage: 1,
    profilePage: 1,
});

export const parseUpgraderUrl = (search = ''): UpgraderUrlState => {
    const params = new URLSearchParams(search);
    const tabRaw = params.get('tab');
    const tab = VALID_TABS.has(tabRaw as UpgraderTab) ? (tabRaw as UpgraderTab) : 'browse';

    return {
        tab,
        browse: {
            codecs: splitList(params.get('codecs')),
            resolutions: splitList(params.get('resolutions')),
            features: splitList(params.get('features')),
            qualities: splitList(params.get('qualities')),
            library: params.get('library') || 'all',
            type: params.get('type') || 'all',
            sort: params.get('sort') || 'sizeGB',
            search: params.get('search') || '',
            page: Math.max(1, Number(params.get('page')) || 1),
        },
        profiles: {
            instance: params.get('instance') || '',
            formatPage: Math.max(1, Number(params.get('formatPage')) || 1),
            profilePage: Math.max(1, Number(params.get('profilePage')) || 1),
        },
    };
};

export const buildUpgraderSearch = (state: UpgraderUrlState): string => {
    const params = new URLSearchParams();

    if (state.tab !== 'browse') params.set('tab', state.tab);

    if (state.tab === 'browse') {
        const b = state.browse;
        if (b.codecs.length) params.set('codecs', b.codecs.join(','));
        if (b.resolutions.length) params.set('resolutions', b.resolutions.join(','));
        if (b.features.length) params.set('features', b.features.join(','));
        if (b.qualities.length) params.set('qualities', b.qualities.join(','));
        if (b.library !== 'all') params.set('library', b.library);
        if (b.type !== 'all') params.set('type', b.type);
        if (b.sort !== 'sizeGB') params.set('sort', b.sort);
        if (b.search) params.set('search', b.search);
        if (b.page > 1) params.set('page', String(b.page));
    } else if (state.tab === 'profiles') {
        const p = state.profiles;
        if (p.instance) params.set('instance', p.instance);
        if (p.formatPage > 1) params.set('formatPage', String(p.formatPage));
        if (p.profilePage > 1) params.set('profilePage', String(p.profilePage));
    }

    return params.toString();
};

export const buildUpgraderPath = (state: UpgraderUrlState): string => {
    const qs = buildUpgraderSearch(state);
    return qs ? `${portalUrl('/upgrader')}?${qs}` : portalUrl('/upgrader');
};

export const replaceUpgraderUrl = (state: UpgraderUrlState) => {
    const next = buildUpgraderPath(state);
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== next) {
        window.history.replaceState({ upgrader: true }, '', next);
    }
};

export const pushUpgraderUrl = (state: UpgraderUrlState) => {
    const next = buildUpgraderPath(state);
    window.history.pushState({ upgrader: true }, '', next);
};

export const readUpgraderUrl = (): UpgraderUrlState =>
    parseUpgraderUrl(typeof window !== 'undefined' ? window.location.search : '');
