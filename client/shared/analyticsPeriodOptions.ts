export const ANALYTICS_PERIOD_OPTIONS = [
    { value: 7, label: 'Last 7 Days' },
    { value: 30, label: 'Last 30 Days' },
    { value: 60, label: 'Last 60 Days' },
    { value: 90, label: 'Last 90 Days' },
    { value: 180, label: 'Last 180 Days' },
    { value: 365, label: 'Last 365 Days' },
    { value: 'all' as const, label: 'All Time' },
];
