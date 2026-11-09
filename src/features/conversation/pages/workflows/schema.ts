import type { ModelConfig } from '@/features/shared/model-schema';
import { WORKFLOW_STEP_TYPE_OPTIONS } from '../../schemas/constants';
import {
  bool,
  buildFields,
  jsonArray,
  jsonField,
  jsonObject,
  numberValue,
  pickUpdatePayload,
  switchField,
  text,
  textField,
  withDefaultActions,
} from '../../schemas/helpers';
import { workflowStepsConfig } from './step-schema';

export const workflowStepTypeOptions = WORKFLOW_STEP_TYPE_OPTIONS;

export const workflowsConfig: ModelConfig = withDefaultActions({
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
      itemEditConfig: workflowStepsConfig,
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
