import { Autocomplete, Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { emrApi } from '@/lib/emr-api';

type DepartmentOption = {
  id: string;
  code: string;
  name: string;
  departmentType?: string;
};

function displayFor(dept: DepartmentOption): string {
  return `${dept.code} · ${dept.name}`.trim();
}

export function DepartmentPicker({
  value,
  onChange,
  label = 'Department',
  placeholder = 'Search by department name or code',
  required = false,
  error,
}: {
  value: { id: string | null; name: string | null } | null;
  onChange: (selection: { id: string | null; name: string | null }) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: React.ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ['emr', 'departments', 'picker', debounced],
    queryFn: async () => {
      const res = await emrApi.get<{ data: DepartmentOption[] }>('/departments', {
        params: { limit: 20, search: debounced || undefined, isActive: 'true' },
      });
      return res.data?.data ?? [];
    },
    staleTime: 30_000,
  });

  const options = useMemo(
    () =>
      (data ?? []).map((d) => ({
        value: d.id,
        label: displayFor(d),
        name: d.name,
      })),
    [data],
  );

  const selectedLabel = value?.id ? (value.name ?? '') : '';

  return (
    <Autocomplete
      label={label}
      placeholder={placeholder}
      required={required}
      error={error}
      value={query || selectedLabel || ''}
      onChange={(raw) => {
        setQuery(raw);
        const exact = options.find((o) => o.label === raw);
        if (exact) {
          onChange({ id: exact.value, name: exact.name });
        } else if (!raw.trim()) {
          onChange({ id: null, name: null });
        }
      }}
      onOptionSubmit={(val) => {
        const option = options.find((o) => o.value === val);
        if (option) {
          onChange({ id: option.value, name: option.name });
          setQuery('');
        }
      }}
      data={options}
      rightSection={isLoading ? <Loader size={14} /> : null}
      limit={20}
    />
  );
}