import { BarChart, DonutChart, LineChart } from '@mantine/charts';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Grid,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import {
  Building2,
  Calculator,
  Calendar,
  Download,
  Filter,
  MapPin,
  Package,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { downloadBlob } from '@/lib/rxsoft-api';
import { RxPage } from '../../../components/page/rx-page';
import { ChartDefs, GradientCursor } from '../dashboard/chart-cursors';
import { ChartCard, EmptyChart, KpiCard } from '../dashboard/components';
import {
  formatAmount,
  formatCompact,
  formatLastUpdated,
  formatNaira,
  formatPct,
} from '../dashboard/format';
import { pctDelta, previousPeriodFilters } from '../dashboard/period';
import { bucketTrend } from '../dashboard/trend';
import {
  usePurchasesAnalytics,
  usePurchasesAnalyticsFilterOptions,
  type PurchasesAnalyticsFilters,
} from './use-purchases-analytics';

const CATEGORY_COLORS = [
  'green',
  'teal',
  'grape',
  'orange',
  'red',
  'blue',
  'cyan',
  'lime',
  'violet',
  'yellow',
];

const STATUS_LABELS: Record<string, string> = {
  received: 'Completed',
  partially_received: 'Partially Received',
  approved: 'Pending',
  draft: 'Pending',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  received: 'green',
  partially_received: 'blue',
  approved: 'yellow',
  draft: 'yellow',
  cancelled: 'red',
};

export function PurchasesDashboardPage() {
  const defaultRange = (): [string, string] => {
    const now = dayjs();
    return [now.startOf('month').format('YYYY-MM-DD'), now.format('YYYY-MM-DD')];
  };

  const [filterState, setFilterState] = useState<{
    location: string | null;
    dateRange: [string | null, string | null];
    category: string | null;
    supplier: string | null;
  }>({ location: null, dateRange: defaultRange(), category: null, supplier: null });

  const appliedFilters: PurchasesAnalyticsFilters = useMemo(() => {
    const [from, to] = filterState.dateRange;
    return {
      warehouseId: filterState.location ?? undefined,
      categoryCode: filterState.category ?? undefined,
      supplierId: filterState.supplier ?? undefined,
      from: from ?? undefined,
      to: to ?? undefined,
    };
  }, [filterState]);

  const analytics = usePurchasesAnalytics(appliedFilters);
  const previousFilters = previousPeriodFilters(appliedFilters);
  const previous = usePurchasesAnalytics(previousFilters ?? {}, { enabled: !!previousFilters });

  const { warehouses, categories, suppliers } = usePurchasesAnalyticsFilterOptions();

  const data = analytics.data;
  const prevData = previous.data;

  const lastUpdated = analytics.dataUpdatedAt
    ? formatLastUpdated(analytics.dataUpdatedAt)
    : formatLastUpdated(Date.now());

  const applyFilters = () => {
    analytics.refetch();
  };

  const resetFilters = () => {
    setFilterState({
      location: null,
      dateRange: defaultRange(),
      category: null,
      supplier: null,
    });
  };

  const trendData = useMemo(() => (data ? bucketTrend(data.trend, 'Daily') : []), [data]);

  const categoryData: Array<{ name: string; value: number }> = useMemo(
    () => (data?.byCategory ?? []).map((c) => ({ name: c.name, value: c.value })),
    [data]
  );

  const supplierData: Array<{ name: string; value: number }> = useMemo(
    () => (data?.bySupplier ?? []).map((s) => ({ name: s.name, value: s.value })),
    [data]
  );

  const locationData: Array<{ name: string; value: number }> = useMemo(
    () => (data?.byLocation ?? []).map((l) => ({ name: l.name, value: l.value })),
    [data]
  );

  const statusData: Array<{ name: string; value: number; color: string }> = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const item of data?.byStatus ?? []) {
      const label = STATUS_LABELS[item.status] ?? item.status;
      grouped.set(label, (grouped.get(label) ?? 0) + item.count);
    }
    const order = ['Completed', 'Partially Received', 'Pending', 'Cancelled'];
    return [...grouped.entries()]
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([name, value]) => ({
        name,
        value,
        color: (Object.keys(STATUS_COLORS).find((k) => STATUS_LABELS[k] === name)
          ? STATUS_COLORS[Object.keys(STATUS_COLORS).find((k) => STATUS_LABELS[k] === name)!]
          : 'gray') as string,
      }));
  }, [data]);

  const spendBySupplier: Array<{ name: string; value: number; color: string }> = useMemo(
    () =>
      (data?.bySupplier ?? []).slice(0, 6).map((s, index) => ({
        name: s.name,
        value: s.value,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      })),
    [data]
  );

  const kpis = useMemo(() => {
    const colorFor = (delta?: number) =>
      delta === undefined ? 'gray' : delta < 0 ? 'red' : 'green';

    return [
      {
        label: 'Total Purchase Value',
        value: formatNaira(data?.summary.totalValue ?? 0),
        delta: pctDelta(data?.summary.totalValue, prevData?.summary.totalValue),
        icon: Wallet,
        color: 'blue',
        deltaColor: colorFor(pctDelta(data?.summary.totalValue, prevData?.summary.totalValue)),
      },
      {
        label: 'Total POs',
        value: (data?.summary.totalPOs ?? 0).toLocaleString(),
        delta: pctDelta(data?.summary.totalPOs, prevData?.summary.totalPOs),
        icon: ShoppingBag,
        color: 'green',
        deltaColor: colorFor(pctDelta(data?.summary.totalPOs, prevData?.summary.totalPOs)),
      },
      {
        label: 'Total Items Purchased',
        value: (data?.summary.itemsPurchased ?? 0).toLocaleString(),
        delta: pctDelta(data?.summary.itemsPurchased, prevData?.summary.itemsPurchased),
        icon: Package,
        color: 'orange',
        deltaColor: colorFor(
          pctDelta(data?.summary.itemsPurchased, prevData?.summary.itemsPurchased)
        ),
      },
      {
        label: 'Average PO Value',
        value: formatAmount(data?.summary.averagePOValue ?? 0),
        delta: pctDelta(data?.summary.averagePOValue, prevData?.summary.averagePOValue),
        icon: Calculator,
        color: 'grape',
        deltaColor: colorFor(
          pctDelta(data?.summary.averagePOValue, prevData?.summary.averagePOValue)
        ),
      },
      {
        label: 'Active Suppliers',
        value: (data?.summary.activeSuppliers ?? 0).toLocaleString(),
        delta: pctDelta(data?.summary.activeSuppliers, prevData?.summary.activeSuppliers),
        icon: Truck,
        color: 'teal',
        deltaColor: colorFor(
          pctDelta(data?.summary.activeSuppliers, prevData?.summary.activeSuppliers)
        ),
      },
      {
        label: 'Top Supplier',
        value: data?.summary.topSupplier?.name ?? '—',
        subtitle: data?.summary.topSupplier
          ? formatNaira(data.summary.topSupplier.value)
          : undefined,
        delta: pctDelta(data?.summary.topSupplier?.value, prevData?.summary.topSupplier?.value),
        icon: Store,
        color: 'cyan',
        deltaColor: colorFor(
          pctDelta(data?.summary.topSupplier?.value, prevData?.summary.topSupplier?.value)
        ),
      },
    ];
  }, [data, prevData]);

  const exportReport = async () => {
    await downloadBlob({ method: 'GET', url: '/purchases/export' }, 'purchases_report.csv');
  };

  const isLoading = analytics.isLoading;
  const isError = analytics.isError || previous.isError;

  return (
    <RxPage
      title="Purchases Dashboard"
      description="Track and analyze your purchasing performance"
      actions={
        <Group gap="xs" align="center">
          {!isLoading && !isError && (
            <Text size="xs" c="dimmed">
              Last updated: {lastUpdated}
            </Text>
          )}
          <Button
            variant="default"
            size="sm"
            leftSection={<Download size={16} />}
            onClick={exportReport}
          >
            Export Report
          </Button>
        </Group>
      }
    >
      <Stack gap="lg">
        {/* FILTERS */}
        <Card withBorder radius="md" p="md">
          <Grid gap="md" align="flex-end">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Location"
                placeholder="All Locations"
                data={warehouses}
                leftSection={<MapPin size={16} />}
                value={filterState.location}
                onChange={(value) => setFilterState((s) => ({ ...s, location: value }))}
                clearable
                searchable
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <DatePickerInput
                label="Date Range"
                type="range"
                placeholder="Pick dates"
                leftSection={<Calendar size={16} />}
                value={filterState.dateRange}
                onChange={(value) =>
                  setFilterState((s) => ({
                    ...s,
                    dateRange: value as [string | null, string | null],
                  }))
                }
                clearable={false}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Category"
                placeholder="All Categories"
                data={categories}
                leftSection={<Tags size={16} />}
                value={filterState.category}
                onChange={(value) => setFilterState((s) => ({ ...s, category: value }))}
                clearable
                searchable
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Supplier"
                placeholder="All Suppliers"
                data={suppliers}
                leftSection={<Building2 size={16} />}
                value={filterState.supplier}
                onChange={(value) => setFilterState((s) => ({ ...s, supplier: value }))}
                clearable
                searchable
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group gap="xs">
                <Button color="blue" leftSection={<Filter size={16} />} onClick={applyFilters}>
                  Apply Filters
                </Button>
                <Button variant="subtle" color="gray" onClick={resetFilters}>
                  Reset
                </Button>
              </Group>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="xs" c="dimmed" ta={{ md: 'right' }}>
                All amounts are in Nigerian Naira (₦)
              </Text>
            </Grid.Col>
          </Grid>
        </Card>

        {isLoading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {isError && (
          <Card withBorder radius="md" py="lg">
            <Center>
              <Text c="red" size="sm">
                Failed to load purchases analytics.
              </Text>
            </Center>
          </Card>
        )}

        {!isLoading && !isError && data && (
          <>
            {/* KPI CARDS */}
            <SimpleGrid cols={{ base: 2, md: 3, xl: 6 }} spacing="md">
              {kpis.map((kpi) => (
                <KpiCard key={kpi.label} {...kpi} />
              ))}
            </SimpleGrid>

            {/* CHARTS ROW 1 */}
            <Grid gap="md">
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <ChartCard title="Purchase Trend">
                  {trendData.length > 0 ? (
                    <LineChart
                      h={300}
                      data={trendData}
                      dataKey="displayDay"
                      series={[
                        { name: 'value', color: 'blue', label: 'Purchase Value' },
                        { name: 'orders', color: 'gray', label: 'Orders' },
                      ]}
                      withLegend
                      withDots={false}
                      curveType="linear"
                      gridAxis="xy"
                      valueFormatter={(value) => formatCompact(value)}
                      tooltipProps={{
                        contentStyle: {
                          backgroundColor: 'var(--mantine-color-white)',
                          border: '1px solid var(--mantine-color-gray-3)',
                          borderRadius: 'var(--mantine-radius-sm)',
                          boxShadow: 'var(--mantine-shadow-sm)',
                        },
                      }}
                      yAxisProps={{
                        tickFormatter: (value: number) => formatCompact(value),
                        width: 48,
                      }}
                    />
                  ) : (
                    <EmptyChart />
                  )}
                </ChartCard>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <ChartCard title="Purchase by Category">
                  {categoryData.length > 0 ? (
                    <BarChart
                      h={300}
                      data={categoryData}
                      dataKey="name"
                      series={[{ name: 'value', color: '#2f9e44', label: 'Value' }]}
                      withBarValueLabel
                      valueFormatter={(value) => formatCompact(value)}
                      barProps={{ radius: 4 }}
                      cursorFill="green.1"
                      tooltipProps={{
                        cursor: <GradientCursor gradientId="green" />,
                        contentStyle: {
                          backgroundColor: 'var(--mantine-color-white)',
                          border: '1px solid var(--mantine-color-gray-3)',
                          borderRadius: 'var(--mantine-radius-sm)',
                          boxShadow: 'var(--mantine-shadow-sm)',
                        },
                      }}
                      yAxisProps={{
                        tickFormatter: (value: number) => formatCompact(value),
                        width: 48,
                      }}
                    >
                      <ChartDefs ids={['green']} />
                    </BarChart>
                  ) : (
                    <EmptyChart />
                  )}
                </ChartCard>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <ChartCard title="Purchase by Supplier">
                  {supplierData.length > 0 ? (
                    <BarChart
                      h={300}
                      orientation="vertical"
                      data={supplierData}
                      dataKey="name"
                      series={[{ name: 'value', color: '#7950f2', label: 'Value' }]}
                      valueFormatter={(value) => formatCompact(value)}
                      barProps={{ radius: 4 }}
                      cursorFill="grape.1"
                      tooltipProps={{
                        cursor: <GradientCursor gradientId="grape" />,
                        contentStyle: {
                          backgroundColor: 'var(--mantine-color-white)',
                          border: '1px solid var(--mantine-color-gray-3)',
                          borderRadius: 'var(--mantine-radius-sm)',
                          boxShadow: 'var(--mantine-shadow-sm)',
                        },
                      }}
                      xAxisProps={{
                        tickFormatter: (value: number) => formatCompact(value),
                        width: 56,
                      }}
                    >
                      <ChartDefs ids={['grape']} />
                    </BarChart>
                  ) : (
                    <EmptyChart />
                  )}
                </ChartCard>
              </Grid.Col>
            </Grid>

            {/* CHARTS ROW 2 */}
            <Grid gap="md">
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <ChartCard title="Purchase by Location">
                  <Group align="center" wrap="nowrap" gap="lg">
                    <Box style={{ flex: 1 }}>
                      {locationData.length > 0 ? (
                        <BarChart
                          h={260}
                          orientation="vertical"
                          data={locationData}
                          dataKey="name"
                          series={[{ name: 'value', color: '#2f9e44', label: 'Value' }]}
                          valueFormatter={(value) => formatCompact(value)}
                          barProps={{ radius: 4 }}
                          cursorFill="green.1"
                          tooltipProps={{
                            cursor: <GradientCursor gradientId="green" />,
                            contentStyle: {
                              backgroundColor: 'var(--mantine-color-white)',
                              border: '1px solid var(--mantine-color-gray-3)',
                              borderRadius: 'var(--mantine-radius-sm)',
                              boxShadow: 'var(--mantine-shadow-sm)',
                            },
                          }}
                          xAxisProps={{
                            tickFormatter: (value: number) => formatCompact(value),
                            width: 52,
                          }}
                        >
                          <ChartDefs ids={['green']} />
                        </BarChart>
                      ) : (
                        <EmptyChart />
                      )}
                    </Box>
                    <Stack gap={6} justify="center" style={{ minWidth: 110 }}>
                      {(data?.byLocation ?? []).slice(0, 7).map((l) => (
                        <Group key={l.warehouseId} justify="space-between" gap={8} wrap="nowrap">
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {l.name}
                          </Text>
                          <Text size="xs" fw={600}>
                            {formatPct(l.pct)}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  </Group>
                </ChartCard>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                <ChartCard title="Spend by Supplier">
                  <Group align="center" wrap="nowrap" gap="lg">
                    {spendBySupplier.length > 0 ? (
                      <DonutChart
                        size={190}
                        thickness={26}
                        withTooltip
                        chartLabel={formatNaira(data.summary.totalValue)}
                        data={spendBySupplier}
                        valueFormatter={(value) => formatCompact(value)}
                      />
                    ) : (
                      <EmptyChart />
                    )}
                    <Stack gap="xs" justify="center" style={{ flex: 1 }}>
                      {spendBySupplier.map((s) => {
                        const pct =
                          data.summary.totalValue > 0
                            ? ((s.value / data.summary.totalValue) * 100).toFixed(1)
                            : '0.0';
                        return (
                          <Group key={s.name} justify="space-between" wrap="nowrap" gap="xs">
                            <Group gap={8} wrap="nowrap">
                              <Box
                                w={10}
                                h={10}
                                style={{ backgroundColor: s.color, borderRadius: 2 }}
                              />
                              <Text size="xs" lineClamp={1}>
                                {s.name}
                              </Text>
                            </Group>
                            <Text size="xs" c="dimmed">
                              {pct}%
                            </Text>
                          </Group>
                        );
                      })}
                    </Stack>
                  </Group>
                </ChartCard>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
                <ChartCard title="PO Status Summary">
                  <Group align="center" wrap="nowrap" gap="lg">
                    {statusData.length > 0 ? (
                      <DonutChart
                        size={190}
                        thickness={26}
                        withTooltip
                        chartLabel={(data.summary.totalPOs ?? 0).toLocaleString()}
                        data={statusData}
                      />
                    ) : (
                      <EmptyChart />
                    )}
                    <Stack gap="xs" justify="center" style={{ flex: 1 }}>
                      {statusData.map((s) => {
                        const pct = data.summary.totalPOs
                          ? ((s.value / data.summary.totalPOs) * 100).toFixed(1)
                          : '0.0';
                        return (
                          <Group key={s.name} justify="space-between" wrap="nowrap" gap="xs">
                            <Group gap={8} wrap="nowrap">
                              <Box
                                w={10}
                                h={10}
                                style={{ backgroundColor: s.color, borderRadius: 2 }}
                              />
                              <Text size="xs" lineClamp={1}>
                                {s.name}
                              </Text>
                            </Group>
                            <Text size="xs" c="dimmed">
                              {pct}%
                            </Text>
                          </Group>
                        );
                      })}
                    </Stack>
                  </Group>
                </ChartCard>
              </Grid.Col>
            </Grid>

            {/* RECENT PURCHASE ORDERS */}
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" align="center" mb="sm">
                <Text fw={600} size="sm">
                  Recent Purchase Orders
                </Text>
                <Anchor size="sm" href="/rxsoft/purchases">
                  View All
                </Anchor>
              </Group>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>PO / Invoice</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Supplier</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Value</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.recent.map((po) => (
                    <Table.Tr key={po.id}>
                      <Table.Td>{po.purchaseOrderNumber}</Table.Td>
                      <Table.Td>{po.orderDate}</Table.Td>
                      <Table.Td>{po.supplierName ?? '—'}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color={STATUS_COLORS[po.status] ?? 'gray'}>
                          {STATUS_LABELS[po.status] ?? po.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{formatNaira(po.totalAmount)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              {data.recent.length === 0 && (
                <Center py="md">
                  <Text size="sm" c="dimmed">
                    No recent purchase orders.
                  </Text>
                </Center>
              )}
            </Paper>
          </>
        )}
      </Stack>
    </RxPage>
  );
}
