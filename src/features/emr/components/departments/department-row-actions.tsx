import { ActionIcon, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MoreHorizontal, Pencil } from 'lucide-react';
import type { Department } from '../../lib/emr-types';
import { DepartmentEditForm } from './department-edit-form';

export function DepartmentRowActions({ row }: { row: Record<string, unknown> }) {
  const [opened, { open, close }] = useDisclosure(false);
  const department = row as unknown as Department;

  return (
    <>
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon variant="subtle" aria-label="Department actions">
            <MoreHorizontal size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<Pencil size={14} />} onClick={open}>
            Edit Department
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <DepartmentEditForm opened={opened} onClose={close} initial={department} />
    </>
  );
}