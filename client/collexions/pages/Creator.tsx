import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Plus, Search, ListMusic, Globe, Loader2, List, Trash2, Sparkles, Filter, ExternalLink, Compass, Clock, LayoutTemplate } from 'lucide-react';
import { api, collexionsImageUrl } from '../api';
import { CustomSelect } from '../components/ui/Inputs';
import { AppConfig } from '../types';

type CreatorTab = 'templates' | 'trending' | 'discover' | 'search' | 'import' | 'manual';

type JobTemplate = {
    id: string;
    name: string;
    description: string;
    category: string;
    media: string;
    source_type: string;
    source_id: string;
    default_sort: string;
    requires: string[];
    available: boolean;
};

const Creator: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<CreatorTab>('templates');
    const [config, setConfig] = useState<AppConfig | null>(null);
    // Trending State
    const [trendingPresets, setTrendingPresets] = useState<any[]>([]);
    const [viewingPreset, setViewingPreset] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    // Templates
    const [templates, setTemplates] = useState<JobTemplate[]>([]);
    const [templateCategories, setTemplateCategories] = useState<Array<{ id: string; label: string }>>([]);
    const [templateCategory, setTemplateCategory] = useState<string>('all');
    const [templateKeys, setTemplateKeys] = useState<{ tmdb: boolean; trakt: boolean }>({ tmdb: false, trakt: false });
    const [franchiseQuery, setFranchiseQuery] = useState('');
    const [franchiseResults, setFranchiseResults] = useState<any[]>([]);
    const [searchingFranchises, setSearchingFranchises] = useState(false);
    const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);

    // Shared State
    const [targetLibrary, setTargetLibrary] = useState<string>('');
    const [collectionTitle, setCollectionTitle] = useState('');
    const [sortOrder, setSortOrder] = useState<'custom' | 'random' | 'release'>('custom');
    const [autoSync, setAutoSync] = useState(true);
    const [creating, setCreating] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [cfg, presets, tplPayload] = await Promise.all([
                api.getConfig(),
                api.getTrending().catch(() => []),
                api.getTemplates().catch(() => ({ templates: [], categories: [], keys: { tmdb: false, trakt: false } })),
            ]);
            setConfig(cfg);
            setTrendingPresets(presets);
            setTemplates(tplPayload.templates || []);
            setTemplateCategories(tplPayload.categories || []);
            setTemplateKeys(tplPayload.keys || { tmdb: false, trakt: false });
            if (cfg?.library_names?.length === 1) {
                setTargetLibrary(cfg.library_names[0]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const filteredTemplates = useMemo(() => {
        if (templateCategory === 'all') return templates;
        return templates.filter((t) => t.category === templateCategory);
    }, [templates, templateCategory]);

    const handleCreateTemplate = async (tpl: JobTemplate) => {
        if (!targetLibrary) {
            showToast('Please select a target library first!', 'error');
            return;
        }
        if (!tpl.available) {
            showToast(`Add required API keys in Settings (${(tpl.requires || []).join(', ')}).`, 'error');
            return;
        }
        setCreatingTemplateId(tpl.id);
        setCreating(true);
        try {
            const res = await api.createFromTemplate({
                library: targetLibrary,
                template_id: tpl.id,
                sort_order: sortOrder || tpl.default_sort,
                auto_sync: autoSync,
            });
            if (res.success) {
                showToast(
                    `Created '${res.title || tpl.name}' — matched ${res.matched}/${res.total} titles.${autoSync ? ' Auto-sync job registered.' : ''}`,
                    'success',
                );
            } else {
                showToast(res.error || 'Failed to create collection.', 'error');
            }
        } catch (e: any) {
            showToast(e?.message || 'Failed to create collection.', 'error');
        } finally {
            setCreating(false);
            setCreatingTemplateId(null);
        }
    };

    const handleFranchiseSearch = async () => {
        if (!franchiseQuery.trim()) return;
        setSearchingFranchises(true);
        try {
            const results = await api.searchFranchises(franchiseQuery.trim());
            setFranchiseResults(Array.isArray(results) ? results : []);
            if (!Array.isArray(results) || results.length === 0) {
                showToast('No franchises found for that search.', 'info');
            }
        } catch (e: any) {
            showToast(e?.message || 'Franchise search failed.', 'error');
            setFranchiseResults([]);
        } finally {
            setSearchingFranchises(false);
        }
    };

    const handleCreateFranchise = async (franchise: { name: string; source_type: string; source_id: string }) => {
        if (!targetLibrary) {
            showToast('Please select a target library first!', 'error');
            return;
        }
        if (!templateKeys.tmdb) {
            showToast('TMDB API key required in Settings.', 'error');
            return;
        }
        setCreatingTemplateId(`franchise-${franchise.source_id}`);
        setCreating(true);
        try {
            const res = await api.createFromTemplate({
                library: targetLibrary,
                title: franchise.name,
                source_type: franchise.source_type,
                source_id: franchise.source_id,
                sort_order: sortOrder === 'custom' ? 'release' : sortOrder,
                auto_sync: autoSync,
            });
            if (res.success) {
                showToast(
                    `Created '${res.title || franchise.name}' — matched ${res.matched}/${res.total} titles.`,
                    'success',
                );
            } else {
                showToast(res.error || 'Failed to create franchise collection.', 'error');
            }
        } catch (e: any) {
            showToast(e?.message || 'Failed to create franchise collection.', 'error');
        } finally {
            setCreating(false);
            setCreatingTemplateId(null);
        }
    };

    const handleCreatePreset = async (preset: any) => {
        if (!targetLibrary) {
            showToast("Please select a target library first!", "error");
            return;
        }
        setCreating(true);
        try {
            // Source ID for trending is the preset ID
            const res = await api.createFromExternal(
                targetLibrary,
                preset.name,
                preset.items,
                sortOrder,
                autoSync,
                `tmdb_trending_${preset.type}`,
                preset.id
            );

            setSelectionPool([]);
            if (res.success) {
                showToast(`Successfully created '${preset.name}'! Matched ${res.matched}/${res.total} items.`, "success");
                setViewingPreset(null);
                setActiveSubTab('trending');
            } else showToast("Error: " + res.error, "error");
        } catch (e) {
            showToast("Failed to create collection.", "error");
        } finally {
            setCreating(false);
        }
    };

    // Manual Build State
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [localSearchYear, setLocalSearchYear] = useState('');
    const [localSearchGenre, setLocalSearchGenre] = useState('');
    const [localResults, setLocalResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // Unified Selection Pool (The "Cart")
    const [selectionPool, setSelectionPool] = useState<any[]>([]);

    // Import State
    const [importUrl, setImportUrl] = useState('');
    const [importedItems, setImportedItems] = useState<any[]>([]);
    const [importing, setImporting] = useState(false);

    // Global Search State
    const [externalQuery, setExternalQuery] = useState('');
    const [externalResults, setExternalResults] = useState<any[]>([]);
    const [searchingExternal, setSearchingExternal] = useState(false);

    // Discover State
    const [discoverType, setDiscoverType] = useState<'movie' | 'tv'>('movie');
    const [discoverGenres, setDiscoverGenres] = useState<any[]>([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [discoverYear, setDiscoverYear] = useState('');
    const [discoverRating, setDiscoverRating] = useState('');
    const [discoverVoteCount, setDiscoverVoteCount] = useState('');
    const [discoverLanguage, setDiscoverLanguage] = useState('');
    const [discoverNetwork, setDiscoverNetwork] = useState('');
    const [discoverCompany, setDiscoverCompany] = useState('');
    const [discoverKeywords, setDiscoverKeywords] = useState('');
    const [discoverYearMode, setDiscoverYearMode] = useState<'exact' | 'before' | 'after'>('exact');
    const [discoverSort, setDiscoverSort] = useState('popularity.desc');
    const [discoverResults, setDiscoverResults] = useState<any[]>([]);
    const [discovering, setDiscovering] = useState(false);
    const [showPoolDetails, setShowPoolDetails] = useState(false);

    useEffect(() => {
        if (activeSubTab === 'discover') {
            api.getTmdbGenres(discoverType).then(setDiscoverGenres).catch(console.error);
        }
    }, [discoverType, activeSubTab]);

    const handleDiscover = async () => {
        setDiscovering(true);
        try {
            const params = {
                type: discoverType,
                with_genres: selectedGenre,
                year: discoverYear,
                year_mode: discoverYearMode,
                with_keywords: discoverKeywords,
                'vote_average.gte': discoverRating,
                'vote_count.gte': discoverVoteCount,
                with_original_language: discoverLanguage,
                with_networks: discoverType === 'tv' ? discoverNetwork : undefined,
                with_companies: discoverType === 'movie' ? discoverCompany : undefined,
                sort_by: discoverSort
            };
            const results = await api.discoverTmdb(params);
            setDiscoverResults(results);
        } catch (e) {
            showToast("Failed to discover content.", "error");
        } finally {
            setDiscovering(false);
        }
    };


    const handleListImport = async () => {
        if (!importUrl) return;
        setImporting(true);
        try {
            let items = [];
            let sourceType = '';

            if (importUrl.includes('mdblist.com')) {
                items = await api.getMdbList(importUrl);
                sourceType = 'mdblist';
            } else {
                items = await api.getTraktList(importUrl);
                sourceType = 'trakt';
            }

            setImportedItems(items);

            // Extract a reasonable title from the URL
            const urlParts = importUrl.split('/').filter(Boolean);
            let slug = '';

            if (sourceType === 'mdblist') {
                // e.g. https://mdblist.com/lists/mojoard_pk/vintage-british-tv/
                const listIndex = urlParts.indexOf('lists');
                if (listIndex !== -1 && urlParts.length > listIndex + 2) {
                    slug = urlParts[listIndex + 2].replace(/-/g, ' ');
                }
            } else {
                // e.g. https://trakt.tv/users/mojoard_pk/lists/vintage-british-tv
                slug = urlParts[urlParts.length - 1].replace(/-/g, ' ');
            }

            if (slug && !collectionTitle) {
                setCollectionTitle(slug.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
            }
        } catch (e) {
            showToast("Failed to fetch list. Check URL or API keys.", "error");
        } finally {
            setImporting(false);
        }
    };

    const handleExternalSearch = async () => {
        if (!externalQuery) return;
        setSearchingExternal(true);
        try {
            const results = await api.searchExternal(externalQuery, 'movie');
            setExternalResults(results);
        } catch (e) {
            console.error(e);
        } finally {
            setSearchingExternal(false);
        }
    };

    const handleLocalSearch = async () => {
        if (!targetLibrary) return;
        setSearching(true);
        try {
            const res = await api.searchLibrary(targetLibrary, localSearchQuery, localSearchGenre, localSearchYear);
            setLocalResults(res);
        } catch (e) {
            showToast("Failed to search library.", "error");
        } finally {
            setSearching(false);
        }
    };

    const toggleSelection = (item: any) => {
        setSelectionPool(prev => {
            const exists = prev.find(i => (i.id || i.guid) === (item.id || item.guid));
            if (exists) {
                return prev.filter(i => (i.id || i.guid) !== (item.id || i.guid));
            }
            return [...prev, item];
        });
    };

    const handleCreate = async () => {
        if (!targetLibrary || !collectionTitle || selectionPool.length === 0) return;
        setCreating(true);
        try {
            // Check if items are from library (ratingKey) or external (id)
            const hasExternal = selectionPool.some(i => i.id && !i.ratingKey);

            let res;
            if (hasExternal) {
                // If there are external items, we use the external creation logic
                res = await api.createFromExternal(
                    targetLibrary,
                    collectionTitle,
                    selectionPool,
                    sortOrder,
                    autoSync,
                    'manual_custom',
                    'custom_selection'
                );
            } else {
                // All items are local library keys
                const keys = selectionPool.map(i => i.ratingKey);
                res = await api.createCollection(targetLibrary, collectionTitle, keys, sortOrder);
            }

            if (res.success) {
                showToast("Collection created!", "success");
                setSelectionPool([]);
                setCollectionTitle('');
                setLocalSearchQuery('');
                setLocalResults([]);
                setDiscoverResults([]);
                setActiveSubTab('trending');
            } else showToast("Error: " + res.error, "error");
        } catch (e) {
            showToast("Failed to create collection.", "error");
        } finally {
            setCreating(false);
        }
    };


    const handleCreateFromExternal = async () => {
        if (!targetLibrary || !collectionTitle) return;
        setCreating(true);
        try {
            const isDiscover = activeSubTab === 'discover';
            const isMdbList = importUrl.includes('mdblist.com');
            const sourceType = activeSubTab === 'import' ? (isMdbList ? 'mdblist' : 'trakt_list') :
                (isDiscover ? 'tmdb_discover' : 'trakt_trending_movie');
            const sourceId = activeSubTab === 'import' ? importUrl :
                (isDiscover ? JSON.stringify({
                    type: discoverType,
                    with_genres: selectedGenre,
                    primary_release_year: discoverType === 'movie' ? discoverYear : undefined,
                    first_air_date_year: discoverType === 'tv' ? discoverYear : undefined,
                    'vote_average.gte': discoverRating,
                    'vote_count.gte': discoverVoteCount,
                    with_original_language: discoverLanguage,
                    with_networks: discoverType === 'tv' ? discoverNetwork : undefined,
                    with_companies: discoverType === 'movie' ? discoverCompany : undefined,
                    sort_by: discoverSort
                }) : externalQuery);

            const itemsToUse = isDiscover ? discoverResults : importedItems;

            const res = await api.createFromExternal(
                targetLibrary,
                collectionTitle,
                itemsToUse,
                sortOrder,
                autoSync,
                sourceType,
                sourceId
            );
            if (res.success) {
                showToast(`Success! Matched ${res.matched}/${res.total} items.`, "success");
                // Clear state
                setImportedItems([]);
                setCollectionTitle('');
                setImportUrl('');
                setExternalQuery('');
                setExternalResults([]);
                setDiscoverResults([]);
                setActiveSubTab('trending');
            } else showToast("Error: " + res.error, "error");
        } catch (e) {
            showToast("Failed to create collection.", "error");
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center text-muted flex-col gap-4">
                <Loader2 className="w-8 h-8 border-t-plex animate-spin" />
                <p>Connecting to external services... This may take a while on the first run.</p>
            </div>
        );
    }

    const hasKeys = config?.tmdb_api_key || config?.trakt_client_id;

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Custom Toast Notification */}
            {toast && (
                <div className={`fixed bottom-8 right-8 z-[110] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-10 duration-500 ${toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100' :
                    toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/50 text-rose-100' :
                        'bg-card/90 border-border text-text'
                    }`}>
                    {toast.type === 'success' && <div className="bg-emerald-500 rounded-full p-1"><Plus className="w-4 h-4 text-emerald-950 rotate-0" /></div>}
                    {toast.type === 'error' && <div className="bg-rose-500 rounded-full p-1"><Plus className="w-4 h-4 text-rose-950 rotate-45" /></div>}
                    <span className="font-bold">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-4 text-white/50 hover:text-text transition-colors">
                        <Plus className="w-4 h-4 rotate-45" />
                    </button>
                </div>
            )}
            {/* Modal for viewing all items in a preset */}
            {viewingPreset && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card border border-border w-full max-w-4xl max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col scale-in-center">
                        <div className="p-6 border-b border-border flex items-center justify-between bg-card/60">
                            <div>
                                <h2 className="text-2xl font-bold text-text">{viewingPreset.name}</h2>
                                <p className="text-muted">{viewingPreset.items.length} items to match</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleCreatePreset(viewingPreset)}
                                    disabled={creating}
                                    className="bg-plex hover:bg-plex/80 disabled:opacity-50 text-text px-6 py-2 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                                >
                                    {creating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
                                    Create Collection
                                </button>
                                <button
                                    onClick={() => setViewingPreset(null)}
                                    className="p-2 hover:bg-white/5 rounded-xl text-muted hover:text-text transition-all"
                                >
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {viewingPreset.items.map((itm: any, idx: number) => (
                                    <div key={idx} className="space-y-2 group">
                                        <div className="aspect-[2/3] bg-card rounded-xl overflow-hidden ring-1 ring-border group-hover:ring-plex/50 transition-all">
                                            {itm.poster ? (
                                                <img src={itm.poster} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted">
                                                    <Globe className="w-8 h-8 opacity-20" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-text truncate px-1">{itm.title}</p>
                                        <p className="text-[10px] text-muted px-1">{itm.year || 'Unknown'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-border bg-card/60 flex justify-end gap-3">
                            <button
                                onClick={() => setViewingPreset(null)}
                                className="px-6 py-2 rounded-xl font-bold text-text hover:bg-white/5 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleCreatePreset(viewingPreset);
                                    setViewingPreset(null);
                                }}
                                disabled={creating || !targetLibrary}
                                className="bg-plex hover:bg-plex-hover text-text px-8 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                            >
                                <Sparkles className="w-4 h-4" />
                                Create Collection
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-text tracking-tight">Collection Creator</h2>
                    <p className="text-muted mt-1 flex items-center gap-2 text-sm md:text-base">
                        <Plus className="w-5 h-5 text-plex" />
                        Create and sync collections from external sources or your library
                    </p>
                </div>
            </div>

            {/* Global Creation Settings */}
            <section className="bg-card/60 border border-border p-6 rounded-2xl flex flex-col xl:flex-row items-center justify-between gap-6 shadow-xl sticky top-0 z-40 backdrop-blur-md">
                <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
                    <div className="flex items-center gap-4">
                        <div className="bg-plex/20 p-3 rounded-xl text-plex">
                            <ListMusic className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text whitespace-nowrap">Target Library</h3>
                            <p className="text-sm text-muted">Creation destination</p>
                        </div>
                    </div>
                    <CustomSelect
                        label="Target Library"
                        className="w-full md:w-56"
                        value={targetLibrary}
                        options={config?.library_names.map(lib => ({ value: lib, label: lib })) || []}
                        onChange={setTargetLibrary}
                        placeholder="Select a library..."
                    />

                </div>

                <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto xl:border-l xl:border-border xl:pl-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-plex/20 p-3 rounded-xl text-plex">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text whitespace-nowrap">Sort Order</h3>
                            <p className="text-sm text-muted">Plex collection sorting</p>
                        </div>
                    </div>
                    <CustomSelect
                        label="Sort Order"
                        className="w-full md:w-48"
                        value={sortOrder}
                        options={[
                            { value: 'custom', label: 'Manual (Default)' },
                            { value: 'random', label: 'Random 🎲' },
                            { value: 'release', label: 'Release Date 📅' }
                        ]}
                        onChange={setSortOrder}
                    />

                </div>

                <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto xl:border-l xl:border-border xl:pl-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text whitespace-nowrap">Auto-Sync</h3>
                            <p className="text-sm text-muted">Sync every 6 hours</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setAutoSync(!autoSync)}
                        className={`px-6 py-2 rounded-xl border font-bold transition-all ${autoSync ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-background/60 border-border text-muted'}`}
                    >
                        {autoSync ? 'Enabled' : 'Disabled'}
                    </button>
                </div>
            </section>

            <div className="flex border-b border-border overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {[
                    { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-4 h-4" /> },
                    { id: 'trending', label: 'Trending', icon: <Globe className="w-4 h-4" /> },
                    { id: 'discover', label: 'Discover', icon: <Compass className="w-4 h-4" /> },
                    { id: 'search', label: 'Global Search', icon: <Search className="w-4 h-4" /> },
                    { id: 'import', label: 'Import List', icon: <ExternalLink className="w-4 h-4" /> },
                    { id: 'manual', label: 'Manual Build', icon: <ListMusic className="w-4 h-4" /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id as CreatorTab)}
                        className={`px-6 py-4 font-medium capitalize transition-all border-b-2 whitespace-nowrap text-sm flex items-center gap-2 ${activeSubTab === tab.id ? 'text-plex border-plex bg-card/30' : 'text-muted border-transparent hover:text-text hover:bg-white/5'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid gap-6">
                {activeSubTab === 'templates' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-3">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-text flex items-center gap-2">
                                        <LayoutTemplate className="w-5 h-5 text-plex" />
                                        One-click collections
                                    </h3>
                                    <p className="text-sm text-muted mt-1">
                                        Creates a real Plex collection from titles you already own, and registers an auto-sync Job.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                                    <span className={`px-2 py-1 rounded-lg border ${templateKeys.tmdb ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-border text-muted'}`}>
                                        TMDB {templateKeys.tmdb ? 'ready' : 'missing'}
                                    </span>
                                    <span className={`px-2 py-1 rounded-lg border ${templateKeys.trakt ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-border text-muted'}`}>
                                        Trakt {templateKeys.trakt ? 'ready' : 'missing'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTemplateCategory('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${templateCategory === 'all' ? 'bg-plex/20 border-plex/40 text-plex' : 'border-border text-muted hover:text-text'}`}
                                >
                                    All
                                </button>
                                {templateCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setTemplateCategory(cat.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${templateCategory === cat.id ? 'bg-plex/20 border-plex/40 text-plex' : 'border-border text-muted hover:text-text'}`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredTemplates.map((tpl) => {
                                const busy = creatingTemplateId === tpl.id;
                                return (
                                    <div
                                        key={tpl.id}
                                        className={`bg-card/50 border rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all ${tpl.available ? 'border-border hover:border-plex/30' : 'border-border/60 opacity-70'}`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-plex bg-plex/10 px-2 py-1 rounded-md border border-plex/20">
                                                    {tpl.category}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase text-muted">
                                                    {tpl.media}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-text">{tpl.name}</h3>
                                            <p className="text-muted text-sm mt-2 leading-relaxed">{tpl.description}</p>
                                            {!tpl.available && (
                                                <p className="text-amber-300/90 text-xs mt-3">
                                                    Needs {(tpl.requires || []).join(' + ')} key in Settings.
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => void handleCreateTemplate(tpl)}
                                            disabled={creating || !targetLibrary || !tpl.available}
                                            className="mt-5 w-full bg-plex hover:bg-plex-hover text-background py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            {busy ? 'Creating…' : 'Create in Plex'}
                                        </button>
                                    </div>
                                );
                            })}
                            {filteredTemplates.length === 0 && (
                                <div className="md:col-span-2 xl:col-span-3 text-center text-muted py-10 border border-dashed border-border rounded-2xl">
                                    No templates in this category.
                                </div>
                            )}
                        </div>

                        <Card title="Search any franchise">
                            <div className="space-y-4">
                                <p className="text-sm text-muted">
                                    Find a TMDB movie collection (e.g. “Matrix”, “Batman”, “Despicable Me”) and create it as a managed Job.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        value={franchiseQuery}
                                        onChange={(e) => setFranchiseQuery(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') void handleFranchiseSearch(); }}
                                        placeholder="Search franchises…"
                                        className="flex-1 bg-background/60 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:border-plex/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => void handleFranchiseSearch()}
                                        disabled={searchingFranchises || !franchiseQuery.trim() || !templateKeys.tmdb}
                                        className="px-5 py-2.5 rounded-xl bg-card border border-border font-bold text-sm text-text hover:border-plex/40 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {searchingFranchises ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                        Search
                                    </button>
                                </div>
                                {!templateKeys.tmdb && (
                                    <p className="text-xs text-amber-300/90">Add a TMDB API key in Settings to search franchises.</p>
                                )}
                                {franchiseResults.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {franchiseResults.map((fr) => {
                                            const id = `franchise-${fr.source_id}`;
                                            const busy = creatingTemplateId === id;
                                            return (
                                                <div key={fr.id} className="flex gap-3 border border-border rounded-xl p-3 bg-background/40">
                                                    <div className="w-14 h-20 rounded-lg overflow-hidden bg-card shrink-0 border border-border">
                                                        {fr.poster ? (
                                                            <img src={fr.poster} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-muted text-[10px]">N/A</div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1 flex flex-col">
                                                        <h4 className="font-bold text-text text-sm truncate">{fr.name}</h4>
                                                        <p className="text-xs text-muted mt-1 line-clamp-2 flex-1">{fr.overview || 'TMDB franchise collection'}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleCreateFranchise(fr)}
                                                            disabled={creating || !targetLibrary}
                                                            className="mt-2 self-start text-xs font-bold px-3 py-1.5 rounded-lg bg-plex/20 text-plex border border-plex/30 hover:bg-plex/30 disabled:opacity-50 flex items-center gap-1.5"
                                                        >
                                                            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                                            Create
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}

                {activeSubTab === 'trending' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        {!hasKeys ? (
                            <Card title="Global Trending Integration">
                                <div className="bg-card/50 border border-border p-8 rounded-2xl text-center space-y-4">
                                    <Globe className="w-12 h-12 text-muted mx-auto" />
                                    <div className="max-w-md mx-auto">
                                        <h3 className="text-lg font-bold text-text">External Integration Required</h3>
                                        <p className="text-muted text-sm mt-2">Add your API keys in Settings to see what's trending.</p>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {trendingPresets.map(preset => (
                                    <div key={preset.id} className="bg-card/50 border border-border p-6 rounded-2xl flex flex-col justify-between hover:border-plex/30 transition-all group shadow-lg">
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-plex bg-plex/10 px-2 py-1 rounded-md border border-plex/20">
                                                    {preset.source}
                                                </span>
                                                <span className="text-xs text-muted font-medium">{preset.items.length} titles</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-text group-hover:text-plex transition-colors">{preset.name}</h3>
                                            <p className="text-muted text-sm mt-2 leading-relaxed">{preset.description}</p>

                                            <div
                                                className="mt-6 flex flex-wrap gap-3 cursor-pointer p-2 -m-2 rounded-xl hover:bg-white/5 transition-colors"
                                                onClick={() => setViewingPreset(preset)}
                                            >
                                                {preset.items.slice(0, 5).map((itm: any, idx: number) => (
                                                    <div key={idx} className="w-12 h-18 bg-card rounded-lg overflow-hidden ring-1 ring-border shadow-sm transition-transform group-hover:scale-105">
                                                        {itm.poster && <img src={itm.poster} alt="" className="w-full h-full object-cover" />}
                                                    </div>
                                                ))}
                                                {preset.items.length > 5 && (
                                                    <div className="w-12 h-18 bg-white/5 rounded-lg flex items-center justify-center text-[10px] font-bold text-muted border border-border transition-transform group-hover:scale-105">
                                                        +{preset.items.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleCreatePreset(preset)}
                                            disabled={creating || !targetLibrary}
                                            className="mt-8 w-full bg-plex hover:bg-plex-hover text-background py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:hover:bg-plex shadow-md transform group-hover:-translate-y-1"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Create Collection
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeSubTab === 'discover' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300 relative z-30">
                        <Card title="Discover Curated Collections">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="relative z-50">
                                    <CustomSelect
                                        label="Media Type"
                                        value={discoverType}
                                        onChange={v => setDiscoverType(v as 'movie' | 'tv')}
                                        options={[
                                            { value: 'movie', label: 'Movies' },
                                            { value: 'tv', label: 'TV Shows' }
                                        ]}
                                    />

                                </div>

                                <div className="relative z-40">
                                    <CustomSelect
                                        label="Genre"
                                        value={selectedGenre}
                                        onChange={setSelectedGenre}
                                        options={[
                                            { value: '', label: 'Any Genre' },
                                            ...discoverGenres.map(g => ({ value: g.id.toString(), label: g.name }))
                                        ]}
                                    />

                                </div>

                                <div className="relative z-30">
                                    <CustomSelect
                                        label="Sort By"
                                        value={discoverSort}
                                        onChange={setDiscoverSort}
                                        options={[
                                            { value: 'popularity.desc', label: 'Most Popular' },
                                            { value: 'vote_average.desc', label: 'Highest Rated' },
                                            { value: 'primary_release_date.desc', label: 'Newest First' },
                                            { value: 'primary_release_date.asc', label: 'Oldest First' }
                                        ]}
                                    />

                                </div>

                                {discoverType === 'tv' ? (
                                    <div className="relative z-20">
                                        <CustomSelect
                                            label="Network"
                                            value={discoverNetwork}
                                            onChange={setDiscoverNetwork}
                                            options={[
                                                { value: '', label: 'Any Network' },
                                                { value: '213', label: 'Netflix' },
                                                { value: '1024', label: 'Amazon' },
                                                { value: '453', label: 'Hulu' },
                                                { value: '2739', label: 'Disney+' },
                                                { value: '2552', label: 'Apple TV+' },
                                                { value: '3353', label: 'Paramount+' },
                                                { value: '318', label: 'Peacock' },
                                                { value: '49', label: 'HBO' },
                                                { value: '67', label: 'Showtime' },
                                                { value: '88', label: 'FX' },
                                                { value: '174', label: 'AMC' },
                                                { value: '3743', label: 'AMC+' },
                                                { value: '71', label: 'The CW' },
                                                { value: '19', label: 'FOX' },
                                                { value: '6', label: 'NBC' },
                                                { value: '2', label: 'ABC' },
                                                { value: '16', label: 'CBS' },
                                                { value: '43', label: 'Nat Geo' },
                                                { value: '64', label: 'Discovery' },
                                                { value: '65', label: 'History' },
                                                { value: '596', label: 'Shudder' },
                                                { value: '351', label: 'Crunchyroll' },
                                                { value: '53', label: 'MTV' },
                                                { value: '56', label: 'Cartoon Network' },
                                                { value: '13', label: 'Nickelodeon' },
                                                { value: '4', label: 'BBC One' },
                                                { value: '21', label: 'BBC Two' },
                                                { value: '270', label: 'ITV' },
                                                { value: '26', label: 'Channel 4' }
                                            ]}
                                        />

                                    </div>
                                ) : (
                                    <div className="relative z-20">
                                        <CustomSelect
                                            label="Studio / Company"
                                            value={discoverCompany}
                                            onChange={setDiscoverCompany}
                                            options={[
                                                { value: '', label: 'Any Studio' },
                                                { value: '420', label: 'Marvel Studios' },
                                                { value: '128066', label: 'DC Studios' },
                                                { value: '3166', label: 'A24' },
                                                { value: '2', label: 'Walt Disney Pictures' },
                                                { value: '174', label: 'Warner Bros. Pictures' },
                                                { value: '33', label: 'Universal Pictures' },
                                                { value: '4', label: 'Paramount' },
                                                { value: '453', label: 'Hulu' },
                                                { value: '24531', label: 'Amazon MGM' },
                                                { value: '2', label: 'Walt Disney' },
                                                { value: '12', label: 'New Line Cinema' },
                                                { value: '5', label: 'Columbia Pictures' },
                                                { value: '1632', label: 'Lionsgate' },
                                                { value: '14', label: 'Miramax' },
                                                { value: '10342', label: 'Studio Ghibli' }
                                            ]}
                                        />

                                    </div>
                                )}

                                <div className="relative z-10">
                                    <CustomSelect
                                        label="Language"
                                        value={discoverLanguage}
                                        onChange={setDiscoverLanguage}
                                        options={[
                                            { value: '', label: 'Any' },
                                            { value: 'en', label: 'English' },
                                            { value: 'ko', label: 'Korean' },
                                            { value: 'ja', label: 'Japanese' },
                                            { value: 'es', label: 'Spanish' },
                                            { value: 'fr', label: 'French' },
                                            { value: 'hi', label: 'Hindi' }
                                        ]}
                                    />

                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-text">Release Year</label>
                                    <div className="flex gap-2">
                                        <div className="w-24">
                                            <CustomSelect
                                                label=""
                                                value={discoverYearMode}
                                                onChange={v => setDiscoverYearMode(v as any)}
                                                options={[
                                                    { value: 'exact', label: 'Exact' },
                                                    { value: 'before', label: 'Before' },
                                                    { value: 'after', label: 'After' }
                                                ]}
                                            />
                                        </div>
                                        <input
                                            type="number" placeholder="1999"
                                            className="flex-1 bg-background/60 border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-plex/50 transition-all placeholder:text-muted"
                                            value={discoverYear} onChange={e => setDiscoverYear(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-text">Keywords / Text</label>
                                    <input
                                        type="text" placeholder="e.g. superhero, mystery"
                                        className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-plex/50 transition-all placeholder:text-muted font-mono"
                                        value={discoverKeywords} onChange={e => setDiscoverKeywords(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-text">Min Rating (0-10)</label>
                                    <input
                                        type="number" step="0.1" min="0" max="10" placeholder="e.g. 7.5"
                                        className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-plex/50 transition-all placeholder:text-muted"
                                        value={discoverRating} onChange={e => setDiscoverRating(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-text">Min Votes</label>
                                    <input
                                        type="number" step="10" min="0" placeholder="e.g. 500"
                                        className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-plex/50 transition-all placeholder:text-muted"
                                        value={discoverVoteCount} onChange={e => setDiscoverVoteCount(e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2 lg:col-span-3 flex items-end">
                                    <button onClick={handleDiscover} disabled={discovering} className="w-full bg-plex hover:bg-plex-hover text-text px-8 py-3 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                                        <Filter className="w-5 h-5" /> Search TMDb
                                    </button>
                                </div>
                            </div>
                        </Card>

                        {discoverResults.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 relative -z-10">
                                {discoverResults.map(item => {
                                    const isSelected = !!selectionPool.find(p => p.id === item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleSelection(item)}
                                            className={`group relative aspect-[2/3] rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-300 ${isSelected
                                                ? 'border-plex shadow-[0_0_20px_rgba(231,155,23,0.2)]'
                                                : 'border-border hover:border-border'
                                                }`}
                                        >
                                            <img
                                                src={item.poster}
                                                alt=""
                                                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isSelected ? 'opacity-60' : ''}`}
                                            />
                                            <div className={`absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                <h4 className="text-sm font-bold text-text truncate">{item.title}</h4>
                                                <p className="text-[10px] text-muted font-medium uppercase">{item.year}</p>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 bg-plex text-background p-1 rounded-lg shadow-lg">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {discoverResults.length > 0 && (
                            <div className="px-1 space-y-4">
                                <div>
                                    <label className="text-sm text-muted mb-2 block font-medium">Collection Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Best Sci-Fi Movies..."
                                        className="w-full md:w-96 bg-background/60 border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-plex/50 transition-colors"
                                        value={collectionTitle}
                                        onChange={e => setCollectionTitle(e.target.value)}
                                    />
                                    <p className="text-xs text-muted mt-2">Set a Title & Target Library, then click to Create & Auto-Sync.</p>
                                </div>
                                <button
                                    onClick={() => handleCreateFromExternal()}
                                    disabled={creating || !targetLibrary || !collectionTitle}
                                    className="bg-plex hover:bg-plex-hover text-text px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 w-full md:w-auto"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    {creating ? 'Creating...' : 'Create Auto-Syncing Collection'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeSubTab === 'search' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <Card title="Global Content Search">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                                    <input className="w-full bg-background/60 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:border-plex/50" placeholder="Search TMDb..." value={externalQuery} onChange={(e) => setExternalQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleExternalSearch()} />
                                </div>
                                <button onClick={handleExternalSearch} disabled={searchingExternal || !externalQuery} className="bg-card hover:bg-white/10 text-text px-6 py-2 rounded-lg border border-border disabled:opacity-50">Search</button>
                            </div>
                        </Card>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {externalResults.map(item => (
                                <div key={item.id} className="bg-card/50 border border-border rounded-2xl overflow-hidden group hover:border-plex/40 transition-all">
                                    <div className="aspect-[2/3] relative">
                                        {item.poster && <img src={item.poster} alt="" className="w-full h-full object-cover" />}
                                        <button onClick={() => setImportedItems(prev => [...prev, item])} className="absolute top-3 right-3 p-2 bg-card/80 backdrop-blur-md rounded-xl text-text opacity-0 group-hover:opacity-100 transition-all hover:bg-plex"><Plus className="w-5 h-5" /></button>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-text truncate">{item.title}</h4>
                                        <p className="text-xs text-muted mt-1 uppercase">{item.year} • {item.type}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeSubTab === 'import' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <Card title="Import from Trakt.tv or MDBList.com">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <ExternalLink className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                                    <input className="w-full bg-background/60 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:border-plex/50" placeholder="Trakt or MDBList URL..." value={importUrl} onChange={(e) => setImportUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleListImport()} />
                                </div>
                                <button onClick={handleListImport} disabled={importing || !importUrl} className="bg-plex hover:bg-plex-hover text-text px-6 py-2 rounded-lg font-bold disabled:opacity-50">Fetch</button>
                            </div>
                        </Card>
                        {importedItems.length > 0 && (
                            <Card
                                title={`Import Preview (${importedItems.length} items)`}
                                actions={
                                    <button
                                        onClick={() => setImportedItems([])}
                                        className="p-1.5 hover:bg-white/5 rounded-lg text-muted hover:text-text transition-all"
                                        title="Clear Import"
                                    >
                                        <Plus className="w-5 h-5 rotate-45" />
                                    </button>
                                }
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                    {importedItems.map((item, idx) => (
                                        <div key={idx} className="p-3 bg-background/30 border border-border rounded-xl flex items-center justify-between group">
                                            <div className="min-w-0"><h4 className="text-sm font-bold text-text truncate">{item.title}</h4><p className="text-xs text-muted">{item.year} • {item.type}</p></div>
                                            <button onClick={() => setImportedItems(prev => prev.filter((_, i) => i !== idx))} className="text-muted hover:text-red-400 opacity-0 group-hover:opacity-100"><Plus className="w-4 h-4 rotate-45" /></button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {activeSubTab === 'manual' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <Card title="1. Search Library Items">
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                                        <input
                                            className="w-full bg-background/60 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:border-plex/50"
                                            placeholder="Search title..."
                                            value={localSearchQuery}
                                            onChange={(e) => setLocalSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleLocalSearch()}
                                        />
                                    </div>
                                    <button
                                        onClick={handleLocalSearch}
                                        disabled={searching || !targetLibrary || (!localSearchQuery && !localSearchYear && !localSearchGenre)}
                                        className="bg-card hover:bg-white/10 text-text px-6 py-2 rounded-lg font-bold disabled:opacity-50 transition-all border border-border"
                                    >
                                        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-muted font-medium ml-1">Year</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 2024"
                                            className="w-full bg-background/60 border border-border rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-plex/50"
                                            value={localSearchYear}
                                            onChange={(e) => setLocalSearchYear(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-muted font-medium ml-1">Genre</label>
                                        <input
                                            placeholder="e.g. Action"
                                            className="w-full bg-background/60 border border-border rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-plex/50"
                                            value={localSearchGenre}
                                            onChange={(e) => setLocalSearchGenre(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {localResults.length > 0 && (
                            <Card
                                title="2. Pick Items to Add"
                                actions={
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const toAdd = localResults.filter(r => !selectionPool.find(p => p.ratingKey === r.ratingKey));
                                                setSelectionPool(prev => [...prev, ...toAdd]);
                                            }}
                                            className="text-xs bg-card hover:bg-white/10 text-text px-3 py-1.5 rounded-lg border border-border transition-all font-medium"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            onClick={() => {
                                                const resultKeys = localResults.map(r => r.ratingKey);
                                                setSelectionPool(prev => prev.filter(p => !resultKeys.includes(p.ratingKey)));
                                            }}
                                            className="text-xs bg-card hover:bg-white/10 text-text px-3 py-1.5 rounded-lg border border-border transition-all font-medium"
                                        >
                                            Clear Results
                                        </button>
                                    </div>

                                }
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {localResults.map(item => {
                                        const isSelected = !!selectionPool.find(p => p.ratingKey === item.ratingKey);
                                        return (
                                            <div
                                                key={item.ratingKey}
                                                onClick={() => toggleSelection(item)}
                                                className={`group relative aspect-[2/3] rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-300 ${isSelected
                                                    ? 'border-plex shadow-[0_0_20px_rgba(231,155,23,0.2)]'
                                                    : 'border-border hover:border-border'
                                                    }`}
                                            >
                                                {item.thumb ? (
                                                    <img
                                                        src={collexionsImageUrl(item.thumb)}
                                                        alt=""
                                                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isSelected ? 'opacity-60' : ''}`}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-card flex items-center justify-center">
                                                        <Search className="w-8 h-8 text-muted" />
                                                    </div>
                                                )}

                                                <div className={`absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                    <h4 className="text-sm font-bold text-text truncate">{item.title}</h4>
                                                    <p className="text-[10px] text-muted font-medium uppercase">{item.year} • {item.type}</p>
                                                </div>

                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 bg-plex text-background p-1 rounded-lg shadow-lg">
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>

            {showPoolDetails && selectionPool.length > 0 && (
                <div className="fixed inset-x-0 bottom-[120px] max-w-2xl mx-auto px-4 z-[45] animate-in slide-in-from-bottom-4">
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-white/5">
                            <h4 className="font-bold text-text flex items-center gap-2 text-sm">
                                <List className="w-4 h-4 text-plex" />
                                Current Selection ({selectionPool.length})
                            </h4>
                            <button onClick={() => setSelectionPool([])} className="text-[10px] text-muted hover:text-red-400 transition-colors uppercase font-bold tracking-wider">
                                Clear All
                            </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar grid grid-cols-1 gap-1">
                            {selectionPool.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5/80 transition-colors group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-12 rounded bg-card flex-shrink-0 overflow-hidden">
                                            {item.poster || item.thumb ? (
                                                <img
                                                    src={item.poster || collexionsImageUrl(item.thumb)}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : <ListMusic className="w-4 h-4 m-2 text-muted" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-text truncate">{item.title}</p>
                                            <p className="text-[10px] text-muted uppercase">{item.year} • {item.type || (item.id ? 'External' : 'Library')}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleSelection(item)}
                                        className="p-1.5 text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {selectionPool.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50 animate-in slide-in-from-bottom-8">
                    <div className="bg-card/90 backdrop-blur-xl border border-plex/30 p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-1 flex gap-4 items-center">
                            <div className="bg-plex/20 p-2 rounded-lg text-plex cursor-pointer hover:bg-plex/30 transition-colors" onClick={() => setShowPoolDetails(!showPoolDetails)}>
                                <ListMusic className={`w-6 h-6 transition-transform ${showPoolDetails ? 'rotate-180' : ''}`} />
                            </div>
                            <div>
                                <p className="text-text font-bold">{selectionPool.length} items selected</p>
                                <p className="text-xs text-muted">{targetLibrary ? `Library: ${targetLibrary}` : 'Select a library above'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <input className="flex-1 sm:w-48 bg-background/60 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-plex/50" placeholder="Collection Title..." value={collectionTitle} onChange={(e) => setCollectionTitle(e.target.value)} />
                            <div className="flex gap-2">
                                <button onClick={handleCreate} disabled={creating || !collectionTitle || !targetLibrary} className="bg-plex hover:bg-plex-hover text-text px-6 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2">
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Create
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectionPool([]);
                                        setCollectionTitle('');
                                        setShowPoolDetails(false);
                                    }}
                                    className="p-2 hover:bg-white/5 rounded-lg text-muted hover:text-text transition-all"
                                    title="Clear All"
                                >
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default Creator;
