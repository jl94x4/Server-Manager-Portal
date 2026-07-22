import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    GripVertical,
    RefreshCw,
    Rows3,
    ChevronUp,
    ChevronDown,
    Info,
    Library,
    Check,
} from 'lucide-react';
import { api } from '../api';
import { CustomSelect } from '../components/ui/Inputs';

const HubToggle: React.FC<{
    label: string;
    shortLabel?: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (next: boolean) => void;
    /** Show label above the checkbox (mobile cards). Desktop table uses column headers instead. */
    showLabel?: boolean;
}> = ({ label, shortLabel, checked, disabled, onChange, showLabel = false }) => (
    <label className={`flex items-center justify-center cursor-pointer select-none min-w-0 ${showLabel ? 'flex-col gap-1.5' : ''}`}>
        {showLabel && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted text-center leading-tight">
                {shortLabel || label}
            </span>
        )}
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`h-5 w-5 shrink-0 rounded border flex items-center justify-center transition-colors disabled:opacity-50 ${
                checked
                    ? 'bg-plex border-plex text-background'
                    : 'bg-background border-border hover:border-plex/50'
            }`}
        >
            {checked ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : null}
        </button>
    </label>
);

type ManagedHub = {
    identifier: string;
    title: string;
    promoted_to_recommended: boolean;
    promoted_to_home: boolean;
    promoted_to_shared: boolean;
    deletable: boolean;
    is_collection: boolean;
};

type PlexLibraryInfo = { name: string; type: string };

const HubsPage: React.FC = () => {
    const [libraries, setLibraries] = useState<PlexLibraryInfo[]>([]);
    const [library, setLibrary] = useState('');
    const [hubs, setHubs] = useState<ManagedHub[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);

    const libraryOptions = useMemo(
        () => libraries
            .filter((l) => l.type === 'movie' || l.type === 'show')
            .map((l) => ({
                value: l.name,
                label: `${l.name} (${l.type === 'show' ? 'TV' : 'Movies'})`,
            })),
        [libraries],
    );

    const loadLibraries = useCallback(async () => {
        try {
            const [libs, cfg] = await Promise.all([
                api.getPlexLibraries().catch(() => []),
                api.getConfig().catch(() => null),
            ]);
            const all = (Array.isArray(libs) ? libs : [])
                .map((l: any) => ({ name: String(l.name || ''), type: String(l.type || '') }))
                .filter((l) => l.name && (l.type === 'movie' || l.type === 'show'));
            const managed = new Set((cfg?.library_names || []) as string[]);
            const ordered = managed.size
                ? [
                    ...all.filter((l) => managed.has(l.name)),
                    ...all.filter((l) => !managed.has(l.name)),
                ]
                : all;
            setLibraries(ordered);
            setLibrary((prev) => {
                if (prev && ordered.some((l) => l.name === prev)) return prev;
                const preferred = ordered.find((l) => managed.has(l.name)) || ordered[0];
                return preferred?.name || '';
            });
        } catch (e: any) {
            setError(e?.message || 'Failed to load libraries');
        }
    }, []);

    const loadHubs = useCallback(async (lib: string) => {
        if (!lib) {
            setHubs([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await api.getManagedHubs(lib);
            setHubs(Array.isArray(data.hubs) ? data.hubs : []);
        } catch (e: any) {
            setHubs([]);
            setError(e?.message || 'Failed to load hubs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadLibraries();
    }, [loadLibraries]);

    useEffect(() => {
        if (library) void loadHubs(library);
    }, [library, loadHubs]);

    const persistOrder = async (next: ManagedHub[], movedIdentifier: string, newIndex: number) => {
        const after = newIndex > 0 ? next[newIndex - 1].identifier : null;
        setBusyId(movedIdentifier);
        setError('');
        try {
            const res = await api.moveManagedHub(library, movedIdentifier, after);
            if (Array.isArray(res.hubs)) setHubs(res.hubs);
        } catch (e: any) {
            setError(e?.message || 'Reorder failed');
            await loadHubs(library);
        } finally {
            setBusyId(null);
        }
    };

    const moveToIndex = async (from: number, to: number) => {
        if (from === to || from < 0 || to < 0 || from >= hubs.length || to >= hubs.length) return;
        const next = [...hubs];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        setHubs(next);
        await persistOrder(next, item.identifier, to);
    };

    const handleDrop = async (targetIndex: number) => {
        if (dragIndex === null || dragIndex === targetIndex) {
            setDragIndex(null);
            setDropIndex(null);
            return;
        }
        const from = dragIndex;
        setDragIndex(null);
        setDropIndex(null);
        await moveToIndex(from, targetIndex);
    };

    const toggleVisibility = async (
        hub: ManagedHub,
        field: 'recommended' | 'home' | 'shared',
        value: boolean,
    ) => {
        const keyMap = {
            recommended: 'promoted_to_recommended',
            home: 'promoted_to_home',
            shared: 'promoted_to_shared',
        } as const;
        const prev = hub[keyMap[field]];
        setHubs((list) =>
            list.map((h) => (h.identifier === hub.identifier ? { ...h, [keyMap[field]]: value } : h)),
        );
        setBusyId(hub.identifier);
        setError('');
        try {
            const res = await api.updateHubVisibility(library, hub.identifier, { [field]: value });
            if (res.hub) {
                setHubs((list) =>
                    list.map((h) => (h.identifier === hub.identifier ? { ...h, ...res.hub } : h)),
                );
            }
        } catch (e: any) {
            setHubs((list) =>
                list.map((h) => (h.identifier === hub.identifier ? { ...h, [keyMap[field]]: prev } : h)),
            );
            setError(e?.message || 'Visibility update failed');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-text tracking-tight flex items-center gap-2">
                        <Rows3 className="w-7 h-7 text-plex shrink-0" />
                        Manage Hubs
                    </h2>
                    <p className="text-sm text-muted mt-1">
                        Reorder library rows and toggle visibility — same controls as Plex Settings → Libraries.
                    </p>
                </div>
                <div className="flex items-end gap-2 sm:gap-3">
                    <CustomSelect
                        label="Library"
                        className="flex-1 min-w-0"
                        value={library}
                        options={libraryOptions}
                        onChange={setLibrary}
                        placeholder="Select a library..."
                    />
                    <button
                        type="button"
                        onClick={() => void loadHubs(library)}
                        disabled={loading || !library}
                        className="h-[42px] w-[42px] shrink-0 inline-flex items-center justify-center rounded-lg bg-card border border-border text-muted hover:text-text transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
                    {error}
                </div>
            )}

            {!library ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted border-2 border-dashed border-border rounded-3xl px-4 text-center">
                    <Library className="w-12 h-12 mb-2 opacity-20" />
                    <p>Select a Movies or TV library to manage hubs.</p>
                </div>
            ) : loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted gap-3">
                    <div className="w-8 h-8 border-2 border-border border-t-plex rounded-full animate-spin" />
                    <p className="text-sm">Loading hubs from Plex…</p>
                </div>
            ) : hubs.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted border-2 border-dashed border-border rounded-3xl px-4 text-center">
                    <Rows3 className="w-12 h-12 mb-2 opacity-20" />
                    <p>No managed hubs found for this library.</p>
                </div>
            ) : (
                <div className="bg-card/40 border border-border rounded-2xl overflow-hidden">
                    {/* Desktop column headers */}
                    <div className="hidden md:grid grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_4.5rem] gap-2 px-4 py-3 border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted">
                        <span>Hub</span>
                        <span className="text-center">Library Rec.</span>
                        <span className="text-center">Home</span>
                        <span className="text-center">Friends</span>
                    </div>
                    <div className="divide-y divide-border/60">
                        {hubs.map((hub, index) => {
                            const isDragging = dragIndex === index;
                            const isDropTarget = dropIndex === index && dragIndex !== null && dragIndex !== index;
                            const busy = busyId === hub.identifier;
                            return (
                                <div
                                    key={hub.identifier}
                                    draggable={!busy}
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
                                        void handleDrop(index);
                                    }}
                                    className={`px-3 sm:px-4 py-3 transition-all
                                        ${isDragging ? 'opacity-50 bg-plex/5 scale-[0.99]' : 'bg-transparent hover:bg-white/[0.03]'}
                                        ${isDropTarget ? 'ring-1 ring-inset ring-plex/40 bg-plex/10' : ''}
                                        ${busy ? 'opacity-70' : ''}`}
                                >
                                    {/* Mobile card layout */}
                                    <div className="md:hidden space-y-3">
                                        <div className="flex items-start gap-2">
                                            <GripVertical className="w-5 h-5 text-muted shrink-0 mt-0.5 cursor-grab active:cursor-grabbing" aria-hidden />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-text leading-snug break-words">{hub.title}</div>
                                                <div className="text-[10px] text-muted uppercase tracking-wide mt-0.5">
                                                    {hub.is_collection ? 'Collection' : 'Built-in hub'}
                                                    {busy && <span className="ml-2 text-plex">Saving…</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={busy || index === 0}
                                                    onClick={() => void moveToIndex(index, index - 1)}
                                                    className="p-2 rounded-lg border border-border text-muted hover:text-text disabled:opacity-30"
                                                    title="Move up"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={busy || index === hubs.length - 1}
                                                    onClick={() => void moveToIndex(index, index + 1)}
                                                    className="p-2 rounded-lg border border-border text-muted hover:text-text disabled:opacity-30"
                                                    title="Move down"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/70 bg-background/40 px-2 py-2.5">
                                            <HubToggle
                                                label="Library Rec."
                                                shortLabel="Lib Rec"
                                                showLabel
                                                checked={hub.promoted_to_recommended}
                                                disabled={busy}
                                                onChange={(v) => void toggleVisibility(hub, 'recommended', v)}
                                            />
                                            <HubToggle
                                                label="Home"
                                                showLabel
                                                checked={hub.promoted_to_home}
                                                disabled={busy}
                                                onChange={(v) => void toggleVisibility(hub, 'home', v)}
                                            />
                                            <HubToggle
                                                label="Friends"
                                                showLabel
                                                checked={hub.promoted_to_shared}
                                                disabled={busy}
                                                onChange={(v) => void toggleVisibility(hub, 'shared', v)}
                                            />
                                        </div>
                                    </div>

                                    {/* Desktop row layout */}
                                    <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_4.5rem] gap-2 items-center">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <GripVertical className="w-5 h-5 text-muted shrink-0 cursor-grab active:cursor-grabbing" aria-hidden />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-text truncate">{hub.title}</div>
                                                <div className="text-[10px] text-muted uppercase tracking-wide mt-0.5">
                                                    {hub.is_collection ? 'Collection' : 'Built-in hub'}
                                                    {busy && <span className="ml-2 text-plex">Saving…</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <HubToggle
                                            label="Library Rec."
                                            checked={hub.promoted_to_recommended}
                                            disabled={busy}
                                            onChange={(v) => void toggleVisibility(hub, 'recommended', v)}
                                        />
                                        <HubToggle
                                            label="Home"
                                            checked={hub.promoted_to_home}
                                            disabled={busy}
                                            onChange={(v) => void toggleVisibility(hub, 'home', v)}
                                        />
                                        <HubToggle
                                            label="Friends"
                                            checked={hub.promoted_to_shared}
                                            disabled={busy}
                                            onChange={(v) => void toggleVisibility(hub, 'shared', v)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="p-4 bg-card/30 border border-border rounded-2xl flex items-start gap-3 text-xs text-muted">
                <Info className="w-4 h-4 text-plex flex-shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0">
                    <p>
                        <b className="text-text">Reorder</b> with the arrows on mobile, or drag the handle on desktop.
                    </p>
                    <p>
                        <b className="text-text">Lib Rec</b> = Recommended · <b className="text-text">Home</b> = your home ·{' '}
                        <b className="text-text">Friends</b> = shared users&apos; home.
                    </p>
                    <p>Pinning a collection in Gallery promotes it into this list so you can place it exactly where you want.</p>
                </div>
            </div>
        </div>
    );
};

export default HubsPage;
