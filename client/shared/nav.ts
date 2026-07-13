export type NavFeatureFlags = {
    maintenance?: boolean;
    upgrader?: boolean;
    request?: boolean;
    requestsQueue?: boolean;
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
