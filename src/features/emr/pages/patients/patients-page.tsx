import { Button, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { patientsConfig } from '../../registry/patients';
import { PatientForm } from '../../components/patients/patient-form';
import { PatientRowActions } from '../../components/patients/patient-row-actions';

export function PatientsPage() {
  const [opened, { open, close }] = useDisclosure(false);

  const config = useMemo(
    () => ({
      ...patientsConfig,
      renderHeaderActions: () => (
        <Button leftSection={<Plus size={16} />} onClick={open}>
          Register Patient
        </Button>
      ),
      columns: [
        ...patientsConfig.columns,
        {
          key: 'actions',
          label: '',
          render: (row: Record<string, unknown>) => (
            <Group gap={4} wrap="nowrap">
              <PatientRowActions row={row} />
            </Group>
          ),
        },
      ],
    }),
    [open],
  );

  return (
    <>
      <DataPageShell config={config as typeof patientsConfig} />
      <Modal opened={opened} onClose={close} title="Register Patient" size="lg" centered>
        <PatientForm onClose={close} />
      </Modal>
    </>
  );
}