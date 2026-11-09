import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import { WORKFLOW_STATUS_OPTIONS } from '../../schemas/constants';
import {
  buildFields,
  jsonField,
  jsonObject,
  numberValue,
  option,
  optionValue,
  pickUpdatePayload,
  selectField,
  text,
  textField,
} from '../../schemas/helpers';

export const workflowInstancesConfig: ModelConfig = {
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
