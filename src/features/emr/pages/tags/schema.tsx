import {
  type Column,
  type FieldGroup,
  ColumnTypeFilters,
} from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { dateTimeCol } from '../../lib/emr-columns';

const columns: Column[] = [
  {
    key: 'name',
    label: 'Tag',
    sortable: true,
    filters: ColumnTypeFilters.STRING,
    render: (row) => (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: `${String(row.color ?? '#868e96')}22`,
          color: String(row.color ?? '#868e96'),
        }}
      >
        {String(row.name)}
      </span>
    ),
  },
  {
    key: 'color',
    label: 'Color',
    render: (row) => (
      <span
        style={{
          display: 'inline-block',
          width: 14,
          height: 14,
          borderRadius: 4,
          backgroundColor: String(row.color ?? '#868e96'),
          verticalAlign: 'middle',
        }}
      />
    ),
  },
  { ...dateTimeCol('createdAt', 'Created') },
];

const fieldGroups: FieldGroup[] = [
  {
    title: 'Tag Details',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, col: 6 },
      { name: 'color', label: 'Color', type: 'color', col: 6, defaultValue: '#228be6' },
    ],
  },
];

const compact = (values: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value != null));

export const tagsConfig: ModelConfig = {
  id: 'tags',
  title: 'Tags',
  description: 'Reusable tags for grouping and filtering patients.',
  endpoint: '/tags',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'tags'],
  columns,
  createFieldGroups: fieldGroups,
  buildCreatePayload: compact,
  buildUpdatePayload: compact,
  defaultSort: { sortBy: 'name', sortOrder: 'asc' },
  canDelete: true,
};
