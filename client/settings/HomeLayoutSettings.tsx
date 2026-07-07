import React, { useCallback, useState } from 'react';
import { Eye, EyeOff, GripVertical, RotateCcw } from 'lucide-react';
import {
    DEFAULT_DASHBOARD_LAYOUT,
    DASHBOARD_SECTION_LABELS,
    SECTION_PREVIEW_META,
    lockWidgetLayout,
    type DashboardLayoutConfig,
    type DashboardSectionId,
} from '../shared/dashboardLayout';

type Props = {
    layout: DashboardLayoutConfig;
    onChange: (layout: DashboardLayoutConfig) => void;
};

const reorderSections = (sections: DashboardSectionId[], from: number, to: number): DashboardSectionId[] => {
    if (from === to || from < 0 || to < 0 || from >= sections.length || to >= sections.length) return sections;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
};

const SectionVisibilityToggle: React.FC<{ visible: boolean; onToggle: () => void }> = ({ visible, onToggle }) => (
    <button
        type="button"
        onClick={(e) => {
            e.stopPropagation();
            onToggle();
        }}
        aria-pressed={visible}
        aria-label={visible ? 'Section shown on home page' : 'Section hidden on home page'}
        className={`inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
            ${visible
                ? 'bg-plex/15 border-plex/40 text-plex hover:bg-plex/25 shadow-[0_0_12px_rgba(229,160,13,0.12)]'
                : 'bg-white/5 border-border/50 text-muted hover:border-white/20 hover:text-text'
            }`}
    >
        {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {visible ? 'Shown' : 'Hidden'}
    </button>
);

const SectionPreview: React.FC<{ layout: DashboardLayoutConfig }> = ({ layout }) => (
    <div className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Live preview</p>
        <div className="flex flex-col gap-2">
            {layout.sections.map((id) => {
                const meta = SECTION_PREVIEW_META[id];
                const hidden = layout.hiddenSections.includes(id);
                return (
                    <div
                        key={id}
                        className={`rounded-lg border transition-all ${hidden ? 'opacity-35 border-border/30 bg-white/[0.02]' : 'border-plex/40 bg-plex/[0.08] shadow-[0_0_16px_rgba(229,160,13,0.08)]'}`}
                    >
                        {id === 'mainGrid' && !hidden ? (
                            <div className={`${meta.previewClass} p-2 flex gap-2`}>
                                <div className="w-1/3 flex flex-col gap-1">
                                    <div className="flex-1 rounded bg-plex/20 border border-plex/30" title="Left column" />
                                    <div className="h-4 rounded bg-plex/15 border border-plex/25" />
                                </div>
                                <div className="w-2/3 flex flex-col gap-1">
                                    <div className="h-8 rounded bg-plex/20 border border-plex/30" />
                                    <div className="flex-1 rounded bg-plex/15 border border-plex/25" />
                                </div>
                            </div>
                        ) : id === 'watchRow' && !hidden ? (
                            <div className={`${meta.previewClass} p-2 flex gap-2`}>
                                <div className="w-1/3 rounded bg-plex/20 border border-plex/30" />
                                <div className="w-2/3 rounded bg-plex/15 border border-plex/25" />
                            </div>
                        ) : (
                            <div className={`${meta.previewClass} rounded bg-plex/15 border border-plex/25 mx-2 my-2`} />
                        )}
                        <div className="px-3 pb-2 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className={`text-sm font-semibold truncate ${hidden ? 'text-muted line-through' : 'text-text'}`}>
                                    {meta.shortLabel}
                                </p>
                                <p className="text-[10px] text-muted truncate">{meta.description}</p>
                            </div>
                            {hidden && <span className="text-[10px] font-bold uppercase tracking-wider text-muted shrink-0">Hidden</span>}
                        </div>
                    </div>
                );
            })}
        </div>
        <p className="text-[10px] text-muted/80 pt-1">Hero banner stays at the top and is not configurable.</p>
    </div>
);

export const HomeLayoutSettings: React.FC<Props> = ({ layout, onChange }) => {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);

    const applyChange = useCallback(
        (next: DashboardLayoutConfig) => onChange(lockWidgetLayout(next)),
        [onChange]
    );

    const toggleSectionHidden = (sectionId: DashboardSectionId) => {
        const hidden = layout.hiddenSections.includes(sectionId)
            ? layout.hiddenSections.filter((s) => s !== sectionId)
            : [...layout.hiddenSections, sectionId];
        applyChange({ ...layout, hiddenSections: hidden });
    };

    const handleDrop = (targetIndex: number) => {
        if (dragIndex === null) return;
        applyChange({ ...layout, sections: reorderSections(layout.sections, dragIndex, targetIndex) });
        setDragIndex(null);
        setDropIndex(null);
    };

    return (
        <div className="mb-8 animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-plex mb-2 border-b border-border pb-2">Home Page Layout</h3>
                    <p className="text-muted text-sm max-w-2xl">
                        Drag sections to reorder the home page for everyone. Show or hide whole sections.
                        The main dashboard grid keeps its fixed left/right layout so card heights stay balanced.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => applyChange({ ...DEFAULT_DASHBOARD_LAYOUT })}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-semibold text-muted hover:text-text hover:border-plex/40 transition-colors shrink-0"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset to default
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-5xl">
                <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Page sections</h4>
                    <p className="text-xs text-muted mb-3">Drag the handle to reorder. Use Shown/Hidden to toggle each section — all are visible by default.</p>
                    <div className="flex flex-col gap-2">
                        {layout.sections.map((id, index) => {
                            const hidden = layout.hiddenSections.includes(id);
                            const isDragging = dragIndex === index;
                            const isDropTarget = dropIndex === index && dragIndex !== null && dragIndex !== index;
                            return (
                                <div
                                    key={id}
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
                                    className={`flex items-center gap-2 py-3 px-3 rounded-xl border bg-background/30 transition-all cursor-grab active:cursor-grabbing
                                        ${isDragging ? 'opacity-50 border-plex/40 scale-[0.98]' : 'border-border/40'}
                                        ${isDropTarget ? 'border-plex ring-1 ring-plex/30' : ''}`}
                                >
                                    <GripVertical className="w-5 h-5 text-muted shrink-0" aria-hidden />
                                    <div className="min-w-0 flex-1">
                                        <div className={`text-text font-medium ${hidden ? 'opacity-50 line-through' : ''}`}>
                                            {DASHBOARD_SECTION_LABELS[id]}
                                        </div>
                                        <div className="text-xs text-muted mt-0.5">{SECTION_PREVIEW_META[id].description}</div>
                                    </div>
                                    <SectionVisibilityToggle visible={!hidden} onToggle={() => toggleSectionHidden(id)} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <SectionPreview layout={layout} />
            </div>

            <div className="max-w-5xl rounded-xl border border-plex/30 bg-plex/5 px-4 py-3">
                <p className="text-xs text-plex font-semibold">
                    Click <span className="text-text">Save Settings</span> at the bottom of this page to apply layout changes for everyone.
                </p>
            </div>

            <div className="max-w-5xl rounded-xl border border-border/30 bg-background/20 px-4 py-3">
                <p className="text-xs text-muted">
                    <span className="font-semibold text-text">Locked:</span> Individual widgets inside the main grid (Quick Actions, Library Size, etc.)
                    cannot be reordered or hidden — that prevents uneven columns and wasted space on desktop.
                </p>
            </div>

            <div className="max-w-5xl">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Watch History Configuration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-background/30 p-4 rounded-xl border border-border/40">
                        <label className="block text-text font-semibold mb-1">Recently Watched Rows</label>
                        <p className="text-xs text-muted mb-3">Number of rows to display per page.</p>
                        <select
                            className="w-full bg-black/20 border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-plex/50"
                            value={layout.recentHistoryRows ?? 7}
                            onChange={(e) => applyChange({ ...layout, recentHistoryRows: parseInt(e.target.value, 10) })}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Row' : 'Rows'}</option>)}
                        </select>
                    </div>
                    <div className="bg-background/30 p-4 rounded-xl border border-border/40">
                        <label className="block text-text font-semibold mb-1">Most Watched Rows</label>
                        <p className="text-xs text-muted mb-3">Number of rows to display per page.</p>
                        <select
                            className="w-full bg-black/20 border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-plex/50"
                            value={layout.topWatchedRows ?? 2}
                            onChange={(e) => applyChange({ ...layout, topWatchedRows: parseInt(e.target.value, 10) })}
                        >
                            {[1, 2, 3, 4, 5, 6, 8, 10].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Row' : 'Rows'}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
