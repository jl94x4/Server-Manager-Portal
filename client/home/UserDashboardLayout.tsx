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
    renderWatchRow: () => React.ReactNode;
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
    renderWatchRow,
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

    return (
        <div className="grid grid-cols-1 gap-3 md:gap-4 w-full">
            {sections.map((sectionId) => {
                switch (sectionId) {
                    case 'wrapUp': {
                        const content = renderWrapUp();
                        if (!content) return null;
                        return (
                            <div key="wrapUp" className="relative w-full min-w-0">
                                {content}
                            </div>
                        );
                    }
                    case 'mainGrid':
                        if (mainGridWidgets.length === 0) return null;
                        return (
                            <div key="mainGrid" className="relative w-full min-w-0 flex flex-col gap-3 md:gap-4">
                                {(left.length > 0 || right.length > 0) && (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 items-start">
                                        <div className="lg:col-span-1 flex flex-col gap-3 md:gap-4 min-h-0">
                                            {left.map((id) => (
                                                <React.Fragment key={id}>{renderMainGridWidget(id)}</React.Fragment>
                                            ))}
                                        </div>
                                        <div className="lg:col-span-2 flex flex-col items-start gap-3 md:gap-4 min-h-0">
                                            {right.map((id) => (
                                                <React.Fragment key={id}>{renderMainGridWidget(id)}</React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    case 'pendingRequests': {
                        const content = renderPendingRequests();
                        if (!content) return null;
                        return (
                            <div key="pendingRequests" className="relative z-[2] w-full min-w-0 isolate">
                                {content}
                            </div>
                        );
                    }
                    case 'watchRow': {
                        const content = renderWatchRow();
                        if (!content) return null;
                        return (
                            <div key="watchRow" className="relative z-[1] w-full min-w-0">
                                {content}
                            </div>
                        );
                    }
                    case 'recentlyAdded':
                        if (recentlyAddedLoading && !hasDashboardData) {
                            return (
                                <div key="recentlyAdded" className="relative w-full min-w-0">
                                    {renderRecentlyAddedSkeleton()}
                                </div>
                            );
                        }
                        if (!hasDashboardData) return null;
                        return (
                            <div key="recentlyAdded" className="relative w-full min-w-0 flex flex-col gap-3 md:gap-4">
                                {recentlyAdded.map((id) => (
                                    <React.Fragment key={id}>{renderRecentlyAddedWidget(id)}</React.Fragment>
                                ))}
                            </div>
                        );
                    default:
                        return null;
                }
            })}
        </div>
    );
};
