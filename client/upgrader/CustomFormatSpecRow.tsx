import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { CF_INFO_LINK, getSpecFieldValue, setSpecFieldValue, type SchemaTemplate } from './customFormatSpec';

export type CustomFormatSpecRowProps = {
    spec: any;
    schema?: SchemaTemplate | null;
    expanded?: boolean;
    onToggleExpand?: () => void;
    onChange: (spec: any) => void;
    onDelete: () => void;
};

const FieldEditor: React.FC<{
    field: any;
    value: unknown;
    onChange: (value: unknown) => void;
}> = ({ field, value, onChange }) => {
    const label = field?.label || field?.name || 'Value';
    const type = String(field?.type || 'textbox');

    if (type === 'select' && Array.isArray(field?.selectOptions)) {
        return (
            <label className="block space-y-1">
                <span className="text-xs text-muted">{label}</span>
                <select
                    value={String(value ?? field?.value ?? '')}
                    onChange={(e) => onChange(field?.isFloat ? parseFloat(e.target.value) : Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text"
                >
                    {field.selectOptions.map((opt: any) => (
                        <option key={String(opt.value)} value={opt.value}>{opt.name}</option>
                    ))}
                </select>
            </label>
        );
    }

    if (type === 'number') {
        return (
            <label className="block space-y-1">
                <span className="text-xs text-muted">{label}</span>
                <input
                    type="number"
                    value={value != null ? String(value) : ''}
                    onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text font-mono"
                />
            </label>
        );
    }

    return (
        <label className="block space-y-1">
            <span className="text-xs text-muted">{label}</span>
            <textarea
                value={String(value ?? '')}
                onChange={(e) => onChange(e.target.value)}
                rows={type === 'textbox' && String(value ?? '').length > 80 ? 4 : 2}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-text resize-y min-h-[2.5rem]"
                spellCheck={false}
            />
            {field?.helpText && <span className="text-[10px] text-muted">{field.helpText}</span>}
        </label>
    );
};

export const CustomFormatSpecRow: React.FC<CustomFormatSpecRowProps> = ({
    spec,
    schema,
    expanded = false,
    onToggleExpand,
    onChange,
    onDelete,
}) => {
    const implLabel = spec?.implementationName || schema?.implementationName || spec?.implementation || 'Specification';
    const fieldDefs: any[] = useMemo(() => {
        if (Array.isArray(schema?.fields) && schema.fields.length) return schema.fields;
        if (Array.isArray(spec?.fields) && spec.fields.length) return spec.fields;
        return [{ name: 'value', label: 'Value', type: 'textbox', value: getSpecFieldValue(spec) ?? '' }];
    }, [schema, spec]);

    const updateField = (fieldName: string, value: unknown) => {
        onChange(setSpecFieldValue(spec, fieldName, value));
    };

    return (
        <div className="rounded-xl border border-border bg-background/50 overflow-hidden">
            <div className="flex items-center gap-2 p-3">
                <button
                    type="button"
                    onClick={onToggleExpand}
                    className="text-muted hover:text-text p-0.5"
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                    <input
                        type="text"
                        value={spec?.name || ''}
                        onChange={(e) => onChange({ ...spec, name: e.target.value })}
                        placeholder="Specification name"
                        className="w-full bg-transparent border-0 text-sm font-semibold text-text focus:outline-none"
                    />
                    <div className="text-[10px] text-muted truncate">{implLabel}</div>
                </div>
                <label className="inline-flex items-center gap-1 text-[10px] text-muted whitespace-nowrap">
                    <input
                        type="checkbox"
                        checked={!!spec?.required}
                        onChange={(e) => onChange({ ...spec, required: e.target.checked })}
                    />
                    Req
                </label>
                <label className="inline-flex items-center gap-1 text-[10px] text-muted whitespace-nowrap">
                    <input
                        type="checkbox"
                        checked={!!spec?.negate}
                        onChange={(e) => onChange({ ...spec, negate: e.target.checked })}
                    />
                    Neg
                </label>
                <button type="button" onClick={onDelete} className="text-muted hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            {expanded && (
                <div className="px-3 pb-3 pt-1 border-t border-border/60 space-y-3">
                    {fieldDefs.map((field) => (
                        <FieldEditor
                            key={field.name}
                            field={field}
                            value={getSpecFieldValue(spec, field.name)}
                            onChange={(val) => updateField(field.name, val)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const cloneSchemaToSpec = (schema: SchemaTemplate, nameOverride?: string): any => ({
    name: nameOverride || schema?.name || schema?.implementationName || 'New condition',
    implementation: schema.implementation,
    implementationName: schema.implementationName || schema.implementation,
    infoLink: schema.infoLink || CF_INFO_LINK,
    negate: !!schema.negate,
    required: schema.required !== false,
    fields: Array.isArray(schema.fields)
        ? schema.fields.map((f: any, i: number) => ({ ...f, order: f.order ?? i }))
        : [{ name: 'value', label: 'Value', type: 'textbox', value: '', order: 0 }],
});
