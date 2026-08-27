import { Autocomplete, Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { emrApi } from '@/lib/emr-api';

export type PatientOption = {
  id: string;
  patientId: string;
  patientName: string;
};

function displayFor(patient: { patientId: string; firstName: string; lastName: string }): string {
  const name = [patient.firstName, patient.lastName].filter(Boolean).join(' ').trim();
  return name ? `${patient.patientId} · ${name}` : patient.patientId;
}

export function PatientPicker({
  value,
  onChange,
  label = 'Patient',
  required = false,
  error,
  disabled = false,
}: {
  value: PatientOption | null;
  onChange: (patient: PatientOption | null) => void;
  label?: string;
  required?: boolean;
  error?: React.ReactNode;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const selectedDisplayRef = useRef('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ['emr', 'patients', 'picker', debounced],
    queryFn: async () => {
      const res = await emrApi.get<{
        data: Array<{ id: string; patientId: string; firstName: string; lastName: string }>;
      }>('/patients', { params: { limit: 20, search: debounced || undefined } });
      return res.data.data;
    },
    staleTime: 15_000,
    placeholderData: (prev) => prev ?? [],
  });

  const options = useMemo(
    () =>
      (data ?? []).map((patient) => ({
        value: displayFor(patient),
        label: displayFor(patient),
      })),
    [data],
  );

  const displayValue = value
    ? value.patientId +
      (value.patientName ? ` · ${value.patientName}` : '')
    : query;

  return (
    <Autocomplete
      label={label}
      required={required}
      error={error}
      disabled={disabled}
      value={displayValue}
      onChange={(next) => {
        setQuery(next);
        if (next !== selectedDisplayRef.current) {
          onChange(null);
        }
      }}
      onOptionSubmit={(selected) => {
        const patient = (data ?? []).find((p) => displayFor(p) === selected);
        if (patient) {
          selectedDisplayRef.current = selected;
          onChange({
            id: patient.id,
            patientId: patient.patientId,
            patientName: [patient.firstName, patient.lastName].filter(Boolean).join(' ').trim(),
          });
          setQuery(selected);
        }
      }}
      data={options}
      limit={20}
      rightSection={isLoading ? <Loader size="xs" /> : undefined}
      placeholder="Search by name or MRN"
    />
  );
}
