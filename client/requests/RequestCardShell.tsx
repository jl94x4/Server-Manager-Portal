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
                            backdropUrl ? 'opacity-40' : 'opacity-30 blur-[2px] scale-110'
                        }`}
                        style={{ backgroundImage: `url(${artUrl})` }}
                        aria-hidden
                    />
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-background via-background/40 via-[38%] to-transparent to-[72%]"
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
