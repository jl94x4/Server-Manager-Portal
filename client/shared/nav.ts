export type NavFeatureFlags = {
    maintenance?: boolean;
    request?: boolean;
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
    const requestEnabled = features.request !== false;

    return (Array.isArray(order) ? order : []).filter((key) => {
        if (key === 'logout' || key === 'logs') return false;
        if ((key === 'users' || key === 'settings' || key === 'maintenance') && !options.isAdmin) return false;
        if (key === 'maintenance' && !maintenanceEnabled) return false;
        if (key === 'request' && !requestEnabled) return false;
        return true;
    });
};
