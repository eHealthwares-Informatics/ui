import { Badge } from '@mantine/core';
import type { ModelConfig } from '@/features/shared/model-schema';
import type { Column } from '@/features/rxsoft/types';

const TYPE_META: Record<string, { label: string; color: string }> = {
  therapeutic: { label: 'Therapeutic', color: 'green' },
  pharmaceutical: { label: 'Pharmaceutical', color: 'blue' },
  ndf_therapeutic: { label: 'NDF Therapeutic', color: 'cyan' },
  ndf_pharmaceutical: { label: 'NDF Pharmaceutical', color: 'grape' },
};

function TypeBadge({ value }: { value: unknown }) {
  const meta = TYPE_META[String(value ?? '')] ?? { label: String(value ?? '-'), color: 'gray' };
  return (
    <Badge color={meta.color} variant="light" size="sm">
      {meta.label}
    </Badge>
  );
}

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type', render: (row) => <TypeBadge value={row.type} /> },
  { key: 'updatedAt', label: 'Updated' },
];

export const drugClassificationsConfig: ModelConfig = {
  id: 'drug-classifications',
  title: 'Drug Classifications',
  description: 'Therapeutic and pharmaceutical categories linked to generic drugs and products.',
  endpoint: '/drug-classifications',
  columns,
  detailPathBuilder: (row) => `/coding-concept/drug-classifications/${String(row.id)}`,
};
