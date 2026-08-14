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

  return (
    <Group justify="space-between" align="center" wrap="wrap">
      {/* LEFT: count */}
      <Text size="sm" c="dimmed">
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
          <MantinePagination value={activePage} onChange={onPageChange} total={totalPages} />

          {/* page size */}
          <Select
            value={String(pageSize)}
            onChange={(val) => val && onPageSizeChange(Number(val))}
            data={[5, 10, 20, 30, 50, 100].map((size) => ({
              value: String(size),
              label: `${size} / page`,
            }))}
            w={120}
          />
        </Group>
      )}
    </Group>
  );
}
