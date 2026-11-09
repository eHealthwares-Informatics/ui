import type { ModelConfig } from '@/features/shared/model-schema';
import { BROADCAST_STATUS_OPTIONS } from '../../schemas/constants';
import {
  asyncField,
  bool,
  buildFields,
  jsonArray,
  jsonField,
  jsonObject,
  numberValue,
  option,
  optionValue,
  pickUpdatePayload,
  selectField,
  shortText,
  switchField,
  text,
  textField,
  withDefaultActions,
} from '../../schemas/helpers';

export const broadcastsConfig: ModelConfig = withDefaultActions({
  id: 'broadcasts',
  title: 'Broadcasts',
  description: 'Manage conversation broadcasts, provider assignments, and acceptance tracking.',
  endpoint: '/broadcasts',
  columns: [
    { key: 'id', label: 'ID', render: (row) => shortText(row.id) },
    {
      key: 'conversationId',
      label: 'Conversation',
      render: (row) => shortText(row.conversationId),
    },
    { key: 'status', label: 'Status' },
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
      render: (row) => {
        if (!row.createdAt) {
          return '—';
        }
        const d = new Date(row.createdAt as any);
        return Number.isFinite(d.getTime()) ? d.toLocaleString() : '—';
      },
    },
  ],
  createFieldGroups: buildFields([
    asyncField('conversationId', 'Conversation', '/conversations'),
    selectField('status', 'Status', BROADCAST_STATUS_OPTIONS),
    jsonField('target', 'Target'),
    jsonField('providers', 'Providers'),
    textField('acceptanceCount', 'Acceptance Count'),
    switchField('chatMode', 'Chat Mode'),
    textField('timeoutAt', 'Timeout (epoch ms)'),
  ]),
  defaultState: {
    conversationId: null,
    status: option('AWAITING'),
    target: {},
    providers: [],
    acceptanceCount: 1,
    chatMode: false,
    timeoutAt: '',
  },
  buildFormState: (row) => ({
    conversationId: option(row.conversationId),
    status: option(row.status || 'AWAITING'),
    target: jsonObject(row.target),
    providers: jsonArray(row.providers),
    acceptanceCount: numberValue(row.acceptanceCount, 1),
    chatMode: bool(row.chatMode),
    timeoutAt: row.timeoutAt ? String(row.timeoutAt) : '',
  }),
  buildCreatePayload: (values) => ({
    conversationId: optionValue(values.conversationId),
    status: optionValue(values.status),
    target: jsonObject(values.target),
    providers: jsonArray(values.providers),
    acceptanceCount: numberValue(values.acceptanceCount, 1),
    chatMode: bool(values.chatMode),
    timeoutAt: text(values.timeoutAt).trim() ? Number(text(values.timeoutAt).trim()) : undefined,
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      conversationId: (v) => optionValue(v),
      status: (v) => optionValue(v),
      target: (v) => jsonObject(v),
      providers: (v) => jsonArray(v),
      acceptanceCount: (v) => numberValue(v, 1),
      chatMode: (v) => bool(v),
      timeoutAt: (v) => (text(v).trim() ? Number(text(v).trim()) : undefined),
    }),
});
