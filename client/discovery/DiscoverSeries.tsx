import React, { useState, useEffect } from 'react';
import { Filter, Tv } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens';
import { FilterDrawer, FilterState } from './FilterDrawer';

export const DiscoverSeries: React.FC<{
    onSelect: (item: any) => void;
    formatItem: (item: any) => any;
}> = ({ onSelect, formatItem }) => {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    
    // Filter State
    const defaultFilters: FilterState = {
        sort: 'popularity.desc',
        genre: '',
        year: '',
        network: '',
        studio: '',
        minRating: ''
    };
    
    const [filters, setFilters] = useState<FilterState>(defaultFilters);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const newFilters = { ...defaultFilters };
            if (params.get('genre')) newFilters.genre = params.get('genre') || '';
            if (params.get('network')) newFilters.network = params.get('network') || '';
            setFilters(newFilters);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let url = `/api/discovery/proxy/discover/tv?sortBy=${filters.sort}&language=en`;
                if (filters.genre) url += `&withGenres=${filters.genre}`;
                if (filters.year) url += `&firstAirDateYear=${filters.year}`;
                if (filters.network) url += `&withNetworks=${filters.network}`;
                if (filters.minRating) url += `&voteAverage.gte=${filters.minRating}&voteCount.gte=100`;
                
                const res = await apiFetch(url);
                if (res && res.results) {
                    setResults(res.results);
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchData();
    }, [filters]);

    return (
        <div className="w-full flex flex-col md:flex-row gap-8 px-4 sm:px-8 mt-4 relative">
            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Tv className="w-6 h-6 text-plex" /> Series
                    </h2>
                    <button 
                        onClick={() => setShowFilters(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white/80 hover:text-white font-bold transition-colors"
                    >
                        <Filter className="w-4 h-4" /> Filters
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 animate-pulse">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="w-full aspect-[2/3] rounded-xl bg-white/5 border border-white/10"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {results.map((rawItem, idx) => {
                            const formatted = formatItem(rawItem);
                            return (
                                <DiscoverPosterCard
                                    key={idx}
                                    item={formatted}
                                    overlay={formatted.overlay}
                                    showQualityBadges={false}
                                    onPosterClick={() => onSelect(formatted)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <FilterDrawer 
                isOpen={showFilters} 
                onClose={() => setShowFilters(false)} 
                type="tv"
                filters={filters}
                onApply={(newFilters) => setFilters(newFilters)}
                onClear={() => setFilters(defaultFilters)}
            />
        </div>
    );
};
