import { Text } from '@mantine/core';
import { FileText, MessageSquare, Users } from 'lucide-react';
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
  BROADCAST_STATUS_OPTIONS,
  INVITE_STATUS_OPTIONS,
  CHANNEL_TYPE_OPTIONS,
  CONVERSATION_STATE_OPTIONS,
  CONVERSATION_STATUS_OPTIONS,
  EXCHANGE_DIRECTION_OPTIONS,
  EXCHANGE_STATUS_OPTIONS,
  PROCESSING_STRATEGY_OPTIONS,
  PROCESS_MODE_OPTIONS,
  PROJECTION_ROLE_OPTIONS,
  PROJECTION_STATUS_OPTIONS,
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

/**
 * Resolves the conversation's attached workflow into an Option for the
 * `workflow` accordion field. Accepts `row.workflow` as an object or id, or a
 * workflow nested inside `row.workflowInstance`.
 */
const workflowOption = (row: Record<string, unknown>): Option | null => {
  const wf = row.workflow as Record<string, unknown> | string | undefined;
  if (wf && typeof wf === 'object') {
    return option(wf.id ?? wf._id, wf.name);
  }
  if (typeof wf === 'string' && wf) {
    return option(wf);
  }
  const instance = row.workflowInstance as Record<string, unknown> | undefined;
  const instanceWorkflow = instance?.workflow as Record<string, unknown> | undefined;
  if (instanceWorkflow) {
    return option(instanceWorkflow.id ?? instanceWorkflow._id, instanceWorkflow.name);
  }
  return option(instance?.workflowId);
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

/** Build the questionnaire `polisher` object from the editor fields. */
const buildPolisher = (values: Record<string, unknown>) => {
  const processorId = optionValue(values.polisherProcessorId);
  const instructions = text(values.polisherInstructions).trim();
  const enabled = bool(values.polisherEnabled, true);
  if (!processorId && !instructions) {
    return null;
  }
  return {
    processorId: processorId || undefined,
    enabled,
    instructions: instructions || undefined,
  };
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
    { key: 'code', label: 'Code' },
    { key: 'provider', label: 'Provider' },
    { key: 'externalId', label: 'External ID' },
    { key: 'pseudoParticipantId', label: 'Pseudo Participant' },
    { key: 'isActive', label: 'Active' },
  ],
  createFieldGroups: buildFields([
    textField('name', 'Name'),
    selectField('type', 'Type', CHANNEL_TYPE_OPTIONS),
    textField('code', 'Code'),
     textField('provider', 'Provider'),
    textField('externalId', 'External ID'),
    asyncField('pseudoParticipantId', 'Pseudo Participant', '/participants', 'firstName'),
    switchField('isActive', 'Active'),
    jsonField('metadata', 'Metadata'),
    jsonField('config', 'Config'),
  ]),
  defaultState: {
    name: '',
    type: option('WEB'),
    provider: '',
    externalId: '',
    pseudoParticipantId: null,
    metadata: {},
    config: {},
    isActive: true,
  },
  buildFormState: (row) => ({
    name: text(row.name),
    type: option(row.type),
    provider: text(row.provider),
    externalId: text(row.externalId),
    pseudoParticipantId: option(row.pseudoParticipantId),
    metadata: jsonObject(row.metadata),
    config: jsonObject(row.config),
    isActive: bool(row.isActive, true),
  }),
  buildCreatePayload: (values) => ({
    name: text(values.name).trim(),
    type: optionValue(values.type),
    code: optionValue(values.code),
    provider: text(values.provider).trim() || undefined,
    externalId: text(values.externalId).trim() || undefined,
    pseudoParticipantId: optionValue(values.pseudoParticipantId) || undefined,
    metadata: jsonObject(values.metadata),
    config: jsonObject(values.config),
    isActive: bool(values.isActive, true),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      name: (v) => text(v).trim(),
      type: (v) => optionValue(v),
      code: (v) => optionValue(v),
      provider: (v) => text(v).trim() || undefined,
      externalId: (v) => text(v).trim() || undefined,
      pseudoParticipantId: (v) => optionValue(v) || undefined,
      metadata: (v) => jsonObject(v),
      config: (v) => jsonObject(v),
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
    jsonField('aiConfig', 'AI Config (incl. processorId)'),
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
    aiConfig: {},
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
    aiConfig: jsonObject(row.aiConfig),
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
    aiConfig: jsonObject(values.aiConfig),
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
      aiConfig: (v) => jsonObject(v),
      metadata: (v) => jsonObject(v),
    }),
});

export const conversationPageSchema: ModelConfig = withDefaultActions({
  id: 'conversations',
  title: 'Conversations',
  description: 'Create and manage conversation sessions, participant linkage, and saved context.',
  endpoint: '/conversations',
  detailPathBuilder: (row) => `/conversation/${String(row.id)}`,
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
      name: 'workflowInstanceId',
      label: 'Workflow Instance ID',
      type: 'text',
      col: 6,
      disabled: true,
    },
    {
      name: 'workflow',
      label: 'Workflow',
      type: 'accordion',
      col: 12,
      itemLabelKey: 'name',
      // Deferred via getter: workflowPageSchema is declared later in this module,
      // so accessing it eagerly would hit the temporal dead zone at module load.
      get itemEditConfig() {
        return workflowPageSchema;
      },
      searchParam: {
        endpoint: '/workflows',
        queryParam: 'search',
        minChars: 0,
        valueKey: 'id',
        labelKey: 'name',
      },
    },
    {
      name: 'responses',
      label: 'Responses',
      type: 'accordion-array',
      col: 12,
      itemLabelKey: 'attribute',
      itemRender: (item: any) =>
        `${item.direction ?? 'RESPONSE'}${item.attribute ? ` · ${item.attribute}` : ''}: ${String(item.textAnswer ?? item.message ?? '').slice(0, 80)}`,
    },
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
    workflowInstanceId: '',
    workflow: null,
    responses: [],
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
    workflowInstanceId: text(row.workflowInstanceId),
    workflow: workflowOption(row),
    responses: jsonArray(row.responses),
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
    workflow: optionValue(values.workflow) || undefined,
    responses: jsonArray(values.responses),
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
      workflow: (v) => optionValue(v) || undefined,
      responses: (v) => jsonArray(v),
    }),
});

export const participantPageSchema: ModelConfig = withDefaultActions({
  id: 'participants',
  title: 'Participants',
  description: 'Create participants and search by phone or email for questionnaire entry.',
  endpoint: '/participants',
  rowActions: [
    { label: 'View Conversations', icon: MessageSquare, href: (row) => `/conversation?participantId=${String(row.id ?? row._id ?? '')}` },
    { label: 'View Projections', icon: Users, href: (row) => `/conversation/projections?participantId=${String(row.id ?? row._id ?? '')}` },
    { label: 'View Exchanges', icon: FileText, href: (row) => `/conversation/exchanges?participantId=${String(row.id ?? row._id ?? '')}` },
  ],
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
    {
      title: 'Polisher',
      description:
        'Rewrites every message this questionnaire emits (questions, validation prompts, introduction, conclusion, menu) through the selected AI processor.',
      fields: [
        asyncField('polisherProcessorId', 'AI Processor', '/ai/processors'),
        switchField('polisherEnabled', 'Enabled'),
        { name: 'polisherInstructions', label: 'Instruction Override', type: 'textarea', col: 12 },
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
    polisherProcessorId: null,
    polisherEnabled: true,
    polisherInstructions: '',
  },
  buildFormState: (row) => {
    const polisher = jsonObject(row.polisher);
    return {
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
      polisherProcessorId: polisher.processorId ? option(polisher.processorId) : null,
      polisherEnabled: bool(polisher.enabled, true),
      polisherInstructions: text(polisher.instructions),
    };
  },
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
    polisher: buildPolisher(values),
    isDynamic: false,
    version: 1,
  }),
  buildUpdatePayload: (values) => {
    const payload = pickUpdatePayload(values, {
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
    });
    if (
      'polisherProcessorId' in values ||
      'polisherEnabled' in values ||
      'polisherInstructions' in values
    ) {
      payload.polisher = buildPolisher(values);
    }
    return payload;
  },
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
  detailPathBuilder: (row) => `/conversation/projections/${String(row.id)}`,
  columns: [
    { key: 'id', label: 'ID', render: (row) => shortText(row.id) },
    { key: 'participant.phone', label: 'Phone', filters: ColumnTypeFilters.STRING },
    {
      key: 'participant',
      label: 'Participant',
      filters: ColumnTypeFilters.STRING,
      render: (row) => {
        const p = row.participant as Record<string, unknown> | undefined;
        return [p?.firstName, p?.lastName].filter(Boolean).join(' ') || '-';
      },
    },
    {
      key: 'conversationId',
      label: 'Conversation',
      filters: ColumnTypeFilters.STRING,
      render: (row) => shortText(row.conversationId),
    },
    {
      key: 'role',
      label: 'Role',
      filters: EQUALS_WITH_OPTIONS(PROJECTION_ROLE_OPTIONS),
    },
    {
      key: 'status',
      label: 'Status',
      filters: EQUALS_WITH_OPTIONS(PROJECTION_STATUS_OPTIONS),
    },
    {
      key: 'isPrimary',
      label: 'Primary',
      render: (row) => (row.isPrimary ? 'Yes' : 'No'),
    },
    {
      key: 'lastMessageText',
      label: 'Last Message',
      render: (row) => {
        const t = String(row.lastMessageText ?? '');
        return t.length < 60 ? t : `${t.slice(0, 60)}...`;
      },
    },
    { key: 'lastMessageAt', label: 'Last Activity', dataType: ColumnDataType.DATE, sortable: true },
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

export const invitePageSchema: ModelConfig = {
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
        if (!row.timeoutAt) return '—';
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

// ── AI Pages ──────────────────────────────────────────────────────────────────

export const aiInstructionPageSchema: ModelConfig = {
  id: 'ai-instructions',
  apiProvider: conversationApi,
  title: 'AI Instructions',
  description: 'Versioned AI instructions for question extraction, with scoring and promotion history.',
  endpoint: '/ai/instructions',
  columns: [
    {
      key: 'questionId',
      label: 'Question ID',
      render: (row) => shortText(row.questionId),
      filters: ColumnTypeFilters.STRING,
    },
    {
      key: 'activeInstructions',
      label: 'Active Instructions',
      render: (row) => {
        const text = String(row.activeInstructions ?? '');
        return text.length < 80 ? text : `${text.slice(0, 80)}...`;
      },
    },
    {
      key: 'activeScore',
      label: 'Score',
      render: (row) => {
        const score = Number(row.activeScore ?? 0);
        const color = score >= 0.8 ? 'green' : score >= 0.5 ? 'yellow' : 'red';
        return `${score.toFixed(3)}`;
      },
    },
    {
      key: 'versionsCount',
      label: 'Versions',
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      dataType: ColumnDataType.DATE,
      sortable: true,
    },
  ],
};

export const aiEvalLogPageSchema: ModelConfig = {
  id: 'ai-eval-logs',
  apiProvider: conversationApi,
  title: 'AI Eval Logs',
  description: 'Audit trail of instruction improvement runs — scores, promotion decisions, and candidate content.',
  endpoint: '/ai/eval-logs',
  columns: [
    {
      key: 'questionId',
      label: 'Question ID',
      render: (row) => shortText(row.questionId),
      filters: ColumnTypeFilters.STRING,
    },
    {
      key: 'currentScore',
      label: 'Current Score',
      render: (row) => Number(row.currentScore ?? 0).toFixed(3),
    },
    {
      key: 'candidateScore',
      label: 'Candidate Score',
      render: (row) => Number(row.candidateScore ?? 0).toFixed(3),
    },
    {
      key: 'promoted',
      label: 'Promoted',
      render: (row) => (row.promoted ? '✅ Yes' : '❌ No'),
    },
    {
      key: 'triggeredBy',
      label: 'Triggered By',
    },
    {
      key: 'candidateContent',
      label: 'Candidate',
      render: (row) => {
        const text = String(row.candidateContent ?? '');
        return text.length < 60 ? text : `${text.slice(0, 60)}...`;
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

export const aiConfigPageSchema: ModelConfig = {
  id: 'ai-config',
  apiProvider: conversationApi,
  title: 'AI Configuration',
  description: 'Current AI routing defaults and provider status (models + keys are stored in the database).',
  endpoint: '/ai/config',
  columns: [
    { key: 'setting', label: 'Setting' },
    { key: 'value', label: 'Value' },
  ],
};

const truncate = (value: unknown, max = 70): string => {
  const text = String(value ?? '');
  return text.length <= max ? text : `${text.slice(0, max)}…`;
};

export const aiCostPageSchema: ModelConfig = {
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
        return <Text size="xs" fw={600} c={`${color}.7`}>{outcome || '—'}</Text>;
      },
    },
    {
      key: 'totalTokens',
      label: 'Tokens',
      render: (row) =>
        `${Number(row.promptTokens ?? 0)} / ${Number(row.completionTokens ?? 0)}`,
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

export const aiRequestLogPageSchema: ModelConfig = {
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

const AI_PROVIDER_OPTIONS: Option[] = [
  'openai',
  'anthropic',
  'gemini',
  'deepseek',
  'grok',
  'openrouter',
].map((value) => ({ value, label: value }));

const AI_ROUTING_OPTIONS: Option[] = [
  { value: 'direct', label: 'direct' },
  { value: 'openrouter', label: 'openrouter' },
];

const AI_TIER_OPTIONS: Option[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(
  (value) => ({ value, label: value }),
);

export const aiProviderPageSchema: ModelConfig = {
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

export const aiModelPageSchema: ModelConfig = withDefaultActions({
  id: 'ai-models',
  title: 'AI Models',
  description:
    'Manage AI models. Provider API keys live here as attributes (never the environment).',
  endpoint: '/ai/models',
  columns: [
    { key: 'key', label: 'Key', sortable: true },
    { key: 'label', label: 'Label' },
    { key: 'provider', label: 'Provider', sortable: true },
    { key: 'model', label: 'Model' },
    { key: 'routing', label: 'Routing' },
    { key: 'tier', label: 'Tier' },
    { key: 'fallbackModel', label: 'Fallback' },
    {
      key: 'expiryDate',
      label: 'Expiry',
      render: (row) =>
        (row as any).expiryDate
          ? String((row as any).expiryDate).slice(0, 10)
          : '—',
    },
    { key: 'retryCount', label: 'Retries' },
    {
      key: 'isDefault',
      label: 'Default',
      render: (row) => ((row as any).isDefault ? '✅' : '—'),
    },
    { key: 'isActive', label: 'Active', sortable: true },
  ],
  createFieldGroups: [
    {
      title: 'Model',
      fields: [
        textField('key', 'Key'),
        textField('label', 'Label'),
        selectField('provider', 'Provider', AI_PROVIDER_OPTIONS),
        textField('model', 'Model String'),
        selectField('routing', 'Routing', AI_ROUTING_OPTIONS),
        selectField('tier', 'Tier', AI_TIER_OPTIONS),
        { name: 'expiryDate', label: 'Expiry Date', type: 'date', col: 6 },
        {
          name: 'fallbackModel',
          label: 'Fallback Model',
          type: 'async-select',
          col: 6,
          searchParam: {
            endpoint: '/ai/models',
            queryParam: 'search',
            minChars: 0,
            valueKey: 'key',
            labelKey: 'label',
          },
        },
        { ...textField('retryCount', 'Retry Count'), type: 'number' },
        { ...textField('fallbackRetryCount', 'Fallback Retry Count'), type: 'number' },
        textField('apiKey', 'API Key'),
        textField('baseUrl', 'Base URL'),
        { ...textField('defaultTemperature', 'Default Temperature'), type: 'number' },
        { ...textField('maxTokens', 'Max Tokens'), type: 'number' },
        { ...textField('version', 'Version'), type: 'number' },
      ],
    },
    {
      title: 'Flags',
      fields: [
        switchField('supportsServerSideThreading', 'Server-side Threading'),
        switchField('isDefault', 'Default Model'),
        switchField('isActive', 'Active'),
        jsonField('metadata', 'Metadata'),
      ],
    },
  ],
  defaultState: {
    key: '',
    label: '',
    provider: option('openai'),
    model: '',
    routing: option('direct'),
    tier: null,
    expiryDate: null,
    fallbackModel: null,
    retryCount: 2,
    fallbackRetryCount: 2,
    apiKey: '',
    baseUrl: '',
    defaultTemperature: '',
    maxTokens: '',
    version: 1,
    supportsServerSideThreading: false,
    isDefault: false,
    isActive: true,
    metadata: {},
  },
  buildFormState: (row) => ({
    key: text(row.key),
    label: text(row.label),
    provider: option(row.provider),
    model: text(row.model),
    routing: option(row.routing || 'direct'),
    tier: row.tier ? option(row.tier) : null,
    expiryDate: row.expiryDate ? String(row.expiryDate).slice(0, 10) : null,
    fallbackModel: row.fallbackModel ? option(row.fallbackModel, row.fallbackModel) : null,
    retryCount:
      row.retryCount != null ? numberValue(row.retryCount, 0) : '',
    fallbackRetryCount:
      row.fallbackRetryCount != null ? numberValue(row.fallbackRetryCount, 0) : '',
    apiKey: '',
    baseUrl: text(row.baseUrl),
    defaultTemperature: row.defaultTemperature != null ? String(row.defaultTemperature) : '',
    maxTokens: row.maxTokens != null ? String(row.maxTokens) : '',
    version: numberValue(row.version, 1),
    supportsServerSideThreading: bool(row.supportsServerSideThreading),
    isDefault: bool(row.isDefault),
    isActive: bool(row.isActive, true),
    metadata: jsonObject(row.metadata),
  }),
  buildCreatePayload: (values) => ({
    key: text(values.key).trim(),
    label: text(values.label).trim(),
    provider: optionValue(values.provider),
    model: text(values.model).trim(),
    routing: optionValue(values.routing) || undefined,
    tier: optionValue(values.tier) || undefined,
    expiryDate: text(values.expiryDate).trim() || undefined,
    fallbackModel: optionValue(values.fallbackModel) || undefined,
    retryCount: text(values.retryCount).trim()
      ? numberValue(values.retryCount, 0)
      : undefined,
    fallbackRetryCount: text(values.fallbackRetryCount).trim()
      ? numberValue(values.fallbackRetryCount, 0)
      : undefined,
    apiKey: text(values.apiKey).trim(),
    baseUrl: text(values.baseUrl).trim() || undefined,
    defaultTemperature: text(values.defaultTemperature).trim()
      ? numberValue(values.defaultTemperature, 0)
      : undefined,
    maxTokens: text(values.maxTokens).trim()
      ? numberValue(values.maxTokens, 0)
      : undefined,
    version: numberValue(values.version, 1),
    supportsServerSideThreading: bool(values.supportsServerSideThreading),
    isDefault: bool(values.isDefault),
    isActive: bool(values.isActive, true),
    metadata: jsonObject(values.metadata),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      label: (v) => text(v).trim(),
      provider: (v) => optionValue(v),
      model: (v) => text(v).trim(),
      routing: (v) => optionValue(v) || undefined,
      tier: (v) => optionValue(v) || undefined,
      expiryDate: (v) => text(v).trim() || undefined,
      fallbackModel: (v) => optionValue(v) || undefined,
      retryCount: (v) => (text(v).trim() ? numberValue(v, 0) : undefined),
      fallbackRetryCount: (v) => (text(v).trim() ? numberValue(v, 0) : undefined),
      // Only send apiKey when the admin typed a new one.
      apiKey: (v) => (text(v).trim() ? text(v).trim() : undefined),
      baseUrl: (v) => text(v).trim() || undefined,
      defaultTemperature: (v) =>
        text(v).trim() ? numberValue(v, 0) : undefined,
      maxTokens: (v) => (text(v).trim() ? numberValue(v, 0) : undefined),
      version: (v) => numberValue(v, 1),
      supportsServerSideThreading: (v) => bool(v),
      isDefault: (v) => bool(v),
      isActive: (v) => bool(v, true),
      metadata: (v) => jsonObject(v),
    }),
});

export const aiProcessorPageSchema: ModelConfig = withDefaultActions({
  id: 'ai-processors',
  title: 'AI Processors',
  description:
    'Reusable AI configurations (prompt + model). Attached to questions and to questionnaires as a polisher.',
  endpoint: '/ai/processors',
  columns: [
    { key: 'key', label: 'Key', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'modelKey', label: 'Model' },
    { key: 'temperature', label: 'Temperature' },
    { key: 'isActive', label: 'Active', sortable: true },
  ],
  createFieldGroups: buildFields([
    textField('key', 'Key'),
    textField('name', 'Name'),
    {
      name: 'modelKey',
      label: 'Model',
      type: 'async-select',
      col: 6,
      searchParam: {
        endpoint: '/ai/models',
        queryParam: 'search',
        minChars: 0,
        valueKey: 'key',
        labelKey: 'label',
      },
    },
    { ...textField('temperature', 'Temperature'), type: 'number' },
    { name: 'systemPrompt', label: 'System Prompt', type: 'textarea', col: 12 },
    jsonField('configJson', 'Config'),
    { ...textField('version', 'Version'), type: 'number' },
    switchField('isActive', 'Active'),
  ]),
  defaultState: {
    key: '',
    name: '',
    modelKey: null,
    temperature: 0.7,
    systemPrompt: '',
    configJson: {},
    version: 1,
    isActive: true,
  },
  buildFormState: (row) => ({
    key: text(row.key),
    name: text(row.name),
    modelKey: row.modelKey ? option(row.modelKey, row.modelKey) : null,
    temperature: numberValue(row.temperature, 0.7),
    systemPrompt: text(row.systemPrompt),
    configJson: jsonObject(row.configJson),
    version: numberValue(row.version, 1),
    isActive: bool(row.isActive, true),
  }),
  buildCreatePayload: (values) => ({
    key: text(values.key).trim(),
    name: text(values.name).trim(),
    modelKey: optionValue(values.modelKey),
    temperature: numberValue(values.temperature, 0.7),
    systemPrompt: text(values.systemPrompt) || undefined,
    configJson: jsonObject(values.configJson),
    version: numberValue(values.version, 1),
    isActive: bool(values.isActive, true),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      name: (v) => text(v).trim(),
      modelKey: (v) => optionValue(v),
      temperature: (v) => numberValue(v, 0.7),
      systemPrompt: (v) => text(v) || undefined,
      configJson: (v) => jsonObject(v),
      version: (v) => numberValue(v, 1),
      isActive: (v) => bool(v, true),
    }),
});

export const broadcastPageSchema: ModelConfig = withDefaultActions({
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
        if (!row.timeoutAt) return '—';
        const d = new Date(Number(row.timeoutAt));
        return Number.isFinite(d.getTime()) ? d.toLocaleString() : '—';
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => {
        if (!row.createdAt) return '—';
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
