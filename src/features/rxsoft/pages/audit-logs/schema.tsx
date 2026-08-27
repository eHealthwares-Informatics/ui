import { Badge } from '@mantine/core';
import type { ModelConfig } from '../../../shared/model-schema';
import type { Column } from '../../types';

const columns: Column[] = [
  {
    key: 'action',
    label: 'Action',
  },
  {
    key: 'actorUsername',
    label: 'Actor',
    render: (row) => String(row.actorUsername ?? '—'),
  },
  {
    key: 'httpMethod',
    label: 'Method',
  },
  {
    key: 'httpPath',
    label: 'Path',
  },
  {
    key: 'statusCode',
    label: 'Status',
    render: (row) => {
      const code = Number(row.statusCode);
      const color = code >= 500 ? 'red' : code >= 400 ? 'orange' : code >= 300 ? 'yellow' : 'green';
      return (
        <Badge size="xs" variant="light" color={color}>
          {String(row.statusCode ?? '—')}
        </Badge>
      );
    },
  },
  {
    key: 'durationMs',
    label: 'Duration (ms)',
    render: (row) => String(row.durationMs ?? '—'),
  },
  {
    key: 'createdAt',
    label: 'Created',
    render: (row) => {
      if (!row.createdAt) {
        return '-';
      }
      return new Date(row.createdAt as string).toLocaleString();
    },
  },
];

export const auditLogsConfig: ModelConfig = {
  id: 'audit-logs',
  title: 'Audit Logs',
  description: 'Read-only system audit trail.',
  endpoint: '/audit-logs',
  columns,
};
