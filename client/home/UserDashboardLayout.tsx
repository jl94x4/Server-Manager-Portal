import React from 'react';
import {
    normalizeSectionLayout,
    resolveDashboardSections,
    resolveMainGridWidgets,
    resolveRecentlyAddedWidgets,
    type DashboardLayoutContext,
    type DashboardWidgetId,
    type DashboardWidgetSize,
    type MainGridWidgetId,
    type RecentlyAddedWidgetId,
} from '../shared/dashboardLayout';

const widgetSizeClass = (size: DashboardWidgetSize | undefined, fallback: DashboardWidgetSize = 'normal') => {
    const resolved = size || fallback;
    if (resolved === 'compact') return 'lg:col-span-4';
    if (resolved === 'wide') return 'lg:col-span-8';
    if (resolved === 'full') return 'lg:col-span-12';
    return 'lg:col-span-6';
};

type Props = {
    layoutConfig: unknown;
    layoutCtx: DashboardLayoutContext;
    renderWrapUp: () => React.ReactNode;
    renderMainGridWidget: (id: MainGridWidgetId) => React.ReactNode;
    renderPendingRequests: () => React.ReactNode;
    renderWatchRowLeft?: () => React.ReactNode;
    renderWatchRowRight?: () => React.ReactNode;
    renderBazarrTools?: () => React.ReactNode;
    renderRecentlyAddedWidget: (id: RecentlyAddedWidgetId) => React.ReactNode;
    renderRecentlyAddedSkeleton: () => React.ReactNode;
    recentlyAddedLoading: boolean;
    hasDashboardData: boolean;
};

export const UserDashboardLayout: React.FC<Props> = ({
    layoutConfig,
    layoutCtx,
    renderWrapUp,
    renderMainGridWidget,
    renderPendingRequests,
    renderWatchRowLeft,
    renderWatchRowRight,
    renderBazarrTools,
    renderRecentlyAddedWidget,
    renderRecentlyAddedSkeleton,
    recentlyAddedLoading,
    hasDashboardData,
}) => {
    const layout = normalizeSectionLayout(layoutConfig);
    const sections = resolveDashboardSections(layout, layoutCtx);
    const mainGridWidgets = resolveMainGridWidgets(layout, layoutCtx);
    const recentlyAdded = resolveRecentlyAddedWidgets(layout);
    const getWidgetClass = (id: DashboardWidgetId, fallback: DashboardWidgetSize = 'normal') => widgetSizeClass(layout.widgetSizes?.[id], fallback);

    const renderMainGridColumns = () => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 items-start">
            {mainGridWidgets.map((id) => (
                <div key={id} className={`min-w-0 ${getWidgetClass(id)}`}>
                    {renderMainGridWidget(id)}
                </div>
            ))}
        </div>
    );

    const renderWatchRowColumns = () => {
        const recentlyWatched = renderWatchRowLeft?.();
        const mostWatched = renderWatchRowRight?.();
        if (!recentlyWatched && !mostWatched) return null;
        return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 items-start">
                {recentlyWatched ? (
                    <div className="lg:col-span-4 flex flex-col gap-3 md:gap-4 min-h-0">
                        {recentlyWatched}
                    </div>
                ) : null}
                {mostWatched ? (
                    <div className={`flex flex-col gap-3 md:gap-4 min-h-0 ${recentlyWatched ? 'lg:col-span-8' : 'lg:col-span-8 lg:col-start-5'}`}>
                        {mostWatched}
                    </div>
                ) : null}
            </div>
        );
    };

    const renderRecentlyAddedRows = () => (
        <>
            {recentlyAdded.map((id) => (
                <div key={id} className={`min-w-0 ${getWidgetClass(id, 'full')}`}>{renderRecentlyAddedWidget(id)}</div>
            ))}
        </>
    );

    const sectionNodes: React.ReactNode[] = [];
    for (let index = 0; index < sections.length; index += 1) {
        const sectionId = sections[index];
        switch (sectionId) {
            case 'wrapUp': {
                const content = renderWrapUp();
                if (!content) break;
                sectionNodes.push(
                    <div key="wrapUp" className="relative w-full min-w-0">
                        {content}
                    </div>
                );
                break;
            }
            case 'mainGrid': {
                if (mainGridWidgets.length === 0) break;
                sectionNodes.push(
                    <div key="mainGrid" className="relative w-full min-w-0">
                        {renderMainGridColumns()}
                    </div>
                );
                break;
            }
            case 'pendingRequests': {
                const content = renderPendingRequests();
                if (!content) break;
                sectionNodes.push(
                    <div key="pendingRequests" className="relative z-[2] w-full min-w-0 isolate">
                        {content}
                    </div>
                );
                break;
            }
            case 'watchRow': {
                const content = renderWatchRowColumns();
                if (!content) break;
                sectionNodes.push(
                    <div key="watchRow" className="relative z-[1] w-full min-w-0">
                        {content}
                    </div>
                );
                break;
            }
            case 'recentlyAdded':
                if (recentlyAddedLoading && !hasDashboardData) {
                    sectionNodes.push(
                        <div key="recentlyAdded" className="relative w-full min-w-0">
                            {renderRecentlyAddedSkeleton()}
                        </div>
                    );
                    break;
                }
                if (!hasDashboardData) break;
                sectionNodes.push(
                    <div key="recentlyAdded" className="relative w-full min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
                        {recentlyAdded.map((id) => (
                            <div key={id} className={`min-w-0 ${getWidgetClass(id, 'full')}`}>{renderRecentlyAddedWidget(id)}</div>
                        ))}
                    </div>
                );
                break;
            case 'bazarrTools': {
                const content = renderBazarrTools?.();
                if (!content) break;
                sectionNodes.push(
                    <div key="bazarrTools" className="relative w-full min-w-0">
                        {content}
                    </div>
                );
                break;
            }
            default:
                break;
        }
    }

    return (
        <div className="grid grid-cols-1 gap-3 md:gap-4 w-full">
            {sectionNodes}
        </div>
    );
};
