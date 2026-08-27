import { ActionIcon, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MoreHorizontal, Pencil } from 'lucide-react';
import type { Staff } from '../../lib/emr-types';
import { StaffEditForm } from './staff-edit-form';

export function StaffRowActions({ row }: { row: Record<string, unknown> }) {
  const [opened, { open, close }] = useDisclosure(false);
  const staff = row as unknown as Staff;

  return (
    <>
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon variant="subtle" aria-label="Staff actions">
            <MoreHorizontal size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<Pencil size={14} />} onClick={open}>
            Edit Staff
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <StaffEditForm opened={opened} onClose={close} initial={staff} />
    </>
  );
}
