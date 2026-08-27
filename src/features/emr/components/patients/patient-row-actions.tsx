import { ActionIcon, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MoreHorizontal, Pencil } from 'lucide-react';
import type { PatientDetail } from '../../lib/emr-types';
import { PatientEditForm } from './patient-edit-form';

export function PatientRowActions({ row }: { row: Record<string, unknown> }) {
  const [opened, { open, close }] = useDisclosure(false);
  const patient = row as unknown as PatientDetail;

  return (
    <>
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon variant="subtle" aria-label="Patient actions">
            <MoreHorizontal size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<Pencil size={14} />} onClick={open}>
            Edit Patient
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <PatientEditForm opened={opened} onClose={close} initial={patient} />
    </>
  );
}
