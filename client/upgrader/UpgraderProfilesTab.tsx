import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Server, Plus, Settings2, Code, Trash2, Check, X, Save, Edit3 } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { UpgraderCustomFormatModal } from './UpgraderCustomFormatModal';
import { UpgraderQualityProfileModal } from './UpgraderQualityProfileModal';

interface ArrInstance {
    id: string;
    name: string;
    type: 'sonarr' | 'radarr';
}

interface CustomFormat {
    id?: number;
    name: string;
    includeCustomFormatWhenRenaming: boolean;
    specifications: any[];
}

interface QualityProfile {
    id: number;
    name: string;
    upgradeAllowed: boolean;
    cutoff: number;
    items: any[];
    formatItems: { format: number; score: number }[];
}

export const UpgraderProfilesTab: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [instances, setInstances] = useState<ArrInstance[]>([]);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
    const [formats, setFormats] = useState<CustomFormat[]>([]);
    const [profiles, setProfiles] = useState<QualityProfile[]>([]);
    const [editingFormat, setEditingFormat] = useState<{ show: boolean; format: CustomFormat | null }>({ show: false, format: null });
    const [editingProfile, setEditingProfile] = useState<{ show: boolean; profile: QualityProfile | null }>({ show: false, profile: null });
    const [formatPage, setFormatPage] = useState(1);
    const [profilePage, setProfilePage] = useState(1);
    const pageSize = 18;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const profilesRes = await apiFetch('/api/upgrader/profiles');
            const loadedInstances = profilesRes?.instances?.map((i: any) => ({
                id: i.id,
                name: i.name || (i.type === 'radarr' ? 'Radarr' : 'Sonarr'),
                type: i.type,
            })) || [];
            setInstances(loadedInstances);
            if (loadedInstances.length > 0 && !selectedInstanceId) {
                setSelectedInstanceId(loadedInstances[0].id);
            }
        } catch (e) {
            console.error('Failed to load instances', e);
        } finally {
            setLoading(false);
        }
    }, [selectedInstanceId]);

    const loadInstanceData = useCallback(async (instanceId: string) => {
        setLoading(true);
        try {
            const [formatsRes, profilesRes] = await Promise.all([
                apiFetch(`/api/upgrader/arr/${instanceId}/customformats`),
                apiFetch(`/api/upgrader/arr/${instanceId}/qualityprofiles`),
            ]);
            setFormats(formatsRes?.formats || []);
            setProfiles(profilesRes?.profiles || []);
        } catch (e) {
            console.error('Failed to load instance data', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSaveFormat = async (format: CustomFormat) => {
        if (!selectedInstanceId) return;
        const method = format.id ? 'PUT' : 'POST';
        const url = format.id 
            ? `/api/upgrader/arr/${selectedInstanceId}/customformats/${format.id}`
            : `/api/upgrader/arr/${selectedInstanceId}/customformats`;
        
        await apiFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(format)
        });
        
        await loadInstanceData(selectedInstanceId);
        setEditingFormat({ show: false, format: null });
    };

    const handleSaveProfile = async (profile: QualityProfile) => {
        if (!selectedInstanceId) return;
        const url = `/api/upgrader/arr/${selectedInstanceId}/qualityprofiles/${profile.id}`;
        
        await apiFetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
        
        await loadInstanceData(selectedInstanceId);
        setEditingProfile({ show: false, profile: null });
    };

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (selectedInstanceId) {
            setFormatPage(1);
            setProfilePage(1);
            loadInstanceData(selectedInstanceId);
        } else {
            setFormats([]);
            setProfiles([]);
        }
    }, [selectedInstanceId, loadInstanceData]);

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-text flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-plex" />
                            Profiles & Custom Formats
                        </h3>
                        <p className="text-sm text-muted mt-1">Manage and sync Quality Profiles and Custom Formats directly to Sonarr and Radarr.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:border-plex"
                            value={selectedInstanceId}
                            onChange={(e) => setSelectedInstanceId(e.target.value)}
                            disabled={loading}
                        >
                            {instances.map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-text transition-colors"
                            onClick={() => selectedInstanceId && loadInstanceData(selectedInstanceId)}
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-plex' : ''}`} />
                        </button>
                    </div>
                </div>
                
                {loading && !formats.length ? (
                    <div className="text-center py-12 text-muted">Loading data from ARR...</div>
                ) : (
                    <div className="flex flex-col gap-8 mt-6">
                        {/* Custom Formats Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-semibold text-text">Custom Formats ({formats.length})</h4>
                                <button
                                    onClick={() => setEditingFormat({ show: true, format: null })}
                                    className="text-xs bg-plex/20 text-plex hover:bg-plex hover:text-background px-3 py-1.5 rounded-lg flex items-center gap-2 font-semibold transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    New Format
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {formats.slice((formatPage - 1) * pageSize, formatPage * pageSize).map(f => (
                                    <div
                                        key={f.id}
                                        onClick={() => setEditingFormat({ show: true, format: f })}
                                        className="bg-background border border-border p-4 rounded-lg flex flex-col justify-between group cursor-pointer hover:border-plex transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold text-sm text-text truncate">{f.name}</div>
                                            <Edit3 className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="text-xs text-muted mt-1">{f.specifications?.length || 0} conditions</div>
                                    </div>
                                ))}
                            </div>
                            {formats.length > pageSize && (
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <button 
                                        disabled={formatPage === 1}
                                        onClick={() => setFormatPage(p => p - 1)}
                                        className="px-3 py-1 bg-background border border-border rounded-lg text-sm text-muted hover:text-text disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-muted">
                                        Page {formatPage} of {Math.ceil(formats.length / pageSize)}
                                    </span>
                                    <button 
                                        disabled={formatPage >= Math.ceil(formats.length / pageSize)}
                                        onClick={() => setFormatPage(p => p + 1)}
                                        className="px-3 py-1 bg-background border border-border rounded-lg text-sm text-muted hover:text-text disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Quality Profiles Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-semibold text-text">Quality Profiles ({profiles.length})</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {profiles.slice((profilePage - 1) * pageSize, profilePage * pageSize).map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => setEditingProfile({ show: true, profile: p })}
                                        className="bg-background border border-border p-4 rounded-lg flex flex-col justify-between group cursor-pointer hover:border-plex transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold text-sm text-text truncate">{p.name}</div>
                                            <Edit3 className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="text-xs text-muted mt-1">{p.formatItems?.filter(f => f.score !== 0).length || 0} active custom formats</div>
                                    </div>
                                ))}
                            </div>
                            {profiles.length > pageSize && (
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <button 
                                        disabled={profilePage === 1}
                                        onClick={() => setProfilePage(p => p - 1)}
                                        className="px-3 py-1 bg-background border border-border rounded-lg text-sm text-muted hover:text-text disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-muted">
                                        Page {profilePage} of {Math.ceil(profiles.length / pageSize)}
                                    </span>
                                    <button 
                                        disabled={profilePage >= Math.ceil(profiles.length / pageSize)}
                                        onClick={() => setProfilePage(p => p + 1)}
                                        className="px-3 py-1 bg-background border border-border rounded-lg text-sm text-muted hover:text-text disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {editingFormat.show && (
                <UpgraderCustomFormatModal
                    format={editingFormat.format}
                    onClose={() => setEditingFormat({ show: false, format: null })}
                    onSave={handleSaveFormat}
                />
            )}

            {editingProfile.show && editingProfile.profile && (
                <UpgraderQualityProfileModal
                    profile={editingProfile.profile}
                    formats={formats}
                    onClose={() => setEditingProfile({ show: false, profile: null })}
                    onSave={handleSaveProfile}
                />
            )}
        </div>
    );
};
