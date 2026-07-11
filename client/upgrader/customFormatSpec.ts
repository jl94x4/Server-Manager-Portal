/** Sonarr / Radarr custom format spec helpers — TRaSH Guides compatible round-trip. */

export const CF_INFO_LINK = 'https://wiki.servarr.com/sonarr/settings#custom-formats-2';

export type SchemaTemplate = {
    implementation: string;
    implementationName?: string;
    name?: string;
    infoLink?: string;
    negate?: boolean;
    required?: boolean;
    fields?: any[];
};

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

export const SONARR_QUALITY_MODIFIER_OPTIONS = [
    { value: 0, name: 'None' },
    { value: 1, name: 'Regional' },
    { value: 2, name: 'SCENE' },
    { value: 3, name: 'WEBDL' },
    { value: 4, name: 'WEBRIP' },
    { value: 5, name: 'REMUX' },
] as const;

export const SONARR_RELEASE_TYPE_OPTIONS = [
    { value: 0, name: 'Unknown' },
    { value: 1, name: 'SingleEpisode' },
    { value: 2, name: 'MultiEpisode' },
    { value: 3, name: 'SeasonPack' },
    { value: 4, name: 'SingleEpisodeSeasonPack' },
    { value: 5, name: 'MultiEpisodeSeasonPack' },
] as const;

export type SimpleFormatState = {
    specifications: any[];
};

export const emptySimpleFormatState = (): SimpleFormatState => ({
    specifications: [],
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

export const setSpecFieldValue = (spec: any, fieldName: string, value: unknown) => {
    if (Array.isArray(spec?.fields)) {
        const hasField = spec.fields.some((f: any) => f?.name === fieldName);
        return {
            ...spec,
            fields: hasField
                ? spec.fields.map((f: any) => (f?.name === fieldName ? { ...f, value } : f))
                : [...spec.fields, { name: fieldName, label: fieldName, type: 'textbox', value, order: spec.fields.length }],
        };
    }
    if (spec?.fields && typeof spec.fields === 'object') {
        return { ...spec, fields: { ...spec.fields, [fieldName]: value } };
    }
    return {
        ...spec,
        fields: [{ name: fieldName, label: fieldName, type: 'textbox', value, order: 0 }],
    };
};

const sourceLabel = (value: number) =>
    SONARR_SOURCE_OPTIONS.find((o) => o.value === Number(value))?.name || `Source ${value}`;

const resolutionLabel = (value: number) =>
    SONARR_RESOLUTION_OPTIONS.find((o) => o.value === Number(value))?.name || `${value}p`;

const escapeRegexLiteral = (text: string) => String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Extract release group name from TRaSH / Sonarr regex patterns. */
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

const buildNumberField = (value: number, label: string, helpText?: string) => [{
    order: 0,
    name: 'value',
    label,
    helpText,
    value: Number(value),
    type: 'number',
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

/** Static fallback when Sonarr/Radarr schema API is unreachable. */
export const FALLBACK_SPEC_SCHEMA: SchemaTemplate[] = [
    {
        implementation: 'ReleaseTitleSpecification',
        implementationName: 'Release Title',
        name: 'Release Title',
        fields: buildTextField(''),
    },
    {
        implementation: 'ReleaseGroupSpecification',
        implementationName: 'Release Group',
        name: 'Release Group',
        fields: buildTextField(''),
    },
    {
        implementation: 'SourceSpecification',
        implementationName: 'Source',
        name: 'Source',
        fields: buildSelectField(3, 'Source', SONARR_SOURCE_OPTIONS),
    },
    {
        implementation: 'ResolutionSpecification',
        implementationName: 'Resolution',
        name: 'Resolution',
        fields: buildSelectField(1080, 'Resolution', SONARR_RESOLUTION_OPTIONS),
    },
    {
        implementation: 'QualityModifierSpecification',
        implementationName: 'Quality Modifier',
        name: 'Quality Modifier',
        fields: buildSelectField(0, 'Quality Modifier', SONARR_QUALITY_MODIFIER_OPTIONS),
    },
    {
        implementation: 'LanguageSpecification',
        implementationName: 'Language',
        name: 'Language',
        fields: buildNumberField(1, 'Language', 'Language ID (e.g. 1 = English)'),
    },
    {
        implementation: 'SizeSpecification',
        implementationName: 'Size',
        name: 'Size',
        fields: [
            { order: 0, name: 'min', label: 'Min Size (MB)', value: 0, type: 'number', advanced: false, privacy: 'normal', isFloat: false },
            { order: 1, name: 'max', label: 'Max Size (MB)', value: 0, type: 'number', advanced: false, privacy: 'normal', isFloat: false },
        ],
    },
    {
        implementation: 'IndexerSpecification',
        implementationName: 'Indexer',
        name: 'Indexer',
        fields: buildNumberField(0, 'Indexer', 'Indexer ID from Prowlarr/Sonarr'),
    },
    {
        implementation: 'ReleaseTypeSpecification',
        implementationName: 'Release Type',
        name: 'Release Type',
        fields: buildSelectField(1, 'Release Type', SONARR_RELEASE_TYPE_OPTIONS),
    },
    {
        implementation: 'YearSpecification',
        implementationName: 'Year',
        name: 'Year',
        fields: buildNumberField(0, 'Year'),
    },
    {
        implementation: 'MultiPartSpecification',
        implementationName: 'Multi Part',
        name: 'Multi Part',
        fields: buildNumberField(0, 'Multi Part'),
    },
    {
        implementation: 'EditionSpecification',
        implementationName: 'Edition',
        name: 'Edition',
        fields: buildTextField(''),
    },
    {
        implementation: 'UntilQualitySpecification',
        implementationName: 'Until Quality',
        name: 'Until Quality',
        fields: buildNumberField(0, 'Quality'),
    },
    {
        implementation: 'UntilScoreSpecification',
        implementationName: 'Until Score',
        name: 'Until Score',
        fields: buildNumberField(0, 'Score'),
    },
];

export const findSchemaForSpec = (schema: SchemaTemplate[], spec: any): SchemaTemplate | null => {
    const impl = String(spec?.implementation || '');
    return schema.find((s) => s.implementation === impl) || null;
};

/** Normalize spec fields (object or array) for the editor UI. */
export const normalizeSpecificationForEditor = (spec: any, schema?: SchemaTemplate | null) => {
    const base = {
        ...spec,
        infoLink: spec?.infoLink || schema?.infoLink || CF_INFO_LINK,
        implementationName: spec?.implementationName || schema?.implementationName || spec?.implementation,
    };
    const fields = spec?.fields;
    if (Array.isArray(fields)) {
        return {
            ...base,
            fields: fields.map((f: any, i: number) => ({ ...f, order: f.order ?? i })),
        };
    }
    if (fields && typeof fields === 'object') {
        const schemaFields = schema?.fields;
        if (Array.isArray(schemaFields) && schemaFields.length) {
            return {
                ...base,
                fields: schemaFields.map((sf: any, i: number) => ({
                    ...sf,
                    order: sf.order ?? i,
                    value: fields[sf.name] ?? sf.value ?? '',
                })),
            };
        }
        const entries = Object.entries(fields);
        if (entries.length === 1 && entries[0][0] === 'value') {
            const isSelect = spec.implementation === 'ResolutionSpecification'
                || spec.implementation === 'SourceSpecification'
                || spec.implementation === 'QualityModifierSpecification'
                || spec.implementation === 'ReleaseTypeSpecification';
            if (isSelect) {
                const options = spec.implementation === 'ResolutionSpecification'
                    ? SONARR_RESOLUTION_OPTIONS
                    : spec.implementation === 'SourceSpecification'
                        ? SONARR_SOURCE_OPTIONS
                        : spec.implementation === 'QualityModifierSpecification'
                            ? SONARR_QUALITY_MODIFIER_OPTIONS
                            : SONARR_RELEASE_TYPE_OPTIONS;
                const label = spec.implementationName || 'Value';
                return { ...base, fields: buildSelectField(Number(entries[0][1]), label, options) };
            }
            return { ...base, fields: buildTextField(String(entries[0][1] ?? '')) };
        }
        return {
            ...base,
            fields: entries.map(([name, value], i) => ({
                name,
                label: name,
                value,
                type: typeof value === 'number' ? 'number' : 'textbox',
                order: i,
            })),
        };
    }
    return base;
};

/** Strip editor-only metadata; keep Sonarr-compatible shape. */
export const normalizeSpecificationForSave = (spec: any) => {
    const { id, ...rest } = spec || {};
    const next: any = { ...rest };
    if (Array.isArray(next.fields)) {
        next.fields = next.fields.map((f: any, i: number) => {
            const field = { ...f, order: f.order ?? i };
            return field;
        });
    }
    return next;
};

export const parseSpecificationsToSimple = (
    specs: any[] = [],
    schema: SchemaTemplate[] = [],
): SimpleFormatState => ({
    specifications: (Array.isArray(specs) ? specs : []).map((spec) => {
        const schemaItem = findSchemaForSpec(schema, spec);
        return normalizeSpecificationForEditor(spec, schemaItem);
    }),
});

export const buildSpecificationsFromSimple = (state: SimpleFormatState): any[] =>
    (state.specifications || []).map(normalizeSpecificationForSave);

export const upsertResolution = (
    specs: any[],
    value: number | null,
    opts: { required?: boolean; negate?: boolean } = {},
) => {
    const filtered = specs.filter((s) => s.implementation !== 'ResolutionSpecification');
    if (value == null || value <= 0) return filtered;
    return [...filtered, buildResolutionSpecification(value, opts)];
};

export const addSourceRule = (specs: any[], value: number, negate: boolean) => [
    ...specs,
    buildSourceSpecification(value, { negate, required: true }),
];

export const addReleaseGroup = (specs: any[], groupName: string) => [
    ...specs,
    buildReleaseGroupSpecification(groupName.trim(), { required: false }),
];

export const addReleaseTitleKeyword = (
    specs: any[],
    keyword: string,
    { negate = false }: { negate?: boolean } = {},
) => [
    ...specs,
    buildReleaseTitleSpecification(`\\b${escapeRegexLiteral(keyword)}\\b`, {
        name: negate ? `Not ${keyword}` : keyword,
        negate,
        required: true,
    }),
];

/** Normalize TRaSH Guides JSON import (strip sync metadata, normalize specifications). */
export const normalizeTrashGuidesCustomFormat = (
    raw: any,
    schema: SchemaTemplate[] = [],
) => {
    const payload = raw && typeof raw === 'object' ? raw : {};
    const specifications = Array.isArray(payload.specifications) ? payload.specifications : [];
    return {
        name: String(payload.name || '').trim(),
        includeCustomFormatWhenRenaming: !!payload.includeCustomFormatWhenRenaming,
        specifications: specifications.map((spec: any) => {
            const schemaItem = findSchemaForSpec(schema, spec);
            return normalizeSpecificationForEditor(spec, schemaItem);
        }),
    };
};

export const mergeSchemaLists = (live: SchemaTemplate[] = [], fallback = FALLBACK_SPEC_SCHEMA) => {
    const map = new Map<string, SchemaTemplate>();
    fallback.forEach((s) => map.set(s.implementation, s));
    live.forEach((s) => map.set(s.implementation, s));
    return Array.from(map.values()).sort((a, b) =>
        String(a.implementationName || a.implementation).localeCompare(String(b.implementationName || b.implementation)),
    );
};
