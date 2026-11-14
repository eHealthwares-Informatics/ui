import { Autocomplete, Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { codingConceptApi } from '@/lib/coding-concept-api';

export type ConceptValue = {
  concept: 'DICOM' | 'LOINC';
  id?: string;
  code?: string;
  name: string;
  source: 'catalog' | 'free-text';
};

type ConceptRow = {
  id: string;
  concept: string;
  code: string;
  name: string;
  shortName: string | null;
  longName: string | null;
};

function displayFor(value: { name: string; code?: string }): string {
  return value.code ? `${value.name} (${value.code})` : value.name;
}

/**
 * Concept autocomplete backed by the concepts API. Free text is always allowed:
 * pressing Enter (or blurring with text that does not match an option) stores a
 * free-text value with `source: 'free-text'`.
 */
export function ConceptAutocomplete({
  concept,
  value,
  onChange,
  label,
  placeholder,
  required = false,
  error,
  disabled = false,
  limit = 20,
}: {
  concept: 'DICOM' | 'LOINC';
  value: ConceptValue | null;
  onChange: (value: ConceptValue | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: React.ReactNode;
  disabled?: boolean;
  limit?: number;
}) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data = [], isLoading } = useQuery({
    queryKey: ['emr', 'concepts', concept, debounced, limit],
    queryFn: async () => {
      const { data } = await codingConceptApi.get<{ data: ConceptRow[] }>('/concepts/suggest', {
        params: {
          concept,
          term: debounced || undefined,
          limit,
        },
      });
      return data.data ?? [];
    },
    staleTime: 60_000,
  });

  const options = useMemo(
    () =>
      data
        .filter((row) => row.name || row.code)
        .map((row) => displayFor({ name: row.name || row.code, code: row.code })),
    [data]
  );

  const commitFreeText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed === selectedLabel) {
      return;
    }
    const found = data.find(
      (row) => displayFor({ name: row.name || row.code, code: row.code }) === trimmed
    );
    if (found) {
      onChange({
        concept,
        id: found.id,
        code: found.code,
        name: found.name || found.code,
        source: 'catalog',
      });
      return;
    }
    onChange({
      concept,
      name: trimmed,
      source: 'free-text',
    });
  };

  const displayValue = value ? displayFor(value) : query;

  return (
    <Autocomplete
      label={label}
      required={required}
      error={error}
      disabled={disabled}
      placeholder={placeholder ?? `Search ${concept} or type a value`}
      value={displayValue}
      onChange={(next) => {
        setQuery(next);
        if (value && next !== displayFor(value)) {
          onChange(null);
        }
      }}
      onOptionSubmit={(option) => {
        const found = data.find(
          (row) => displayFor({ name: row.name || row.code, code: row.code }) === option
        );
        if (found) {
          setSelectedLabel(option);
          onChange({
            concept,
            id: found.id,
            code: found.code,
            name: found.name || found.code,
            source: 'catalog',
          });
        } else {
          setSelectedLabel('');
          commitFreeText(option);
        }
      }}
      onBlur={() => {
        if (!value && query.trim() && query.trim() !== selectedLabel) {
          commitFreeText(query);
        }
      }}
      data={options}
      limit={limit}
      rightSection={isLoading ? <Loader size="xs" /> : undefined}
    />
  );
}
