import React, { useMemo, useState } from 'react';
import { GripVertical, MoreHorizontal } from 'lucide-react';
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

export const NavigationOrderSettings: React.FC<Props> = ({
    navOrder,
    onChange,
    downloadsVisibleToMembers,
    onDownloadsVisibleToMembersChange,
}) => {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);

    const mobileKeys = useMemo(() => navOrder.filter(isMobileNavKey), [navOrder]);
    const moreStartsAtMobileIndex = mobileKeys.length > MOBILE_NAV_PRIMARY_SLOTS
        ? MOBILE_NAV_PRIMARY_SLOTS
        : null;

    const mobileIndexByKey = useMemo(() => {
        const map = new Map<string, number>();
        mobileKeys.forEach((key, index) => map.set(key, index));
        return map;
    }, [mobileKeys]);

    const handleDrop = (targetIndex: number) => {
        if (dragIndex === null) return;
        onChange(reorder(navOrder, dragIndex, targetIndex));
        setDragIndex(null);
        setDropIndex(null);
    };

    return (
        <div className="mb-8 animate-fade-in">
            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Navigation Order</h3>
            <p className="text-muted text-sm mb-2 max-w-2xl">
                Drag items to reorder the desktop sidebar. On mobile, the first {MOBILE_NAV_PRIMARY_SLOTS} items stay in the bottom bar; the rest move into More.
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

            <div className="flex flex-col gap-2 max-w-xl">
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
                                draggable
                                onDragStart={() => setDragIndex(index)}
                                onDragEnd={() => {
                                    setDragIndex(null);
                                    setDropIndex(null);
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDropIndex(index);
                                }}
                                onDragLeave={() => {
                                    if (dropIndex === index) setDropIndex(null);
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    handleDrop(index);
                                }}
                                className={`flex items-center gap-3 py-3 px-3 rounded-xl border bg-background/30 transition-all cursor-grab active:cursor-grabbing
                                    ${isDragging ? 'opacity-50 border-plex/40 scale-[0.98]' : 'border-border/40'}
                                    ${isDropTarget ? 'border-plex ring-1 ring-plex/30' : ''}
                                    ${inMoreMenu ? 'border-dashed border-border/50 bg-white/[0.02]' : ''}
                                    ${!isMobileNavKey(key) ? 'opacity-70' : ''}`}
                            >
                                <GripVertical className="w-5 h-5 text-muted shrink-0" aria-hidden />
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
                                {inMobileBar && moreStartsAtMobileIndex !== null && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-plex/90 bg-plex/10 border border-plex/25 rounded-md px-2 py-1 shrink-0">
                                        Mobile bar
                                    </span>
                                )}
                                {inMoreMenu && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-white/5 border border-border/60 rounded-md px-2 py-1 shrink-0">
                                        More
                                    </span>
                                )}
                            </div>
                        </React.Fragment>
                    );
                })}
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
