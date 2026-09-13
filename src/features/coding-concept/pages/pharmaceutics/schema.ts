import type { ModelConfig } from '@/features/shared/model-schema';
import { ColumnDataType, ColumnTypeFilters, type Column, type Field } from '@/features/rxsoft/types';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'commonGenericName', label: 'Generic Name' },
  { key: 'clinicalName', label: 'Clinical Name' },
  { key: 'drugClass', label: 'Drug Class' },
  { key: 'bodySystem', label: 'Body System' },
  { key: 'dosage', label: 'Dosage' },
  { key: 'isControlledSubstance', label: 'Controlled', render: (r: any) => r.isControlledSubstance ? 'Yes' : 'No' },
  { key: 'indications', label: 'Indications', render: (r: any) => (r.indications ?? '').slice(0, 60) + ((r.indications?.length ?? 0) > 60 ? '...' : '') },
  { key: 'updatedAt', label: 'Updated', dataType: ColumnDataType.DATE, filters: ColumnTypeFilters.DATE },
];

const createFields: Field[] = [
  { name: 'code', label: 'Code', required: true, col: 4 },
  // ── Identity & classification ──────────────────────────────────────────
  { name: 'clinicalName', label: 'Clinical Name (INN)', col: 8 },
  { name: 'brandNames', label: 'Brand Names', col: 6 },
  { name: 'drugClass', label: 'Drug Class', col: 6 },
  { name: 'bodySystem', label: 'Body System', col: 6 },
  { name: 'formulations', label: 'Formulations', col: 6 },
  { name: 'chemicalConstituents', label: 'Chemical Constituents', type: 'textarea', col: 12 },
  { name: 'pharmacology', label: 'Pharmacology', type: 'textarea', col: 12 },
  { name: 'commonGenericName', label: 'Common Generic Name', col: 12 },
  // ── Clinical monograph ─────────────────────────────────────────────────
  { name: 'indications', label: 'Indications', type: 'textarea', col: 12 },
  { name: 'contraindications', label: 'Contraindications', type: 'textarea', col: 12 },
  { name: 'precautions', label: 'Precautions', type: 'textarea', col: 12 },
  { name: 'warnings', label: 'Warnings', type: 'textarea', col: 12 },
  { name: 'mechanismOfAction', label: 'Mechanism of Action', type: 'textarea', col: 12 },
  { name: 'adverseEffects', label: 'Adverse Effects', type: 'textarea', col: 12 },
  { name: 'drugInteractions', label: 'Drug Interactions', type: 'textarea', col: 12 },
  { name: 'ivIncompatibilities', label: 'IV Incompatibilities', type: 'textarea', col: 12 },
  { name: 'foodInteractions', label: 'Food Interactions', type: 'textarea', col: 12 },
  { name: 'traditionalMedicineEffects', label: 'Traditional Medicine Effects', type: 'textarea', col: 12 },
  // ── Dosing ─────────────────────────────────────────────────────────────
  { name: 'dosage', label: 'Dosage', type: 'textarea', col: 12 },
  { name: 'dosePerAgeRange', label: 'Dose per Age Range', type: 'textarea', col: 12 },
  { name: 'dosePerWeightRange', label: 'Dose per Weight Range', type: 'textarea', col: 12 },
  { name: 'missedDose', label: 'Missed Dose', type: 'textarea', col: 12 },
  // ── Patient-specific variables ─────────────────────────────────────────
  { name: 'bodyWeightAndAge', label: 'Body Weight & Age', type: 'textarea', col: 12 },
  { name: 'physiologicalVariables', label: 'Physiological Variables', type: 'textarea', col: 12 },
  { name: 'pharmacokineticVariables', label: 'Pharmacokinetic Variables', type: 'textarea', col: 12 },
  { name: 'diseaseVariables', label: 'Disease Variables', type: 'textarea', col: 12 },
  { name: 'environmentalVariables', label: 'Environmental Variables', type: 'textarea', col: 12 },
  { name: 'extremesOfAge', label: 'Extremes of Age', type: 'textarea', col: 12 },
  { name: 'intercurrentIllness', label: 'Intercurrent Illness', type: 'textarea', col: 12 },
  // ── Adherence & prescribing ────────────────────────────────────────────
  { name: 'adherenceInfo', label: 'Adherence Info', type: 'textarea', col: 12 },
  { name: 'prescriptionReasons', label: 'Prescription Reasons', type: 'textarea', col: 12 },
  { name: 'recommendations', label: 'Recommendations', type: 'textarea', col: 12 },
  { name: 'generalDrugUse', label: 'General Drug Use', type: 'textarea', col: 12 },
  { name: 'patientCounseling', label: 'Patient Counseling', type: 'textarea', col: 12 },
  { name: 'nursingConsiderations', label: 'Nursing Considerations', type: 'textarea', col: 12 },
  { name: 'recommendedLabel', label: 'Recommended Label', col: 12 },
  // ── Regulatory ─────────────────────────────────────────────────────────
  { name: 'isControlledSubstance', label: 'Controlled Substance', type: 'switch', col: 6 },
  // ── Appendices ─────────────────────────────────────────────────────────
  { name: 'pregnancyEffects', label: 'Pregnancy Effects', type: 'textarea', col: 12 },
  { name: 'breastfeedingEffects', label: 'Breastfeeding Effects', type: 'textarea', col: 12 },
  { name: 'interactiveEffects', label: 'Interactive Effects', type: 'textarea', col: 12 },
  { name: 'renalImpairment', label: 'Renal Impairment', type: 'textarea', col: 12 },
  { name: 'hepaticImpairment', label: 'Hepatic Impairment', type: 'textarea', col: 12 },
];

function buildCreatePayload(values: Record<string, unknown>) {
  const payload: Record<string, unknown> = { code: values.code };
  for (const [
    k,
    v,
  ] of ([
    ['clinicalName', values.clinicalName],
    ['brandNames', values.brandNames],
    ['drugClass', values.drugClass],
    ['bodySystem', values.bodySystem],
    ['formulations', values.formulations],
    ['chemicalConstituents', values.chemicalConstituents],
    ['pharmacology', values.pharmacology],
    ['commonGenericName', values.commonGenericName],
    ['indications', values.indications],
    ['contraindications', values.contraindications],
    ['precautions', values.precautions],
    ['warnings', values.warnings],
    ['mechanismOfAction', values.mechanismOfAction],
    ['adverseEffects', values.adverseEffects],
    ['drugInteractions', values.drugInteractions],
    ['ivIncompatibilities', values.ivIncompatibilities],
    ['foodInteractions', values.foodInteractions],
    ['traditionalMedicineEffects', values.traditionalMedicineEffects],
    ['dosage', values.dosage],
    ['dosePerAgeRange', values.dosePerAgeRange],
    ['dosePerWeightRange', values.dosePerWeightRange],
    ['missedDose', values.missedDose],
    ['bodyWeightAndAge', values.bodyWeightAndAge],
    ['physiologicalVariables', values.physiologicalVariables],
    ['pharmacokineticVariables', values.pharmacokineticVariables],
    ['diseaseVariables', values.diseaseVariables],
    ['environmentalVariables', values.environmentalVariables],
    ['extremesOfAge', values.extremesOfAge],
    ['intercurrentIllness', values.intercurrentIllness],
    ['adherenceInfo', values.adherenceInfo],
    ['prescriptionReasons', values.prescriptionReasons],
    ['recommendations', values.recommendations],
    ['generalDrugUse', values.generalDrugUse],
    ['patientCounseling', values.patientCounseling],
    ['nursingConsiderations', values.nursingConsiderations],
    ['recommendedLabel', values.recommendedLabel],
    ['pregnancyEffects', values.pregnancyEffects],
    ['breastfeedingEffects', values.breastfeedingEffects],
    ['interactiveEffects', values.interactiveEffects],
    ['renalImpairment', values.renalImpairment],
    ['hepaticImpairment', values.hepaticImpairment],
  ] as Array<[string, unknown]>)) {
    payload[k] = v ?? undefined;
  }
  payload.isControlledSubstance = values.isControlledSubstance ?? false;
  return payload;
}

function buildUpdatePayload(values: Record<string, unknown>) {
  return buildCreatePayload(values);
}

export const codedPharmaceuticsConfig: ModelConfig = {
  id: 'coded-pharmaceutics',
  title: 'Pharmaceutics',
  description: 'Clinical and pharmaceutical reference records.',
  endpoint: '/pharmaceutics',
  columns,
  createFields,
  buildCreatePayload,
  buildUpdatePayload,
  canDelete: true,
};
