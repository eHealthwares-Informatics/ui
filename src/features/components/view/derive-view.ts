import type { ModelConfig } from '@/features/shared/model-schema';
import type { View, ViewAccordion, ViewField, ViewFieldGroup, Column, Field, FieldGroup } from '@/features/rxsoft/types';

const HIDDEN_FIELD_TYPES = new Set(['hidden', 'password']);

function fieldToViewField(f: Field): ViewField<any> {
  return { key: f.name, label: f.label, col: f.col ?? 3 };
}

function columnToViewField(c: Column): ViewField<any> | null {
  if (c.render) {return null;}
  if (c.key.includes('.')) {
    return {
      key: c.key,
      label: c.label,
      col: 3,
      render: (_: any, data: any) => {
        const value = c.key.split('.').reduce((acc: any, k: string) => acc?.[k], data);
        return String(value ?? '-');
      },
    };
  }
  return { key: c.key, label: c.label, col: 3 };
}

const ACCORDION_TYPES = new Set(['accordion', 'accordion-array']);

function fieldGroupToViewFieldGroup(fg: FieldGroup): ViewFieldGroup<any> {
  return {
    title: fg.title,
    fields: fg.fields
      .filter((f) => !HIDDEN_FIELD_TYPES.has(f.type ?? '') && !ACCORDION_TYPES.has(f.type ?? ''))
      .map(fieldToViewField),
  };
}

function extractAccordionFields(fg: FieldGroup): ViewAccordion<any>[] {
  return fg.fields
    .filter((f): f is Field & { type: 'accordion' | 'accordion-array' } => ACCORDION_TYPES.has(f.type ?? ''))
    .map((f) => ({
      key: f.name,
      title: f.label,
      labelKey: f.itemLabelKey ?? 'name',
      itemEditConfig: f.itemEditConfig,
    }));
}

function deriveEndpoint(endpoint: string): string {
  if (endpoint.includes(':id')) {return endpoint;}
  return `${endpoint.replace(/\/$/, '')}/:id`;
}

export function deriveView(config: ModelConfig): View<any> {
  if (config.view) {return config.view;}

  const endpoint = deriveEndpoint(config.endpoint);
  const title = `${config.title} Details`;

  let fieldGroups: ViewFieldGroup<any>[] = [];
  let accordions: ViewAccordion<any>[] = [];

  if (config.tabGroups?.length) {
    for (const tab of config.tabGroups) {
      for (const fg of tab.fieldGroups ?? []) {
        accordions.push(...extractAccordionFields(fg));
      }
    }
    fieldGroups = config.tabGroups.flatMap((tab) =>
      (tab.fieldGroups ?? []).map(fieldGroupToViewFieldGroup),
    );
  }

  if (!fieldGroups.length && config.createFieldGroups?.length) {
    accordions = config.createFieldGroups.flatMap(extractAccordionFields);
    fieldGroups = config.createFieldGroups.map(fieldGroupToViewFieldGroup);
  }

  if (!fieldGroups.length && config.createFields?.length) {
    const fields = config.createFields
      .filter((f) => !HIDDEN_FIELD_TYPES.has(f.type ?? '') && !ACCORDION_TYPES.has(f.type ?? ''))
      .map(fieldToViewField);
    if (fields.length) {
      fieldGroups = [{ title: 'Details', fields }];
    }
    accordions = config.createFields
      .filter((f): f is Field & { type: 'accordion' | 'accordion-array' } => ACCORDION_TYPES.has(f.type ?? ''))
      .map((f) => ({
        key: f.name,
        title: f.label,
        labelKey: f.itemLabelKey ?? 'name',
        itemEditConfig: f.itemEditConfig,
      }));
  }

  if (!fieldGroups.length && config.columns?.length) {
    const fields = config.columns
      .map(columnToViewField)
      .filter((f): f is ViewField<any> => f !== null);
    if (fields.length) {
      fieldGroups = [{ title: 'Details', fields }];
    }
  }

  const result: View<any> = { endpoint, title, fieldGroups, editConfig: config };
  if (accordions.length) {
    result.accordions = accordions;
  }
  return result;
}
