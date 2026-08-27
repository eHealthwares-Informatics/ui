import { BarChart, CompositeChart, DonutChart, LineChart } from '@mantine/charts';
import {
  Box,
  Button,
  Card,
  Center,
  Grid,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import {
  Calculator,
  Calendar,
  CreditCard,
  Download,
  Filter,
  MapPin,
  Package,
  RotateCcw,
  ShoppingBag,
  Tags,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { downloadBlob } from '@/lib/rxsoft-api';
import { RxPage } from '../../../components/page/rx-page';
import type { SalesAnalyticsCategory } from '../../types';
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
  useGrossProfit,
  useSalesAnalytics,
  useSalesAnalyticsFilterOptions,
  type SalesAnalyticsFilters,
} from './use-sales-analytics';

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

export function SalesAnalyticsPage() {
  const defaultRange = (): [string, string] => {
    const now = dayjs();
    return [now.startOf('month').format('YYYY-MM-DD'), now.format('YYYY-MM-DD')];
  };

  const [filterState, setFilterState] = useState<{
    location: string | null;
    dateRange: [string | null, string | null];
    category: string | null;
    paymentMethod: string | null;
  }>({ location: null, dateRange: defaultRange(), category: null, paymentMethod: null });

  const appliedFilters: SalesAnalyticsFilters = useMemo(() => {
    const [from, to] = filterState.dateRange;
    return {
      stockLocationId: filterState.location ?? undefined,
      categoryCode: filterState.category ?? undefined,
      paymentMethodId: filterState.paymentMethod ?? undefined,
      from: from ?? undefined,
      to: to ?? undefined,
    };
  }, [filterState]);

  const analytics = useSalesAnalytics(appliedFilters);
  const previousFilters = previousPeriodFilters(appliedFilters);
  const previous = useSalesAnalytics(previousFilters ?? {}, { enabled: !!previousFilters });

  const { locations, categories, paymentMethods } = useSalesAnalyticsFilterOptions();

  const grossProfit = useGrossProfit(appliedFilters.from, appliedFilters.to);
  const grossProfitPrev = useGrossProfit(
    previousFilters?.from,
    previousFilters?.to,
    !!previousFilters
  );

  const data = analytics.data;
  const prevData = previous.data;
  const grossProfitValue = grossProfit.data;

  const lastUpdated = analytics.dataUpdatedAt
    ? formatLastUpdated(analytics.dataUpdatedAt)
    : formatLastUpdated(Date.now());

  const applyFilters = () => {
    analytics.refetch();
    grossProfit.refetch();
  };

  const resetFilters = () => {
    setFilterState({
      location: null,
      dateRange: defaultRange(),
      category: null,
      paymentMethod: null,
    });
  };

  const trendData = useMemo(() => (data ? bucketTrend(data.trend, 'Daily') : []), [data]);

  const categoryData: Array<{ name: string; revenue: number }> = useMemo(
    () => (data?.byCategory ?? []).map((c) => ({ name: c.name, revenue: c.revenue })),
    [data]
  );

  const locationData: Array<{ name: string; revenue: number }> = useMemo(
    () => (data?.byLocation ?? []).map((l) => ({ name: l.name, revenue: l.revenue })),
    [data]
  );

  const donutData: Array<{ name: string; value: number; color: string }> = useMemo(
    () =>
      (data?.byCategory ?? []).map((c: SalesAnalyticsCategory, index: number) => ({
        name: c.name,
        value: c.revenue,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      })),
    [data]
  );

  const kpis = useMemo(() => {
    const isDown = (delta?: number) => delta !== undefined && delta < 0;
    const colorFor = (delta?: number) =>
      delta === undefined ? 'gray' : isDown(delta) ? 'red' : 'green';

    return [
      {
        label: 'Total Sales',
        value: formatNaira(data?.summary.totalRevenue ?? 0),
        delta: pctDelta(data?.summary.totalRevenue, prevData?.summary.totalRevenue),
        icon: Wallet,
        color: 'blue',
        deltaColor: colorFor(pctDelta(data?.summary.totalRevenue, prevData?.summary.totalRevenue)),
      },
      {
        label: 'Total Orders',
        value: (data?.summary.totalSales ?? 0).toLocaleString(),
        delta: pctDelta(data?.summary.totalSales, prevData?.summary.totalSales),
        icon: ShoppingBag,
        color: 'green',
        deltaColor: colorFor(pctDelta(data?.summary.totalSales, prevData?.summary.totalSales)),
      },
      {
        label: 'Average Order Value',
        value: formatAmount(data?.summary.averageOrderValue ?? 0),
        delta: pctDelta(data?.summary.averageOrderValue, prevData?.summary.averageOrderValue),
        icon: Calculator,
        color: 'grape',
        deltaColor: colorFor(
          pctDelta(data?.summary.averageOrderValue, prevData?.summary.averageOrderValue)
        ),
      },
      {
        label: 'Items Sold',
        value: (data?.summary.itemsSold ?? 0).toLocaleString(),
        delta: pctDelta(data?.summary.itemsSold, prevData?.summary.itemsSold),
        icon: Package,
        color: 'orange',
        deltaColor: colorFor(pctDelta(data?.summary.itemsSold, prevData?.summary.itemsSold)),
      },
      {
        label: 'Gross Profit',
        value: formatNaira(grossProfitValue ?? 0),
        delta: pctDelta(grossProfitValue, grossProfitPrev.data),
        icon: TrendingUp,
        color: 'teal',
        deltaColor: colorFor(pctDelta(grossProfitValue, grossProfitPrev.data)),
      },
      {
        label: 'Refunds',
        value: formatNaira(data?.summary.refunds ?? 0),
        delta: pctDelta(data?.summary.refunds, prevData?.summary.refunds),
        icon: RotateCcw,
        color: 'red',
        deltaColor: colorFor(pctDelta(data?.summary.refunds, prevData?.summary.refunds)),
      },
    ];
  }, [data, prevData, grossProfitValue, grossProfitPrev.data]);

  const exportReport = async () => {
    await downloadBlob({ method: 'GET', url: '/reports/export' }, 'sales_report.csv');
  };

  const isLoading = analytics.isLoading || grossProfit.isLoading;
  const isError = analytics.isError || previous.isError;

  return (
    <RxPage
      title="Sales Analytics"
      description="Overview of sales performance"
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
            loading={false}
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
                data={locations}
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
                label="Payment Method"
                placeholder="All Methods"
                data={paymentMethods}
                leftSection={<CreditCard size={16} />}
                value={filterState.paymentMethod}
                onChange={(value) => setFilterState((s) => ({ ...s, paymentMethod: value }))}
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
                Failed to load sales analytics.
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
              <Grid.Col span={{ base: 12, xl: 8 }}>
                <ChartCard title="Sales Trend">
                  {trendData.length > 0 ? (
                    <LineChart
                      h={300}
                      data={trendData}
                      dataKey="displayDay"
                      series={[
                        { name: 'revenue', color: 'blue', label: 'Revenue' },
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

              <Grid.Col span={{ base: 12, xl: 4 }}>
                <ChartCard title="Sales by Category">
                  {categoryData.length > 0 ? (
                    <BarChart
                      h={300}
                      data={categoryData}
                      dataKey="name"
                      series={[
                        {
                          name: 'revenue',
                          color: '#2f9e44',
                          label: 'Revenue',
                        },
                      ]}
                      withBarValueLabel
                      valueFormatter={(value) => formatCompact(value)}
                      barProps={{ radius: 4 }}
                      cursorFill="blue.1"
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
            </Grid>

            {/* CHARTS ROW 2 */}
            <Grid gap="md">
              <Grid.Col span={{ base: 12, lg: 6, xl: 4 }}>
                <ChartCard title="Sales by Location">
                  {locationData.length > 0 ? (
                    <BarChart
                      h={300}
                      orientation="vertical"
                      data={locationData}
                      dataKey="name"
                      series={[
                        {
                          name: 'revenue',
                          color: '#7950f2',
                          label: 'Revenue',
                        },
                      ]}
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

              <Grid.Col span={{ base: 12, lg: 6, xl: 4 }}>
                <ChartCard title="Revenue Distribution">
                  <Group align="center" wrap="nowrap" gap="lg">
                    {donutData.length > 0 ? (
                      <DonutChart
                        size={190}
                        thickness={26}
                        withTooltip
                        chartLabel={formatNaira(data.summary.totalRevenue)}
                        data={donutData}
                        valueFormatter={(value) => formatCompact(value)}
                      />
                    ) : (
                      <EmptyChart />
                    )}
                    <Stack gap="xs" justify="center" style={{ flex: 1 }}>
                      {data.byCategory.map((category, index) => (
                        <Group key={category.code} justify="space-between" wrap="nowrap" gap="xs">
                          <Group gap={8} wrap="nowrap">
                            <Box
                              w={10}
                              h={10}
                              style={{
                                backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                                borderRadius: 2,
                              }}
                            />
                            <Text size="xs">{category.name}</Text>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {formatPct(category.pct)}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  </Group>
                </ChartCard>
              </Grid.Col>

              <Grid.Col span={{ base: 12, lg: 6, xl: 4 }}>
                <ChartCard title="Orders vs Revenue">
                  {trendData.length > 0 ? (
                    <CompositeChart
                      h={300}
                      data={trendData}
                      dataKey="displayDay"
                      withRightYAxis
                      series={[
                        {
                          name: 'orders',
                          color: 'gray',
                          type: 'bar',
                          label: 'Orders',
                          yAxisId: 'left',
                        },
                        {
                          name: 'revenue',
                          color: 'green',
                          type: 'line',
                          label: 'Revenue',
                          yAxisId: 'right',
                        },
                      ]}
                      withLegend
                      withDots={false}
                      gridAxis="xy"
                      tooltipProps={{
                        cursor: <GradientCursor gradientId="gray" />,
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
                      rightYAxisProps={{
                        tickFormatter: (value: number) => formatCompact(value),
                        width: 48,
                      }}
                    >
                      <ChartDefs ids={['gray']} />
                    </CompositeChart>
                  ) : (
                    <EmptyChart />
                  )}
                </ChartCard>
              </Grid.Col>
            </Grid>
          </>
        )}
      </Stack>
    </RxPage>
  );
}
