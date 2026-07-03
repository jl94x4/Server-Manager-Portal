import React, { useCallback, useState } from 'react';
import { GripVertical, RotateCcw } from 'lucide-react';
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
                        className={`rounded-lg border transition-opacity ${hidden ? 'opacity-35 border-border/30 bg-white/[0.02]' : 'border-plex/25 bg-plex/5'}`}
                    >
                        {id === 'mainGrid' && !hidden ? (
                            <div className={`${meta.previewClass} p-2 flex gap-2`}>
                                <div className="w-1/3 flex flex-col gap-1">
                                    <div className="flex-1 rounded bg-white/10 border border-white/10" title="Left column" />
                                    <div className="h-4 rounded bg-white/10 border border-white/10" />
                                </div>
                                <div className="w-2/3 flex flex-col gap-1">
                                    <div className="h-8 rounded bg-white/10 border border-white/10" />
                                    <div className="flex-1 rounded bg-white/10 border border-white/10" />
                                </div>
                            </div>
                        ) : id === 'watchRow' && !hidden ? (
                            <div className={`${meta.previewClass} p-2 flex gap-2`}>
                                <div className="w-1/3 rounded bg-white/10 border border-white/10" />
                                <div className="w-2/3 rounded bg-white/10 border border-white/10" />
                            </div>
                        ) : (
                            <div className={`${meta.previewClass} rounded bg-white/10 border border-white/10 mx-2 my-2`} />
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
                    <p className="text-xs text-muted mb-3">Drag the handle to reorder. Uncheck Show to hide a section.</p>
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
                                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={!hidden}
                                            onChange={() => toggleSectionHidden(id)}
                                            className="accent-plex"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        Show
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <SectionPreview layout={layout} />
            </div>

            <div className="max-w-5xl rounded-xl border border-border/30 bg-background/20 px-4 py-3">
                <p className="text-xs text-muted">
                    <span className="font-semibold text-text">Locked:</span> Individual widgets inside the main grid (Quick Actions, Library Size, etc.)
                    cannot be reordered or hidden — that prevents uneven columns and wasted space on desktop.
                </p>
            </div>
        </div>
    );
};
