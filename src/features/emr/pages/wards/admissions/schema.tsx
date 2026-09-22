import { type Column, EQUALS_WITH_OPTIONS } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { BedCell } from '../../../components/wards/bed-cell';
import { WardCell } from '../../../components/wards/ward-cell';
import { badgeCol, dateTimeCol, patientCol } from '../../../lib/emr-columns';
import { ADMISSION_STATUSES, ADMISSION_TYPES, toSelectData } from '../../../lib/emr-constants';

const columns: Column[] = [
  { key: 'admissionNumber', label: 'Admission #' },
  { ...patientCol() },
  {
    key: 'visitId',
    label: 'Visit #',
    render: (r) => {
      const visit = r.visit as { visitNumber?: string } | null | undefined;
      return visit?.visitNumber ?? '—';
    },
  },
  { key: 'wardId', label: 'Ward', render: (r) => <WardCell wardId={String(r.wardId ?? '')} /> },
  { key: 'bedId', label: 'Bed', render: (r) => <BedCell bedId={String(r.bedId ?? '')} /> },
  {
    ...badgeCol('admissionType', 'Type', 'admissionType'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(ADMISSION_TYPES)),
  },
  { ...dateTimeCol('admissionDatetime', 'Admitted') },
  {
    ...badgeCol('status', 'Status', 'admission'),
    filters: EQUALS_WITH_OPTIONS(toSelectData(ADMISSION_STATUSES)),
  },
];

export const admissionsConfig: ModelConfig = {
  id: 'admissions',
  title: 'Admissions',
  description: 'Admit patients and manage their ward and bed occupancy.',
  endpoint: '/admissions',
  apiProvider: emrApi,
  queryKeyBase: ['emr', 'admissions'],
  columns,
  canDelete: true,
};
