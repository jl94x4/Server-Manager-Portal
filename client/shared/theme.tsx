import React from 'react';

const GRID_TEXTURE = 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")';

/** Full-intensity ambient background for login / setup wizard */
export const AuthPageBackground: React.FC = () => (
    <div className="pointer-events-none absolute inset-0 bg-background">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-plex/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 w-[480px] h-[480px] rounded-full bg-amber-500/8 blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-plex/5 blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(229,160,13,0.12),transparent)]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: GRID_TEXTURE }} />
    </div>
);

/** Subtle ambient background for authenticated app shell */
export const AppAmbientBackground: React.FC = () => (
    <div className="pointer-events-none fixed inset-0 bg-background -z-10">
        <div className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full bg-plex/[0.06] blur-[100px]" />
        <div className="absolute top-1/2 -right-32 w-[360px] h-[360px] rounded-full bg-amber-500/[0.04] blur-[90px]" />
        <div className="absolute bottom-0 left-1/3 w-[320px] h-[320px] rounded-full bg-plex/[0.03] blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(229,160,13,0.06),transparent)]" />
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: GRID_TEXTURE }} />
    </div>
);

export const themeClasses = {
    glassCard: 'glass-card',
    glassCardSm: 'glass-card-sm',
    glassCardLg: 'glass-card-lg',
    sectionCard: 'section-card',
    btnPrimary: 'btn-primary',
    btnSecondary: 'btn-secondary',
    btnPrimaryLg: 'btn-primary-lg',
    pageHeader: 'page-header',
    pageTitle: 'page-title',
    navActive: 'nav-item-active',
    inputPremium: 'input-premium',
    labelPremium: 'label-premium',
    badgePlex: 'badge-plex',
} as const;
