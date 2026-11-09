import { Badge, Text } from '@mantine/core';
import type { ModelConfig } from '@/features/shared/model-schema';
import {
  buildFields,
  optionValue,
  pickUpdatePayload,
  selectField,
  switchField,
  textField,
  withDefaultActions,
} from '../../schemas/helpers';

export const BILL_TO_OPTIONS = [
  { value: 'ORGANISATION', label: 'Organisation' },
  { value: 'CHANNEL', label: 'Channel' },
  { value: 'PARTICIPANT', label: 'Participant' },
];

export const DIRECTION_OPTIONS = [
  { value: 'INBOUND', label: 'Inbound' },
  { value: 'OUTBOUND', label: 'Outbound' },
];

const nullableText = (value: unknown) => {
  const text = String(value ?? '').trim();
  return text || null;
};

const nullableNumber = (value: unknown) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const money = (value: unknown) =>
  value === null || value === undefined ? '—' : `${Number(value)} coins`;

function scopeBadge(row: Record<string, unknown>) {
  return row.organizationId ? (
    <Badge size="xs" variant="light">
      {String(row.organizationId).slice(0, 8)}
    </Badge>
  ) : (
    <Badge size="xs" color="gray" variant="light">
      global
    </Badge>
  );
}

const dimension = (key: string, label: string) => ({
  key,
  label,
  sortable: false,
  render: (row: Record<string, unknown>) => (
    <Text size="xs" ff="monospace">
      {row[key] ? String(row[key]) : '—'}
    </Text>
  ),
});

/** Billing rules: coin pricing per channel/questionnaire/event/model/template. */
export function buildBillingRulesConfig(args: {
  organizationId: string | null;
  scopeKey?: string;
  scopeParams?: Record<string, string>;
  canManageGlobal?: boolean;
}): ModelConfig {
  const { organizationId, scopeKey = organizationId ?? 'global', scopeParams = {} } = args;

  return withDefaultActions({
    id: 'billing-rules',
    title: 'Billing Rules',
    description:
      'Coin pricing per channel, questionnaire, event, AI model or notification template.',
    endpoint: '/billing/rules',
    listParamStyle: 'plain',
    queryKeyBase: ['billing-rules', scopeKey],
    listParams: {
      ...scopeParams,
    },
    columns: [
      {
        key: 'organizationId',
        label: 'Scope',
        render: (row) => scopeBadge(row),
      },
      dimension('channel', 'Channel'),
      dimension('questionnaire', 'Questionnaire'),
      dimension('event', 'Event'),
      dimension('aiModel', 'AI model'),
      dimension('notificationTemplate', 'Notification template'),
      {
        key: 'coins',
        label: 'Coins',
        sortable: true,
        render: (row) => <Text size="sm">{money(row.coins ?? row.coinsPer1kTokens)}</Text>,
      },
      { key: 'priority', label: 'Priority', sortable: true },
      {
        key: 'active',
        label: 'Active',
        sortable: true,
        render: (row) => (
          <Badge size="xs" color={row.active === false ? 'gray' : 'green'} variant="light">
            {row.active === false ? 'Inactive' : 'Active'}
          </Badge>
        ),
      },
      {
        key: 'updatedAt',
        label: 'Updated',
        sortable: true,
        render: (row) => (row.updatedAt ? new Date(String(row.updatedAt)).toLocaleString() : '—'),
      },
    ],
    createFieldGroups: buildFields([
      selectField('billTo', 'Bill to', BILL_TO_OPTIONS, 6),
      selectField('direction', 'Direction', DIRECTION_OPTIONS, 6),
      textField('channel', 'Channel', 6),
      textField('questionnaire', 'Questionnaire code', 6),
      textField('question', 'Question id', 6),
      textField('event', 'Event key', 6),
      textField('aiModel', 'AI model', 6),
      textField('notificationTemplate', 'Notification template code', 6),
      {
        name: 'coins',
        label: 'Coins per send',
        type: 'number',
        min: 0,
        col: 6,
      },
      {
        name: 'coinsPer1kTokens',
        label: 'Coins per 1k tokens',
        type: 'number',
        min: 0,
        col: 6,
      },
      {
        name: 'markupBps',
        label: 'Markup (bps)',
        type: 'number',
        min: 0,
        col: 6,
      },
      {
        name: 'markupCoins',
        label: 'Markup (coins)',
        type: 'number',
        min: 0,
        col: 6,
      },
      {
        name: 'priority',
        label: 'Priority (lower wins)',
        type: 'number',
        min: 0,
        col: 6,
      },
      switchField('active', 'Active'),
      switchField('reask', 'Applies to re-asks'),
      { name: 'effectiveFrom', label: 'Effective from', type: 'date', col: 6 },
      { name: 'effectiveTo', label: 'Effective to', type: 'date', col: 6 },
    ]),
    modalTitle: 'Billing rule',
    buildCreatePayload: (values) => ({
      organizationId:
        values.organizationId === null ? null : (values.organizationId ?? organizationId ?? null),
      billTo: optionValue(values.billTo) ?? null,
      direction: optionValue(values.direction) ?? null,
      channel: nullableText(values.channel),
      questionnaire: nullableText(values.questionnaire),
      question: nullableText(values.question),
      event: nullableText(values.event),
      aiModel: nullableText(values.aiModel),
      notificationTemplate: nullableText(values.notificationTemplate),
      coins: nullableNumber(values.coins),
      coinsPer1kTokens: nullableNumber(values.coinsPer1kTokens),
      markupBps: nullableNumber(values.markupBps),
      markupCoins: nullableNumber(values.markupCoins),
      priority: Number(values.priority ?? 0),
      active: values.active !== false,
      reask: values.reask === undefined || values.reask === '' ? null : values.reask === true,
      effectiveFrom: nullableText(values.effectiveFrom),
      effectiveTo: nullableText(values.effectiveTo),
    }),
    buildUpdatePayload: (values) =>
      pickUpdatePayload(values, {
        billTo: (value) => optionValue(value) ?? null,
        direction: (value) => optionValue(value) ?? null,
        channel: nullableText,
        questionnaire: nullableText,
        question: nullableText,
        event: nullableText,
        aiModel: nullableText,
        notificationTemplate: nullableText,
        coins: nullableNumber,
        coinsPer1kTokens: nullableNumber,
        markupBps: nullableNumber,
        markupCoins: nullableNumber,
        priority: (value) => Number(value ?? 0),
        active: (value) => value !== false,
        reask: (value) => (value === undefined || value === '' ? null : value === true),
        effectiveFrom: nullableText,
        effectiveTo: nullableText,
      }),
    buildFormState: (row) => ({
      organizationId: row.organizationId ?? null,
      billTo: optionValue(row.billTo),
      direction: optionValue(row.direction),
      channel: row.channel ?? '',
      questionnaire: row.questionnaire ?? '',
      question: row.question ?? '',
      event: row.event ?? '',
      aiModel: row.aiModel ?? '',
      notificationTemplate: row.notificationTemplate ?? '',
      coins: row.coins ?? '',
      coinsPer1kTokens: row.coinsPer1kTokens ?? '',
      markupBps: row.markupBps ?? '',
      markupCoins: row.markupCoins ?? '',
      priority: row.priority ?? 0,
      active: row.active !== false,
      reask: row.reask ?? null,
      effectiveFrom: row.effectiveFrom ?? '',
      effectiveTo: row.effectiveTo ?? '',
    }),
    defaultState: {
      organizationId,
      billTo: null,
      direction: null,
      channel: '',
      questionnaire: '',
      question: '',
      event: '',
      aiModel: '',
      notificationTemplate: '',
      coins: '',
      coinsPer1kTokens: '',
      markupBps: '',
      markupCoins: '',
      priority: 0,
      active: true,
      reask: null,
      effectiveFrom: '',
      effectiveTo: '',
    },
    defaultSort: { sortBy: 'priority', sortOrder: 'asc' },
    deletePathBuilder: (row) =>
      `/billing/rules/${row.id}${
        row.organizationId
          ? `?organizationId=${encodeURIComponent(String(row.organizationId))}`
          : ''
      }`,
  });
}
