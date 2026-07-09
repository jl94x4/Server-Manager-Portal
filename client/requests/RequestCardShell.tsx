import React from 'react';

type Props = {
    backdropUrl?: string;
    className?: string;
    children: React.ReactNode;
};

/** Seerr-style request row with faded fanart/backdrop behind content. */
export const RequestCardShell: React.FC<Props> = ({ backdropUrl, className = '', children }) => (
    <div className={`relative overflow-hidden rounded-xl border border-white/10 hover:border-white/20 transition-colors ${className}`}>
        {backdropUrl ? (
            <>
                <div
                    className="absolute inset-0 bg-cover bg-center scale-[1.03] opacity-[0.22]"
                    style={{ backgroundImage: `url(${backdropUrl})` }}
                    aria-hidden
                />
                <div
                    className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70"
                    aria-hidden
                />
            </>
        ) : (
            <div className="absolute inset-0 bg-background/50" aria-hidden />
        )}
        <div className="relative z-[1]">{children}</div>
    </div>
);
