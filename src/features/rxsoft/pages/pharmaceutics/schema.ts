import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, FieldGroup } from '../../types';

export const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'commonGenericName', label: 'Generic Name' },
  { key: 'clinicalName', label: 'Clinical Name' },
  { key: 'drugClass', label: 'Drug Class' },
  { key: 'updatedAt', label: 'Updated' },
];

export const createFieldGroups: FieldGroup[] = [
  {
    title: 'Pharmaceutics',
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'commonBrandName', label: 'Common Brand Name' },
      { name: 'commonGenericName', label: 'Common Generic Name' },
      { name: 'clinicalName', label: 'Clinical Name' },
      { name: 'drugClass', label: 'Drug Class' },
      { name: 'chemicalConstituents', label: 'Chemical Constituents' },
      { name: 'pharmaceutics', label: 'Pharmaceutics' },
      { name: 'indications', label: 'Indications' },
      { name: 'contraindications', label: 'Contraindications' },
      { name: 'mechanism', label: 'Mechanism' },
      { name: 'missedDose', label: 'Missed Dose' },
      { name: 'drugInteractions', label: 'Drug Interactions' },
      { name: 'dosage', label: 'Dosage' },
    ],
  },
];

export const buildPayload = (values: Record<string, unknown>) => ({
  code: values.code,
  commonBrandName: values.commonBrandName || undefined,
  commonGenericName: values.commonGenericName || undefined,
  clinicalName: values.clinicalName || undefined,
  drugClass: values.drugClass || undefined,
  chemicalConstituents: values.chemicalConstituents || undefined,
  pharmaceutics: values.pharmaceutics || undefined,
  indications: values.indications || undefined,
  contraindications: values.contraindications || undefined,
  mechanism: values.mechanism || undefined,
  missedDose: values.missedDose || undefined,
  drugInteractions: values.drugInteractions || undefined,
  dosage: values.dosage || undefined,
});

export const pharmaceuticsConfig: ModelConfig = {
  id: 'pharmaceutics',
  title: 'Pharmaceutics',
  description: 'Clinical and pharmaceutical reference records.',
  endpoint: '/pharmaceutics',
  columns,
  createFieldGroups,
  buildCreatePayload: buildPayload,
  canDelete: true,
};
