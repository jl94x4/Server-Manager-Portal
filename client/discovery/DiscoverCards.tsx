import React, { useState } from 'react';
import { tmdbDuotoneLogo } from './discoverConstants';

type CompanyCardProps = {
    name: string;
    logoPath: string;
    onClick: () => void;
};

/** Overseerr-style duotone logo card for networks and studios. */
export const CompanyCard: React.FC<CompanyCardProps> = ({ name, logoPath, onClick }) => {
    const [failed, setFailed] = useState(false);

    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative w-[170px] sm:w-[200px] h-[100px] sm:h-[112px] flex-shrink-0 snap-start rounded-xl border border-white/10 bg-zinc-900/80 overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-plex"
            aria-label={name}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
            {!failed ? (
                <img
                    src={tmdbDuotoneLogo(logoPath)}
                    alt={name}
                    loading="lazy"
                    className="absolute inset-0 m-auto max-w-[78%] max-h-[58%] object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                    onError={() => setFailed(true)}
                />
            ) : (
                <span className="absolute inset-0 flex items-center justify-center px-3 text-center text-sm font-bold text-white/90">
                    {name}
                </span>
            )}
        </button>
    );
};

type GenreCardProps = {
    name: string;
    gradient?: string;
    /** Seerr/Overseerr genre slider duotone backdrop URL */
    image?: string;
    onClick: () => void;
};

export const GenreCard: React.FC<GenreCardProps> = ({ name, gradient, image, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`relative w-[150px] sm:w-[180px] h-[88px] sm:h-[100px] flex-shrink-0 snap-start rounded-xl overflow-hidden p-4 flex items-end justify-start cursor-pointer hover:scale-[1.03] transition-transform shadow-lg border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-plex ${
            image ? 'bg-zinc-900' : `bg-gradient-to-br ${gradient || 'from-zinc-800 to-black'}`
        }`}
        style={image ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
        {image && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />}
        <span className="relative z-10 text-white font-black drop-shadow-md text-left leading-tight">{name}</span>
    </button>
);
