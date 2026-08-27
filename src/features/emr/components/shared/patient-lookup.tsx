import { Loader, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { PatientDetail } from '../../lib/emr-types';

export function PatientLookup() {
  const navigate = useNavigate();
  const [mrn, setMrn] = useState('');

  const lookup = useMutation({
    mutationFn: async (value: string) => {
      const { data } = await emrApi.get<PatientDetail>(
        `/patients/by-mrn/${encodeURIComponent(value)}`,
      );
      return data;
    },
    onSuccess: (patient) => {
      setMrn('');
      void navigate({ to: `/emr/patients/${patient.id}` });
    },
    onError: (error, value) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        notifications.show({
          color: 'red',
          message: `No patient found with MRN ${value}`,
        });
        return;
      }
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const submit = () => {
    const value = mrn.trim();
    if (value && !lookup.isPending) {
      lookup.mutate(value);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <TextInput
        placeholder="Find patient by MRN…"
        aria-label="Find patient by MRN"
        leftSection={<Search size={14} />}
        rightSection={
          lookup.isPending ? (
            <Loader size={14} />
          ) : (
            <ArrowRight size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
          )
        }
        value={mrn}
        onChange={(event) => setMrn(event.currentTarget.value)}
      />
    </form>
  );
}
