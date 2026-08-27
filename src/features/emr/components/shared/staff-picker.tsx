import { Autocomplete, Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import type { Staff } from '../../lib/emr-types';

export type StaffOption = {
  id: string;
  staffId: string;
  staffName: string;
  roleType: string;
};

function displayFor(staff: { staffNumber: string; firstName: string; lastName: string; roleType: string }): string {
  const name = [staff.firstName, staff.lastName].filter(Boolean).join(' ').trim();
  const base = name ? `${staff.staffNumber} · ${name}` : staff.staffNumber;
  return staff.roleType ? `${base} (${staff.roleType})` : base;
}

export function StaffPicker({
  value,
  onChange,
  label = 'Provider',
  required = false,
  error,
  clearable = true,
}: {
  value: StaffOption | null;
  onChange: (staff: StaffOption | null) => void;
  label?: string;
  required?: boolean;
  error?: React.ReactNode;
  clearable?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const selectedDisplayRef = useRef('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ['emr', 'staff', 'picker', debounced],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Staff[] }>('/staff', {
        params: { limit: 20, search: debounced || undefined, isActive: 'true' },
      });
      return res.data.data;
    },
    staleTime: 15_000,
    placeholderData: (prev) => prev ?? [],
  });

  const options = useMemo(
    () =>
      (data ?? []).map((staff) => ({
        value: displayFor(staff),
        label: displayFor(staff),
      })),
    [data],
  );

  const displayValue = value
    ? value.staffId + (value.staffName ? ` · ${value.staffName}` : '')
    : query;

  return (
    <Autocomplete
      label={label}
      required={required}
      error={error}
      clearable={clearable}
      value={displayValue}
      onChange={(next) => {
        setQuery(next);
        if (next !== selectedDisplayRef.current) {
          onChange(null);
        }
      }}
      onOptionSubmit={(selected) => {
        const staff = (data ?? []).find((s) => displayFor(s) === selected);
        if (staff) {
          selectedDisplayRef.current = selected;
          onChange({
            id: staff.id,
            staffId: staff.staffNumber,
            staffName: [staff.firstName, staff.lastName].filter(Boolean).join(' ').trim(),
            roleType: staff.roleType,
          });
          setQuery(selected);
        }
      }}
      data={options}
      limit={20}
      rightSection={isLoading ? <Loader size="xs" /> : undefined}
      placeholder="Search staff by name or staff number"
    />
  );
}
