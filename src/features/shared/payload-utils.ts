import type { Field, FieldGroup, TabGroup } from '@/features/rxsoft/types';

interface FieldDef {
  name: string;
  type?: string;
}

type ConfigFields = {
  createFields?: Field[];
  createFieldGroups?: FieldGroup[];
  tabGroups?: TabGroup[];
};

/** Unwraps a react-select-style { value, label } object to just the value */
export function unwrapSelectValue(v: unknown): unknown {
  if (
    v &&
    typeof v === 'object' &&
    'value' in (v as Record<string, unknown>) &&
    'label' in (v as Record<string, unknown>)
  ) {
    return (v as Record<string, unknown>).value;
  }
  return v;
}

/** Flattens all fields defined across a ModelConfig (create fields, field groups, tabs) */
export function collectFields(config: ConfigFields): Field[] {
  const out: Field[] = [];
  for (const f of config.createFields ?? []) {
    out.push(f);
  }
  for (const g of config.createFieldGroups ?? []) {
    out.push(...(g.fields ?? []));
  }
  for (const t of config.tabGroups ?? []) {
    out.push(...(t.fields ?? []));
    for (const g of t.fieldGroups ?? []) {
      out.push(...(g.fields ?? []));
    }
  }
  return out;
}

/** Extracts the id from a single multi-async-select option */
export function extractOptionId(item: unknown): unknown {
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    return obj.value ?? obj.id ?? obj.code ?? item;
  }
  return item;
}

/** Converts multi-async-select Option[] values to plain id arrays before submitting */
export function normalizeMultiSelectIds(
  values: Record<string, unknown>,
  fields: Field[]
): Record<string, unknown> {
  if (!fields.length) {
    return values;
  }
  const next: Record<string, unknown> = { ...values };
  for (const f of fields) {
    if (f.type !== 'multi-async-select' || next[f.name] === undefined) {
      continue;
    }
    const value = next[f.name];
    next[f.name] = Array.isArray(value) ? value.map(extractOptionId) : value;
  }
  return next;
}

/** Casts a value to number/boolean if fieldType indicates, otherwise identity */
export function castValue(v: unknown, fieldType?: string): unknown {
  const unwrapped = unwrapSelectValue(v);
  if (fieldType === 'number') {
    if (unwrapped === null || unwrapped === undefined || unwrapped === '') {
      return null;
    }
    const n = Number(unwrapped);
    return Number.isNaN(n) ? unwrapped : n;
  }
  if (fieldType === 'switch' || fieldType === 'boolean') {
    return unwrapped === true || unwrapped === 'true';
  }
  return unwrapped;
}

/** Builds a payload from form values, casting each field according to its FieldDef type.
 *  If fields is omitted, every key is cast as string (pass-through). */
export function buildPayload(
  values: Record<string, unknown>,
  fields?: FieldDef[]
): Record<string, unknown> {
  if (!fields) {
    return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, castValue(v, 'string')]));
  }
  const fieldMap = new Map(fields.map((f) => [f.name, f]));
  return Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, castValue(v, fieldMap.get(k)?.type)])
  );
}
