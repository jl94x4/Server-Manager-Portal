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

    return (
        <div className={`relative overflow-hidden rounded-xl border border-white/10 hover:border-white/20 transition-colors ${className}`}>
            {artUrl ? (
                <>
                    <div
                        className={`absolute inset-y-0 right-0 w-[72%] bg-cover bg-center ${
                            backdropUrl ? 'opacity-[0.55]' : 'opacity-[0.35] blur-[2px] scale-110'
                        }`}
                        style={{ backgroundImage: `url(${artUrl})` }}
                        aria-hidden
                    />
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-background from-[22%] via-background/75 via-[48%] to-background/10"
                        aria-hidden
                    />
                    <div
                        className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent"
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
