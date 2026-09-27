import { useEffect, useState } from 'react';
import { SearchOption } from '../rxsoft/types';

export function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

export function getArrayPayload(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }
  if (payload && typeof payload === 'object') {
    const shaped = payload as Record<string, unknown>;
    if (Array.isArray(shaped.data)) {
      return shaped.data as Record<string, unknown>[];
    }
    if (Array.isArray(shaped.items)) {
      return shaped.items as Record<string, unknown>[];
    }
    if (Array.isArray(shaped.results)) {
      return shaped.results as Record<string, unknown>[];
    }
  }
  return [];
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return a === b;
  }
  if (typeof a !== typeof b) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((item, i) => isEqual(item, b[i]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;

    if ('value' in aObj || 'value' in bObj) {
      const aValue = 'value' in aObj ? aObj.value : a;
      const bValue = 'value' in bObj ? bObj.value : b;
      return isEqual(aValue, bValue);
    }

    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    return aKeys.every((key) => isEqual(aObj[key], bObj[key]));
  }

  return false;
}

export function getDirtyFields(
  current: Record<string, unknown>,
  initial: Record<string, unknown>
): Record<string, unknown> {
  const dirty: Record<string, unknown> = {};
  const allKeys = new Set([...Object.keys(current), ...Object.keys(initial)]);
  for (const key of allKeys) {
    if (!isEqual(current[key], initial[key])) {
      dirty[key] = current[key];
    }
  }
  return dirty;
}

export function mapOption(item: unknown, valueKey?: string, labelKey?: string): SearchOption {
  if (typeof item !== 'object') {
    const primitive = String(item);
    return { value: primitive, label: primitive };
  }

  const source = item as Record<string, unknown>;
  const rawValue =
    (valueKey ? source[valueKey] : undefined) ??
    source.id ??
    source.value ??
    source.code ??
    source.name;

  const value = String(rawValue);
  const label = String(
    (labelKey ? source[labelKey] : undefined) ??
      source.name ??
      source.label ??
      source.code ??
      rawValue
  );
  return { value, label };
}
