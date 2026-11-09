import { Text } from '@mantine/core';
import { ColumnDataType, ColumnTypeFilters } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import { shortText } from '../../schemas/helpers';

export const aiCostsConfig: ModelConfig = {
  id: 'ai-costs',
  apiProvider: conversationApi,
  title: 'AI Costs',
  description:
    'Per-call cost observability — tokens, latency, outcome and estimated USD cost for every AI provider call.',
  endpoint: '/ai/costs',
  canDelete: false,
  columns: [
    {
      key: 'calledAt',
      label: 'Called',
      dataType: ColumnDataType.DATE,
      sortable: true,
    },
    { key: 'provider', label: 'Provider', sortable: true, filters: ColumnTypeFilters.STRING },
    { key: 'model', label: 'Model', filters: ColumnTypeFilters.STRING },
    { key: 'callType', label: 'Call Type' },
    {
      key: 'outcome',
      label: 'Outcome',
      render: (row) => {
        const outcome = String(row.outcome ?? '');
        const color =
          outcome === 'success' ? 'green' : outcome === 'fallback_used' ? 'yellow' : 'red';
        return (
          <Text size="xs" fw={600} c={`${color}.7`}>
            {outcome || '—'}
          </Text>
        );
      },
    },
    {
      key: 'totalTokens',
      label: 'Tokens',
      render: (row) => `${Number(row.promptTokens ?? 0)} / ${Number(row.completionTokens ?? 0)}`,
    },
    {
      key: 'costUsd',
      label: 'Cost (USD)',
      render: (row) => Number(row.costUsd ?? 0).toFixed(6),
    },
    {
      key: 'latencyMs',
      label: 'Latency',
      render: (row) => `${Number(row.latencyMs ?? 0)} ms`,
    },
    { key: 'source', label: 'Source' },
    {
      key: 'conversationId',
      label: 'Conversation',
      render: (row) => shortText(row.conversationId),
    },
  ],
};
