import type { Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { badgeCol, dateTimeCol, patientCol } from '../../../lib/emr-columns';

const columns: Column[] = [
  { key: 'admissionNumber', label: 'Admission #' },
  { ...patientCol() },
  { ...badgeCol('dischargeType', 'Type', 'dischargeType') },
  { ...dateTimeCol('dischargeDatetime', 'Discharged') },
  { key: 'dischargeSummary', label: 'Summary', render: (r) => String(r.dischargeSummary ?? '—') },
];

export const dischargesConfig: ModelConfig = {
  id: 'discharges',
  title: 'Discharges',
  description: 'Discharge history.',
  endpoint: '/admissions',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'admissions'],
  listParams: { status: 'DISCHARGED' },
  columns,
};
