import { ActionIcon, Menu, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquarePlus, MoreHorizontal } from 'lucide-react';
import { emrApi } from '@/lib/emr-api';
import { getApiErrorMessage } from '../../lib/emr-errors';
import { AdmitFromVisitModal } from './admit-from-visit-modal';
import { VisitCommentsPanel } from './visit-comments';

export function VisitActions({ row }: { row: Record<string, unknown> }) {
  const queryClient = useQueryClient();
  const status = String(row.status ?? 'ONGOING');
  const id = String(row.id ?? '');
  const [commentOpened, { open: openComment, close: closeComment }] = useDisclosure(false);
  const [admitOpened, { open: openAdmit, close: closeAdmit }] = useDisclosure(false);

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
    return (
      <>
        <ActionIcon variant="subtle" aria-label="Visit actions" onClick={openComment}>
          <MessageSquarePlus size={16} />
        </ActionIcon>
        <Modal
          opened={commentOpened}
          onClose={closeComment}
          title="Visit comments"
          size="md"
          centered
        >
          <VisitCommentsPanel visitId={id} />
        </Modal>
      </>
    );
  }

  return (
    <>
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon variant="subtle" aria-label="Visit actions">
            <MoreHorizontal size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<MessageSquarePlus size={14} />} onClick={openComment}>
            Add comment
          </Menu.Item>
          <Menu.Item onClick={openAdmit}>Convert to admission…</Menu.Item>
          <Menu.Item onClick={() => endVisit.mutate()}>End visit</Menu.Item>
          <Menu.Item color="red" onClick={() => cancelVisit.mutate()}>
            Cancel visit
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <Modal
        opened={commentOpened}
        onClose={closeComment}
        title="Visit comments"
        size="md"
        centered
      >
        <VisitCommentsPanel visitId={id} />
      </Modal>
      <AdmitFromVisitModal
        opened={admitOpened}
        onClose={closeAdmit}
        visitId={id}
        patientLabel={String(row.patientName ?? row.patientId ?? 'patient')}
      />
    </>
  );
}
