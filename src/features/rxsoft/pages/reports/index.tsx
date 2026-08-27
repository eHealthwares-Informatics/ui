import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  BarChart3,
  BoxIcon,
  CalendarDays,
  Download,
  FileBarChart,
  FileText,
  Hash,
  Loader2,
  Package,
  ShoppingBag,
  TrendingUp,
  Warehouse,
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { downloadBlob, rxsoftApi } from '@/lib/rxsoft-api';
import { RxPage } from '../../../components/page/rx-page';
import type { DailySale, InventoryValuation, TopProduct } from '../../types';
import { ReportsTable } from './components/table';

export function RxReportsPage() {
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, unknown>>({});

  const updateField = (name: string, value: unknown) => {
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const reportsQuery = useQuery({
    queryKey: ['rxsoft-reports'],
    queryFn: async () => {
      const [dailySales, inventory, topProducts] = await Promise.all([
        rxsoftApi.get<DailySale[]>('/reports/daily-sales'),
        rxsoftApi.get<InventoryValuation>('/reports/inventory-valuation'),
        rxsoftApi.get<TopProduct[]>('/reports/top-selling-items'),
      ]);

      return {
        dailySales: dailySales.data,
        inventory: inventory.data,
        topProducts: topProducts.data,
      };
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      await downloadBlob({ method: 'GET', url: '/reports/export' }, 'reports_summary.csv');
    },
    onError: () => setError('Failed to export report summary.'),
  });

  const data = reportsQuery.data;

  return (
    <RxPage
      title="Reports"
      description="Daily/monthly analytics and export-ready operational reports."
      actions={
        <Button onClick={() => exportMutation.mutate()} loading={exportMutation.isPending}>
          Export Summary
        </Button>
      }
    >
      {/* LOADING */}
      {reportsQuery.isLoading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {/* ERROR */}
      {(reportsQuery.isError || error) && (
        <Text c="red" size="sm">
          {error ?? 'Failed to load reports.'}
        </Text>
      )}

      {/* CONTENT */}
      {data && (
        <Stack gap="lg">
          {/* KPI CARDS */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Card withBorder radius="md" p="md">
              <Group gap="sm" align="flex-start" wrap="nowrap">
                <ThemeIcon color="blue" variant="light" size="lg" radius="md">
                  <Package size={24} />
                </ThemeIcon>
                <Stack gap={2} style={{ flex: 1 }}>
                  <Text size="xs" c="dimmed" fw={600}>
                    Inventory Items
                  </Text>
                  <Text size="xl" fw={700} lh={1.1}>
                    {data.inventory.itemsCount.toLocaleString()}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Total products in stock
                  </Text>
                </Stack>
              </Group>
            </Card>

            <Card withBorder radius="md" p="md">
              <Group gap="sm" align="flex-start" wrap="nowrap">
                <ThemeIcon color="green" variant="light" size="lg" radius="md">
                  <Warehouse size={24} />
                </ThemeIcon>
                <Stack gap={2} style={{ flex: 1 }}>
                  <Text size="xs" c="dimmed" fw={600}>
                    Total Quantity
                  </Text>
                  <Text size="xl" fw={700} lh={1.1}>
                    {data.inventory.totalQuantity.toLocaleString()}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Units across all locations
                  </Text>
                </Stack>
              </Group>
            </Card>
          </SimpleGrid>

          {/* QUICK STATS ROW */}
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
            <Card withBorder radius="md" p="sm">
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon color="orange" variant="light" size="sm" radius="sm">
                  <CalendarDays size={16} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" fw={500}>
                    Sales Days
                  </Text>
                  <Text size="sm" fw={600}>
                    {data.dailySales.length}
                  </Text>
                </Stack>
              </Group>
            </Card>

            <Card withBorder radius="md" p="sm">
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon color="grape" variant="light" size="sm" radius="sm">
                  <ShoppingBag size={16} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" fw={500}>
                    Top Products
                  </Text>
                  <Text size="sm" fw={600}>
                    {data.topProducts.length}
                  </Text>
                </Stack>
              </Group>
            </Card>

            <Card withBorder radius="md" p="sm">
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon color="teal" variant="light" size="sm" radius="sm">
                  <TrendingUp size={16} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" fw={500}>
                    Avg Daily Sales
                  </Text>
                  <Text size="sm" fw={600}>
                    {data.dailySales.length > 0
                      ? (
                          data.dailySales.reduce((sum, d) => sum + (d.salesCount ?? 0), 0) /
                          data.dailySales.length
                        ).toFixed(1)
                      : '0'}
                  </Text>
                </Stack>
              </Group>
            </Card>

            <Card withBorder radius="md" p="sm">
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon color="red" variant="light" size="sm" radius="sm">
                  <BarChart3 size={16} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" fw={500}>
                    Top Product
                  </Text>
                  <Text size="sm" fw={600} lineClamp={1}>
                    {data.topProducts.length > 0 ? data.topProducts[0].productCode : '—'}
                  </Text>
                </Stack>
              </Group>
            </Card>
          </SimpleGrid>

          <Divider />

          {/* TABLES */}
          <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="md">
            <ReportsTable
              title="Daily Sales"
              description="Operational totals by day"
              icon={FileBarChart}
              columns={['Day', 'Sales Count', 'Total Amount']}
              rows={data.dailySales.map((item) => (
                <tr key={item.day}>
                  <td>
                    <Group gap="xs" wrap="nowrap">
                      <CalendarDays size={14} color="var(--mantine-color-dimmed)" />
                      <Text size="sm">{item.day}</Text>
                    </Group>
                  </td>
                  <td>
                    <Badge size="sm" variant="light" color="blue">
                      {item.salesCount}
                    </Badge>
                  </td>
                  <td>
                    <Text size="sm" fw={500}>
                      {typeof item.totalAmount === 'number'
                        ? `₦${item.totalAmount.toLocaleString()}`
                        : item.totalAmount}
                    </Text>
                  </td>
                </tr>
              ))}
            />

            <ReportsTable
              title="Top Products"
              description="Best-performing products"
              icon={FileText}
              columns={['Product', 'Quantity Sold', 'Revenue']}
              rows={data.topProducts.map((item) => (
                <tr key={item.productCode}>
                  <td>
                    <Group gap="xs" wrap="nowrap">
                      <BoxIcon size={14} color="var(--mantine-color-dimmed)" />
                      <Text size="sm" fw={500}>
                        {item.productCode}
                      </Text>
                    </Group>
                  </td>
                  <td>
                    <Badge size="sm" variant="light" color="green">
                      {item.quantitySold}
                    </Badge>
                  </td>
                  <td>
                    <Text size="sm" fw={500}>
                      {typeof item.revenue === 'number'
                        ? `₦${item.revenue.toLocaleString()}`
                        : item.revenue}
                    </Text>
                  </td>
                </tr>
              ))}
            />
          </SimpleGrid>
        </Stack>
      )}
    </RxPage>
  );
}
