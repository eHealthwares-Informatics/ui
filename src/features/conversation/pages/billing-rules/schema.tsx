import { Badge, Text } from '@mantine/core';
import type { Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import {
  autocompleteField,
  buildFields,
  option,
  optionValue,
  pickUpdatePayload,
  selectField,
  switchField,
  uniqueOptions,
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

export type BillingChannelRef = {
  id: string;
  name?: string | null;
  code?: string | null;
  type?: string | null;
};

export type BillingQuestionnaireRef = {
  id: string;
  name?: string | null;
  code?: string | null;
};

export type BillingQuestionRef = {
  id: string;
  attribute?: string | null;
  text?: string | null;
};

export type BillingAiModelRef = {
  id: string;
  key?: string | null;
  label?: string | null;
};

export type BillingEventRef = {
  id: string;
  key?: string | null;
  label?: string | null;
};

export type BillingTemplateRef = {
  id: string;
  code?: string | null;
  name?: string | null;
};

const nullableText = (value: unknown) => {
  const text = String(value ?? '').trim();
  return text || null;
};

const nullableNumber = (value: unknown) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const money = (value: unknown) =>
  value === null || value === undefined ? '—' : `${Number(value)} coins`;

const optionFor =
  (options: Option[]) =>
  (value: unknown): Option | null => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return options.find((item) => item.value === String(value)) ?? option(value);
  };

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

const dimension = (key: string, label: string, resolve?: (value: unknown) => string) => ({
  key,
  label,
  sortable: false,
  render: (row: Record<string, unknown>) => {
    const raw = row[key];
    const text =
      raw === null || raw === undefined || raw === '' ? '—' : (resolve?.(raw) ?? String(raw));
    return (
      <Text size="xs" ff="monospace">
        {text}
      </Text>
    );
  },
});

/** Billing rules: coin pricing per channel/questionnaire/event/model/template. */
export function buildBillingRulesConfig(args: {
  organizationId: string | null;
  scopeKey?: string;
  scopeParams?: Record<string, string>;
  channels?: BillingChannelRef[];
  questionnaires?: BillingQuestionnaireRef[];
  questions?: BillingQuestionRef[];
  aiModels?: BillingAiModelRef[];
  events?: BillingEventRef[];
  templates?: BillingTemplateRef[];
}): ModelConfig {
  const {
    organizationId,
    scopeKey = organizationId ?? 'global',
    scopeParams = {},
    channels = [],
    questionnaires = [],
    questions = [],
    aiModels = [],
    events = [],
    templates = [],
  } = args;

  const channelOptions: Option[] = channels.map((channel) => ({
    value: channel.id,
    label: `${channel.name ?? channel.code ?? 'Channel'}${
      channel.code ? ` (${channel.code})` : ''
    }`,
  }));

  const questionnaireOptions: Option[] = questionnaires.map((questionnaire) => ({
    value: questionnaire.id,
    label: `${questionnaire.code ?? questionnaire.id}${
      questionnaire.name ? ` — ${questionnaire.name}` : ''
    }`,
  }));

  const questionOptions: Option[] = questions.map((question) => ({
    value: question.id,
    label: `${question.attribute ?? question.id}${question.text ? ` — ${question.text}` : ''}`,
  }));

  const aiModelOptions: Option[] = aiModels.map((model) => ({
    value: model.key ?? model.id,
    label: `${model.label ?? model.key ?? model.id}${model.key ? ` (${model.key})` : ''}`,
  }));

  const eventOptions: Option[] = events.map((event) => ({
    value: event.key ?? event.id,
    label: `${event.label ?? event.key ?? event.id}${event.key ? ` (${event.key})` : ''}`,
  }));

  // Templates are matched by code; global + org copies share codes, so dedupe.
  const templateOptions: Option[] = uniqueOptions(
    templates.map((template) => ({
      value: template.code ?? template.id,
      label: `${template.code ?? template.id}${template.name ? ` — ${template.name}` : ''}`,
    }))
  );

  const channelLabel = (value: unknown) =>
    channelOptions.find((item) => item.value === String(value))?.label ?? String(value);
  const questionnaireLabel = (value: unknown) =>
    questionnaireOptions.find((item) => item.value === String(value))?.label ?? String(value);
  const questionLabel = (value: unknown) =>
    questionOptions.find((item) => item.value === String(value))?.label ?? String(value);
  const aiModelLabel = (value: unknown) =>
    aiModelOptions.find((item) => item.value === String(value))?.label ?? String(value);
  const eventLabel = (value: unknown) =>
    eventOptions.find((item) => item.value === String(value))?.label ?? String(value);
  const templateLabel = (value: unknown) =>
    templateOptions.find((item) => item.value === String(value))?.label ?? String(value);

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
        key: 'id',
        label: 'ID',
      },
      {
        key: 'organizationId',
        label: 'Scope',
        render: (row) => scopeBadge(row),
      },
      dimension('channelId', 'Channel', channelLabel),
      dimension('questionnaire', 'Questionnaire', questionnaireLabel),
      dimension('question', 'Question', questionLabel),
      dimension('event', 'Event', eventLabel),
      dimension('aiModel', 'AI model', aiModelLabel),
      dimension('notificationTemplate', 'Notification template', templateLabel),
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
      autocompleteField('channelId', 'Channel', channelOptions, 6),
      autocompleteField('questionnaire', 'Questionnaire', questionnaireOptions, 6),
      autocompleteField('question', 'Question', questionOptions, 6),
      autocompleteField('event', 'Lifecycle event', eventOptions, 6),
      autocompleteField('aiModel', 'AI model', aiModelOptions, 6),
      autocompleteField('notificationTemplate', 'Notification template', templateOptions, 6),
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
      channelId: optionValue(values.channelId) ?? null,
      questionnaire: optionValue(values.questionnaire) ?? null,
      question: optionValue(values.question) ?? null,
      event: optionValue(values.event) ?? null,
      aiModel: optionValue(values.aiModel) ?? null,
      notificationTemplate: optionValue(values.notificationTemplate) ?? null,
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
    buildUpdatePayload: (values, row) => ({
      // Scope the PATCH to the row's own organisation (null = global); without
      // it a super-admin editing an org rule would resolve to the global scope.
      organizationId:
        row && 'organizationId' in row
          ? ((row.organizationId as string | null | undefined) ?? null)
          : (organizationId ?? null),
      ...pickUpdatePayload(values, {
        billTo: (value) => optionValue(value) ?? null,
        direction: (value) => optionValue(value) ?? null,
        channelId: (value) => optionValue(value) ?? null,
        questionnaire: (value) => optionValue(value) ?? null,
        question: (value) => optionValue(value) ?? null,
        event: (value) => optionValue(value) ?? null,
        aiModel: (value) => optionValue(value) ?? null,
        notificationTemplate: (value) => optionValue(value) ?? null,
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
    }),
    buildFormState: (row) => ({
      organizationId: row.organizationId ?? null,
      billTo: optionValue(row.billTo),
      direction: optionValue(row.direction),
      channelId: optionFor(channelOptions)(row.channelId),
      questionnaire: optionFor(questionnaireOptions)(row.questionnaire),
      question: optionFor(questionOptions)(row.question),
      event: optionFor(eventOptions)(row.event),
      aiModel: optionFor(aiModelOptions)(row.aiModel),
      notificationTemplate: optionFor(templateOptions)(row.notificationTemplate),
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
      channelId: null,
      questionnaire: null,
      question: null,
      event: null,
      aiModel: null,
      notificationTemplate: null,
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
