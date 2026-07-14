import React, { useState } from 'react';
import { AlertTriangle, ClipboardList } from 'lucide-react';
import { RequestsAdminPanel } from './RequestsAdminPanel';
import { IssuesAdminPanel } from './IssuesAdminPanel';

type QueueTab = 'requests' | 'issues';

type Props = {
    onCountsChange?: () => void;
    openIssueCount?: number;
};

export const RequestQueueDashboard: React.FC<Props> = ({ onCountsChange, openIssueCount = 0 }) => {
    const [tab, setTab] = useState<QueueTab>('requests');

    return (
        <div className="w-full max-w-[100%] animate-fade-in">
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    type="button"
                    onClick={() => setTab('requests')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                        tab === 'requests'
                            ? 'bg-plex/15 border-plex/40 text-text'
                            : 'bg-white/[0.03] border-border text-muted hover:text-text hover:border-white/20'
                    }`}
                >
                    <ClipboardList className="w-4 h-4" />
                    Requests
                </button>
                <button
                    type="button"
                    onClick={() => setTab('issues')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                        tab === 'issues'
                            ? 'bg-plex/15 border-plex/40 text-text'
                            : 'bg-white/[0.03] border-border text-muted hover:text-text hover:border-white/20'
                    }`}
                >
                    <AlertTriangle className="w-4 h-4" />
                    Issues
                    {openIssueCount > 0 && (
                        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-black text-[10px] font-black inline-flex items-center justify-center">
                            {openIssueCount > 99 ? '99+' : openIssueCount}
                        </span>
                    )}
                </button>
            </div>

            {tab === 'requests' ? (
                <RequestsAdminPanel onCountsChange={onCountsChange} embedded />
            ) : (
                <IssuesAdminPanel onCountsChange={onCountsChange} />
            )}
        </div>
    );
};
