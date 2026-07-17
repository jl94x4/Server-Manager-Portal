import React, { useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical, MoreHorizontal } from 'lucide-react';
import { getNavItemLabel, MOBILE_NAV_PRIMARY_SLOTS } from '../shared/nav';
import { SettingsToggleRow } from '../shared/ui';
import { SettingHint } from './SettingHint';

type Props = {
    navOrder: string[];
    onChange: (next: string[]) => void;
    downloadsVisibleToMembers: boolean;
    onDownloadsVisibleToMembersChange: (next: boolean) => void;
};

const reorder = (items: string[], from: number, to: number): string[] => {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
};

/** Keys that never appear in the mobile bottom bar / More menu. */
const isMobileNavKey = (key: string) => key !== 'logout' && key !== 'logs';

const vibrate = (pattern: number | number[]) => {
    try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(pattern);
        }
    } catch {
        /* ignore unsupported / blocked vibration */
    }
};

export const NavigationOrderSettings: React.FC<Props> = ({
    navOrder,
    onChange,
    downloadsVisibleToMembers,
    onDownloadsVisibleToMembersChange,
}) => {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(null);
    const dragIndexRef = useRef<number | null>(null);
    const dropIndexRef = useRef<number | null>(null);
    const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

    const mobileKeys = useMemo(() => navOrder.filter(isMobileNavKey), [navOrder]);
    const moreStartsAtMobileIndex = mobileKeys.length > MOBILE_NAV_PRIMARY_SLOTS
        ? MOBILE_NAV_PRIMARY_SLOTS
        : null;

    const mobileIndexByKey = useMemo(() => {
        const map = new Map<string, number>();
        mobileKeys.forEach((key, index) => map.set(key, index));
        return map;
    }, [mobileKeys]);

    const commitReorder = (from: number, to: number, { haptic = false } = {}) => {
        if (from === to) return;
        onChange(reorder(navOrder, from, to));
        if (haptic) vibrate(18);
    };

    const indexFromClientY = (clientY: number) => {
        let nextIndex = navOrder.length - 1;
        for (let i = 0; i < itemRefs.current.length; i += 1) {
            const node = itemRefs.current[i];
            if (!node) continue;
            const rect = node.getBoundingClientRect();
            if (clientY < rect.top + rect.height / 2) {
                nextIndex = i;
                break;
            }
        }
        return Math.max(0, Math.min(navOrder.length - 1, nextIndex));
    };

    const clearDragState = () => {
        dragIndexRef.current = null;
        dropIndexRef.current = null;
        setDragIndex(null);
        setDropIndex(null);
        setDragPoint(null);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>, index: number) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragIndexRef.current = index;
        dropIndexRef.current = index;
        setDragIndex(index);
        setDropIndex(index);
        setDragPoint({ x: event.clientX, y: event.clientY });
        vibrate(12);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (dragIndexRef.current === null) return;
        setDragPoint({ x: event.clientX, y: event.clientY });
        const nextDrop = indexFromClientY(event.clientY);
        if (dropIndexRef.current !== nextDrop) {
            dropIndexRef.current = nextDrop;
            setDropIndex(nextDrop);
            vibrate(8);
        }
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (dragIndexRef.current === null) return;
        try {
            event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
            /* already released */
        }
        const from = dragIndexRef.current;
        const to = dropIndexRef.current ?? from;
        clearDragState();
        if (from !== to) {
            vibrate([10, 30, 16]);
            commitReorder(from, to);
        } else {
            vibrate(6);
        }
    };

    const handlePointerCancel = () => {
        clearDragState();
        vibrate(6);
    };

    const draggingKey = dragIndex != null ? navOrder[dragIndex] : null;

    return (
        <div className="mb-8 animate-fade-in">
            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Navigation Order</h3>
            <p className="text-muted text-sm mb-2 max-w-2xl">
                Drag the handle to reorder the desktop sidebar. On phones, press and drag the grip — or use the arrows. The first {MOBILE_NAV_PRIMARY_SLOTS} items stay in the bottom bar; the rest move into More.
            </p>
            <p className="text-xs text-muted mb-4 max-w-2xl">
                Labels match the live sidebar. Logout stays in this list for desktop config but is not shown in the mobile bar.
            </p>

            <div className="mb-6 max-w-xl rounded-xl border border-border/70 p-4 bg-background/30">
                <SettingsToggleRow
                    title="Show Downloads to members"
                    hint={(
                        <SettingHint>
                            When off, Downloads stays in the nav order for admins only. Members will not see the tab or the download status page.
                        </SettingHint>
                    )}
                    checked={downloadsVisibleToMembers}
                    onChange={onDownloadsVisibleToMembersChange}
                    border={false}
                />
                <p className={`text-xs mt-2 font-semibold ${downloadsVisibleToMembers ? 'text-green-300' : 'text-yellow-300'}`}>
                    Members: {downloadsVisibleToMembers ? 'can see Downloads' : 'Downloads hidden'}
                </p>
            </div>

            <div className={`relative flex flex-col gap-2 max-w-xl select-none ${dragIndex !== null ? 'cursor-grabbing' : ''}`}>
                {navOrder.map((key, index) => {
                    const mobileIndex = mobileIndexByKey.get(key);
                    const inMobileBar = mobileIndex !== undefined
                        && (moreStartsAtMobileIndex === null || mobileIndex < moreStartsAtMobileIndex);
                    const inMoreMenu = mobileIndex !== undefined
                        && moreStartsAtMobileIndex !== null
                        && mobileIndex >= moreStartsAtMobileIndex;
                    const showMoreDivider = moreStartsAtMobileIndex !== null
                        && mobileIndex === moreStartsAtMobileIndex;

                    const isDragging = dragIndex === index;
                    const isDropTarget = dropIndex === index && dragIndex !== null && dragIndex !== index;
                    const insertBefore = isDropTarget && dragIndex !== null && dropIndex < dragIndex;
                    const insertAfter = isDropTarget && dragIndex !== null && dropIndex > dragIndex;

                    return (
                        <React.Fragment key={key}>
                            {showMoreDivider && (
                                <div className="flex items-center gap-3 pt-3 pb-1">
                                    <div className="h-px flex-1 bg-border/70" />
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted shrink-0">
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                        Mobile More menu
                                    </span>
                                    <div className="h-px flex-1 bg-border/70" />
                                </div>
                            )}

                            <div
                                ref={(node) => { itemRefs.current[index] = node; }}
                                data-nav-order-index={index}
                                className={`relative flex items-center gap-2 sm:gap-3 py-3 px-3 rounded-xl border bg-background/30 transition-[transform,box-shadow,opacity,border-color,background-color] duration-150
                                    ${isDragging ? 'opacity-40 border-plex/50 bg-plex/5 scale-[0.985] shadow-inner' : 'border-border/40'}
                                    ${isDropTarget ? 'border-plex ring-2 ring-plex/35 bg-plex/10' : ''}
                                    ${inMoreMenu && !isDropTarget ? 'border-dashed border-border/50 bg-white/[0.02]' : ''}
                                    ${!isMobileNavKey(key) ? 'opacity-70' : ''}`}
                            >
                                {insertBefore && (
                                    <div className="pointer-events-none absolute -top-1.5 left-3 right-3 h-1 rounded-full bg-plex shadow-[0_0_12px_rgba(229,160,13,0.55)]" />
                                )}
                                {insertAfter && (
                                    <div className="pointer-events-none absolute -bottom-1.5 left-3 right-3 h-1 rounded-full bg-plex shadow-[0_0_12px_rgba(229,160,13,0.55)]" />
                                )}

                                <button
                                    type="button"
                                    aria-label={`Drag to reorder ${getNavItemLabel(key)}`}
                                    onPointerDown={(e) => handlePointerDown(e, index)}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerCancel={handlePointerCancel}
                                    className={`touch-none shrink-0 p-1.5 -ml-1 rounded-lg transition-colors cursor-grab active:cursor-grabbing
                                        ${isDragging ? 'text-plex bg-plex/15' : 'text-muted hover:text-text hover:bg-white/5 active:bg-white/10 active:scale-95'}`}
                                >
                                    <GripVertical className="w-5 h-5" aria-hidden />
                                </button>

                                <div className="min-w-0 flex-1">
                                    <div className="text-text font-medium">
                                        {getNavItemLabel(key, {
                                            adminSuffix: true,
                                            downloadsMembersVisible: downloadsVisibleToMembers,
                                        })}
                                    </div>
                                    {!isMobileNavKey(key) && (
                                        <p className="text-[11px] text-muted mt-0.5">Not shown in the mobile bottom bar</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    {inMobileBar && moreStartsAtMobileIndex !== null && (
                                        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-plex/90 bg-plex/10 border border-plex/25 rounded-md px-2 py-1">
                                            Mobile bar
                                        </span>
                                    )}
                                    {inMoreMenu && (
                                        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-muted bg-white/5 border border-border/60 rounded-md px-2 py-1">
                                            More
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        aria-label={`Move ${getNavItemLabel(key)} up`}
                                        disabled={index === 0}
                                        onClick={() => commitReorder(index, index - 1, { haptic: true })}
                                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border/60 bg-white/[0.03] text-muted hover:text-text hover:border-plex/40 active:scale-90 active:bg-plex/15 disabled:opacity-30 disabled:pointer-events-none transition-transform"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={`Move ${getNavItemLabel(key)} down`}
                                        disabled={index === navOrder.length - 1}
                                        onClick={() => commitReorder(index, index + 1, { haptic: true })}
                                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border/60 bg-white/[0.03] text-muted hover:text-text hover:border-plex/40 active:scale-90 active:bg-plex/15 disabled:opacity-30 disabled:pointer-events-none transition-transform"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}

                {draggingKey && dragPoint && (
                    <div
                        className="pointer-events-none fixed z-[80] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-plex/50 bg-card/95 px-3 py-3 shadow-2xl shadow-black/40 ring-1 ring-plex/30 backdrop-blur-md"
                        style={{ left: dragPoint.x, top: dragPoint.y }}
                        aria-hidden
                    >
                        <div className="flex items-center gap-3">
                            <GripVertical className="w-5 h-5 text-plex shrink-0" />
                            <p className="text-sm font-bold text-text truncate">
                                {getNavItemLabel(draggingKey, {
                                    adminSuffix: true,
                                    downloadsMembersVisible: downloadsVisibleToMembers,
                                })}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {moreStartsAtMobileIndex === null ? (
                <p className="text-xs text-muted mt-4 max-w-xl">
                    All mobile-visible items currently fit in the bottom bar — no More menu yet.
                </p>
            ) : (
                <p className="text-xs text-muted mt-4 max-w-xl">
                    Items below the divider open from the mobile More button. Reorder carefully if you want Status, Settings, or Discover higher in the bottom bar.
                </p>
            )}
        </div>
    );
};
