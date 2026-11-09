import { ColumnDataType, ColumnTypeFilters, EQUALS_WITH_OPTIONS } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import { PROJECTION_ROLE_OPTIONS, PROJECTION_STATUS_OPTIONS } from '../../schemas/constants';
import { shortText } from '../../schemas/helpers';

export const projectionsConfig: ModelConfig = {
  id: 'projections',
  apiProvider: conversationApi,
  title: 'Projections',
  description: 'View conversation participant projections, roles, and activity.',
  endpoint: '/projections',
  detailPathBuilder: (row) => `/conversation/projections/${String(row.id)}`,
  columns: [
    { key: 'id', label: 'ID', render: (row) => shortText(row.id) },
    { key: 'participant.phone', label: 'Phone', filters: ColumnTypeFilters.STRING },
    {
      key: 'participant',
      label: 'Participant',
      filters: ColumnTypeFilters.STRING,
      render: (row) => {
        const p = row.participant as Record<string, unknown> | undefined;
        return [p?.firstName, p?.lastName].filter(Boolean).join(' ') || '-';
      },
    },
    {
      key: 'conversationId',
      label: 'Conversation',
      filters: ColumnTypeFilters.STRING,
      render: (row) => shortText(row.conversationId),
    },
    {
      key: 'role',
      label: 'Role',
      filters: EQUALS_WITH_OPTIONS(PROJECTION_ROLE_OPTIONS),
    },
    {
      key: 'status',
      label: 'Status',
      filters: EQUALS_WITH_OPTIONS(PROJECTION_STATUS_OPTIONS),
    },
    {
      key: 'isPrimary',
      label: 'Primary',
      render: (row) => (row.isPrimary ? 'Yes' : 'No'),
    },
    {
      key: 'lastMessageText',
      label: 'Last Message',
      render: (row) => {
        const t = String(row.lastMessageText ?? '');
        return t.length < 60 ? t : `${t.slice(0, 60)}...`;
      },
    },
    { key: 'lastMessageAt', label: 'Last Activity', dataType: ColumnDataType.DATE, sortable: true },
    { key: 'unreadCount', label: 'Unread' },
  ],
};
