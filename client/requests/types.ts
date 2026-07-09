export type PortalRequestItem = {
    id: number;
    status: number | null;
    statusLabel: string;
    type: 'movie' | 'tv';
    is4k: boolean;
    title: string;
    year: string | null;
    overview: string;
    posterUrl: string;
    requestedBy: {
        id: number | null;
        displayName: string;
        avatar: string;
    };
    createdAt: string | null;
    updatedAt: string | null;
    mediaStatus: number | null;
    seerrUrl: string;
};

export type PortalRequestCounts = {
    configured: boolean;
    connected?: boolean;
    supported?: boolean;
    pending: number;
    approved: number;
    declined: number;
    total: number;
    error?: string | null;
};
