import React from 'react';

type Props = {
    backdropUrl?: string;
    posterUrl?: string;
    className?: string;
    children: React.ReactNode;
};

/** Seerr-style request row with faded fanart/backdrop behind content. */
export const RequestCardShell: React.FC<Props> = ({ backdropUrl, posterUrl, className = '', children }) => {
    const artUrl = backdropUrl || posterUrl;
    const cardGradient =
        'linear-gradient(to right, rgb(var(--color-bg) / 1) 0%, rgb(var(--color-bg) / 0.94) 24%, rgb(var(--color-bg) / 0.55) 50%, rgb(var(--color-bg) / 0.12) 76%, rgb(var(--color-bg) / 0) 88%)';

    return (
        <div className={`relative overflow-hidden rounded-xl border border-white/10 hover:border-white/20 transition-colors ${className}`}>
            {artUrl ? (
                <>
                    <div
                        className={`absolute inset-0 bg-cover bg-center ${
                            backdropUrl ? 'opacity-30' : 'opacity-20 blur-[2px] scale-105'
                        }`}
                        style={{ backgroundImage: `url(${artUrl})` }}
                        aria-hidden
                    />
                    <div
                        className="absolute inset-0"
                        style={{ backgroundImage: cardGradient }}
                        aria-hidden
                    />
                </>
            ) : (
                <div className="absolute inset-0 bg-background/50" aria-hidden />
            )}
            <div className="relative z-[1]">{children}</div>
        </div>
    );
};
