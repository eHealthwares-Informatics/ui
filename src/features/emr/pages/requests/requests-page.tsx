import { Button, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { requestsConfig } from '../../registry/requests';
import { RequestForm } from '../../components/requests/request-form';
import { RequestRowActions } from '../../components/requests/request-row-actions';

export function RequestsPage() {
  const [opened, { open, close }] = useDisclosure(false);

  const config = useMemo(
    () => ({
      ...requestsConfig,
      renderHeaderActions: () => (
        <Button leftSection={<Plus size={16} />} onClick={open}>
          New Clinical Request
        </Button>
      ),
      columns: [
        ...requestsConfig.columns,
        {
          key: 'actions',
          label: '',
          render: (row: Record<string, unknown>) => (
            <Group gap={4} wrap="nowrap">
              <RequestRowActions row={row} />
            </Group>
          ),
        },
      ],
    }),
    [open],
  );

  return (
    <>
      <DataPageShell config={config as typeof requestsConfig} />
      <Modal opened={opened} onClose={close} title="New Clinical Request" size="lg" centered>
        <RequestForm onClose={close} />
      </Modal>
    </>
  );
}