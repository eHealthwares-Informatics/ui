import type { ModelConfig } from '@/features/shared/model-schema';
import { PROCESSING_STRATEGY_OPTIONS } from '../../schemas/constants';
import {
  asyncField,
  bool,
  jsonArray,
  jsonField,
  jsonObject,
  option,
  optionValue,
  pickUpdatePayload,
  selectField,
  switchField,
  text,
  textField,
  withDefaultActions,
} from '../../schemas/helpers';
import { questionsConfig } from '../questions/schema';
import { workflowsConfig } from '../workflows/schema';

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

export const questionnairesConfig: ModelConfig = withDefaultActions({
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
          itemEditConfig: questionsConfig,
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
          itemEditConfig: workflowsConfig,
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
