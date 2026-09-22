import { Button, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { StaffForm } from '../../components/staff/staff-form';
import { StaffRowActions } from '../../components/staff/staff-row-actions';
import { staffConfig } from './schema';

export function StaffPage() {
  const [opened, { open, close }] = useDisclosure(false);

  const config = useMemo(
    () => ({
      ...staffConfig,
      renderHeaderActions: () => (
        <Button leftSection={<Plus size={16} />} onClick={open}>
          Register Staff
        </Button>
      ),
      columns: [
        ...staffConfig.columns,
        {
          key: 'actions',
          label: '',
          render: (row: Record<string, unknown>) => (
            <Group gap={4} wrap="nowrap">
              <StaffRowActions row={row} />
            </Group>
          ),
        },
      ],
    }),
    [open]
  );

  return (
    <>
      <DataPageShell config={config as typeof staffConfig} />
      <Modal opened={opened} onClose={close} title="Register Staff" size="lg" centered>
        <StaffForm onClose={close} />
      </Modal>
    </>
  );
}
