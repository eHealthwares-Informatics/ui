import { useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { ColumnTypeFilters } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { codingConceptEndpoint } from '@/lib/coding-concept-api';
import { codingModuleOptions } from '../shared';

const conceptsEndpoint = codingConceptEndpoint('/concepts');
const mappingsEndpoint = codingConceptEndpoint('/concepts/mappings');

const columns = [
  { key: 'externalModule', label: 'External module', filters: ColumnTypeFilters.STRING },
  { key: 'externalCode', label: 'External code', filters: ColumnTypeFilters.STRING },
  { key: 'internalModule', label: 'Internal module' },
  { key: 'internalCode', label: 'Internal code', filters: ColumnTypeFilters.STRING },
  { key: 'moduleCodeId', label: 'Concept ID' },
];

const config: ModelConfig = {
  id: 'mappings',
  title: 'External Mappings',
  description: 'Crosswalks between external module codes and internal module codes.',
  endpoint: mappingsEndpoint,
  columns,
  modalTitle: 'Add External Mapping',
  createFields: [
    {
      name: 'externalModule',
      label: 'External module',
      type: 'select',
      required: true,
      options: codingModuleOptions,
    },
    {
      name: 'externalCode',
      label: 'External code',
      required: true,
    },
    {
      name: 'internalModule',
      label: 'Internal module',
      type: 'select',
      required: true,
      options: codingModuleOptions,
    },
    {
      name: 'internalCode',
      label: 'Internal code',
    },
    {
      name: 'moduleCodeId',
      label: 'Linked concept',
      type: 'async-select',
      searchParam: {
        endpoint: conceptsEndpoint,
        queryParam: 'search',
        valueKey: 'id',
        labelKey: 'shortName',
      },
      placeholder: 'Search concept by code or name',
    },
  ],
  buildCreatePayload: (values) => ({
    externalModule: values.externalModule,
    externalCode: values.externalCode,
    internalModule: values.internalModule,
    internalCode: values.internalCode,
    moduleCodeId: values.moduleCodeId,
  }),
  buildUpdatePayload: (values) => ({
    externalModule: values.externalModule,
    externalCode: values.externalCode,
    internalModule: values.internalModule,
    internalCode: values.internalCode,
    moduleCodeId: values.moduleCodeId,
  }),
  canDelete: true,
};

export const Mapping = () => {
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
