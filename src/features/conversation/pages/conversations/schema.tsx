import type { Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { CONVERSATION_STATE_OPTIONS, CONVERSATION_STATUS_OPTIONS } from '../../schemas/constants';
import {
  asyncField,
  buildFields,
  jsonArray,
  jsonField,
  jsonObject,
  option,
  optionValue,
  pickUpdatePayload,
  selectField,
  shortText,
  text,
  textField,
  withDefaultActions,
} from '../../schemas/helpers';
import { questionsConfig } from '../questions/schema';
import { workflowsConfig } from '../workflows/schema';

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

export const conversationsConfig: ModelConfig = withDefaultActions({
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
      get itemEditConfig() {
        return workflowsConfig;
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
      itemEditConfig: questionsConfig,
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
