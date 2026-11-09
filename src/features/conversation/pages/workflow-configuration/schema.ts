import type { ModelConfig } from '@/features/shared/model-schema';
import { WORKFLOW_STATUS_OPTIONS } from '../../schemas/constants';
import {
  asyncField,
  buildFields,
  jsonArray,
  jsonField,
  jsonObject,
  numberValue,
  option,
  optionValue,
  pickUpdatePayload,
  selectField,
  textField,
  withDefaultActions,
} from '../../schemas/helpers';

export const workflowAttachmentsConfig: ModelConfig = withDefaultActions({
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
