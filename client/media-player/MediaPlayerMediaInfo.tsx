import React from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useDiscoverI18n } from '../discovery/i18n';
import { formatBitrateMbps, formatBytes, formatClock, formatPlayerDuration } from './playerUtils';
import type { PlayerItem, PlayerMediaInfo, PlayerMediaPartInfo } from './types';

type Props = {
    item: PlayerItem;
    onClose: () => void;
};

const Cell: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    if (value == null || value === '') return null;
    return (
        <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</div>
            <div className="break-words text-sm font-semibold text-text">{value}</div>
        </div>
    );
};

const partRows = (part: PlayerMediaPartInfo, media: PlayerMediaInfo, t: (key: string) => string) => {
    const video = part.video || {};
    const audio = part.audio?.[0] || {};
    return [
        { label: t('mediaPlayerPage.duration'), value: part.durationMs ? formatClock(part.durationMs) : (media.durationMs ? formatPlayerDuration(media.durationMs) : '') },
        { label: t('mediaPlayerPage.bitrate'), value: formatBitrateMbps(video.bitrate || media.bitrate) },
        { label: t('mediaPlayerPage.width'), value: video.width || media.width },
        { label: t('mediaPlayerPage.height'), value: video.height || media.height },
        { label: t('mediaPlayerPage.aspectRatio'), value: video.aspectRatio },
        { label: t('mediaPlayerPage.videoResolution'), value: video.resolution || media.videoResolution },
        { label: t('mediaPlayerPage.codec'), value: (video.codec || media.videoCodec || '').toUpperCase() },
        { label: t('mediaPlayerPage.language'), value: audio.language || audio.displayTitle },
        { label: t('mediaPlayerPage.languageTag'), value: audio.language },
        { label: t('mediaPlayerPage.bitDepth'), value: video.bitDepth },
        { label: t('mediaPlayerPage.chromaLocation'), value: video.chromaLocation },
        { label: t('mediaPlayerPage.codedHeight'), value: video.codedHeight },
        { label: t('mediaPlayerPage.container'), value: (part.container || media.container || '').toUpperCase() },
        { label: t('mediaPlayerPage.size'), value: formatBytes(part.size) },
        { label: t('mediaPlayerPage.part'), value: itemTitle(part, media) },
        { label: t('mediaPlayerPage.file'), value: part.fileName },
        { label: t('mediaPlayerPage.frameRate'), value: video.frameRate },
    ].filter((row) => row.value != null && row.value !== '');
};

const itemTitle = (part: PlayerMediaPartInfo, media: PlayerMediaInfo) => {
    const res = part.video?.resolution || media.videoResolution || '';
    const codec = part.video?.codec || media.videoCodec || '';
    const audio = part.audio?.[0];
    return [res, codec, audio?.codec, audio?.language].filter(Boolean).join(' · ');
};

export const MediaPlayerMediaInfo: React.FC<Props> = ({ item, onClose }) => {
    const { t } = useDiscoverI18n();
    const files = (item.mediaInfo || []).flatMap((media) => media.parts.map((part) => ({ media, part })));
    const overlay = (
        <div className="fixed inset-0 z-[3500] flex items-start justify-center bg-black/70 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={t('mediaPlayerPage.mediaInfo')}>
            <button type="button" className="absolute inset-0" aria-label={t('common.close')} onClick={onClose} />
            <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-plex">{item.title}</p>
                        <h2 className="text-lg font-black text-text">{t('mediaPlayerPage.mediaInfo')}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-white/5 p-2 text-muted hover:bg-white/10 hover:text-text"
                        aria-label={t('common.close')}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="max-h-[calc(90vh-4.5rem)] overflow-y-auto px-5 py-4">
                    {files.length ? (
                        <div className="mb-5">
                            <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">{t('mediaPlayerPage.files')}</h3>
                            <ul className="flex flex-col gap-2">
                                {files.map(({ part }) => (
                                    <li key={part.id} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-text">
                                        {part.fileName || t('mediaPlayerPage.file')}
                                        {part.size ? <span className="ml-2 text-xs font-bold text-muted">{formatBytes(part.size)}</span> : null}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    {files.map(({ media, part }) => (
                        <div key={`${media.id}-${part.id}`} className="mb-5 grid grid-cols-1 gap-3 last:mb-0 sm:grid-cols-3">
                            {partRows(part, media, t).map((row) => (
                                <Cell key={row.label} label={row.label} value={row.value} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
    if (typeof document === 'undefined') return null;
    return createPortal(overlay, document.body);
};
