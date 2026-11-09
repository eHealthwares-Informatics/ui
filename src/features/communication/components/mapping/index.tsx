import { Equal } from 'lucide-react';
import { useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import {
  Column,
  ColumnDataType,
  ColumnTypeFilters,
  FilterType,
  Option,
} from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

/* -------------------------- COMPONENT -------------------------- */

const EQUALS_WITH_OPTIONS = (options: Option[]) => [
  {
    name: 'Equals',
    icon: Equal,
    type: FilterType.EQUALS,
    options,
  },
];

const columns: Column[] = [
  {
    key: 'name',
    label: 'Mapping',
    dataType: ColumnDataType.STRING,
    filters: ColumnTypeFilters.STRING,
  },

  {
    key: 'sourceProtocol',
    label: 'Protocol',
    dataType: ColumnDataType.STRING,
    filters: ColumnTypeFilters.STRING,
  },

  {
    key: 'sourceMessageType',
    label: 'Message Type',
    dataType: ColumnDataType.STRING,
    filters: EQUALS_WITH_OPTIONS([
      { value: 'ORDER', label: 'Order' },
      { value: 'PATIENT', label: 'Patient' },
    ]),
  },

  {
    key: 'mappingSteps',
    label: 'Steps(Fields)',
    render: (row: any) => `${row.mappingSteps.length}`,
    dataType: ColumnDataType.STRING,
    filters: ColumnTypeFilters.STRING,
  },

  {
    key: 'version',
    label: 'Version',
    dataType: ColumnDataType.NUMBER,
    filters: ColumnTypeFilters.NUMBER,
  },

  {
    key: 'active',
    label: 'Active',
    dataType: ColumnDataType.BOOLEAN,
    filters: EQUALS_WITH_OPTIONS([
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' },
    ]),
  },
  {
    key: 'updatedAt',
    label: 'Updated',
    dataType: ColumnDataType.DATE,
    render: (row: any) => new Date(row.updatedAt).toDateString(),
    filters: ColumnTypeFilters.DATE,
  },
];

const config: ModelConfig = {
  id: 'mappings',
  title: 'Mappings',
  description: 'Mappings for Cannonical Entities .',
  endpoint: 'v1/mappings',
  columns,
  modalTitle: 'Application Entity',
  canDelete: true,
};

export function MappingPage() {
  const [formState, setFormState] = useState<Record<string, unknown>>({});
  const updateField = (name: string, value: unknown) => {
    setFormState((prev) => ({
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
}
