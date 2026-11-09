import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import { AI_PROVIDER_OPTIONS } from '../../schemas/ai-constants';
import {
  bool,
  buildFields,
  option,
  optionValue,
  pickUpdatePayload,
  selectField,
  switchField,
  text,
  textField,
} from '../../schemas/helpers';

export const aiProvidersConfig: ModelConfig = {
  id: 'ai-providers',
  apiProvider: conversationApi,
  title: 'AI Providers',
  description:
    'Provider credentials. Set/rotate the shared API key here — a model uses its own key when set, otherwise it falls back to its provider key.',
  endpoint: '/ai/providers',
  canDelete: false,
  columns: [
    { key: 'code', label: 'Provider', sortable: true },
    { key: 'name', label: 'Name' },
    {
      key: 'configured',
      label: 'Configured',
      render: (row) => ((row as any).configured ? '✅ Yes' : '❌ No'),
    },
    { key: 'modelCount', label: 'Models' },
    { key: 'baseUrl', label: 'Base URL' },
    { key: 'isActive', label: 'Active' },
  ],
  createFieldGroups: buildFields([
    selectField('code', 'Provider Code', AI_PROVIDER_OPTIONS),
    textField('name', 'Name'),
    textField('apiKey', 'API Key'),
    textField('baseUrl', 'Base URL'),
    switchField('isActive', 'Active'),
  ]),
  defaultState: {
    code: option('openai'),
    name: '',
    apiKey: '',
    baseUrl: '',
    isActive: true,
  },
  buildFormState: (row) => ({
    // Never echo the stored key back to the client.
    code: option(row.code),
    name: text(row.name),
    apiKey: '',
    baseUrl: text(row.baseUrl),
    isActive: bool(row.isActive, true),
  }),
  buildCreatePayload: (values) => ({
    code: optionValue(values.code),
    name: text(values.name).trim(),
    apiKey: text(values.apiKey).trim() || undefined,
    baseUrl: text(values.baseUrl).trim() || undefined,
    isActive: bool(values.isActive, true),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      name: (v) => text(v).trim(),
      // Only send apiKey when the admin typed a new one (empty = keep).
      apiKey: (v) => (text(v).trim() ? text(v).trim() : undefined),
      baseUrl: (v) => text(v).trim() || undefined,
      isActive: (v) => bool(v, true),
    }),
};
