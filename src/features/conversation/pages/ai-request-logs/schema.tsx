import { Text } from '@mantine/core';
import { ColumnDataType, ColumnTypeFilters } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';

const truncate = (value: unknown, max = 70): string => {
  const text = String(value ?? '');
  return text.length <= max ? text : `${text.slice(0, max)}…`;
};

export const aiRequestLogsConfig: ModelConfig = {
  id: 'ai-request-logs',
  apiProvider: conversationApi,
  title: 'AI Request Logs',
  description:
    'Full request/response audit for AI calls — prompts, completions, tokens and errors.',
  endpoint: '/ai/request-logs',
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
      render: (row) => (
        <Text size="xs" fw={600} c={row.outcome === 'success' ? 'green.7' : 'red.7'}>
          {String(row.outcome ?? '—')}
        </Text>
      ),
    },
    {
      key: 'latencyMs',
      label: 'Latency',
      render: (row) => `${Number(row.latencyMs ?? 0)} ms`,
    },
    {
      key: 'userMessage',
      label: 'Request',
      render: (row) => truncate(row.userMessage),
    },
    {
      key: 'responseText',
      label: 'Response',
      render: (row) => truncate(row.responseText ?? row.error),
    },
    { key: 'source', label: 'Source' },
  ],
};
