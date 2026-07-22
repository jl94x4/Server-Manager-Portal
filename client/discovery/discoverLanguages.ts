/** Common TMDB original-language options for discover filters. */
export const DISCOVER_LANGUAGE_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'Any Language' },
    { value: 'en', label: 'English' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'hi', label: 'Hindi' },
    { value: 'ar', label: 'Arabic' },
    { value: 'ru', label: 'Russian' },
    { value: 'th', label: 'Thai' },
    { value: 'sv', label: 'Swedish' },
    { value: 'no', label: 'Norwegian' },
    { value: 'da', label: 'Danish' },
    { value: 'nl', label: 'Dutch' },
    { value: 'pl', label: 'Polish' },
    { value: 'tr', label: 'Turkish' },
    { value: 'id', label: 'Indonesian' },
    { value: 'vi', label: 'Vietnamese' },
];

export const US_CONTENT_RATINGS = ['NR', 'G', 'PG', 'PG-13', 'R', 'NC-17'] as const;

export const TV_STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: '0', label: 'Returning Series' },
    { value: '1', label: 'Planned' },
    { value: '2', label: 'In Production' },
    { value: '3', label: 'Ended' },
    { value: '4', label: 'Cancelled' },
    { value: '5', label: 'Pilot' },
];
