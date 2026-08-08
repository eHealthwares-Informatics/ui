import { useMemo, useState } from 'react';
import {
  Card,
  Group,
  Modal,
  Pagination,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Microscope,
  Printer,
  TrendingUp,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { RxPage } from '@/features/components/page/rx-page';
import { lisApi } from '@/lib/lis-api';

interface DashboardMetrics {
  totalOrders: number;
  ordersInProgress: number;
  ordersCompletedToday: number;
  receivedToday: number;
  pendingResults: number;
  readyForValidation: number;
  partiallyCompletedToday: number;
  ordersEnteredByUserToday: number;
  ordersRejectedToday: number;
  unPrintedResults: number;
  averageTurnAroundTimeHours: number;
  delayedTurnAroundCount: number;
  delayedTurnAroundThresholdHours: number;
  tatSubMetrics: {
    receptionToValidationHours: number;
    receptionToResultHours: number;
    resultToValidationHours: number;
  };
  dailyTrend: { date: string; received: number; completed: number }[];
}

interface MetricCardDef {
  type: string;
  icon: any;
  color: string;
  value: string | number;
  label: string;
  subtitle: string;
  clickable: boolean;
}

const COLUMNS: Record<string, { key: string; label: string; render?: (v: any) => string }[]> = {
  'orders-in-progress': [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'patientName', label: 'Patient' },
    { key: 'status', label: 'Status' },
    { key: 'receivedDate', label: 'Received' },
  ],
  'ready-for-validation': [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'patientName', label: 'Patient' },
    { key: 'resultValue', label: 'Result' },
  ],
  'completed-today': [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'patientName', label: 'Patient' },
    { key: 'completedDate', label: 'Completed' },
  ],
  'partially-completed-today': [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'patientName', label: 'Patient' },
    { key: 'status', label: 'Status' },
    { key: 'receivedDate', label: 'Received' },
  ],
  'entered-by-user-today': [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'patientName', label: 'Patient' },
    { key: 'createdAt', label: 'Created' },
  ],
  'rejected-today': [
    { key: 'barcode', label: 'Barcode' },
    { key: 'orderNumber', label: 'Order #' },
    { key: 'sampleType', label: 'Type' },
    { key: 'rejectionReason', label: 'Reason' },
  ],
  'unprinted-results': [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'patientName', label: 'Patient' },
    { key: 'validatedDate', label: 'Validated' },
  ],
  'received-today': [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'patientName', label: 'Patient' },
    { key: 'receivedDate', label: 'Received' },
    { key: 'requesterName', label: 'Requester' },
  ],
  'delayed-turnaround': [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'patientName', label: 'Patient' },
    { key: 'receivedDate', label: 'Received' },
    { key: 'hoursSinceReceive', label: 'Hours', render: (v: number) => `${v.toFixed(1)}h` },
  ],
};

function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ['lis-dashboard-metrics'],
    queryFn: async () => {
      const res = await lisApi.get('/lis/dashboard/metrics');
      return res.data as DashboardMetrics;
    },
    refetchInterval: 60_000,
  });
}

function useDrilldownData(type: string | null, page: number, pageSize: number) {
  return useQuery({
    queryKey: ['lis-dashboard-drilldown', type, page, pageSize],
    queryFn: async () => {
      const res = await lisApi.get(`/lis/dashboard/metrics/${type}`, {
        params: { offset: (page - 1) * pageSize, limit: pageSize },
      });
      return res.data as { data: Record<string, any>[]; total: number };
    },
    enabled: !!type,
  });
}

export function LisOrdersDashboardPage() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  const [selectedMetric, setSelectedMetric] = useState<{
    type: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const drilldown = useDrilldownData(selectedMetric?.type ?? null, page, pageSize);

  const statCards: MetricCardDef[] = useMemo(() => {
    if (!metrics) return [];
    return [
      { type: '', icon: ClipboardListIcon, color: 'blue', value: metrics.totalOrders, label: 'Total Orders', subtitle: '', clickable: false },
      { type: 'orders-in-progress', icon: Clock, color: 'orange', value: metrics.ordersInProgress, label: 'In Progress', subtitle: 'Awaiting Result Entry', clickable: true },
      { type: 'ready-for-validation', icon: Microscope, color: 'yellow', value: metrics.readyForValidation, label: 'Ready for Validation', subtitle: 'Awaiting Review', clickable: true },
      { type: 'completed-today', icon: CheckCircle2, color: 'green', value: metrics.ordersCompletedToday, label: 'Completed Today', subtitle: '', clickable: true },
      { type: 'partially-completed-today', icon: Ban, color: 'grape', value: metrics.partiallyCompletedToday, label: 'Partially Completed', subtitle: 'Awaiting Remaining Tests', clickable: true },
      { type: 'entered-by-user-today', icon: UserPlus, color: 'cyan', value: metrics.ordersEnteredByUserToday, label: 'Entered by You', subtitle: '', clickable: true },
      { type: 'rejected-today', icon: XCircle, color: 'red', value: metrics.ordersRejectedToday, label: 'Rejected Today', subtitle: '', clickable: true },
      { type: 'unprinted-results', icon: Printer, color: 'teal', value: metrics.unPrintedResults, label: 'Unprinted Results', subtitle: '', clickable: true },
      { type: 'received-today', icon: Inbox, color: 'blue', value: metrics.receivedToday, label: 'Electronic Orders', subtitle: '', clickable: true },
      { type: 'average-turnaround', icon: TrendingUp, color: 'teal', value: `${metrics.averageTurnAroundTimeHours}h`, label: 'Avg TAT', subtitle: 'Reception to Validation', clickable: true },
      { type: 'delayed-turnaround', icon: AlertTriangle, color: 'red', value: metrics.delayedTurnAroundCount, label: 'Delayed Turnaround', subtitle: '', clickable: true },
    ];
  }, [metrics]);

  const handleTileClick = (card: MetricCardDef) => {
    if (!card.clickable) return;
    setPage(1);
    if (card.type === 'average-turnaround') {
      setSelectedMetric({ type: 'average-turnaround', title: 'Average Turnaround Time', subtitle: '' });
    } else {
      setSelectedMetric({ type: card.type, title: card.label, subtitle: card.subtitle });
    }
  };

  const closeDrilldown = () => {
    setSelectedMetric(null);
    setPage(1);
  };

  const columns = selectedMetric?.type ? COLUMNS[selectedMetric.type] ?? [] : [];
  const drilldownData = drilldown.data?.data ?? [];
  const drilldownTotal = drilldown.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(drilldownTotal / pageSize));

  return (
    <RxPage title="Dashboard" description="LIS operational metrics and trends">
      <Stack gap="lg">
        {isLoading && (
          <Paper withBorder p="lg" radius="md" style={{ textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin" />
            <Text size="sm" c="dimmed" mt="sm">Loading dashboard metrics...</Text>
          </Paper>
        )}

        {!isLoading && metrics && (
          <>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
              {statCards.map((card, idx) => (
                <Card
                  key={idx}
                  withBorder
                  padding="md"
                  radius="md"
                  style={card.clickable ? { cursor: 'pointer' } : undefined}
                  onClick={() => handleTileClick(card)}
                >
                  <Group gap="sm" align="flex-start">
                    <ThemeIcon color={card.color} variant="light" size="lg" radius="xl">
                      <card.icon size={20} />
                    </ThemeIcon>
                    <div style={{ flex: 1 }}>
                      <Text fw={700} size="xl">
                        {card.value}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {card.label}
                      </Text>
                      {card.subtitle && (
                        <Text size="xs" c="gray" mt={2}>
                          {card.subtitle}
                        </Text>
                      )}
                    </div>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>

            <Paper withBorder p="md" radius="md">
              <Stack gap="md">
                <Title order={4}>Daily Order Trend (7 days)</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="received" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} name="Received" />
                    <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </Stack>
            </Paper>
          </>
        )}
      </Stack>

      {/* Drilldown Modal */}
      <Modal
        opened={!!selectedMetric}
        onClose={closeDrilldown}
        title={selectedMetric?.title ?? ''}
        size="xl"
      >
        {selectedMetric?.type === 'average-turnaround' && metrics ? (
          <SimpleGrid cols={3} spacing="md">
            <Card withBorder padding="md" radius="md">
              <Text size="sm" c="dimmed">Reception → Result</Text>
              <Text fw={700} size="xl">{metrics.tatSubMetrics.receptionToResultHours}h</Text>
            </Card>
            <Card withBorder padding="md" radius="md">
              <Text size="sm" c="dimmed">Reception → Validation</Text>
              <Text fw={700} size="xl">{metrics.tatSubMetrics.receptionToValidationHours}h</Text>
            </Card>
            <Card withBorder padding="md" radius="md">
              <Text size="sm" c="dimmed">Result → Validation</Text>
              <Text fw={700} size="xl">{metrics.tatSubMetrics.resultToValidationHours}h</Text>
            </Card>
          </SimpleGrid>
        ) : (
          <Stack gap="md">
            {drilldown.isLoading ? (
              <Paper p="xl" style={{ textAlign: 'center' }}>
                <Loader2 size={24} className="animate-spin" />
              </Paper>
            ) : drilldownData.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">No items found</Text>
            ) : (
              <>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      {columns.map((col) => (
                        <Table.Th key={col.key}>{col.label}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {drilldownData.map((row, i) => (
                      <Table.Tr key={row.id ?? i}>
                        {columns.map((col) => (
                          <Table.Td key={col.key}>
                            {col.render ? col.render(row[col.key]) : (row[col.key] ?? '—')}
                          </Table.Td>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                {totalPages > 1 && (
                  <Group justify="center">
                    <Pagination total={totalPages} value={page} onChange={setPage} />
                  </Group>
                )}
              </>
            )}
          </Stack>
        )}
      </Modal>
    </RxPage>
  );
}

function ClipboardListIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" /><path d="M12 16h4" />
      <path d="M8 11h.01" /><path d="M8 16h.01" />
    </svg>
  );
}