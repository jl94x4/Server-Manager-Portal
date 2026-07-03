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
    renderWatchRow,
    renderRecentlyAddedWidget,
    renderRecentlyAddedSkeleton,
    recentlyAddedLoading,
    hasDashboardData,
}) => {
    const layout = normalizeSectionLayout(layoutConfig);
    const sections = resolveDashboardSections(layout);
    const mainGridWidgets = resolveMainGridWidgets(layout, layoutCtx);
    const { left, right } = splitMainGridForDesktop(mainGridWidgets);
    const recentlyAdded = resolveRecentlyAddedWidgets(layout);

    return (
        <>
            {sections.map((sectionId) => {
                switch (sectionId) {
                    case 'wrapUp':
                        return <React.Fragment key="wrapUp">{renderWrapUp()}</React.Fragment>;
                    case 'mainGrid':
                        if (mainGridWidgets.length === 0) return null;
                        return (
                            <React.Fragment key="mainGrid">
                                <div className="flex flex-col gap-3 md:gap-4 lg:hidden">
                                    {mainGridWidgets.map((id) => (
                                        <React.Fragment key={id}>{renderMainGridWidget(id)}</React.Fragment>
                                    ))}
                                </div>
                                <div className="hidden lg:grid lg:grid-cols-3 gap-3 md:gap-4 items-stretch">
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
                            </React.Fragment>
                        );
                    case 'watchRow':
                        return <React.Fragment key="watchRow">{renderWatchRow()}</React.Fragment>;
                    case 'recentlyAdded':
                        if (recentlyAddedLoading && !hasDashboardData) {
                            return <React.Fragment key="recentlyAdded">{renderRecentlyAddedSkeleton()}</React.Fragment>;
                        }
                        if (!hasDashboardData) return null;
                        return (
                            <div key="recentlyAdded" className="flex flex-col gap-3 md:gap-4 w-full">
                                {recentlyAdded.map((id) => (
                                    <React.Fragment key={id}>{renderRecentlyAddedWidget(id)}</React.Fragment>
                                ))}
                            </div>
                        );
                    default:
                        return null;
                }
            })}
        </>
    );
};
