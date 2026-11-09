import { Modal, Button, Stack, Group } from '@mantine/core';
import { useState, useEffect } from 'react';
import { Column, FilterValue } from '@/features/rxsoft/types';
import { FilterRow, LocalFilter } from './filter-row';

export default function FiltersModal({
  open,
  columns,
  appliedFilters,
  updateFilters,
  setOpen,
}: {
  open: boolean;
  appliedFilters: Record<string, FilterValue | null>;
  updateFilters: (columnKey: string, filterValue: FilterValue | null) => void;
  setOpen: (value: boolean) => void;
  columns: Column[];
}) {
  const [filters, setFilters] = useState<LocalFilter[]>([]);

  // Hydrate from appliedFilters when modal opens
  useEffect(() => {
    if (!open) {
      return;
    }

    const initial: LocalFilter[] = Object.entries(appliedFilters)
      .filter(([_, v]) => v !== null)
      .map(([key, v]) => ({
        id: crypto.randomUUID(),
        columnKey: key,
        selectedFilter: v!.filter,
        value: v!.value,
        valueTo: v!.valueTo,
      }));

    setFilters(initial);
  }, [open, appliedFilters]);

  const addFilter = () => {
    setFilters((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        columnKey: null,
        selectedFilter: null,
      },
    ]);
  };

  const updateFilter = (id: string, field: keyof LocalFilter, value: any) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const applyFilters = () => {
    // reset first
    Object.keys(appliedFilters).forEach((key) => updateFilters(key, null));

    filters.forEach((f) => {
      if (!f.columnKey || !f.selectedFilter) {
        return;
      }

      updateFilters(f.columnKey, {
        filter: f.selectedFilter,
        value: f.value,
        valueTo: f.valueTo,
      });
    });

    setOpen(false);
  };

  return (
    <Modal opened={open} onClose={() => setOpen(false)} title="Filters" centered size="lg">
      <Stack gap="md">
        {filters.map((filter) => (
          <FilterRow
            key={filter.id}
            filter={filter}
            columns={columns}
            updateFilter={updateFilter}
            removeFilter={removeFilter}
          />
        ))}

        <Button variant="subtle" color="green" onClick={addFilter}>
          + Add Filter
        </Button>

        <Group justify="flex-end">
          <Button onClick={applyFilters}>Apply</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
