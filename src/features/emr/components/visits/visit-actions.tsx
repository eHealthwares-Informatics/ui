import { ActionIcon, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { emrApi } from '@/lib/emr-api';
import { getApiErrorMessage } from '../../lib/emr-errors';

export function VisitActions({ row }: { row: Record<string, unknown> }) {
  const queryClient = useQueryClient();
  const status = String(row.status ?? 'ONGOING');
  const id = String(row.id ?? '');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['emr', 'visits'] });
    queryClient.invalidateQueries({ queryKey: ['emr', 'appointments'] });
    queryClient.invalidateQueries({ queryKey: ['emr', 'dashboard'] });
  };

  const endVisit = useMutation({
    mutationFn: async () => {
      const { data } = await emrApi.post(`/visits/${id}/end`);
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Visit ended', color: 'teal' });
      invalidate();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const cancelVisit = useMutation({
    mutationFn: async () => {
      const { data } = await emrApi.post(`/visits/${id}/cancel`);
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Visit cancelled', color: 'teal' });
      invalidate();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  if (status !== 'ONGOING') {
    return <ActionIcon variant="subtle" color="gray" disabled aria-label="No actions"><MoreHorizontal size={16} /></ActionIcon>;
  }

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" aria-label="Visit actions">
          <MoreHorizontal size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => endVisit.mutate()}>End visit</Menu.Item>
        <Menu.Item color="red" onClick={() => cancelVisit.mutate()}>
          Cancel visit
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
