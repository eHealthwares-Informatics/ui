import { Group, Modal } from '@mantine/core';
import { useMemo } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { RequestForm } from '../../components/requests/request-form';
import { RequestRowActions } from '../../components/requests/request-row-actions';
import { requestsConfig } from './schema';

export function RequestsPage() {
  const config = useMemo(
    () => ({
      ...requestsConfig,
      renderCreateModal: ({ onClose }: { onClose: () => void }) => (
        <Modal opened onClose={onClose} title="New Clinical Request" size="lg">
          <RequestForm onClose={onClose} />
        </Modal>
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
    []
  );

  return <DataPageShell config={config as typeof requestsConfig} />;
}
