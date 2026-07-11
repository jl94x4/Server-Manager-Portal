/** Sonarr / Radarr custom format spec helpers — Trash Guides compatible round-trip. */

export const CF_INFO_LINK = 'https://wiki.servarr.com/sonarr/settings#custom-formats-2';

export const SONARR_RESOLUTION_OPTIONS = [
    { value: 0, name: 'Unknown' },
    { value: 360, name: 'R360p' },
    { value: 480, name: 'R480p' },
    { value: 540, name: 'R540p' },
    { value: 576, name: 'R576p' },
    { value: 720, name: 'R720p' },
    { value: 1080, name: 'R1080p' },
    { value: 2160, name: 'R2160p' },
] as const;

export const SONARR_SOURCE_OPTIONS = [
    { value: 0, name: 'Unknown' },
    { value: 1, name: 'Television' },
    { value: 2, name: 'TelevisionRaw' },
    { value: 3, name: 'Web' },
    { value: 4, name: 'WebRip' },
    { value: 5, name: 'DVD' },
    { value: 6, name: 'Bluray' },
    { value: 7, name: 'BlurayRaw' },
] as const;

export type SourceRule = {
    value: number;
    label: string;
    negate: boolean;
    required: boolean;
};

export type ReleaseGroupRule = {
    name: string;
    required: boolean;
};

export type SimpleFormatState = {
    resolution: { value: number; required: boolean; negate: boolean } | null;
    sourceRules: SourceRule[];
    releaseGroups: ReleaseGroupRule[];
    keywords: string[];
    negateKeywords: string[];
    matchAll: boolean;
    otherSpecifications: any[];
};

export const emptySimpleFormatState = (): SimpleFormatState => ({
    resolution: null,
    sourceRules: [],
    releaseGroups: [],
    keywords: [],
    negateKeywords: [],
    matchAll: true,
    otherSpecifications: [],
});

export const getSpecFieldValue = (spec: any, fieldName = 'value') => {
    if (!spec?.fields) return undefined;
    if (Array.isArray(spec.fields)) {
        return spec.fields.find((f: any) => f?.name === fieldName)?.value;
    }
    if (typeof spec.fields === 'object') {
        return spec.fields[fieldName];
    }
    return undefined;
};

const sourceLabel = (value: number) =>
    SONARR_SOURCE_OPTIONS.find((o) => o.value === Number(value))?.name || `Source ${value}`;

const resolutionLabel = (value: number) =>
    SONARR_RESOLUTION_OPTIONS.find((o) => o.value === Number(value))?.name || `${value}p`;

const escapeRegexLiteral = (text: string) => String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Extract release group name from Trash / Sonarr regex patterns. */
export const parseReleaseGroupName = (spec: any): string => {
    const raw = String(getSpecFieldValue(spec) ?? '');
    const lookbehind = raw.match(/\(\?<=[^)]+\)(.+?)\\b/i);
    if (lookbehind?.[1]) return lookbehind[1];
    const anchored = raw.match(/\^\(?([^$\\)]+)\)?\$/);
    if (anchored?.[1]) return anchored[1].replace(/\\\./g, '.');
    if (spec?.name && spec.name !== 'Release Group') return String(spec.name);
    return raw || 'Group';
};

export const buildReleaseGroupRegex = (groupName: string) =>
    `(?<=^|[\\s.-])${escapeRegexLiteral(groupName)}\\b`;

const buildSelectField = (
    value: number,
    label: string,
    selectOptions: ReadonlyArray<{ value: number; name: string }>,
) => [{
    order: 0,
    name: 'value',
    label,
    value: Number(value),
    type: 'select',
    advanced: false,
    selectOptions: selectOptions.map((o, i) => ({ ...o, order: o.value || i })),
    privacy: 'normal',
    isFloat: false,
}];

const buildTextField = (value: string, label = 'Regular Expression', helpText = 'Custom Format RegEx is Case Insensitive') => [{
    order: 0,
    name: 'value',
    label,
    helpText,
    value,
    type: 'textbox',
    advanced: false,
    privacy: 'normal',
    isFloat: false,
}];

export const buildResolutionSpecification = (
    value: number,
    { required = true, negate = false } = {},
) => ({
    name: resolutionLabel(value),
    implementation: 'ResolutionSpecification',
    implementationName: 'Resolution',
    infoLink: CF_INFO_LINK,
    negate,
    required,
    fields: buildSelectField(value, 'Resolution', SONARR_RESOLUTION_OPTIONS),
});

export const buildSourceSpecification = (
    value: number,
    { required = true, negate = false, name }: { required?: boolean; negate?: boolean; name?: string } = {},
) => {
    const label = sourceLabel(value);
    return {
        name: name || (negate ? `Not ${label}` : label),
        implementation: 'SourceSpecification',
        implementationName: 'Source',
        infoLink: CF_INFO_LINK,
        negate,
        required,
        fields: buildSelectField(value, 'Source', SONARR_SOURCE_OPTIONS),
    };
};

export const buildReleaseGroupSpecification = (
    groupName: string,
    { required = false } = {},
) => ({
    name: groupName,
    implementation: 'ReleaseGroupSpecification',
    implementationName: 'Release Group',
    infoLink: CF_INFO_LINK,
    negate: false,
    required,
    fields: buildTextField(buildReleaseGroupRegex(groupName)),
});

export const buildReleaseTitleSpecification = (
    pattern: string,
    { name, negate = false, required = true }: { name?: string; negate?: boolean; required?: boolean } = {},
) => ({
    name: name || (negate ? `Exclude ${pattern}` : `Match ${pattern}`),
    implementation: 'ReleaseTitleSpecification',
    implementationName: 'Release Title',
    infoLink: CF_INFO_LINK,
    negate,
    required,
    fields: buildTextField(pattern, 'Regular Expression'),
});

/** Parse Sonarr / Trash Guides specifications into the simple editor state. */
export const parseSpecificationsToSimple = (specs: any[] = []): SimpleFormatState => {
    const state = emptySimpleFormatState();
    let isMatchAll = true;

    (Array.isArray(specs) ? specs : []).forEach((spec) => {
        const impl = String(spec?.implementation || '');

        if (impl === 'ResolutionSpecification') {
            const value = Number(getSpecFieldValue(spec) ?? 0);
            if (value > 0) {
                state.resolution = {
                    value,
                    required: !!spec.required,
                    negate: !!spec.negate,
                };
            }
            return;
        }

        if (impl === 'SourceSpecification') {
            const value = Number(getSpecFieldValue(spec) ?? 0);
            state.sourceRules.push({
                value,
                label: sourceLabel(value),
                negate: !!spec.negate,
                required: spec.required !== false,
            });
            return;
        }

        if (impl === 'ReleaseGroupSpecification') {
            state.releaseGroups.push({
                name: parseReleaseGroupName(spec),
                required: !!spec.required,
            });
            return;
        }

        if (impl === 'ReleaseTitleSpecification') {
            const val = String(getSpecFieldValue(spec) ?? '');
            const clean = val
                .replace(/^\\b/, '')
                .replace(/\\b$/, '')
                .replace(/^\(/, '')
                .replace(/\)$/, '')
                .replace(/^\(\?i:/, '')
                .replace(/\)$/, '');

            if (spec.negate) {
                clean.split('|').filter(Boolean).forEach((part) => {
                    state.negateKeywords.push(part.replace(/\\b/g, '').trim());
                });
            } else if (val.includes('|') && !val.includes('(?<=')) {
                isMatchAll = false;
                clean.split('|').filter(Boolean).forEach((part) => {
                    state.keywords.push(part.replace(/\\b/g, '').trim());
                });
            } else if (val.includes('|')) {
                clean.split('|').filter(Boolean).forEach((part) => state.keywords.push(part.trim()));
            } else {
                const kw = clean.replace(/\\b/g, '').trim();
                if (kw) state.keywords.push(kw);
            }
            return;
        }

        state.otherSpecifications.push(spec);
    });

    state.matchAll = isMatchAll;
    return state;
};

/** Build Sonarr-compatible specifications from simple editor state. */
export const buildSpecificationsFromSimple = (state: SimpleFormatState): any[] => {
    const specs: any[] = [...state.otherSpecifications];

    if (state.resolution && state.resolution.value > 0) {
        specs.push(buildResolutionSpecification(state.resolution.value, {
            required: state.resolution.required,
            negate: state.resolution.negate,
        }));
    }

    state.sourceRules.forEach((rule) => {
        specs.push(buildSourceSpecification(rule.value, {
            negate: rule.negate,
            required: rule.required,
            name: rule.negate ? `Not ${rule.label}` : rule.label,
        }));
    });

    state.releaseGroups.forEach((group) => {
        if (!group.name.trim()) return;
        specs.push(buildReleaseGroupSpecification(group.name.trim(), { required: group.required }));
    });

    if (state.matchAll) {
        state.keywords.filter(Boolean).forEach((kw) => {
            specs.push(buildReleaseTitleSpecification(`\\b${escapeRegexLiteral(kw)}\\b`, {
                name: kw,
                required: true,
            }));
        });
    } else if (state.keywords.length > 0) {
        const pattern = `\\b(${state.keywords.map(escapeRegexLiteral).join('|')})\\b`;
        specs.push(buildReleaseTitleSpecification(pattern, { name: 'Match Any', required: true }));
    }

    state.negateKeywords.filter(Boolean).forEach((kw) => {
        specs.push(buildReleaseTitleSpecification(`\\b${escapeRegexLiteral(kw)}\\b`, {
            name: `Not ${kw}`,
            negate: true,
            required: true,
        }));
    });

    return specs;
};

/** Normalize Trash Guides JSON import (strip sync metadata, keep specifications). */
export const normalizeTrashGuidesCustomFormat = (raw: any) => {
    const payload = raw && typeof raw === 'object' ? raw : {};
    const specifications = Array.isArray(payload.specifications) ? payload.specifications : [];
    return {
        name: String(payload.name || '').trim(),
        includeCustomFormatWhenRenaming: !!payload.includeCustomFormatWhenRenaming,
        specifications: specifications.map((spec: any) => {
            const fields = spec?.fields;
            if (fields && !Array.isArray(fields) && typeof fields === 'object') {
                const value = fields.value;
                const isSelect = spec.implementation === 'ResolutionSpecification'
                    || spec.implementation === 'SourceSpecification';
                return {
                    ...spec,
                    infoLink: spec.infoLink || CF_INFO_LINK,
                    fields: isSelect
                        ? buildSelectField(
                            Number(value),
                            spec.implementation === 'ResolutionSpecification' ? 'Resolution' : 'Source',
                            spec.implementation === 'ResolutionSpecification'
                                ? SONARR_RESOLUTION_OPTIONS
                                : SONARR_SOURCE_OPTIONS,
                        )
                        : buildTextField(String(value ?? '')),
                };
            }
            return spec;
        }),
    };
};
