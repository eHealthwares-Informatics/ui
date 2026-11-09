import type { ModelConfig } from '@/features/shared/model-schema';
import { WORKFLOW_STEP_TYPE_OPTIONS } from '../../schemas/constants';
import {
  buildFields,
  jsonArray,
  jsonField,
  jsonObject,
  option,
  optionValue,
  pickUpdatePayload,
  selectField,
  text,
  textField,
  withDefaultActions,
} from '../../schemas/helpers';

export const workflowStepsConfig: ModelConfig = withDefaultActions({
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
