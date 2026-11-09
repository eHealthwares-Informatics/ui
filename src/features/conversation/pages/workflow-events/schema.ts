import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';

export const workflowEventsConfig: ModelConfig = {
  id: 'workflow-events',
  apiProvider: conversationApi,
  title: 'Workflow Events',
  description: 'Monitor workflow events and inspect payloads for transition debugging.',
  endpoint: '/workflow-events',
  columns: [
    { key: 'workflowInstanceId', label: 'Workflow Instance' },
    { key: 'type', label: 'Type' },
    { key: 'correlationId', label: 'Correlation' },
    { key: 'sequence', label: 'Sequence' },
    {
      key: 'payload',
      label: 'Payload',
      render: (row) => JSON.stringify(row.payload ?? {}).slice(0, 80),
    },
  ],
};
