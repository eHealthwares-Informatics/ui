import { Text } from '@mantine/core';
import {
  ColumnDataType,
  ColumnTypeFilters,
  EQUALS_WITH_OPTIONS,
  type Field,
  type FieldGroup,
  type Option,
} from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import {
  CHANNEL_TYPE_OPTIONS,
  CONVERSATION_STATE_OPTIONS,
  CONVERSATION_STATUS_OPTIONS,
  EXCHANGE_DIRECTION_OPTIONS,
  EXCHANGE_STATUS_OPTIONS,
  PROCESSING_STRATEGY_OPTIONS,
  PROCESS_MODE_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  RENDER_MODE_OPTIONS,
  WORKFLOW_STATUS_OPTIONS,
  WORKFLOW_STEP_TYPE_OPTIONS,
} from '../types/constants';
import { ParticipantCell } from './participant-cell';

const option = (value?: unknown, fallbackLabel?: unknown): Option | null => {
  if (value == null || value === '') {
    return null;
  }
  return {
    value: String(value),
    label: String(fallbackLabel ?? value),
  };
};

const optionValue = (value: unknown) => {
  if (value && typeof value === 'object' && 'value' in value) {
    return String((value as Option).value);
  }
  return value ? String(value) : undefined;
};

const jsonObject = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const jsonArray = (value: unknown) => (Array.isArray(value) ? value : []);

const text = (value: unknown) => String(value ?? '');

const bool = (value: unknown, fallback = false) => (typeof value === 'boolean' ? value : fallback);

const numberValue = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Builds an update payload containing ONLY keys present in `values`
 * (i.e. the dirty-field subset), so PATCH only sends changed fields.
 */
const pickUpdatePayload = (
  values: Record<string, unknown>,
  map: Record<string, (value: unknown, values: Record<string, unknown>) => unknown>
) => {
  const payload: Record<string, unknown> = {};
  Object.entries(map).forEach(([key, fn]) => {
    if (key in values) {
      payload[key] = fn(values[key], values);
    }
  });
  return payload;
};

const asyncField = (name: string, label: string, endpoint: string, labelKey = 'name'): Field => ({
  name,
  label,
  type: 'async-select',
  col: 6,
  searchParam: {
    endpoint,
    queryParam: 'search',
    minChars: 0,
    valueKey: 'id',
    labelKey,
  },
});

const selectField = (name: string, label: string, options: Option[], col = 6): Field => ({
  name,
  label,
  type: 'select',
  options,
  col,
});

const textField = (name: string, label: string, col = 6): Field => ({
  name,
  label,
  type: 'text',
  col,
});

const jsonField = (name: string, label: string): Field => ({
  name,
  label,
  type: 'json',
  col: 12,
});

const switchField = (name: string, label: string, col = 6): Field => ({
  name,
  label,
  type: 'switch',
  col,
});

const buildFields = (fields: Field[]): FieldGroup[] => [{ fields }];

const withDefaultActions = (config: Omit<ModelConfig, 'canDelete'>): ModelConfig => ({
  canDelete: true,
  apiProvider: conversationApi,
  ...config,
});

export const channelPageSchema: ModelConfig = withDefaultActions({
  id: 'channels',
  title: 'Channels',
  description: 'Manage delivery channels, providers, activation, and metadata.',
  endpoint: '/channels',
  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'provider', label: 'Provider' },
    { key: 'externalId', label: 'External ID' },
    { key: 'isActive', label: 'Active' },
  ],
  createFieldGroups: buildFields([
    textField('name', 'Name'),
    selectField('type', 'Type', CHANNEL_TYPE_OPTIONS),
    textField('provider', 'Provider'),
    textField('externalId', 'External ID'),
    switchField('isActive', 'Active'),
    jsonField('metadata', 'Metadata'),
  ]),
  defaultState: {
    name: '',
    type: option('WEB'),
    provider: '',
    externalId: '',
    metadata: {},
    isActive: true,
  },
  buildFormState: (row) => ({
    name: text(row.name),
    type: option(row.type),
    provider: text(row.provider),
    externalId: text(row.externalId),
    metadata: jsonObject(row.metadata),
    isActive: bool(row.isActive, true),
  }),
  buildCreatePayload: (values) => ({
    name: text(values.name).trim(),
    type: optionValue(values.type),
    provider: text(values.provider).trim() || undefined,
    externalId: text(values.externalId).trim() || undefined,
    metadata: jsonObject(values.metadata),
    isActive: bool(values.isActive, true),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      name: (v) => text(v).trim(),
      type: (v) => optionValue(v),
      provider: (v) => text(v).trim() || undefined,
      externalId: (v) => text(v).trim() || undefined,
      metadata: (v) => jsonObject(v),
      isActive: (v) => bool(v, true),
    }),
});

const shortText = (value: unknown) => {
  const id = String(value ?? '');
  const short = id.length > 10 ? `${id.slice(0, 4)}...${id.slice(-4)}` : id;
  return (
    <Text
      component="span"
      title={id}
      size="sm"
      style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
    >
      {short}
    </Text>
  );
};
export const questionOptionPageSchema: ModelConfig = withDefaultActions({
  id: 'question-options',
  title: 'Options',
  description: 'Define answer options for choice-type questions.',
  endpoint: '/option-lists',
  columns: [
    { key: 'key', label: 'Key' },
    { key: 'value', label: 'Value' },
    { key: 'label', label: 'Label' },
    { key: 'index', label: 'Order' },
  ],
  createFieldGroups: buildFields([
    textField('key', 'Key'),
    textField('value', 'Value'),
    textField('label', 'Label'),
    { ...textField('index', 'Order'), type: 'number' },
    textField('jumpToQuestionId', 'Jump To Question'),
    textField('backToQuestionId', 'Back To Question'),
    textField('childQuestionnaireId', 'Child Questionnaire'),
    jsonField('metadata', 'Metadata'),
  ]),
  defaultState: {
    key: '',
    value: '',
    label: '',
    index: 1,
    jumpToQuestionId: '',
    backToQuestionId: '',
    childQuestionnaireId: '',
    metadata: {},
  },
  buildFormState: (row) => ({
    key: text(row.key),
    value: text(row.value),
    label: text(row.label),
    index: numberValue(row.index, 1),
    jumpToQuestionId: text(row.jumpToQuestionId),
    backToQuestionId: text(row.backToQuestionId),
    childQuestionnaireId: text(row.childQuestionnaireId),
    metadata: jsonObject(row.metadata),
  }),
  buildCreatePayload: (values) => ({
    key: text(values.key).trim(),
    value: text(values.value).trim(),
    label: text(values.label).trim(),
    index: numberValue(values.index, 1),
    jumpToQuestionId: text(values.jumpToQuestionId).trim() || undefined,
    backToQuestionId: text(values.backToQuestionId).trim() || undefined,
    childQuestionnaireId: text(values.childQuestionnaireId).trim() || undefined,
    metadata: jsonObject(values.metadata),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      key: (v) => text(v).trim(),
      value: (v) => text(v).trim(),
      label: (v) => text(v).trim(),
      index: (v) => numberValue(v, 1),
      jumpToQuestionId: (v) => text(v).trim() || undefined,
      backToQuestionId: (v) => text(v).trim() || undefined,
      childQuestionnaireId: (v) => text(v).trim() || undefined,
      metadata: (v) => jsonObject(v),
    }),
});

export const optionListsPageSchema: ModelConfig = withDefaultActions({
  id: 'option-lists',
  title: 'Option Lists',
  description: 'Define reusable option lists that choice-type questions can reference.',
  endpoint: '/option-lists',
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'options',
      label: 'Options',
      render: (row) => `${(row as any).options?.length ?? 0} options`,
    },
    {
      key: 'createdAt',
      label: 'Created At',
      dataType: ColumnDataType.DATE,
      sortable: true,
    },
  ],
  createFieldGroups: buildFields([
    textField('name', 'Name'),
    {
      name: 'options',
      label: 'Options',
      type: 'json-accordion-array',
      col: 12,
      itemLabelKey: 'label',
      itemRender: (item: any) => `${item.key ?? '?'}: ${item.label ?? '-'}`,
      itemEditConfig: questionOptionPageSchema,
    },
    jsonField('tags', 'Tags'),
    jsonField('metadata', 'Metadata'),
  ]),
  defaultState: {
    name: '',
    options: [],
    tags: [],
    metadata: {},
  },
  buildFormState: (row) => ({
    name: text(row.name),
    options: jsonArray(row.options),
    tags: jsonArray(row.tags),
    metadata: jsonObject(row.metadata),
  }),
  buildCreatePayload: (values) => ({
    name: text(values.name).trim(),
    options: jsonArray(values.options),
    tags: jsonArray(values.tags),
    metadata: jsonObject(values.metadata),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      name: (v) => text(v).trim(),
      options: (v) => jsonArray(v),
      tags: (v) => jsonArray(v),
      metadata: (v) => jsonObject(v),
    }),
});

export const questionPageSchema: ModelConfig = withDefaultActions({
  id: 'questions',
  title: 'Questions',
  description: 'Browse and edit questionnaire questions with schema-based fields.',
  endpoint: '/questions',
  columns: [
    { key: 'index', label: '#', sortable: true },
    { key: 'attribute', label: 'Attribute', sortable: true },
    { key: 'text', label: 'Text', sortable: true },
    { key: 'questionType', label: 'Type', sortable: true },
    { key: 'renderMode', label: 'Render' },
    { key: 'processMode', label: 'Process' },
    { key: 'isRequired', label: 'Required' },
    { key: 'isActive', label: 'Active', sortable: true },
    { key: 'createdAt', label: 'Created At', dataType: ColumnDataType.DATE, sortable: true },
  ],
  createFieldGroups: buildFields([
    asyncField('questionnaireId', 'Questionnaire', '/questionnaires'),
    asyncField('optionListId', 'Option List', '/option-lists'),
    { ...textField('index', 'Index'), type: 'number' },
    textField('attribute', 'Attribute'),
    { name: 'text', label: 'Text', type: 'textarea', col: 12 },
    selectField('questionType', 'Question Type', QUESTION_TYPE_OPTIONS),
    selectField('renderMode', 'Render Mode', RENDER_MODE_OPTIONS),
    selectField('processMode', 'Process Mode', PROCESS_MODE_OPTIONS),
    switchField('isRequired', 'Required'),
    switchField('isActive', 'Active'),
    {
      name: 'options',
      label: 'Options',
      type: 'json-accordion-array',
      col: 12,
      itemLabelKey: 'label',
      itemRender: (item: any) => `${item.key ?? '?'}: ${item.label ?? '-'}`,
      itemEditConfig: questionOptionPageSchema,
    },
    jsonField('validationRules', 'Validation Rules'),
    jsonField('metadata', 'Metadata'),
  ]),
  defaultState: {
    questionnaireId: null,
    optionListId: null,
    index: 1,
    attribute: '',
    text: '',
    questionType: option('text'),
    renderMode: option('input'),
    processMode: option('none'),
    isRequired: false,
    isActive: true,
    options: [],
    validationRules: [],
    metadata: {},
  },
  buildFormState: (row) => ({
    questionnaireId: option(row.questionnaireId),
    optionListId: option(row.optionListId),
    index: numberValue(row.index, 1),
    attribute: text(row.attribute),
    text: text(row.text),
    questionType: option(row.questionType || 'text'),
    renderMode: option(row.renderMode || 'input'),
    processMode: option(row.processMode || 'none'),
    isRequired: bool(row.isRequired),
    isActive: bool(row.isActive, true),
    options: jsonArray(row.options),
    validationRules: jsonArray(row.validationRules),
    metadata: jsonObject(row.metadata),
  }),
  buildCreatePayload: (values) => ({
    questionnaireId: optionValue(values.questionnaireId),
    optionListId: optionValue(values.optionListId) || undefined,
    index: numberValue(values.index, 1),
    attribute: text(values.attribute).trim(),
    text: text(values.text).trim(),
    questionType: optionValue(values.questionType),
    renderMode: optionValue(values.renderMode),
    processMode: optionValue(values.processMode),
    isRequired: bool(values.isRequired),
    isActive: bool(values.isActive, true),
    options: jsonArray(values.options),
    validationRules: jsonArray(values.validationRules),
    metadata: jsonObject(values.metadata),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      questionnaireId: (v) => optionValue(v),
      optionListId: (v) => optionValue(v) || undefined,
      index: (v) => numberValue(v, 1),
      attribute: (v) => text(v).trim(),
      text: (v) => text(v).trim(),
      questionType: (v) => optionValue(v),
      renderMode: (v) => optionValue(v),
      processMode: (v) => optionValue(v),
      isRequired: (v) => bool(v),
      isActive: (v) => bool(v, true),
      options: (v) => jsonArray(v),
      validationRules: (v) => jsonArray(v),
      metadata: (v) => jsonObject(v),
    }),
});

export const conversationPageSchema: ModelConfig = withDefaultActions({
  id: 'conversations',
  title: 'Conversations',
  description: 'Create and manage conversation sessions, participant linkage, and saved context.',
  endpoint: '/conversations',
  editPathBuilder: (row) => `/conversation/${String(row.id)}/edit`,
  columns: [
    { key: 'id', label: 'Conversation ID', render: (row) => shortText(row.id) },
    {
      key: 'questionnaireId',
      label: 'Questionnaire',
      render: (row) => (row as any).questionnaire?.name ?? shortText(row.questionnaireId),
    },
    {
      key: 'channelId',
      label: 'Channel',
      render: (row) => (row as any).channel?.name ?? shortText(row.channelId),
    },
    {
      key: 'currentQuestionId',
      label: 'Current Question',
      render: (row) => (row as any).currentQuestion?.text ?? shortText(row.currentQuestionId),
    },
    { key: 'status', label: 'Status' },
    { key: 'state', label: 'State' },
  ],
  createFieldGroups: buildFields([
    asyncField('questionnaireId', 'Questionnaire', '/questionnaires'),
    textField('questionnaireCode', 'Questionnaire Code'),
    asyncField('channelId', 'Channel', '/channels'),
    textField('participantId', 'Participant ID'),
    textField('phone', 'Phone'),
    textField('email', 'Email'),
    textField('currentQuestionId', 'Current Question ID'),
    selectField('status', 'Status', CONVERSATION_STATUS_OPTIONS),
    selectField('state', 'State', CONVERSATION_STATE_OPTIONS),
    jsonField('context', 'Context'),
    {
      name: 'questions',
      label: 'Questions',
      type: 'accordion-array',
      col: 12,
      itemLabelKey: 'text',
      itemRender: (item: any) => `${item.index ?? '?'}: ${item.text ?? '-'}`,
      itemEditConfig: questionPageSchema,
    },
  ]),
  defaultState: {
    questionnaireId: null,
    questionnaireCode: '',
    channelId: null,
    participantId: '',
    phone: '',
    email: '',
    currentQuestionId: '',
    status: option('ACTIVE'),
    state: option('START'),
    context: {},
  },
  buildFormState: (row) => ({
    questionnaireId: option(row.questionnaireId),
    questionnaireCode: '',
    channelId: option(row.channelId),
    participantId: text(row.participantId),
    phone: '',
    email: '',
    currentQuestionId: text(row.currentQuestionId),
    status: option(row.status || 'ACTIVE'),
    state: option(row.state || 'START'),
    context: jsonObject(row.context),
  }),
  buildCreatePayload: (values) => ({
    questionnaireId: optionValue(values.questionnaireId),
    questionnaireCode: text(values.questionnaireCode).trim() || undefined,
    channelId: optionValue(values.channelId),
    participantId: text(values.participantId).trim() || undefined,
    phone: text(values.phone).trim() || undefined,
    email: text(values.email).trim() || undefined,
    currentQuestionId: text(values.currentQuestionId).trim() || undefined,
    status: optionValue(values.status),
    state: optionValue(values.state),
    context: jsonObject(values.context),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      questionnaireId: (v) => optionValue(v),
      questionnaireCode: (v) => text(v).trim() || undefined,
      channelId: (v) => optionValue(v),
      participantId: (v) => text(v).trim() || undefined,
      phone: (v) => text(v).trim() || undefined,
      email: (v) => text(v).trim() || undefined,
      currentQuestionId: (v) => text(v).trim() || undefined,
      status: (v) => optionValue(v),
      state: (v) => optionValue(v),
      context: (v) => jsonObject(v),
    }),
});

export const participantPageSchema: ModelConfig = withDefaultActions({
  id: 'participants',
  title: 'Participants',
  description: 'Create participants and search by phone or email for questionnaire entry.',
  endpoint: '/participants',
  columns: [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
  ],
  createFieldGroups: buildFields([
    textField('firstName', 'First Name'),
    textField('lastName', 'Last Name'),
    textField('phone', 'Phone'),
    { ...textField('email', 'Email'), type: 'email' },
    jsonField('metadata', 'Metadata'),
  ]),
  defaultState: {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    metadata: {},
  },
  buildFormState: (row) => ({
    firstName: text(row.firstName),
    lastName: text(row.lastName),
    phone: text(row.phone),
    email: text(row.email),
    metadata: jsonObject(row.metadata),
  }),
  buildCreatePayload: (values) => ({
    firstName: text(values.firstName).trim() || undefined,
    lastName: text(values.lastName).trim() || undefined,
    phone: text(values.phone).trim() || undefined,
    email: text(values.email).trim() || undefined,
    metadata: jsonObject(values.metadata),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      firstName: (v) => text(v).trim() || undefined,
      lastName: (v) => text(v).trim() || undefined,
      phone: (v) => text(v).trim() || undefined,
      email: (v) => text(v).trim() || undefined,
      metadata: (v) => jsonObject(v),
    }),
});

export const stepPageSchema: ModelConfig = withDefaultActions({
  id: 'steps',
  title: 'Steps',
  description: 'Define workflow step configuration, transitions, and execution hooks.',
  endpoint: '/steps',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Type' },
  ],
  createFieldGroups: buildFields([
    textField('id', 'ID'),
    selectField('type', 'Type', WORKFLOW_STEP_TYPE_OPTIONS),
    jsonField('config', 'Config'),
    jsonField('transitions', 'Transitions'),
    selectField(
      'onEnter',
      'On Enter',
      ['HTTP_POST', 'SERVICE_CALL', 'EMIT_EVENT', 'DELAY', 'NOOP'].map((v) => ({
        value: v,
        label: v,
      }))
    ),
    selectField(
      'onExit',
      'On Exit',
      ['HTTP_POST', 'SERVICE_CALL', 'EMIT_EVENT', 'DELAY', 'NOOP'].map((v) => ({
        value: v,
        label: v,
      }))
    ),
  ]),
  defaultState: {
    id: '',
    type: null,
    config: {},
    transitions: [],
    onEnter: null,
    onExit: null,
  },
  buildFormState: (row) => ({
    id: text(row.id),
    type: option(row.type),
    config: jsonObject(row.config),
    transitions: jsonArray(row.transitions),
    onEnter: option(row.onEnter),
    onExit: option(row.onExit),
  }),
  buildCreatePayload: (values) => ({
    id: text(values.id).trim(),
    type: optionValue(values.type),
    config: jsonObject(values.config),
    transitions: jsonArray(values.transitions),
    onEnter: optionValue(values.onEnter) || undefined,
    onExit: optionValue(values.onExit) || undefined,
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      id: (v) => text(v).trim(),
      type: (v) => optionValue(v),
      config: (v) => jsonObject(v),
      transitions: (v) => jsonArray(v),
      onEnter: (v) => optionValue(v) || undefined,
      onExit: (v) => optionValue(v) || undefined,
    }),
});

export const workflowPageSchema: ModelConfig = withDefaultActions({
  id: 'workflows',
  title: 'Workflows',
  description: 'Define workflow steps, transition rules, metadata, and orchestration limits.',
  endpoint: '/workflows',
  editPathBuilder: (row) => `/conversation/workflows/${String(row.id)}/edit`,
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { key: 'version', label: 'Version' },
    { key: 'maxTransitionsPerRun', label: 'Max Transitions' },
    { key: 'isActive', label: 'Active' },
  ],
  createFieldGroups: buildFields([
    textField('name', 'Name'),
    textField('code', 'Code'),
    { ...textField('version', 'Version'), type: 'number' },
    { ...textField('maxTransitionsPerRun', 'Max Transitions Per Run'), type: 'number' },
    textField('startStepId', 'Start Step ID'),
    switchField('isActive', 'Active'),
    jsonField('metadata', 'Metadata'),
    {
      name: 'steps',
      label: 'Steps',
      type: 'accordion-array',
      col: 12,
      itemLabelKey: 'id',
      itemEditConfig: stepPageSchema,
    },
  ]),
  defaultState: {
    name: '',
    code: '',
    metadata: {},
    version: 1,
    maxTransitionsPerRun: 25,
    isActive: true,
    startStepId: '',
    steps: [],
  },
  buildFormState: (row) => ({
    name: text(row.name),
    code: text(row.code),
    metadata: jsonObject(row.metadata),
    version: numberValue(row.version, 1),
    maxTransitionsPerRun: numberValue(row.maxTransitionsPerRun, 25),
    isActive: bool(row.isActive, true),
    startStepId: text(row.startStepId),
    steps: jsonArray(row.steps),
  }),
  buildCreatePayload: (values) => ({
    name: text(values.name).trim(),
    code: text(values.code).trim(),
    metadata: jsonObject(values.metadata),
    version: numberValue(values.version, 1),
    maxTransitionsPerRun: numberValue(values.maxTransitionsPerRun, 25),
    isActive: bool(values.isActive, true),
    startStepId: text(values.startStepId).trim() || undefined,
    steps: jsonArray(values.steps),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      name: (v) => text(v).trim(),
      code: (v) => text(v).trim(),
      metadata: (v) => jsonObject(v),
      version: (v) => numberValue(v, 1),
      maxTransitionsPerRun: (v) => numberValue(v, 25),
      isActive: (v) => bool(v, true),
      startStepId: (v) => text(v).trim() || undefined,
      steps: (v) => jsonArray(v),
    }),
});

export const questionnairePageSchema: ModelConfig = withDefaultActions({
  id: 'questionnaires',
  title: 'Questionnaires',
  description:
    'Create and manage questionnaires, strategy settings, metadata, and activation state.',
  endpoint: '/questionnaires',
  editPathBuilder: (row) => `/conversation/questionnaires/${String(row.id)}/edit`,
  columns: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'processingStrategy', label: 'Strategy' },
    { key: 'isActive', label: 'Active' },
    { key: 'workflowId', label: 'Workflow' },
  ],
  createFieldGroups: [
    {
      title: 'Questionnaire Details',
      fields: [
        textField('name', 'Name'),
        textField('code', 'Code'),
        { name: 'description', label: 'Description', type: 'textarea', col: 12 },
        selectField('processingStrategy', 'Processing Strategy', PROCESSING_STRATEGY_OPTIONS),
        switchField('isActive', 'Active'),
        switchField('isInit', 'Init Flow'),
        switchField('isMediaHandler', 'Media Handler'),
        switchField('allowBackNavigation', 'Allow Back Navigation'),
        switchField('allowMultipleSessions', 'Allow Multiple Sessions'),
        {
          name: 'channelIds',
          label: 'Channels',
          type: 'multi-async-select',
          col: 12,
          searchParam: {
            endpoint: '/channels',
            queryParam: 'search',
            minChars: 0,
            valueKey: 'id',
            labelKey: 'name',
          },
        },
        jsonField('tags', 'Tags'),
        jsonField('metadata', 'Metadata'),
      ],
    },
    {
      title: 'Questions',
      fields: [
        {
          name: 'questions',
          label: 'Questions',
          type: 'accordion-array',
          col: 12,
          relationshipId: 'questionnaireId',
          itemLabelKey: 'text',
          itemRender: (item: any) =>
            `${item.index ?? '?'}: ${item.text ?? '-'} : ${item.attribute}`,
          itemEditConfig: questionPageSchema,
        },
      ],
    },
    {
      title: 'Workflow',
      fields: [
        {
          name: 'workflowId',
          label: 'Workflow',
          type: 'accordion',
          col: 12,
          itemLabelKey: 'name',
          itemEditConfig: workflowPageSchema,
          searchParam: {
            endpoint: '/workflows',
            queryParam: 'search',
            minChars: 0,
            valueKey: 'id',
            labelKey: 'name',
          },
        },
      ],
    },
  ],
  defaultState: {
    name: '',
    code: '',
    description: '',
    allowBackNavigation: true,
    allowMultipleSessions: false,
    processingStrategy: option('STATIC'),
    channelIds: [],
    tags: [],
    metadata: {},
    isActive: true,
    isInit: false,
    isMediaHandler: false,
    questions: [],
    workflowId: null,
  },
  buildFormState: (row) => ({
    id: text(row.id),
    name: text(row.name),
    code: text(row.code),
    description: text(row.description),
    allowBackNavigation: bool(row.allowBackNavigation, true),
    allowMultipleSessions: bool(row.allowMultipleSessions),
    processingStrategy: option(row.processingStrategy || 'STATIC'),
    channelIds: jsonArray(row.channelIds),
    tags: jsonArray(row.tags),
    metadata: jsonObject(row.metadata),
    isActive: bool(row.isActive, true),
    isInit: bool(row.isInit),
    isMediaHandler: bool(row.isMediaHandler),
    questions: jsonArray(row.questions),
    workflowId: option(row.workflowId),
  }),
  buildCreatePayload: (values) => ({
    name: text(values.name).trim(),
    code: text(values.code).trim(),
    description: text(values.description).trim() || undefined,
    allowBackNavigation: bool(values.allowBackNavigation, true),
    allowMultipleSessions: bool(values.allowMultipleSessions),
    processingStrategy: optionValue(values.processingStrategy),
    channelIds: jsonArray(values.channelIds),
    metadata: jsonObject(values.metadata),
    tags: jsonArray(values.tags),
    questions: jsonArray(values.questions),
    workflowId: optionValue(values.workflowId) || undefined,
    isActive: bool(values.isActive, true),
    isInit: bool(values.isInit),
    isMediaHandler: bool(values.isMediaHandler),
    isDynamic: false,
    version: 1,
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      name: (v) => text(v).trim(),
      code: (v) => text(v).trim(),
      description: (v) => text(v).trim() || undefined,
      allowBackNavigation: (v) => bool(v, true),
      allowMultipleSessions: (v) => bool(v),
      processingStrategy: (v) => optionValue(v),
      channelIds: (v) => jsonArray(v),
      metadata: (v) => jsonObject(v),
      tags: (v) => jsonArray(v),
      questions: (v) => jsonArray(v),
      workflowId: (v) => optionValue(v) || undefined,
      isActive: (v) => bool(v, true),
      isInit: (v) => bool(v),
      isMediaHandler: (v) => bool(v),
    }),
});

export const workflowInstancePageSchema: ModelConfig = {
  id: 'workflow-instances',
  apiProvider: conversationApi,
  title: 'Workflow Instances',
  description: 'Track active and completed workflow runs and inspect current state.',
  endpoint: '/workflow-instances',
  canDelete: true,
  columns: [
    { key: 'workflowId', label: 'Workflow' },
    { key: 'workflowVersion', label: 'Version' },
    { key: 'flowId', label: 'Flow Name' },
    { key: 'status', label: 'Status' },
    { key: 'currentStepId', label: 'Current State' },
  ],
  createFieldGroups: buildFields([
    selectField('status', 'Status', WORKFLOW_STATUS_OPTIONS),
    textField('currentStepId', 'Current Step ID'),
    { ...textField('workflowVersion', 'Workflow Version'), type: 'number' },
    jsonField('state', 'State'),
    jsonField('config', 'Config'),
  ]),
  defaultState: {
    status: option('ACTIVE'),
    currentStepId: '',
    workflowVersion: 1,
    state: {},
    config: {},
  },
  buildFormState: (row) => ({
    status: option(row.status || 'ACTIVE'),
    currentStepId: text(row.currentStepId),
    workflowVersion: numberValue(row.workflowVersion, 1),
    state: jsonObject(row.state),
    config: jsonObject(row.config),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      status: (v) => optionValue(v),
      currentStepId: (v) => text(v).trim() || undefined,
      workflowVersion: (v) => numberValue(v, 1),
      state: (v) => jsonObject(v),
      config: (v) => jsonObject(v),
    }),
};

export const workflowEventPageSchema: ModelConfig = {
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

export const projectionPageSchema: ModelConfig = {
  id: 'projections',
  apiProvider: conversationApi,
  title: 'Projections',
  description: 'View conversation participant projections, roles, and activity.',
  endpoint: '/projections',
  columns: [
    { key: 'participant.phone', label: 'Phone' },
    {
      key: 'participant',
      label: 'Name',
      render: (row) => {
        const p = row.participant as Record<string, unknown> | undefined;
        return [p?.firstName, p?.lastName].filter(Boolean).join(' ') || '-';
      },
    },
    {
      key: 'conversationId',
      label: 'Conversation',
      render: (row) => shortText(row.conversationId),
    },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    {
      key: 'isPrimary',
      label: 'Primary',
      render: (row) => (row.isPrimary ? 'Yes' : 'No'),
    },
    {
      key: 'lastMessageText',
      label: 'Last Message',
      render: (row) => {
        const text = String(row.lastMessageText ?? '');
        return text.length < 60 ? text : `${text.slice(0, 60)}...`;
      },
    },
    { key: 'lastMessageAt', label: 'Last Activity' },
    { key: 'unreadCount', label: 'Unread' },
  ],
};

export const exchangePageSchema: ModelConfig = withDefaultActions({
  id: 'exchanges',
  title: 'Exchanges',
  description:
    'Review inbound and outbound channel exchanges, message lifecycle, and payload metadata.',
  endpoint: '/exchanges',
  columns: [
    {
      key: 'channelType',
      label: 'Channel',
      filters: EQUALS_WITH_OPTIONS(CHANNEL_TYPE_OPTIONS),
    },
    {
      key: 'direction',
      label: 'Direction',
      filters: EQUALS_WITH_OPTIONS(EXCHANGE_DIRECTION_OPTIONS),
    },
    {
      key: 'status',
      label: 'Status',
      filters: EQUALS_WITH_OPTIONS(EXCHANGE_STATUS_OPTIONS),
    },
    { key: 'conversationId', label: 'Conversation ID', filters: ColumnTypeFilters.STRING },
    {
      key: 'senderId',
      label: 'Sender',
      filters: ColumnTypeFilters.STRING,
      render: (row) => <ParticipantCell participantId={String(row.senderId ?? '')} />,
    },
    {
      key: 'receiverId',
      label: 'Receiver',
      filters: ColumnTypeFilters.STRING,
      render: (row) => <ParticipantCell participantId={String(row.receiverId ?? '')} />,
    },
    {
      key: 'messageId',
      label: 'Message ID',
      filters: ColumnTypeFilters.STRING,
      render: (row) => shortText(row.messageId),
    },
    {
      key: 'message',
      label: 'Message',
      filters: ColumnTypeFilters.STRING,
      render: (row) => shortText(row.message),
    },
    {
      key: 'createdAt',
      label: 'CreatedAt',
      dataType: ColumnDataType.DATE,
      filters: ColumnTypeFilters.DATE,
      sortable: true
    },
  ],
  detailPathBuilder: (row) => `/conversation/exchanges/${String(row.id)}`,
});

export const workflowAttachmentPageSchema: ModelConfig = withDefaultActions({
  id: 'workflow-attachments',
  title: 'Workflow Attachments',
  description: 'Configure questionnaire-to-workflow attachments and mapping metadata.',
  endpoint: '/workflow-attachments',
  columns: [
    { key: 'questionnaireId', label: 'Questionnaire' },
    { key: 'workflowId', label: 'Workflow' },
    { key: 'workflowVersion', label: 'Version' },
    { key: 'status', label: 'Status' },
  ],
  createFieldGroups: buildFields([
    asyncField('questionnaireId', 'Questionnaire', '/questionnaires'),
    asyncField('workflowId', 'Workflow', '/workflows'),
    { ...textField('workflowVersion', 'Workflow Version'), type: 'number' },
    selectField('status', 'Status', WORKFLOW_STATUS_OPTIONS),
    jsonField('mappings', 'Mappings'),
    jsonField('metadata', 'Metadata'),
  ]),
  defaultState: {
    questionnaireId: null,
    workflowId: null,
    workflowVersion: 1,
    status: option('ACTIVE'),
    mappings: [],
    metadata: {},
  },
  buildFormState: (row) => ({
    questionnaireId: option(row.questionnaireId),
    workflowId: option(row.workflowId),
    workflowVersion: numberValue(row.workflowVersion, 1),
    status: option(row.status || 'ACTIVE'),
    mappings: jsonArray(row.mappings),
    metadata: jsonObject(row.metadata),
  }),
  buildCreatePayload: (values) => ({
    questionnaireId: optionValue(values.questionnaireId),
    workflowId: optionValue(values.workflowId),
    workflowVersion: numberValue(values.workflowVersion, 1),
    status: optionValue(values.status),
    mappings: jsonArray(values.mappings),
    metadata: jsonObject(values.metadata),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      questionnaireId: (v) => optionValue(v),
      workflowId: (v) => optionValue(v),
      workflowVersion: (v) => numberValue(v, 1),
      status: (v) => optionValue(v),
      mappings: (v) => jsonArray(v),
      metadata: (v) => jsonObject(v),
    }),
});

export const workflowStepTypeOptions = WORKFLOW_STEP_TYPE_OPTIONS;
