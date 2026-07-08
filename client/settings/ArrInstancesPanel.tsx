import React from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import type { ArrInstance } from '../shared/types';
import { IntegrationTestButton } from '../shared/IntegrationTestButton';
import { SettingsSwitch } from '../shared/ui';

const SECRET_MASK = '••••••••';

const hasCredentials = (
    instance: ArrInstance,
    saved?: ArrInstance,
) => {
    const effectiveUrl = String(instance.url || saved?.url || '').trim();
    const effectiveKey = String(instance.apiKey || saved?.apiKey || '').trim();
    return Boolean(effectiveUrl && effectiveKey && effectiveKey !== SECRET_MASK);
};

export const createEmptyArrInstance = (type: 'sonarr' | 'radarr', isDefault = false): ArrInstance => ({
    id: crypto.randomUUID(),
    type,
    name: type === 'radarr' ? 'Radarr' : 'Sonarr',
    url: '',
    apiKey: '',
    enabled: true,
    isDefault,
    plexLibraryIds: [],
});

type PlexLibrary = {
    id: string;
    title: string;
    type: string;
};

type Props = {
    type: 'sonarr' | 'radarr';
    title: string;
    subtitle: string;
    instances: ArrInstance[];
    savedInstances: ArrInstance[];
    libraries?: PlexLibrary[];
    allInstances?: ArrInstance[];
    onChange: (instances: ArrInstance[]) => void;
    onMessage: (message: string, success: boolean) => void;
    className?: string;
};

export const ArrInstancesPanel: React.FC<Props> = ({
    type,
    title,
    subtitle,
    instances,
    savedInstances,
    libraries = [],
    allInstances = [],
    onChange,
    onMessage,
    className = '',
}) => {
    const libraryType = type === 'radarr' ? 'movie' : 'show';
    const availableLibraries = libraries.filter((entry) => String(entry.type || '').toLowerCase() === libraryType);

    const librariesAssignedElsewhere = (instanceId: string) => {
        const assigned = new Set<string>();
        allInstances
            .filter((entry) => entry.id !== instanceId && entry.type === type)
            .forEach((entry) => {
                (entry.plexLibraryIds || []).forEach((libraryId) => assigned.add(String(libraryId)));
            });
        return assigned;
    };

    const toggleLibrary = (instanceId: string, libraryId: string) => {
        const instance = instances.find((entry) => entry.id === instanceId);
        if (!instance) return;
        const current = new Set((instance.plexLibraryIds || []).map((entry) => String(entry)));
        if (current.has(libraryId)) current.delete(libraryId);
        else current.add(libraryId);
        updateInstance(instanceId, { plexLibraryIds: Array.from(current) });
    };
    const updateInstance = (id: string, patch: Partial<ArrInstance>) => {
        onChange(instances.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
    };

    const removeInstance = (id: string) => {
        const next = instances.filter((entry) => entry.id !== id);
        if (next.length > 0 && !next.some((entry) => entry.isDefault)) {
            next[0] = { ...next[0], isDefault: true };
        }
        onChange(next);
    };

    const setDefault = (id: string) => {
        onChange(instances.map((entry) => ({ ...entry, isDefault: entry.id === id })));
    };

    const addInstance = () => {
        onChange([
            ...instances,
            createEmptyArrInstance(type, instances.length === 0),
        ]);
    };

    return (
        <div className={className}>
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <h3 className="text-lg font-bold text-plex">{title}</h3>
                    <p className="text-sm text-muted mt-1">{subtitle}</p>
                </div>
                <button
                    type="button"
                    onClick={addInstance}
                    className="px-3 py-2 rounded-lg border border-border text-sm font-medium text-text hover:bg-white/5 transition-colors flex items-center gap-2 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Add Instance
                </button>
            </div>

            {instances.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted text-center">
                    No {type === 'radarr' ? 'Radarr' : 'Sonarr'} instances configured.
                </div>
            ) : (
                <div className="space-y-4">
                    {instances.map((instance, index) => {
                        const saved = savedInstances.find((entry) => entry.id === instance.id);
                        const testPayload = type === 'sonarr'
                            ? { sonarrUrl: instance.url, sonarrApiKey: instance.apiKey, instanceId: instance.id }
                            : { radarrUrl: instance.url, radarrApiKey: instance.apiKey, instanceId: instance.id };

                        return (
                            <div key={instance.id} className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xs uppercase tracking-wider font-bold text-muted">
                                            Instance {index + 1}
                                        </span>
                                        {instance.isDefault && (
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-plex bg-plex/10 px-2 py-0.5 rounded-full">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <SettingsSwitch
                                            checked={instance.enabled !== false}
                                            onChange={(enabled) => updateInstance(instance.id, { enabled })}
                                            className="!ml-0"
                                        />
                                        <button
                                            type="button"
                                            title={instance.isDefault ? 'Default instance' : 'Set as default'}
                                            onClick={() => setDefault(instance.id)}
                                            className={`p-2 rounded-lg transition-colors ${instance.isDefault ? 'text-plex bg-plex/10' : 'text-muted hover:text-text hover:bg-white/5'}`}
                                        >
                                            <Star className={`w-4 h-4 ${instance.isDefault ? 'fill-current' : ''}`} />
                                        </button>
                                        <button
                                            type="button"
                                            title="Remove instance"
                                            onClick={() => removeInstance(instance.id)}
                                            className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-muted uppercase tracking-wider font-bold mb-1 block">Display Name</label>
                                    <input
                                        className="w-full p-2.5 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all text-sm"
                                        type="text"
                                        value={instance.name}
                                        onChange={(e) => updateInstance(instance.id, { name: e.target.value })}
                                        placeholder={type === 'radarr' ? 'Radarr' : 'Sonarr'}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-muted uppercase tracking-wider font-bold mb-1 block">URL</label>
                                    <input
                                        className="w-full p-2.5 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all text-sm"
                                        type="text"
                                        value={instance.url}
                                        onChange={(e) => updateInstance(instance.id, { url: e.target.value })}
                                        placeholder={type === 'radarr' ? 'http://localhost:7878' : 'http://localhost:8989'}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-muted uppercase tracking-wider font-bold mb-1 block">API Key</label>
                                    <input
                                        className="w-full p-2.5 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all text-sm"
                                        type="password"
                                        value={instance.apiKey}
                                        onChange={(e) => updateInstance(instance.id, { apiKey: e.target.value })}
                                        placeholder="API key"
                                    />
                                </div>

                                {availableLibraries.length > 0 && (
                                    <div>
                                        <label className="text-xs text-muted uppercase tracking-wider font-bold mb-1 block">Plex Libraries</label>
                                        <p className="text-[11px] text-muted mb-2">
                                            Map libraries to this instance for maintenance routing. Unmapped libraries use the default instance.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {availableLibraries.map((library) => {
                                                const libraryId = String(library.id);
                                                const selected = (instance.plexLibraryIds || []).includes(libraryId);
                                                const takenElsewhere = librariesAssignedElsewhere(instance.id).has(libraryId);
                                                return (
                                                    <button
                                                        key={`${instance.id}-${libraryId}`}
                                                        type="button"
                                                        disabled={takenElsewhere && !selected}
                                                        title={takenElsewhere && !selected ? 'Assigned to another instance' : library.title}
                                                        onClick={() => toggleLibrary(instance.id, libraryId)}
                                                        className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                                                            selected
                                                                ? 'bg-plex/15 border-plex/40 text-plex'
                                                                : takenElsewhere
                                                                    ? 'bg-background/20 border-border text-muted/50 cursor-not-allowed'
                                                                    : 'bg-background/30 border-border text-text hover:border-plex/40'
                                                        }`}
                                                    >
                                                        {library.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <IntegrationTestButton
                                    type={type}
                                    payload={testPayload}
                                    disabled={!hasCredentials(instance, saved)}
                                    onMessage={onMessage}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
