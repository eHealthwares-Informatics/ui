import { ActionIcon, Button, Group, Menu, Text, TextInput } from '@mantine/core';
import { Download, FileText, Filter, RefreshCcw, Search, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Column, FilterValue } from '@/features/rxsoft/types';
import { useDebouncedValue } from '../utils';
import FiltersModal from './filters-modal';

export const HeaderBar = ({
  open,
  setOpen,
  columns,
  appliedFilters,
  updateFilters,
  pageIndex,
  pageSize,
  totalItems,
  onCreate,
  refresh,
  search,
  onSearchChange,
  customActions,
  onExportCsv,
  onExportPdf,
  onDelete,
  hasFilterableColumns,
  minSearchLength = 2,
  debounceMs = 300,
}: {
  open: boolean;
  appliedFilters: Record<string, FilterValue | null>;
  updateFilters: (columnKey: string, filterValue: FilterValue | null) => void;
  setOpen: (value: boolean) => void;
  columns: Column[];
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  onCreate?: () => void;
  refresh: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  customActions?: React.ReactNode;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  onDelete?: () => void;
  hasFilterableColumns?: boolean;
  minSearchLength?: number;
  debounceMs?: number;
}) => {
  const [searchValue, setSearchValue] = useState(search);
  const debouncedSearch = useDebouncedValue(searchValue, debounceMs);

  useEffect(() => {
    if (debouncedSearch.length === 0 || debouncedSearch.length >= minSearchLength) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, minSearchLength, onSearchChange]);

  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  return (
    <>
      <Group justify="space-between">
        <Group gap="xs">
          <TextInput
            data-testid="header-search"
            leftSection={<Search size={14} />}
            placeholder="Search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.currentTarget.value)}
          />
          {hasFilterableColumns && (
            <Button variant="subtle" leftSection={<Filter size={14} />} onClick={() => setOpen(true)}>
              Filters
            </Button>
          )}
          {onCreate && (
            <Button data-testid="header-new" variant="subtle" onClick={onCreate}>
              New
            </Button>
          )}
          {(onExportCsv || onExportPdf) && (
            <Menu shadow="md" width={160} withinPortal>
              <Menu.Target>
                <Button data-testid="header-export" variant="subtle" leftSection={<Download size={14} />}>
                  Export
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<Download size={14} />}
                  disabled={!onExportCsv}
                  onClick={onExportCsv}
                >
                  CSV
                </Menu.Item>
                <Menu.Item
                  leftSection={<FileText size={14} />}
                  disabled={!onExportPdf}
                  onClick={onExportPdf}
                >
                  PDF
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
          {onDelete && (
            <Button data-testid="header-delete" variant="subtle" leftSection={<Trash size={14} />} onClick={onDelete}>
              Delete
            </Button>
          )}
          {customActions}
        </Group>

        <Group gap="xs">
          {totalItems > 0 && (
            <Text size="xs" c="dimmed">
              {(pageIndex - 1) * pageSize + 1}–{Math.min(pageIndex * pageSize, totalItems)} of {totalItems}
            </Text>
          )}
          <ActionIcon variant="subtle" onClick={refresh}>
            <RefreshCcw size={16} />
          </ActionIcon>
        </Group>
      </Group>
      <FiltersModal
        open={open}
        setOpen={setOpen}
        columns={columns}
        appliedFilters={appliedFilters}
        updateFilters={updateFilters}
      />
    </>
  );
};
