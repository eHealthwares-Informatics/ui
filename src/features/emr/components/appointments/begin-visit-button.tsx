import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { getApiErrorMessage } from '../../lib/emr-errors';

/**
 * Check the patient in and jump straight to the created visit's page. The
 * backend's check-in endpoint creates the visit and returns it alongside the
 * transitioned appointment.
 */
export function BeginVisitButton({
  appointmentId,
  disabled,
}: {
  appointmentId: string;
  disabled?: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [started, setStarted] = useState(false);

  const beginVisit = useMutation({
    mutationFn: async () => {
      const { data } = await emrApi.post<{
        appointment: Record<string, unknown>;
        visit: Record<string, unknown>;
      }>(`/appointments/${appointmentId}/check-in`, {});
      return data;
    },
    onSuccess: (data) => {
      notifications.show({ message: 'Patient checked in', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'appointments'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'visits'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'dashboard'] });
      setStarted(true);
      const visitId = String(data.visit?.id ?? '');
      if (visitId) {
        void navigate({ to: '/emr/visits/$visitId', params: { visitId } });
      }
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  if (started) {
    return null;
  }

  return (
    <Button
      size="compact-xs"
      variant="light"
      leftSection={<Stethoscope size={14} />}
      loading={beginVisit.isPending}
      disabled={disabled}
      onClick={() => beginVisit.mutate()}
    >
      Begin Visit
    </Button>
  );
}
