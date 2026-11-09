import { useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { ColumnDataType, ColumnTypeFilters, Field, Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { codingConceptEndpoint } from '@/lib/coding-concept-api';
import { codingModuleOptions } from '../shared';

const conceptsEndpoint = codingConceptEndpoint('/concepts');

const conceptFields: Field[] = [
  {
    name: 'concept',
    label: 'Concept',
    type: 'select' as const,
    required: true,
    options: codingModuleOptions,
    placeholder: 'Select module',
    col: 6,
  },
  {
    name: 'code',
    label: 'Code',
    required: true,
    placeholder: 'LOINC-12345',
    col: 6,
  },
  {
    name: 'shortName',
    label: 'Short name',
    placeholder: 'CBC',
    col: 6,
  },
  {
    name: 'longName',
    label: 'Long name',
    col: 6,
    placeholder: 'Complete Blood Count',
  },
  {
    name: 'shortDescription',
    label: 'Short description',
    col: 6,
    placeholder: 'Brief label used in compact views',
    type: 'textarea',
  },
  {
    name: 'fullDescription',
    label: 'Full description',
    col: 12,
    placeholder: 'Long clinical description',
    type: 'textarea',
  },
];

const columns = [
  { key: 'concept', label: 'Concept', filters: ColumnTypeFilters.STRING },
  { key: 'code', label: 'Code', filters: ColumnTypeFilters.STRING },
  { key: 'shortName', label: 'Short name', filters: ColumnTypeFilters.STRING },
  { key: 'longName', label: 'Long name', filters: ColumnTypeFilters.STRING },
  {
    key: 'updatedAt',
    label: 'Updated',
    dataType: ColumnDataType.DATE,
    filters: ColumnTypeFilters.DATE,
  },
];

const config: ModelConfig = {
  id: 'concepts',
  title: 'Concept Codes',
  description: 'Registered codes by coding module.',
  endpoint: conceptsEndpoint,
  columns,
  modalTitle: 'Add Concept Code',
  createFields: conceptFields,
  detailPathBuilder: (row) => `${row.id}`,
  buildCreatePayload: (values) => ({
    code: {
      concept: (values.module as Option).value,
      code: values.code,
      shortName: values.shortName,
      fullName: values.fullName,
      shortDescription: values.shortDescription,
      fullDescription: values.fullDescription,
    },
  }),
  buildUpdatePayload: (values) => ({
    module: values.module,
    code: values.code,
    shortName: values.shortName,
    fullName: values.fullName,
    shortDescription: values.shortDescription,
    fullDescription: values.fullDescription,
  }),
  canDelete: true,
};

export const Concepts = () => {
  const [formState, setFormState] = useState<any>({});
  const updateField = (name: string, value: unknown) => {
    setFormState((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <DataPageShell
      config={config}
      embedded
      formState={formState}
      setFormState={setFormState}
      updateField={updateField}
    />
  );
};
