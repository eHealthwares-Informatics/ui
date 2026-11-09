import { ColumnDataType } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import {
  buildFields,
  jsonArray,
  jsonField,
  jsonObject,
  pickUpdatePayload,
  text,
  textField,
  withDefaultActions,
} from '../../schemas/helpers';
import { questionOptionsConfig } from './option-schema';

export const optionListsConfig: ModelConfig = withDefaultActions({
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
      itemEditConfig: questionOptionsConfig,
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
