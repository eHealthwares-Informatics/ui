import { Group, Text, Pagination as MantinePagination, Select } from '@mantine/core';

type PaginationProps = {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function Pagination({
  pageIndex,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0;
  const activePage = Math.min(Math.max(pageIndex, 1), Math.max(totalPages, 1));

  // Always include the active page size: a size that is not in the preset list
  // leaves the Select with no matching option, so it renders empty (this is
  // what happened when the default was 25).
  const pageSizeOptions = Array.from(new Set([5, 10, 20, 25, 30, 50, 100, pageSize]))
    .sort((a, b) => a - b)
    .map((size) => ({ value: String(size), label: `${size} / page` }));

  return (
    <Group justify="space-between" align="center" wrap="wrap">
      {/* LEFT: count */}
      <Text data-testid="pagination-records-total" size="sm" c="dimmed">
        {totalItems} record{totalItems === 1 ? '' : 's'} total
      </Text>

      {/* RIGHT: controls */}
      {totalItems > 0 && (
        <Group gap="sm" align="center">
          {/* page info */}
          <Text size="sm" c="dimmed">
            Page {pageIndex} of {totalPages}
          </Text>

          {/* pagination */}
          <MantinePagination
            data-testid="pagination-controls"
            value={activePage}
            onChange={onPageChange}
            total={totalPages}
          />

          {/* page size */}
          <Select
            data-testid="pagination-page-size"
            value={String(pageSize)}
            onChange={(val) => val && onPageSizeChange(Number(val))}
            data={pageSizeOptions}
            w={120}
          />
        </Group>
      )}
    </Group>
  );
}
