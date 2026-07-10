import React from 'react';
import {
    normalizeSectionLayout,
    resolveDashboardSections,
    resolveMainGridWidgets,
    resolveRecentlyAddedWidgets,
    splitMainGridForDesktop,
    type DashboardLayoutContext,
    type MainGridWidgetId,
    type RecentlyAddedWidgetId,
} from '../shared/dashboardLayout';

type Props = {
    layoutConfig: unknown;
    layoutCtx: DashboardLayoutContext;
    renderWrapUp: () => React.ReactNode;
    renderMainGridWidget: (id: MainGridWidgetId) => React.ReactNode;
    renderPendingRequests: () => React.ReactNode;
    renderWatchRowLeft?: () => React.ReactNode;
    renderWatchRowRight?: () => React.ReactNode;
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
    renderRecentlyAddedWidget,
    renderRecentlyAddedSkeleton,
    recentlyAddedLoading,
    hasDashboardData,
}) => {
    const layout = normalizeSectionLayout(layoutConfig);
    const sections = resolveDashboardSections(layout, layoutCtx);
    const mainGridWidgets = resolveMainGridWidgets(layout, layoutCtx);
    const { left, right } = splitMainGridForDesktop(mainGridWidgets);
    const recentlyAdded = resolveRecentlyAddedWidgets(layout);

    const renderMainGridColumns = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 items-start">
            <div className="lg:col-span-1 flex flex-col gap-3 md:gap-4 min-h-0">
                {left.map((id) => (
                    <React.Fragment key={id}>{renderMainGridWidget(id)}</React.Fragment>
                ))}
            </div>
            <div className="lg:col-span-2 flex flex-col gap-3 md:gap-4 min-h-0">
                {right.map((id) => (
                    <React.Fragment key={id}>{renderMainGridWidget(id)}</React.Fragment>
                ))}
            </div>
        </div>
    );

    const renderWatchRowColumns = () => {
        const recentlyWatched = renderWatchRowLeft?.();
        const mostWatched = renderWatchRowRight?.();
        if (!recentlyWatched && !mostWatched) return null;
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 items-start">
                {recentlyWatched ? (
                    <div className="lg:col-span-1 flex flex-col gap-3 md:gap-4 min-h-0">
                        {recentlyWatched}
                    </div>
                ) : null}
                {mostWatched ? (
                    <div className={`flex flex-col gap-3 md:gap-4 min-h-0 ${recentlyWatched ? 'lg:col-span-2' : 'lg:col-span-2 lg:col-start-2'}`}>
                        {mostWatched}
                    </div>
                ) : null}
            </div>
        );
    };

    const renderMergedMainAndWatchGrid = () => {
        const recentlyWatched = renderWatchRowLeft?.();
        const mostWatched = renderWatchRowRight?.();
        return (
            <>
                <div className="hidden lg:grid lg:grid-cols-3 gap-3 md:gap-4 items-start w-full">
                    <div className="flex flex-col gap-3 md:gap-4 min-h-0">
                        {left.map((id) => (
                            <React.Fragment key={id}>{renderMainGridWidget(id)}</React.Fragment>
                        ))}
                        {recentlyWatched}
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-3 md:gap-4 min-h-0">
                        {right.map((id) => (
                            <React.Fragment key={id}>{renderMainGridWidget(id)}</React.Fragment>
                        ))}
                        {mostWatched}
                    </div>
                </div>
                <div className="lg:hidden flex flex-col gap-3 md:gap-4 w-full">
                    {renderMainGridColumns()}
                    {renderWatchRowColumns()}
                </div>
            </>
        );
    };

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
                const nextSection = sections[index + 1];
                const canMergeWatchRow = nextSection === 'watchRow' && (renderWatchRowLeft || renderWatchRowRight);
                if (canMergeWatchRow) {
                    sectionNodes.push(
                        <div key="mainGrid-watchRow" className="relative w-full min-w-0">
                            {renderMergedMainAndWatchGrid()}
                        </div>
                    );
                    index += 1;
                    break;
                }
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
                    <div key="recentlyAdded" className="relative w-full min-w-0 flex flex-col gap-3 md:gap-4">
                        {recentlyAdded.map((id) => (
                            <React.Fragment key={id}>{renderRecentlyAddedWidget(id)}</React.Fragment>
                        ))}
                    </div>
                );
                break;
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
