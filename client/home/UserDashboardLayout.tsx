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
    if (resolved === 'compact') return 'lg:col-span-1';
    if (resolved === 'wide') return 'lg:col-span-2';
    if (resolved === 'full') return 'lg:col-span-3';
    return 'lg:col-span-1';
};

type Props = {
    layoutConfig: unknown;
    layoutCtx: DashboardLayoutContext;
    editing?: boolean;
    onMoveSection?: (id: string, direction: -1 | 1) => void;
    onReorderSection?: (sourceId: string, targetId: string) => void;
    onToggleSection?: (id: string) => void;
    onMoveMainWidget?: (id: MainGridWidgetId, direction: -1 | 1) => void;
    onReorderMainWidget?: (sourceId: MainGridWidgetId, targetId: MainGridWidgetId) => void;
    onMoveRecentlyAddedWidget?: (id: RecentlyAddedWidgetId, direction: -1 | 1) => void;
    onReorderRecentlyAddedWidget?: (sourceId: RecentlyAddedWidgetId, targetId: RecentlyAddedWidgetId) => void;
    onToggleWidget?: (id: DashboardWidgetId) => void;
    onWidgetSizeChange?: (id: DashboardWidgetId, size: DashboardWidgetSize) => void;
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

const editButtonClass = 'inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-white/15 bg-black/60 px-1.5 text-[9px] font-black text-white backdrop-blur hover:border-plex/60 hover:text-plex disabled:opacity-35 disabled:cursor-not-allowed';

const InlineEditFrame: React.FC<{
    editing?: boolean;
    dragId?: string;
    label: string;
    first?: boolean;
    last?: boolean;
    dragging?: boolean;
    dropTarget?: boolean;
    onDragStart?: () => void;
    onDragEnter?: () => void;
    onDrop?: () => void;
    onDragEnd?: () => void;
    size?: DashboardWidgetSize;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onHide?: () => void;
    onSizeChange?: (size: DashboardWidgetSize) => void;
    children: React.ReactNode;
}> = ({ editing, dragId, label, first, last, dragging, dropTarget, onDragStart, onDragEnter, onDrop, onDragEnd, size, onMoveUp, onMoveDown, onHide, onSizeChange, children }) => {
    if (!editing) return <>{children}</>;
    return (
        <div
            draggable
            data-dashboard-drag-id={dragId}
            onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                if (dragId) event.dataTransfer.setData('text/plain', dragId);
                onDragStart?.();
            }}
            onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                onDragEnter?.();
            }}
            onDragEnter={(event) => {
                event.preventDefault();
                onDragEnter?.();
            }}
            onDrop={(event) => {
                event.preventDefault();
                onDrop?.();
            }}
            onDragEnd={onDragEnd}
            className={`relative rounded-xl transition-[opacity,transform,box-shadow] duration-150 cursor-grab active:cursor-grabbing ${dragging ? 'opacity-50 scale-[0.99]' : ''} ${dropTarget ? 'ring-2 ring-plex shadow-[0_0_0_4px_rgba(0,180,255,0.18)]' : 'ring-1 ring-plex/35'}`}
        >
            <div className="absolute right-1.5 top-1.5 z-30 flex flex-wrap items-center justify-end gap-1 rounded-lg border border-white/10 bg-background/85 p-1 shadow-xl backdrop-blur-md">
                <span className="hidden xl:inline px-2 text-[10px] font-black uppercase tracking-wider text-muted max-w-32 truncate">{label}</span>
                <span className="inline-flex h-6 items-center rounded-md border border-plex/35 bg-plex/10 px-2 text-[9px] font-black uppercase tracking-wider text-plex" title="Drag to snap into another slot">Drag</span>
                <button type="button" className={editButtonClass} onClick={(event) => { event.stopPropagation(); onMoveUp?.(); }} disabled={first} title="Move up">↑</button>
                <button type="button" className={editButtonClass} onClick={(event) => { event.stopPropagation(); onMoveDown?.(); }} disabled={last} title="Move down">↓</button>
                <button type="button" className={`${editButtonClass} hover:!border-red-400 hover:!text-red-300`} onClick={(event) => { event.stopPropagation(); onHide?.(); }} title="Hide">Hide</button>
            </div>
            {onSizeChange && (
                <div className="absolute bottom-1.5 left-1.5 z-30 flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-background/85 p-1 shadow-xl backdrop-blur-md">
                    <span className="hidden xl:inline px-1.5 text-[9px] font-black uppercase tracking-wider text-muted">Scale</span>
                    {(['compact', 'normal', 'wide', 'full'] as DashboardWidgetSize[]).map((option) => (
                    <button
                        key={option}
                        type="button"
                        className={`${editButtonClass} ${(size || 'normal') === option ? '!border-plex !bg-plex !text-black' : ''}`}
                        onClick={(event) => { event.stopPropagation(); onSizeChange(option); }}
                        title={`Resize ${label}`}
                    >
                        {option === 'compact' ? 'S' : option === 'normal' ? 'M' : option === 'wide' ? 'L' : 'XL'}
                    </button>
                    ))}
                </div>
            )}
            <div className={`pointer-events-none absolute inset-0 z-20 rounded-xl border ${dropTarget ? 'border-plex bg-plex/10' : 'border-plex/25 bg-plex/[0.025]'}`} />
            {children}
        </div>
    );
};

export const UserDashboardLayout: React.FC<Props> = ({
    layoutConfig,
    layoutCtx,
    editing = false,
    onMoveSection,
    onReorderSection,
    onToggleSection,
    onMoveMainWidget,
    onReorderMainWidget,
    onMoveRecentlyAddedWidget,
    onReorderRecentlyAddedWidget,
    onToggleWidget,
    onWidgetSizeChange,
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
    const sectionIndex = (id: string) => layout.sections.indexOf(id as any);
    const [dragging, setDragging] = React.useState<{ group: 'section' | 'main' | 'recent'; id: string } | null>(null);
    const [dropTarget, setDropTarget] = React.useState<{ group: 'section' | 'main' | 'recent'; id: string } | null>(null);
    const isDragging = (group: 'section' | 'main' | 'recent', id: string) => dragging?.group === group && dragging.id === id;
    const isDropTarget = (group: 'section' | 'main' | 'recent', id: string) => dropTarget?.group === group && dropTarget.id === id && !isDragging(group, id);
    const startDrag = (group: 'section' | 'main' | 'recent', id: string) => {
        setDragging({ group, id });
        setDropTarget(null);
    };
    const endDrag = () => {
        setDragging(null);
        setDropTarget(null);
    };
    const enterDrop = (group: 'section' | 'main' | 'recent', id: string) => {
        if (!dragging || dragging.group !== group || dragging.id === id) return;
        setDropTarget({ group, id });
    };
    const dropOn = (group: 'section' | 'main' | 'recent', id: string) => {
        if (!dragging || dragging.group !== group || dragging.id === id) {
            endDrag();
            return;
        }
        if (group === 'section') onReorderSection?.(dragging.id, id);
        if (group === 'main') onReorderMainWidget?.(dragging.id as MainGridWidgetId, id as MainGridWidgetId);
        if (group === 'recent') onReorderRecentlyAddedWidget?.(dragging.id as RecentlyAddedWidgetId, id as RecentlyAddedWidgetId);
        endDrag();
    };

    const renderMainGridColumns = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 grid-flow-row-dense gap-1.5 md:gap-2 items-start">
            {mainGridWidgets.map((id, index) => (
                <div key={id} className={`min-w-0 ${getWidgetClass(id)}`}>
                    <InlineEditFrame
                        editing={editing}
                        dragId={`main:${id}`}
                        label={id}
                        first={index === 0}
                        last={index === mainGridWidgets.length - 1}
                        dragging={isDragging('main', id)}
                        dropTarget={isDropTarget('main', id)}
                        onDragStart={() => startDrag('main', id)}
                        onDragEnter={() => enterDrop('main', id)}
                        onDrop={() => dropOn('main', id)}
                        onDragEnd={endDrag}
                        size={layout.widgetSizes?.[id] || 'normal'}
                        onMoveUp={() => onMoveMainWidget?.(id, -1)}
                        onMoveDown={() => onMoveMainWidget?.(id, 1)}
                        onHide={() => onToggleWidget?.(id)}
                        onSizeChange={(size) => onWidgetSizeChange?.(id, size)}
                    >
                        {renderMainGridWidget(id)}
                    </InlineEditFrame>
                </div>
            ))}
        </div>
    );

    const renderWatchRowColumns = () => {
        const recentlyWatched = renderWatchRowLeft?.();
        const mostWatched = renderWatchRowRight?.();
        if (!recentlyWatched && !mostWatched) return null;
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 grid-flow-row-dense gap-1.5 md:gap-2 items-start">
                {recentlyWatched ? (
                    <div className="lg:col-span-1 flex flex-col gap-1.5 md:gap-2 min-h-0">
                        {recentlyWatched}
                    </div>
                ) : null}
                {mostWatched ? (
                    <div className={`flex flex-col gap-1.5 md:gap-2 min-h-0 ${recentlyWatched ? 'lg:col-span-2' : 'lg:col-span-2'}`}>
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
                    <div key="wrapUp" className="relative w-full min-w-0 lg:col-span-3">
                        <InlineEditFrame
                            editing={editing}
                            dragId="section:wrapUp"
                            label="Wrap-Up"
                            first={sectionIndex('wrapUp') === 0}
                            last={sectionIndex('wrapUp') === layout.sections.length - 1}
                            dragging={isDragging('section', 'wrapUp')}
                            dropTarget={isDropTarget('section', 'wrapUp')}
                            onDragStart={() => startDrag('section', 'wrapUp')}
                            onDragEnter={() => enterDrop('section', 'wrapUp')}
                            onDrop={() => dropOn('section', 'wrapUp')}
                            onDragEnd={endDrag}
                            onMoveUp={() => onMoveSection?.('wrapUp', -1)}
                            onMoveDown={() => onMoveSection?.('wrapUp', 1)}
                            onHide={() => onToggleSection?.('wrapUp')}
                        >
                            {content}
                        </InlineEditFrame>
                    </div>
                );
                break;
            }
            case 'mainGrid': {
                if (mainGridWidgets.length === 0) break;
                mainGridWidgets.forEach((id, widgetIndex) => {
                    sectionNodes.push(
                    <div key={`main-${id}`} className={`relative w-full min-w-0 ${getWidgetClass(id)}`}>
                        <InlineEditFrame
                            editing={editing}
                            dragId={`main:${id}`}
                            label={id}
                            first={widgetIndex === 0}
                            last={widgetIndex === mainGridWidgets.length - 1}
                            dragging={isDragging('main', id)}
                            dropTarget={isDropTarget('main', id)}
                            onDragStart={() => startDrag('main', id)}
                            onDragEnter={() => enterDrop('main', id)}
                            onDrop={() => dropOn('main', id)}
                            onDragEnd={endDrag}
                            size={layout.widgetSizes?.[id] || 'normal'}
                            onMoveUp={() => onMoveMainWidget?.(id, -1)}
                            onMoveDown={() => onMoveMainWidget?.(id, 1)}
                            onHide={() => onToggleWidget?.(id)}
                            onSizeChange={(size) => onWidgetSizeChange?.(id, size)}
                        >
                            {renderMainGridWidget(id)}
                        </InlineEditFrame>
                    </div>
                    );
                });
                break;
            }
            case 'pendingRequests': {
                const content = renderPendingRequests();
                if (!content) break;
                sectionNodes.push(
                    <div key="pendingRequests" className="relative z-[2] w-full min-w-0 isolate lg:col-span-3">
                        <InlineEditFrame
                            editing={editing}
                            dragId="section:pendingRequests"
                            label="Pending requests"
                            first={sectionIndex('pendingRequests') === 0}
                            last={sectionIndex('pendingRequests') === layout.sections.length - 1}
                            dragging={isDragging('section', 'pendingRequests')}
                            dropTarget={isDropTarget('section', 'pendingRequests')}
                            onDragStart={() => startDrag('section', 'pendingRequests')}
                            onDragEnter={() => enterDrop('section', 'pendingRequests')}
                            onDrop={() => dropOn('section', 'pendingRequests')}
                            onDragEnd={endDrag}
                            onMoveUp={() => onMoveSection?.('pendingRequests', -1)}
                            onMoveDown={() => onMoveSection?.('pendingRequests', 1)}
                            onHide={() => onToggleSection?.('pendingRequests')}
                        >
                            {content}
                        </InlineEditFrame>
                    </div>
                );
                break;
            }
            case 'watchRow': {
                const recentlyWatched = renderWatchRowLeft?.();
                const mostWatched = renderWatchRowRight?.();
                if (!recentlyWatched && !mostWatched) break;
                if (recentlyWatched) {
                    sectionNodes.push(
                    <div key="watchRow-recent" className="relative z-[1] w-full min-w-0 lg:col-span-1">
                        <InlineEditFrame
                            editing={editing}
                            dragId="section:watchRow"
                            label="Recently watched"
                            first={sectionIndex('watchRow') === 0}
                            last={sectionIndex('watchRow') === layout.sections.length - 1}
                            dragging={isDragging('section', 'watchRow')}
                            dropTarget={isDropTarget('section', 'watchRow')}
                            onDragStart={() => startDrag('section', 'watchRow')}
                            onDragEnter={() => enterDrop('section', 'watchRow')}
                            onDrop={() => dropOn('section', 'watchRow')}
                            onDragEnd={endDrag}
                            onMoveUp={() => onMoveSection?.('watchRow', -1)}
                            onMoveDown={() => onMoveSection?.('watchRow', 1)}
                            onHide={() => onToggleSection?.('watchRow')}
                        >
                            {recentlyWatched}
                        </InlineEditFrame>
                    </div>
                    );
                }
                if (mostWatched) {
                    sectionNodes.push(
                    <div key="watchRow-most" className="relative z-[1] w-full min-w-0 lg:col-span-2">
                        {mostWatched}
                    </div>
                    );
                }
                break;
            }
            case 'recentlyAdded':
                if (recentlyAddedLoading && !hasDashboardData) {
                    sectionNodes.push(
                        <div key="recentlyAdded" className="relative w-full min-w-0 lg:col-span-3">
                            {renderRecentlyAddedSkeleton()}
                        </div>
                    );
                    break;
                }
                if (!hasDashboardData) break;
                sectionNodes.push(
                    <React.Fragment key="recentlyAdded">
                        {recentlyAdded.map((id, index) => (
                            <div key={id} className={`relative w-full min-w-0 ${getWidgetClass(id, 'full')}`}>
                                <InlineEditFrame
                                    editing={editing}
                                    dragId={`recent:${id}`}
                                    label={id}
                                    first={index === 0}
                                    last={index === recentlyAdded.length - 1}
                                    dragging={isDragging('recent', id)}
                                    dropTarget={isDropTarget('recent', id)}
                                    onDragStart={() => startDrag('recent', id)}
                                    onDragEnter={() => enterDrop('recent', id)}
                                    onDrop={() => dropOn('recent', id)}
                                    onDragEnd={endDrag}
                                    size={layout.widgetSizes?.[id] || 'full'}
                                    onMoveUp={() => onMoveRecentlyAddedWidget?.(id, -1)}
                                    onMoveDown={() => onMoveRecentlyAddedWidget?.(id, 1)}
                                    onHide={() => onToggleWidget?.(id)}
                                    onSizeChange={(size) => onWidgetSizeChange?.(id, size)}
                                >
                                    {renderRecentlyAddedWidget(id)}
                                </InlineEditFrame>
                            </div>
                        ))}
                    </React.Fragment>
                );
                break;
            case 'bazarrTools': {
                const content = renderBazarrTools?.();
                if (!content) break;
                sectionNodes.push(
                    <div key="bazarrTools" className="relative w-full min-w-0 lg:col-span-3">
                        <InlineEditFrame
                            editing={editing}
                            dragId="section:bazarrTools"
                            label="Bazarr tools"
                            first={sectionIndex('bazarrTools') === 0}
                            last={sectionIndex('bazarrTools') === layout.sections.length - 1}
                            dragging={isDragging('section', 'bazarrTools')}
                            dropTarget={isDropTarget('section', 'bazarrTools')}
                            onDragStart={() => startDrag('section', 'bazarrTools')}
                            onDragEnter={() => enterDrop('section', 'bazarrTools')}
                            onDrop={() => dropOn('section', 'bazarrTools')}
                            onDragEnd={endDrag}
                            onMoveUp={() => onMoveSection?.('bazarrTools', -1)}
                            onMoveDown={() => onMoveSection?.('bazarrTools', 1)}
                            onHide={() => onToggleSection?.('bazarrTools')}
                        >
                            {content}
                        </InlineEditFrame>
                    </div>
                );
                break;
            }
            default:
                break;
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 grid-flow-row-dense gap-1.5 md:gap-2 w-full items-start">
            {sectionNodes}
        </div>
    );
};
