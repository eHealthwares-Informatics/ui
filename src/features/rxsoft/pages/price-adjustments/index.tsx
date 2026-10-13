import { Badge, Button, Card, Group, Pagination, Select, Stack, Table, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { RxPage } from '../../../components/page/rx-page';

type PriceAdjustmentRow = {
  id: string;
  priceListId: string | null;
  priceListName?: string | null;
  itemId: string | null;
  itemName?: string | null;
  itemCode?: string | null;
  locationName?: string | null;
  reason: string | null;
  delta: number | string;
  oldUnitPrice: number | string | null;
  newUnitPrice: number | string;
  currencyCode: string | null;
  performedByUserId: string;
  performedAt: string;
};

const PAGE_SIZE = 20;

const money = (value: number | string | null | undefined, currency?: string | null) => {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return `${currency ?? ''} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`.trim();
};

/**
 * Price-adjustment history — append-only audit of every price list item change
 * (`GET /price-adjustments`). Filters by item, price list and date range; the
 * page can be deep-linked with `?itemId=<uuid>` (e.g. from Price List Items).
 */
export function RxPriceAdjustmentsPage() {
  const initialItemId = useMemo(
    () =>
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('itemId')
        : null,
    []
  );

  const [itemId, setItemId] = useState<string | null>(initialItemId);
  const [itemSearch, setItemSearch] = useState('');
  const [priceListId, setPriceListId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [itemId, priceListId, fromDate, toDate]);

  const { data: itemResults = [] } = useQuery({
    queryKey: ['items-search', itemSearch],
    queryFn: async () => {
      if (itemSearch.trim().length < 2) return [];
      const { data } = await rxsoftApi.get('/items', {
        params: { search: itemSearch, page: 1, limit: 20 },
      });
      return data?.data ?? [];
    },
    enabled: itemSearch.trim().length >= 2,
  });

  const { data: priceLists = [] } = useQuery({
    queryKey: ['price-lists', 'all'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/price-lists', { params: { limit: 100 } });
      return data?.data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['price-adjustments', { itemId, priceListId, fromDate, toDate, page }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (itemId) params.itemId = itemId;
      if (priceListId) params.priceListId = priceListId;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const { data } = await rxsoftApi.get('/price-adjustments', { params });
      return data as { data: PriceAdjustmentRow[]; meta: { total: number } };
    },
  });

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const clearFilters = () => {
    setItemId(null);
    setPriceListId(null);
    setFromDate(null);
    setToDate(null);
  };

  return (
    <RxPage
      title="Price Adjustment History"
      description="Every price list item change, with the before/after price window and reason."
    >
      <Stack gap="md">
        <Card withBorder radius="md" p="md">
          <Group align="flex-end" gap="sm" wrap="wrap">
            <Select
              label="Item"
              placeholder="Search items…"
              w={260}
              searchable
              clearable
              value={itemId}
              onChange={setItemId}
              onSearchChange={setItemSearch}
              data={(Array.isArray(itemResults) ? itemResults : []).map((i: any) => ({
                value: i.id,
                label: `${i.displayName ?? i.name ?? i.id}${i.code ? ` (${i.code})` : ''}`,
              }))}
              nothingFoundMessage={itemSearch.length < 2 ? 'Type 2+ characters' : 'No items'}
            />
            <Select
              label="Price list"
              placeholder="All price lists"
              w={220}
              searchable
              clearable
              value={priceListId}
              onChange={setPriceListId}
              data={(Array.isArray(priceLists) ? priceLists : []).map((p: any) => ({
                value: p.id,
                label: p.name ?? p.code ?? p.id,
              }))}
            />
            <DatePickerInput
              label="From"
              placeholder="Any"
              valueFormat="YYYY-MM-DD"
              clearable
              value={fromDate}
              onChange={setFromDate}
              w={160}
            />
            <DatePickerInput
              label="To"
              placeholder="Any"
              valueFormat="YYYY-MM-DD"
              clearable
              value={toDate}
              onChange={setToDate}
              w={160}
            />
            <Button variant="light" onClick={clearFilters}>
              Clear
            </Button>
          </Group>
        </Card>

        <Table.ScrollContainer minWidth={900}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Item</Table.Th>
                <Table.Th>Price list</Table.Th>
                <Table.Th>Old → New</Table.Th>
                <Table.Th>Δ</Table.Th>
                <Table.Th>Reason</Table.Th>
                <Table.Th>By</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => {
                const delta = Number(row.delta);
                return (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      {row.performedAt ? new Date(row.performedAt).toLocaleString() : '—'}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600}>
                        {row.itemName ?? row.itemId ?? '—'}
                      </Text>
                      {row.itemCode ? (
                        <Text size="xs" c="dimmed">
                          {row.itemCode}
                        </Text>
                      ) : null}
                    </Table.Td>
                    <Table.Td>{row.priceListName ?? row.priceListId ?? '—'}</Table.Td>
                    <Table.Td>
                      {money(row.oldUnitPrice, row.currencyCode)} →{' '}
                      {money(row.newUnitPrice, row.currencyCode)}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={delta < 0 ? 'red' : delta > 0 ? 'green' : 'gray'}
                        variant="light"
                      >
                        {delta > 0 ? '+' : ''}
                        {Number.isNaN(delta) ? '—' : delta.toLocaleString()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{row.reason ?? '—'}</Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {row.performedByUserId ? row.performedByUserId.slice(0, 8) : '—'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {!isLoading && rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text c="dimmed" ta="center" py="lg">
                      No price adjustments found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {isLoading ? 'Loading…' : `${total} adjustment${total === 1 ? '' : 's'}`}
          </Text>
          {totalPages > 1 ? (
            <Pagination value={page} onChange={setPage} total={totalPages} />
          ) : null}
        </Group>
      </Stack>
    </RxPage>
  );
}
