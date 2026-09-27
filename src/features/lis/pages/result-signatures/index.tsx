import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { Column, Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

const columns: Column[] = [
  { key: 'resultId', label: 'Result ID' },
  { key: 'userName', label: 'Signed By' },
  {
    key: 'isSupervisor',
    label: 'Supervisor',
    render: (row: any) => (row.isSupervisor ? '✓' : '-'),
  },
  { key: 'signedAt', label: 'Signed At' },
  { key: 'notes', label: 'Notes' },
];

const createFields: Field[] = [
  { name: 'resultId', label: 'Result ID', type: 'text', required: true, col: 6 },
  {
    name: 'userId',
    label: 'User',
    type: 'async-select',
    searchParam: { endpoint: '/lis/users', valueKey: 'id', labelKey: 'name' },
    col: 4,
  },
  { name: 'userName', label: 'User Name', type: 'text', col: 4 },
  { name: 'isSupervisor', label: 'Supervisor Signature', type: 'switch', col: 4 },
  { name: 'signatureData', label: 'Signature Data', type: 'text', col: 12 },
  { name: 'notes', label: 'Notes', type: 'text', col: 12 },
];

const config: ModelConfig = {
  id: 'result-signatures',
  title: 'Result Signatures',
  description: 'Technical and supervisory signatures for result validation.',
  endpoint: '/lis/result-signatures',
  columns,
  createFields,
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
  canDelete: false,
};

export function LisResultSignaturesPage() {
  return <DataPageShell config={config} />;
}
