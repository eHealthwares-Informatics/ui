import { Autocomplete, Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { emrApi } from '@/lib/emr-api';

type LocationOption = {
  id: string;
  code: string;
  name: string;
};

function displayFor(location: { code: string; name: string }): string {
  return `${location.code} · ${location.name}`.trim();
}

export function LocationPicker({
  value,
  onChange,
  label = 'Location',
  placeholder = 'Search by location name or code',
  required = false,
  error,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: React.ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const selectedDisplayRef = useRef('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data: selectedLabel } = useQuery({
    queryKey: ['emr', 'locations', value],
    queryFn: async () => {
      if (!value) {
        return '';
      }
      const res = await emrApi.get<{ data: LocationOption }>(`/locations/${value}`);
      const location = res.data?.data ?? res.data;
      return location ? displayFor(location) : '';
    },
    enabled: Boolean(value),
    staleTime: 60_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['emr', 'locations', 'picker', debounced],
    queryFn: async () => {
      const res = await emrApi.get<{ data: LocationOption[] }>('/locations', {
        params: { limit: 20, search: debounced || undefined },
      });
      return res.data?.data ?? [];
    },
    staleTime: 15_000,
    placeholderData: (prev) => prev ?? [],
  });

  const options = useMemo(
    () =>
      (data ?? []).map((location) => ({
        value: displayFor(location),
        label: displayFor(location),
      })),
    [data]
  );

  const displayValue = value ? selectedLabel || selectedDisplayRef.current || value : query;

  return (
    <Autocomplete
      label={label}
      required={required}
      error={error}
      value={displayValue}
      onChange={(next) => {
        setQuery(next);
        if (next !== selectedDisplayRef.current) {
          onChange(null);
        }
      }}
      onOptionSubmit={(selected) => {
        const location = (data ?? []).find((l) => displayFor(l) === selected);
        if (location) {
          selectedDisplayRef.current = selected;
          onChange(location.id);
          setQuery(selected);
        }
      }}
      data={options}
      limit={20}
      rightSection={isLoading ? <Loader size="xs" /> : undefined}
      placeholder={placeholder}
    />
  );
}
