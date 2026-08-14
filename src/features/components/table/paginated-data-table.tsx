import { Card, TextInput, Select, Group, Stack, Table, Text, Loader, Center } from '@mantine/core';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FilterValue, Pagination as PaginationType } from '../../rxsoft/types';
import { ActionCellProps } from './action-cell';
import { Pagination } from './pagination';
import { DataTable } from './table';

type PaginatedDataTableProps = {
  columns: Array<{
    key: string;
    label: string;
    render?: (row: Record<string, unknown>) => React.ReactNode;
  }>;
  rows: Record<string, unknown>[];
  isLoading?: boolean;
  isError?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  pageSizeOptions?: number[];
  actionCellProps?: ActionCellProps;
  appliedFilters?: Record<string, FilterValue | null>;
  applyColumnFilter?: (columnKey: string, filterValue: FilterValue | null) => void;
  pageIndex?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export function PaginatedDataTable({
  columns,
  rows,
  isLoading = false,
  isError = false,
  searchValue,
  onSearchChange,
  actionCellProps,
  applyColumnFilter,
  appliedFilters,
}: PaginatedDataTableProps) {
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  // const [pagination, setPagination] = useState<PaginationType>({
  //   pageIndex: 0,
  //   pageSize: 0,
  //   to : 0,
  // })

  const search = searchValue ?? '';
  const setSearch = onSearchChange ?? (() => {});

  useEffect(() => {
    setPageIndex(1);
  }, [search, pageSize]);

  const pagedRows = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [pageIndex, pageSize, rows]);

  const totalPages = Math.ceil(rows.length / pageSize);

  // {
  //                 canDelete,
  //                 detailPathBuilder,
  //                 editPathBuilder,
  //                 hasInlineEdit,
  //                 openEditModal: openModal,
  //                 deleteMutation,
  //               }

  return (
    <Stack gap="md">
      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        errorLoading={isError}
        actionCellProps={actionCellProps}
        appliedFilters={appliedFilters}
        applyColumnFilter={applyColumnFilter}
      />
      {pageIndex && pageSize && totalPages && (
        <Pagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalItems={rows.length}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
        />
      )}
    </Stack>
  );
}
