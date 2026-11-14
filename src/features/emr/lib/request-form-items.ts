import type { LoincTest } from '../components/shared/loinc-test-search';
import { buildItemName, buildReferenceCode } from '../components/shared/master-item-meta';
import type { MasterItem } from '../components/shared/master-item-search';
import type { FormFieldSchema, FormFieldType, FormSchema } from './emr-types';

/**
 * Turns a filled request form into the `items` array the requests API expects.
 *
 * A request form (see the REQUEST_* seeds) captures lines in a `table` field
 * whose columns mirror the old inline item editor — a catalogue picker plus
 * name/code/quantity/dose/… — so each row becomes one request item. Standalone
 * picker fields are also accepted as a single line.
 */

export type RequestItemDraft = {
  name: string;
  code?: string;
  dose?: string;
  doseUnit?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  durationUnit?: string;
  quantity?: number;
  instructions?: string;
  itemKind?: 'STOCK_ITEM' | 'GENERIC_PRODUCT' | 'GENERIC_DRUG' | 'LOINC_TEST';
  referenceCode?: string;
  testDefinitionId?: string;
  sampleType?: string;
  specimenNotes?: string;
  modality?: string;
  bodyPart?: string;
  contrast?: boolean;
  clinicalIndication?: string;
  category?: string;
  notes?: string;
};

/** Controls that store a picked catalogue entry. */
const PICKER_TYPES = new Set<FormFieldType>([
  'item',
  'inventory-item',
  'generic-product',
  'generic-drug',
  'loinc-test',
]);

/** Row fields copied verbatim onto the request item when present. */
const COPIED_TEXT_KEYS = [
  'dose',
  'doseUnit',
  'frequency',
  'route',
  'duration',
  'durationUnit',
  'instructions',
  'sampleType',
  'specimenNotes',
  'modality',
  'bodyPart',
  'clinicalIndication',
  'category',
  'notes',
] as const;

function asText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asItem(value: unknown): MasterItem | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const candidate = value as Partial<MasterItem>;
  return typeof candidate.label === 'string' && typeof candidate.kind === 'string'
    ? (candidate as MasterItem)
    : undefined;
}

function asLoincTest(value: unknown): LoincTest | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const candidate = value as Partial<LoincTest>;
  return typeof candidate.code === 'string' && typeof candidate.name === 'string'
    ? (candidate as LoincTest)
    : undefined;
}

function rowToItem(
  row: Record<string, unknown>,
  columns: Array<{ key: string; label?: string; type: FormFieldType }>
): RequestItemDraft | null {
  const pickerColumn = columns.find(
    (column) => PICKER_TYPES.has(column.type) && column.type !== 'loinc-test'
  );
  const loincColumn = columns.find((column) => column.type === 'loinc-test');

  const item = pickerColumn ? asItem(row[pickerColumn.key]) : undefined;
  const test = loincColumn ? asLoincTest(row[loincColumn.key]) : undefined;

  const code = asText(row.code) ?? item?.code ?? item?.id ?? test?.code;
  const name =
    asText(row.name) ??
    (item ? buildItemName(item.label, item.code ?? item.id) : undefined) ??
    (test ? `${test.name} — ${test.code}` : undefined);

  if (!name && !code) {
    return null;
  }

  const draft: RequestItemDraft = {
    name: name ?? (code as string),
    code,
    quantity: asNumber(row.quantity),
    itemKind: item?.kind ?? (test ? 'LOINC_TEST' : undefined),
    referenceCode:
      item?.referenceCode ??
      (item ? buildReferenceCode(item) : undefined) ??
      (test ? `LOINC_TEST:${test.code}` : undefined),
    testDefinitionId: test?.code,
  };

  for (const key of COPIED_TEXT_KEYS) {
    const value = asText(row[key]);
    if (value !== undefined) {
      draft[key] = value;
    }
  }
  if (typeof row.contrast === 'boolean') {
    draft.contrast = row.contrast;
  }
  return draft;
}

function collectItems(
  fields: FormFieldSchema[],
  data: Record<string, unknown>,
  items: RequestItemDraft[]
): void {
  for (const field of fields) {
    if (field.type === 'tab' || field.type === 'col') {
      collectItems(field.fields ?? [], data, items);
      continue;
    }

    if (field.type === 'table') {
      const columns = field.columns ?? [];
      // Only tables holding a catalogue picker describe request lines; other
      // tables are plain form data (stored with the request, not itemised).
      if (!columns.some((column) => PICKER_TYPES.has(column.type))) {
        continue;
      }
      const rows = Array.isArray(data[field.key])
        ? (data[field.key] as Record<string, unknown>[])
        : [];
      for (const row of rows) {
        const mapped = rowToItem(row, columns);
        if (mapped) {
          items.push(mapped);
        }
      }
      continue;
    }

    if (PICKER_TYPES.has(field.type)) {
      // A standalone picker is a one-line request.
      const mapped = rowToItem({ [field.key]: data[field.key] }, [
        { key: field.key, label: field.label, type: field.type },
      ]);
      if (mapped) {
        items.push(mapped);
      }
    }
  }
}

export function formDataToRequestItems(
  schema: FormSchema,
  data: Record<string, unknown>
): RequestItemDraft[] {
  const items: RequestItemDraft[] = [];
  collectItems(schema.fields ?? [], data ?? {}, items);
  return items;
}
