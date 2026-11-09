import { ColumnDataType, ColumnTypeFilters, EQUALS_WITH_OPTIONS } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import { INVITE_STATUS_OPTIONS } from '../../schemas/constants';
import { bool, jsonArray, shortText } from '../../schemas/helpers';

export const invitesConfig: ModelConfig = {
  id: 'invites',
  apiProvider: conversationApi,
  title: 'Invites',
  description: 'View conversation invites, provider assignments, and acceptance tracking.',
  endpoint: '/invites',
  detailPathBuilder: (row) => `/conversation/invites/${String(row.id)}`,
  columns: [
    { key: 'id', label: 'ID', render: (row) => shortText(row.id) },
    {
      key: 'conversationId',
      label: 'Conversation',
      filters: ColumnTypeFilters.STRING,
      render: (row) => shortText(row.conversationId),
    },
    {
      key: 'status',
      label: 'Status',
      filters: EQUALS_WITH_OPTIONS(INVITE_STATUS_OPTIONS),
    },
    {
      key: 'providers',
      label: 'Providers',
      render: (row) => {
        const providers = jsonArray(row.providers);
        return `${providers.length} provider${providers.length !== 1 ? 's' : ''}`;
      },
    },
    { key: 'acceptanceCount', label: 'Required' },
    { key: 'acceptedCount', label: 'Accepted' },
    {
      key: 'chatMode',
      label: 'Chat Mode',
      render: (row) => (bool(row.chatMode) ? 'Yes' : 'No'),
    },
    {
      key: 'timeoutAt',
      label: 'Timeout',
      render: (row) => {
        if (!row.timeoutAt) {
          return '—';
        }
        const d = new Date(Number(row.timeoutAt));
        return Number.isFinite(d.getTime()) ? d.toLocaleString() : '—';
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      dataType: ColumnDataType.DATE,
      sortable: true,
    },
  ],
};
