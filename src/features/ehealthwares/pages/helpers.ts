import type { Field } from '@/features/rxsoft/types';
import { buildPayload } from '@/features/shared/payload-utils';

/** Splits a newline-separated textarea value into an array of non-empty strings. */
export function splitLinesArray(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return value;
}

/** Joins a string[] value back into newline-separated text for the edit form. */
export function joinArrayLines(value: unknown): string {
  return Array.isArray(value) ? value.map(String).join('\n') : '';
}

/** Standard payload builder: casts number/switch fields, keeps the rest. */
export function buildContentPayload(values: Record<string, unknown>, fields: Field[]) {
  return buildPayload(values, fields);
}
