import { Text } from '@mantine/core';
import type { Field, FieldGroup, Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';

export const option = (value?: unknown, fallbackLabel?: unknown): Option | null => {
  if (value == null || value === '') {
    return null;
  }
  return {
    value: String(value),
    label: String(fallbackLabel ?? value),
  };
};

export const optionValue = (value: unknown) => {
  if (value && typeof value === 'object' && 'value' in value) {
    return String((value as Option).value);
  }
  return value ? String(value) : undefined;
};

export const jsonObject = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const jsonArray = (value: unknown) => (Array.isArray(value) ? value : []);

export const text = (value: unknown) => String(value ?? '');

export const bool = (value: unknown, fallback = false) =>
  typeof value === 'boolean' ? value : fallback;

export const numberValue = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Builds an update payload containing ONLY keys present in `values`
 * (i.e. the dirty-field subset), so PATCH only sends changed fields.
 */
export const pickUpdatePayload = (
  values: Record<string, unknown>,
  map: Record<string, (value: unknown, values: Record<string, unknown>) => unknown>
) => {
  const payload: Record<string, unknown> = {};
  Object.entries(map).forEach(([key, fn]) => {
    if (key in values) {
      payload[key] = fn(values[key], values);
    }
  });
  return payload;
};

export const asyncField = (
  name: string,
  label: string,
  endpoint: string,
  labelKey = 'name'
): Field => ({
  name,
  label,
  type: 'async-select',
  col: 6,
  searchParam: {
    endpoint,
    queryParam: 'search',
    minChars: 0,
    valueKey: 'id',
    labelKey,
  },
});

export const selectField = (name: string, label: string, options: Option[], col = 6): Field => ({
  name,
  label,
  type: 'select',
  options,
  col,
});

export const textField = (name: string, label: string, col = 6): Field => ({
  name,
  label,
  type: 'text',
  col,
});

/**
 * Searchable select that stores the selected option value. `optionsFor` makes
 * the option list follow another field (dependent selects); the control clears
 * itself when the stored value is no longer in that list.
 */
export const autocompleteField = (
  name: string,
  label: string,
  options: Option[],
  col = 6,
  optionsFor?: (formState: Record<string, unknown>) => Option[]
): Field => ({
  name,
  label,
  type: 'autocomplete',
  options,
  optionsFor,
  col,
});

/** Dedupe options by value, keeping the first label (global + org overlaps). */
export const uniqueOptions = (options: Option[]): Option[] => {
  const seen = new Map<string, Option>();
  options.forEach((option) => {
    if (!seen.has(option.value)) {
      seen.set(option.value, option);
    }
  });
  return [...seen.values()];
};

export const jsonField = (name: string, label: string): Field => ({
  name,
  label,
  type: 'json',
  col: 12,
});

export const switchField = (name: string, label: string, col = 6): Field => ({
  name,
  label,
  type: 'switch',
  col,
});

export const buildFields = (fields: Field[]): FieldGroup[] => [{ fields }];

export const withDefaultActions = (config: Omit<ModelConfig, 'canDelete'>): ModelConfig => ({
  canDelete: true,
  apiProvider: conversationApi,
  ...config,
});

/** Renders an id as a short monospace label, keeping the full id in a title. */
export const shortText = (value: unknown) => {
  const id = String(value ?? '');
  const short = id.length > 10 ? `${id.slice(0, 4)}...${id.slice(-4)}` : id;
  return (
    <Text
      component="span"
      title={id}
      size="sm"
      style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
    >
      {short}
    </Text>
  );
};
