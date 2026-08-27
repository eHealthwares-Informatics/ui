import { Group, Select, TextInput, ActionIcon } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { X } from 'lucide-react';
import { Column, ColumnDataType, ColumnFilter } from '@/features/rxsoft/types';
import { isNoValueFilter, isRangeFilter } from './filters-helpers';

export type LocalFilter = {
  id: string;
  columnKey: string | null;
  selectedFilter: ColumnFilter | null;
  value?: any;
  valueTo?: any;
};

function toDate(value?: any): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateValue(date: any): string | undefined {
  if (!date) {
    return undefined;
  }
  const parsed = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}

export function FilterRow({
  filter,
  columns,
  updateFilter,
  removeFilter,
}: {
  filter: LocalFilter;
  columns: Column[];
  updateFilter: (id: string, field: keyof LocalFilter, value: any) => void;
  removeFilter: (id: string) => void;
}) {
  const column = columns.find((c) => c.key === filter.columnKey);
  const availableFilters = column?.filters ?? [];
  const type = filter.selectedFilter?.type;
  const isDateColumn =
    column?.dataType === ColumnDataType.DATE ||
    column?.dataType === ColumnDataType.DATETIME;

  return (
    <Group grow align="flex-end">
      {/* Column */}
      <Select
        label="Field"
        placeholder="Select field"
        value={filter.columnKey}
        onChange={(val) => {
          updateFilter(filter.id, 'columnKey', val);
          updateFilter(filter.id, 'selectedFilter', null);
          updateFilter(filter.id, 'value', undefined);
          updateFilter(filter.id, 'valueTo', undefined);
        }}
        data={columns
          .filter((c) => c.filters && c.filters.length > 0)
          .map((c) => ({
            value: c.key,
            label: c.label,
          }))}
      />

      {/* Operation */}
      <Select
        label="Operation"
        placeholder="Select operation"
        value={type ?? null}
        onChange={(val) => {
          const selected = availableFilters.find((f) => f.type === val);
          updateFilter(filter.id, 'selectedFilter', selected || null);
          updateFilter(filter.id, 'value', undefined);
          updateFilter(filter.id, 'valueTo', undefined);
        }}
        data={availableFilters.map((f) => ({
          value: f.type,
          label: f.name,
        }))}
        disabled={!filter.columnKey}
      />

      {/* Value Inputs */}
      {isRangeFilter(type) ? (
        isDateColumn ? (
          <>
            <DatePickerInput
              label="From"
              value={toDate(filter.value)}
              onChange={(date) => updateFilter(filter.id, 'value', dateValue(date))}
              clearable
            />
            <DatePickerInput
              label="To"
              value={toDate(filter.valueTo)}
              onChange={(date) => updateFilter(filter.id, 'valueTo', dateValue(date))}
              clearable
            />
          </>
        ) : (
          <>
            <TextInput
              label="From"
              value={filter.value || ''}
              onChange={(e) => updateFilter(filter.id, 'value', e.currentTarget.value)}
            />
            <TextInput
              label="To"
              value={filter.valueTo || ''}
              onChange={(e) => updateFilter(filter.id, 'valueTo', e.currentTarget.value)}
            />
          </>
        )
      ) : !isNoValueFilter(type) && type ? (
        isDateColumn ? (
          <DatePickerInput
            label="Value"
            value={toDate(filter.value)}
            onChange={(date) => updateFilter(filter.id, 'value', dateValue(date))}
            clearable
          />
        ) : (
          <TextInput
            label="Value"
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, 'value', e.currentTarget.value)}
          />
        )
      ) : null}

      {/* Remove */}
      <ActionIcon color="red" variant="light" onClick={() => removeFilter(filter.id)}>
        <X size={16} />
      </ActionIcon>
    </Group>
  );
}
