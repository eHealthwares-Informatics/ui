import { Button, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { visitsConfig } from '../../registry/visits';
import { VisitForm } from '../../components/visits/visit-form';
import { VisitActions } from '../../components/visits/visit-actions';

export function VisitsPage() {
  const [opened, { open, close }] = useDisclosure(false);

  const config = useMemo(
    () => ({
      ...visitsConfig,
      renderHeaderActions: () => (
        <Button leftSection={<Plus size={16} />} onClick={open}>
          Start Visit
        </Button>
      ),
      columns: [
        ...visitsConfig.columns,
        {
          key: 'actions',
          label: '',
          render: (row: Record<string, unknown>) => (
            <Group gap={4} wrap="nowrap">
              <VisitActions row={row} />
            </Group>
          ),
        },
      ],
    }),
    [open],
  );

  return (
    <>
      <DataPageShell config={config as typeof visitsConfig} />
      <Modal opened={opened} onClose={close} title="Start Visit" size="lg" centered>
        <VisitForm onClose={close} />
      </Modal>
    </>
  );
}