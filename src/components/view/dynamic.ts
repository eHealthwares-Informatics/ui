// view/build-attribute-fields.ts

import { ViewField } from '@/features/rxsoft/types';

export function normalizeConceptValues(values: any[]) {
  return Object.fromEntries(values.map((v) => [v.attribute.code, v.value]));
}
export function buildAttributeFields<T>(key: string, attributes: any[]): ViewField<T>[] {
  return attributes.map((attr) => ({
    key: `${String(key)}.${attr.code}`,

    label: attr.name,

    col: 5,
  }));
}
