import { Table, Text, Loader, Center } from '@mantine/core';
import { Column, FilterValue } from '../../rxsoft/types';
import { ActionCell, ActionCellProps } from './action-cell';
import { TableHeader, SortOrder } from './table-header';
import { renderCell } from './utils';

type DataTableProps = {
  columns: Column[];
  rows: Record<string, unknown>[];
  isLoading: boolean;
  errorLoading: boolean;
  actionCellProps?: ActionCellProps;
  appliedFilters?: Record<string, FilterValue | null>;
  applyColumnFilter?: (columnKey: string, filterValue: FilterValue | null) => void;
  sortBy?: string | null;
  sortOrder?: SortOrder;
  onSortChange?: (key: string, order: SortOrder) => void;
};

export const DataTable = ({
  columns,
  actionCellProps,
  rows,
  isLoading,
  errorLoading,
  appliedFilters,
  applyColumnFilter,
  sortBy,
  sortOrder,
  onSortChange,
}: DataTableProps) => {
  const colSpan = columns.length + (actionCellProps ? 1 : 0);

  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>SN</Table.Th>
          {columns.map((column) => (
            <Table.Th key={column.key}>
              <TableHeader
                column={column}
                filterValue={appliedFilters && appliedFilters[column.key]}
                onFilterValueChange={(filterValue) => {
                  applyColumnFilter && applyColumnFilter(column.key, filterValue);
                }}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={onSortChange}
              />
            </Table.Th>
          ))}

          {actionCellProps && <Table.Th style={{ width: 140 }}>Actions</Table.Th>}
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {isLoading && (
          <Table.Tr>
            <Table.Td colSpan={colSpan}>
              <Center>
                <Loader size="sm" />
              </Center>
            </Table.Td>
          </Table.Tr>
        )}

        {errorLoading && (
          <Table.Tr>
            <Table.Td colSpan={colSpan}>
              <Text c="red" ta="center">
                Failed to load data
              </Text>
            </Table.Td>
          </Table.Tr>
        )}

        {!isLoading && !errorLoading && rows.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={colSpan}>
              <Text c="dimmed" ta="center">
                No records found.
              </Text>
            </Table.Td>
          </Table.Tr>
        )}

        {rows.map((row: any, index: number) => (
          <Table.Tr key={String(row.id ?? index)}>
            <Table.Td key={index}>{index + 1}</Table.Td>
            {columns.map((column) => (
              <Table.Td key={column.key}>
                {column.render ? column.render(row, actionCellProps) : renderCell(row, column)}
              </Table.Td>
            ))}

            {actionCellProps && (
              <Table.Td>
                <ActionCell {...actionCellProps} row={row} rowIndex={index} />
              </Table.Td>
            )}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};
