export type NavFeatureFlags = {
    maintenance?: boolean;
    upgrader?: boolean;
    request?: boolean;
    requestsQueue?: boolean;
};

/** Default sidebar order matching Settings → Navigation stock layout. */
export const DEFAULT_NAV_ORDER = [
    'home',
    'discover',
    'request',
    'analytics',
    'users',
    'downloads',
    'upgrader',
    'mediastack',
    'requests',
    'status',
    'maintenance',
    'about',
    'settings',
    'logout',
] as const;

const LEGACY_DEFAULT_NAV_ORDERS = [
    ['home', 'discover', 'users', 'status', 'analytics', 'downloads', 'mediastack', 'maintenance', 'request', 'about', 'settings', 'logout'],
    ['home', 'discover', 'users', 'analytics', 'downloads', 'mediastack', 'upgrader', 'requests', 'status', 'maintenance', 'request', 'about', 'logs', 'settings', 'logout'],
    ['home', 'discover', 'status', 'analytics', 'mediastack', 'request', 'about', 'settings', 'logout'],
    ['home', 'discover', 'status', 'analytics', 'request', 'users', 'downloads', 'mediastack', 'maintenance', 'about', 'settings', 'logout'],
];

const sameOrder = (a: string[], b: string[]) => (
    a.length === b.length && a.every((key, index) => key === b[index])
);

/** Upgrade known legacy defaults to the current default without clobbering custom orders. */
export const resolveNavOrder = (order?: string[] | null): string[] => {
    if (!Array.isArray(order) || !order.length) return [...DEFAULT_NAV_ORDER];
    if (LEGACY_DEFAULT_NAV_ORDERS.some((legacy) => sameOrder(order, legacy))) {
        return [...DEFAULT_NAV_ORDER];
    }
    return [...order];
};

const PLACEHOLDER_REQUEST_URLS = new Set([
    'https://yourdomain.com',
    'http://yourdomain.com',
    '',
]);

export const isRequestNavEnabled = (requestAppType?: string | null, requestUrl?: string | null) => {
    if (!requestAppType || requestAppType === 'none') return false;
    const url = String(requestUrl || '').trim();
    if (!url || PLACEHOLDER_REQUEST_URLS.has(url)) return false;
    return true;
};

export const filterNavOrder = (
    order: string[],
    options: { isAdmin: boolean; features?: NavFeatureFlags },
) => {
    const features = options.features || {};
    const maintenanceEnabled = features.maintenance !== false;
    const upgraderEnabled = !!features.upgrader;
    const requestsQueueEnabled = !!features.requestsQueue;
    const requestEnabled = features.request !== false || requestsQueueEnabled;

    return (Array.isArray(order) ? order : []).filter((key) => {
        if (key === 'logout' || key === 'logs') return false;
        if ((key === 'users' || key === 'settings' || key === 'maintenance' || key === 'upgrader' || key === 'requests') && !options.isAdmin) return false;
        if (key === 'maintenance' && !maintenanceEnabled) return false;
        if (key === 'upgrader' && !upgraderEnabled) return false;
        if (key === 'request' && !requestEnabled) return false;
        if (key === 'requests' && !requestsQueueEnabled) return false;
        return true;
    });
};
