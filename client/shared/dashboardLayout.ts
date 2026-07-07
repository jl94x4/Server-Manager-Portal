export type DashboardSectionId = 'wrapUp' | 'mainGrid' | 'watchRow' | 'recentlyAdded';

export type MainGridWidgetId =
    | 'adminBadge'
    | 'accessStatus'
    | 'tempAccessSetup'
    | 'quickActions'
    | 'announcement'
    | 'referral'
    | 'newsletterPrefs'
    | 'support'
    | 'libraryStats'
    | 'analytics';

export type RecentlyAddedWidgetId = 'recentMovies' | 'recentShows' | 'recentMusic';

export type DashboardWidgetId = MainGridWidgetId | RecentlyAddedWidgetId;

export interface DashboardLayoutConfig {
    version: 1;
    sections: DashboardSectionId[];
    mainGridOrder: MainGridWidgetId[];
    recentlyAddedOrder: RecentlyAddedWidgetId[];
    hiddenSections: DashboardSectionId[];
    hiddenWidgets: DashboardWidgetId[];
    recentHistoryRows?: number;
    topWatchedRows?: number;
}

export const DASHBOARD_SECTION_LABELS: Record<DashboardSectionId, string> = {
    wrapUp: 'Personal Wrap-Up',
    mainGrid: 'Main dashboard grid',
    watchRow: 'Recently / Most Watched',
    recentlyAdded: 'Recently Added rows',
};

export const MAIN_GRID_WIDGET_META: Record<MainGridWidgetId, { label: string; column: 'left' | 'right'; adminOnly?: boolean; userOnly?: boolean }> = {
    adminBadge: { label: 'Server Admin badge', column: 'left', adminOnly: true },
    quickActions: { label: 'Quick Actions', column: 'left', adminOnly: true },
    accessStatus: { label: 'Access status & expiry', column: 'left', userOnly: true },
    tempAccessSetup: { label: 'Temp access setup spinner', column: 'left', userOnly: true },
    announcement: { label: 'Announcement banner', column: 'left' },
    referral: { label: 'Invite Friends / referral', column: 'left', userOnly: true },
    newsletterPrefs: { label: 'Newsletter preferences', column: 'left', userOnly: true },
    support: { label: 'Need Help / contact', column: 'left', userOnly: true },
    libraryStats: { label: 'Server Library Size', column: 'right' },
    analytics: { label: 'Your Analytics', column: 'right' },
};

export const RECENTLY_ADDED_WIDGET_META: Record<RecentlyAddedWidgetId, string> = {
    recentMovies: 'Recently Added Movies',
    recentShows: 'Recently Added TV Shows',
    recentMusic: 'Recently Added Music',
};

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutConfig = {
    version: 1,
    sections: ['wrapUp', 'mainGrid', 'watchRow', 'recentlyAdded'],
    mainGridOrder: [
        'adminBadge',
        'quickActions',
        'accessStatus',
        'announcement',
        'referral',
        'newsletterPrefs',
        'support',
        'libraryStats',
        'analytics',
    ],
    recentlyAddedOrder: ['recentMovies', 'recentShows', 'recentMusic'],
    hiddenSections: [],
    hiddenWidgets: [],
    recentHistoryRows: 7,
    topWatchedRows: 2,
};

const ALL_SECTIONS: DashboardSectionId[] = ['wrapUp', 'mainGrid', 'watchRow', 'recentlyAdded'];
const ALL_MAIN_GRID: MainGridWidgetId[] = Object.keys(MAIN_GRID_WIDGET_META) as MainGridWidgetId[];
const ALL_RECENTLY_ADDED: RecentlyAddedWidgetId[] = ['recentMovies', 'recentShows', 'recentMusic'];

const uniqueValid = <T extends string>(values: unknown, allowed: T[], fallback: T[]): T[] => {
    if (!Array.isArray(values)) return [...fallback];
    const seen = new Set<T>();
    const result: T[] = [];
    values.forEach((value) => {
        if (typeof value !== 'string') return;
        const id = value as T;
        if (!allowed.includes(id) || seen.has(id)) return;
        seen.add(id);
        result.push(id);
    });
    allowed.forEach((id) => {
        if (!seen.has(id)) result.push(id);
    });
    return result;
};

export const normalizeDashboardLayout = (raw: unknown): DashboardLayoutConfig => {
    const input = raw && typeof raw === 'object' ? (raw as Partial<DashboardLayoutConfig>) : {};
    return {
        version: 1,
        sections: uniqueValid(input.sections, ALL_SECTIONS, DEFAULT_DASHBOARD_LAYOUT.sections),
        mainGridOrder: uniqueValid(input.mainGridOrder, ALL_MAIN_GRID, DEFAULT_DASHBOARD_LAYOUT.mainGridOrder),
        recentlyAddedOrder: uniqueValid(input.recentlyAddedOrder, ALL_RECENTLY_ADDED, DEFAULT_DASHBOARD_LAYOUT.recentlyAddedOrder),
        hiddenSections: uniqueValid(input.hiddenSections, ALL_SECTIONS, []),
        hiddenWidgets: uniqueValid(
            input.hiddenWidgets,
            [...ALL_MAIN_GRID, ...ALL_RECENTLY_ADDED] as DashboardWidgetId[],
            []
        ),
        recentHistoryRows: typeof input.recentHistoryRows === 'number' ? input.recentHistoryRows : DEFAULT_DASHBOARD_LAYOUT.recentHistoryRows,
        topWatchedRows: typeof input.topWatchedRows === 'number' ? input.topWatchedRows : DEFAULT_DASHBOARD_LAYOUT.topWatchedRows,
    };
};

export type DashboardLayoutContext = {
    isAdmin: boolean;
    hasUser: boolean;
    referralEnabled?: boolean;
};

export const isMainGridWidgetAvailable = (id: MainGridWidgetId, ctx: DashboardLayoutContext): boolean => {
    const meta = MAIN_GRID_WIDGET_META[id];
    if (meta.adminOnly && !ctx.isAdmin) return false;
    if (meta.userOnly && ctx.isAdmin) return false;
    if (id === 'referral' && !ctx.referralEnabled) return false;
    if (id === 'tempAccessSetup' && (ctx.isAdmin || ctx.hasUser)) return false;
    if (id === 'accessStatus' && (ctx.isAdmin || !ctx.hasUser)) return false;
    if (id === 'adminBadge' && !ctx.isAdmin) return false;
    if (id === 'quickActions' && !ctx.isAdmin) return false;
    return true;
};

export const resolveMainGridWidgets = (layout: DashboardLayoutConfig, ctx: DashboardLayoutContext): MainGridWidgetId[] =>
    layout.mainGridOrder.filter(
        (id) => !layout.hiddenWidgets.includes(id) && isMainGridWidgetAvailable(id, ctx)
    );

export const splitMainGridForDesktop = (widgets: MainGridWidgetId[]) => ({
    left: widgets.filter((id) => MAIN_GRID_WIDGET_META[id].column === 'left'),
    right: widgets.filter((id) => MAIN_GRID_WIDGET_META[id].column === 'right'),
});

export const resolveRecentlyAddedWidgets = (layout: DashboardLayoutConfig): RecentlyAddedWidgetId[] =>
    layout.recentlyAddedOrder.filter((id) => !layout.hiddenWidgets.includes(id));

export const resolveDashboardSections = (layout: DashboardLayoutConfig): DashboardSectionId[] =>
    layout.sections.filter((id) => !layout.hiddenSections.includes(id));

/** Widget order/visibility is fixed; only section order + visibility is customizable. */
export const lockWidgetLayout = (layout: DashboardLayoutConfig): DashboardLayoutConfig => ({
    ...layout,
    mainGridOrder: [...DEFAULT_DASHBOARD_LAYOUT.mainGridOrder],
    recentlyAddedOrder: [...DEFAULT_DASHBOARD_LAYOUT.recentlyAddedOrder],
    hiddenWidgets: [],
});

export const normalizeSectionLayout = (raw: unknown): DashboardLayoutConfig => {
    const normalized = lockWidgetLayout(normalizeDashboardLayout(raw));
    const input = raw && typeof raw === 'object' ? (raw as Partial<DashboardLayoutConfig>) : null;
    if (!input || !Array.isArray(input.hiddenSections)) {
        return { ...normalized, hiddenSections: [] };
    }
    if (normalized.hiddenSections.length >= ALL_SECTIONS.length) {
        return { ...normalized, hiddenSections: [] };
    }
    return normalized;
};

export const SECTION_PREVIEW_META: Record<
    DashboardSectionId,
    { shortLabel: string; description: string; previewClass: string }
> = {
    wrapUp: {
        shortLabel: 'Wrap-Up',
        description: 'Personal stats cards',
        previewClass: 'h-14',
    },
    mainGrid: {
        shortLabel: 'Main grid',
        description: 'Fixed layout: admin/actions left · library/analytics right',
        previewClass: 'h-20',
    },
    watchRow: {
        shortLabel: 'Watch history',
        description: 'Recently watched & most watched',
        previewClass: 'h-16',
    },
    recentlyAdded: {
        shortLabel: 'Recently added',
        description: 'Movies, shows & music rows',
        previewClass: 'h-12',
    },
};
