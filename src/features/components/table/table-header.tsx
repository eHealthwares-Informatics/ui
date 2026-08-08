import {
  ActionIcon,
  Group,
  Menu,
  TextInput,
  Modal,
  NumberInput,
  Stack,
  Button,
  Select,
} from '@mantine/core';
import { DatePickerInput, DateTimePicker } from '@mantine/dates';
import { ArrowDown, ArrowUp, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Column, ColumnDataType, ColumnFilter, FilterType, FilterValue } from '../../rxsoft/types';
import { resolveAutoFilterValue } from './utils';
import { AsyncSelectField } from '../form/async-field';

export type SortOrder = 'asc' | 'desc' | null;

export const TableHeader = ({
  column,
  filterValue,
  onFilterValueChange,
  sortBy,
  sortOrder,
  onSortChange,
}: {
  column: Column;
  filterValue?: FilterValue | null;
  onFilterValueChange?: (filterValue: FilterValue | null) => void;
  sortBy?: string | null;
  sortOrder?: SortOrder;
  onSortChange?: (key: string, order: SortOrder) => void;
}) => {
  const { label, dataType, filters, sortable } = column;
  const [open, setOpen] = useState(false);
  const [menuOpened, setMenuOpened] = useState(false);
  const [tempFilter, setTempFilter] = useState<FilterValue | null>(filterValue || null);

  const isSorted = sortable && sortBy === column.key && !!sortOrder;
  const sortIcon = !sortable
    ? null
    : sortOrder === 'asc' && sortBy === column.key
      ? <ArrowUp size={14} />
      : sortOrder === 'desc' && sortBy === column.key
        ? <ArrowDown size={14} />
        : <ArrowUpDown size={14} />;

  const handleSortClick = () => {
    if (!onSortChange) return;
    const next: SortOrder =
      sortBy !== column.key || !sortOrder
        ? 'asc'
        : sortOrder === 'asc'
          ? 'desc'
          : null;
    onSortChange(column.key, next);
  };

  // ------------------------
  // HANDLE FILTER CLICK
  // ------------------------
  const handleFiltering = (filter: ColumnFilter) => {
    setMenuOpened(false); // ✅ close immediately

    const auto = resolveAutoFilterValue(filter);

    // ✅ AUTO FILTER → apply instantly
    if (onFilterValueChange && auto) {
      onFilterValueChange(auto);
      setTempFilter(auto);
      return;
    }

    // ❌ NEED INPUT → open modal
    setTempFilter({ filter, value: '', valueTo: '' });
    setOpen(true);
  };

  // ------------------------
  // APPLY BUTTON
  // ------------------------
  const handleApply = () => {
    onFilterValueChange && onFilterValueChange(tempFilter);
    // setTempFilter(null)
    setOpen(false);
  };

  // ------------------------
  // UI
  // ------------------------
  return (
    <>
      <Group gap="xs">
        {label}

        {sortable && onSortChange && (
          <ActionIcon
            size="sm"
            variant={isSorted ? 'light' : 'subtle'}
            color={isSorted ? 'blue' : undefined}
            onClick={handleSortClick}
            aria-label={`Sort by ${label}`}
          >
            {sortIcon}
          </ActionIcon>
        )}

        {filters && onFilterValueChange && filters?.length > 0 && (
          <Menu shadow="md" width={220} opened={menuOpened} onChange={setMenuOpened}>
            <Menu.Target>
              <ActionIcon size="sm" variant="subtle">
                <SlidersHorizontal size={14} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {filters?.map((filter: ColumnFilter) =>
                filter.options ? (
                  <Select
                    value={tempFilter?.value}
                    data={filter.options}
                    onChange={(value) =>
                      handleFiltering({ ...filter, filterValue: { filter, value } })
                    }
                  />
                ) : filter.async_option_config ?
                  <AsyncSelectField
                    value={filter.filterValue?.value}
                    field={{ name: filter.name, value: filter.filterValue?.value, searchParam: filter.async_option_config, label: '' }}
                    onChange={(value) =>
                      handleFiltering({ ...filter, filterValue: { filter, value: value?.value } })
                    } />
                  : (
                    <Menu.Item key={filter.type} onClick={() => handleFiltering(filter)}>
                      {filter.name}
                    </Menu.Item>
                  )
              )}

              <Menu.Item color="red" onClick={() => onFilterValueChange(null)}>
                Clear filter
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      {/* MODAL */}
      {tempFilter && (
        <Modal opened={open} onClose={() => setOpen(false)} title={tempFilter?.filter.name}>
          <Stack>
            <FilterInput
              dataType={dataType}
              filterValue={tempFilter}
              updateFilter={setTempFilter}
            />

            <Button onClick={handleApply}>Apply</Button>
          </Stack>
        </Modal>
      )}
    </>
  );
};

// ------------------------
// RENDER INPUT
// ------------------------
const FilterInput = ({
  dataType,
  filterValue,
  updateFilter,
}: {
  dataType: any;
  filterValue: FilterValue;
  updateFilter: (filterValue: FilterValue | null) => void;
}) => {
  const isBetween = filterValue.filter.type === FilterType.BETWEEN;
  const [value, setValue] = useState<string | null>(filterValue.value);
  const [valueTo, setValueTo] = useState<string | null>(filterValue.valueTo);

  useEffect(() => {
    updateFilter({
      ...filterValue,
      value,
      valueTo,
    });
  }, [value, valueTo]);

  switch (dataType) {
    case ColumnDataType.NUMBER:
      return (
        <Stack>
          <NumberInput
            label={isBetween ? 'From' : 'Value'}
            value={value || ''}
            onChange={(v) => setValue(v as string)}
          />
          {isBetween && (
            <NumberInput label="To" value={valueTo || ''} onChange={(v) => setValue(v as string)} />
          )}
        </Stack>
      );

    case ColumnDataType.DATE:
      return (
        <Stack>
          <DatePickerInput label={isBetween ? 'From' : 'Date'} value={value} onChange={setValue} />
          {isBetween && <DatePickerInput label="To" value={valueTo} onChange={setValueTo} />}
        </Stack>
      );

    case ColumnDataType.DATETIME:
      return (
        <Stack>
          <DateTimePicker label={isBetween ? 'From' : 'Date'} value={value} onChange={setValue} />
          {isBetween && <DateTimePicker label="To" value={valueTo} onChange={setValueTo} />}
        </Stack>
      );

    default:
      return (
        <TextInput
          label="Value"
          value={value || ''}
          onChange={(e) => setValue(e.currentTarget.value)}
        />
      );
  }
};
