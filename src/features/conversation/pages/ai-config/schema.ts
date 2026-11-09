import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';

export const aiSettingsConfig: ModelConfig = {
  id: 'ai-config',
  apiProvider: conversationApi,
  title: 'AI Configuration',
  description:
    'Current AI routing defaults and provider status (models + keys are stored in the database).',
  endpoint: '/ai/config',
  columns: [
    { key: 'setting', label: 'Setting' },
    { key: 'value', label: 'Value' },
  ],
};
