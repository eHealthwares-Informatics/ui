import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  ArrowLeftRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Printer,
  Save,
  User,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { RxPage } from '@/features/components/page/rx-page';
import { lisApi } from '@/lib/lis-api';

const routeApi = getRouteApi('/_authenticated/lis/orders/$orderId/report');

/* ------------------------------------------------------------------
   Types
  ------------------------------------------------------------------ */
interface TestDefinition {
  id: string;
  name: string;
  code?: string;
  uom?: { name: string } | null;
}
interface OrderItem {
  id: string;
  testDefinitionId: string;
  testDefinition: TestDefinition | null;
  status: string;
  resultValue: string | null;
  notes: string | null;
}
interface Order {
  id: string;
  orderNumber: string;
  patientName: string;
  patientId: string;
  patientGender: string | null;
  patientAge: number | null;
  patientDateOfBirth: string | null;
  status: string;
  requestedDate: string | null;
  items: OrderItem[];
}
interface ResultItem {
  id: string;
  orderItemId: string;
  value: string | null;
  status: string;
  notes: string | null;
  unitId: string | null;
  referenceRangeId: string | null;
}
interface RefRange {
  id: string;
  testId: string;
  alias: string;
  lowValue: string;
  highValue: string;
  gender: string;
  minAge: number;
  maxAge: number;
  criticalLow: string | null;
  criticalHigh: string | null;
  unit: { name: string } | null;
}
interface SignaturesData {
  data: Array<{
    id: string;
    userName?: string;
    isSupervisor?: boolean;
    createdAt: string;
  }>;
}

/* ------------------------------------------------------------------
   Route (created by TanStack Router file-based routing so this is
   kept minimal; the real route file is at
   src/routes/_authenticated/lis/orders/$orderId/report.tsx)
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   Page
  ------------------------------------------------------------------ */
export function LisOrderReportPage() {
  const { orderId } = routeApi.useParams();
  return (
    <RxPage
      title="Medical reports"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Medical reports', href: '/lis/orders' },
        { label: 'Edit medical report' },
      ]}
    >
      <OrderReportContent orderId={orderId} />
    </RxPage>
  );
}

export function OrderReportContent({ orderId, embedded = false }: { orderId: string; embedded?: boolean }) {
  const navigate = useNavigate();

  /* ---------- Data queries ---------- */
  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await lisApi.get(`/lis/orders/${orderId}`);
      return (res.data?.data ?? res.data) as Order;
    },
    enabled: !!orderId,
  });

  const resultsQuery = useQuery({
    queryKey: ['results', orderId],
    queryFn: async () => {
      const res = await lisApi.get('/lis/results', { params: { limit: 1000 } });
      return (res.data?.data ?? []) as ResultItem[];
    },
    enabled: !!orderId,
  });

  const rangesQuery = useQuery({
    queryKey: ['reference-ranges'],
    queryFn: async () => {
      const res = await lisApi.get('/lis/reference-ranges', { params: { limit: 1000 } });
      return (res.data?.data ?? []) as RefRange[];
    },
  });

  const order = orderQuery.data;
  const allResults = resultsQuery.data ?? [];
  const allRanges = rangesQuery.data ?? [];

  /* ---------- Local state ---------- */
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, { value: string; notes: string }>>({});
  const [saving, setSaving] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [patientModalOpen, setPatientModalOpen] = useState(false);

  /* ---------- Previous / Next ---------- */
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const currentIndex = useMemo(() => orderIds.indexOf(orderId), [orderIds, orderId]);

  useEffect(() => {
    // Try to recover order IDs from localStorage (written by orders list)
    const stored = localStorage.getItem('lis_orders_ids');
    if (stored) {
      try {
        setOrderIds(JSON.parse(stored));
      } catch {
        /* noop */
      }
    }
  }, []);

  const goPrev = () => {
    if (currentIndex > 0) {
      navigate({ to: `/lis/orders/${orderIds[currentIndex - 1]}/report` });
    }
  };
  const goNext = () => {
    if (currentIndex >= 0 && currentIndex < orderIds.length - 1) {
      navigate({ to: `/lis/orders/${orderIds[currentIndex + 1]}/report` });
    }
  };

  /* ---------- Init form values when order/results load ---------- */
  useEffect(() => {
    if (!order?.items) return;
    const map: Record<string, { value: string; notes: string }> = {};
    for (const item of order.items) {
      const result = allResults.find((r) => r.orderItemId === item.id);
      map[item.id] = {
        value: result?.value ?? item.resultValue ?? '',
        notes: result?.notes ?? item.notes ?? '',
      };
    }
    setValues(map);
    if (order.items.length > 0 && !activeTab) {
      setActiveTab(order.items[0].id);
    }
  }, [order, allResults]);

  /* ---------- Helpers ---------- */
  const getRangesForItem = (item: OrderItem) => {
    const testId = item.testDefinitionId ?? item.testDefinition?.id;
    if (!testId) return [];
    return allRanges.filter((r) => r.testId === testId);
  };

  const formatRange = (ranges: RefRange[]) => {
    if (!ranges.length) return '—';
    return ranges
      .map((r) => `${r.alias}: ${r.lowValue} - ${r.highValue} ${r.unit?.name ?? ''}`)
      .join(' | ');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'yellow';
      case 'COMPLETED':
        return 'green';
      case 'CANCELLED':
        return 'red';
      default:
        return 'gray';
    }
  };

  /* ---------- Mutations ---------- */
  const saveResult = useMutation({
    mutationFn: async (payload: { orderItemId: string; value: string; notes: string }) => {
      const existing = allResults.find((r) => r.orderItemId === payload.orderItemId);
      if (existing) {
        await lisApi.patch(`/lis/results/${existing.id}`, {
          value: payload.value,
          notes: payload.notes,
        });
      } else {
        await lisApi.post('/lis/results', {
          orderItemId: payload.orderItemId,
          value: payload.value,
          notes: payload.notes,
        });
      }
    },
    onSuccess: () => {
      notifications.show({
        title: 'Saved',
        message: 'Result saved successfully',
        color: 'green',
        icon: <CheckCircle2 size={16} />,
      });
      resultsQuery.refetch();
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to save result',
        color: 'red',
      });
    },
  });

  const signReport = useMutation({
    mutationFn: async () => {
      // Sign each result that exists for this order
      const resultsToSign = allResults.filter((r) =>
        order?.items?.some((i) => i.id === r.orderItemId),
      );
      for (const result of resultsToSign) {
        await lisApi.post('/lis/result-signatures', {
          resultId: result.id,
          notes: 'Signed from report page',
        });
      }
    },
    onSuccess: () => {
      notifications.show({
        title: 'Signed',
        message: 'Report signed successfully',
        color: 'green',
      });
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to sign report',
        color: 'red',
      });
    },
  });

  /* ---------- Handlers ---------- */
  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(values).map(([itemId, val]) =>
        saveResult.mutateAsync({ orderItemId: itemId, value: val.value, notes: val.notes }),
      );
      await Promise.all(promises);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  /* ---------- Render ---------- */
  if (orderQuery.isLoading || !order) {
    return (
      <Paper withBorder p="md" radius="md">
        <Text>Loading order...</Text>
      </Paper>
    );
  }

  return (
    <>
      <Stack gap="md">
        <Group justify="flex-end" wrap="wrap">
          {!embedded && (
            <>
              <Button
                variant="light"
                leftSection={<ChevronLeft size={16} />}
                onClick={goPrev}
                disabled={currentIndex <= 0}
              >
                Previous
              </Button>
              <Button
                variant="light"
                rightSection={<ChevronRight size={16} />}
                onClick={goNext}
                disabled={currentIndex >= orderIds.length - 1}
              >
                Next
              </Button>
            </>
          )}
          <Button
            color="green"
            leftSection={<CheckCircle2 size={16} />}
            onClick={() => signReport.mutate()}
            loading={signReport.isPending}
          >
            Sign Report
          </Button>
          <Button
            color="cyan"
            leftSection={<User size={16} />}
            onClick={() => setPatientModalOpen(true)}
          >
            Patient Info
          </Button>
          <Button
            color="red"
            leftSection={<Printer size={16} />}
            onClick={handlePrint}
          >
            Print Report
          </Button>
        </Group>

        {/* Order summary header */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Text fw={700} size="lg">
                Order #{order.orderNumber}
              </Text>
              <Badge color={statusColor(order.status)}>{order.status}</Badge>
            </Group>
            <Group gap="sm">
              <Text size="sm" c="dimmed">
                Patient: <strong>{order.patientName}</strong>
              </Text>
              <Text size="sm" c="dimmed">
                MRN: {order.patientId}
              </Text>
            </Group>
          </Group>
        </Paper>

        {/* Upload report section */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center">
            <Text fw={600}>Upload report</Text>
            <Group gap="xs">
              <Button variant="subtle" size="xs" onClick={() => setUploadOpen((v) => !v)}>
                {uploadOpen ? '-' : '+'}
              </Button>
            </Group>
          </Group>
          {uploadOpen && (
            <Stack gap="sm" mt="sm">
              <Text size="sm" c="dimmed">
                Upload functionality will be implemented here. (drag-drop or file picker)
              </Text>
              <Button variant="outline" leftSection={<FileUp size={16} />} disabled>
                Choose file
              </Button>
            </Stack>
          )}
        </Paper>

        {/* Tests section with tabs */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="center" mb="md">
            <Text fw={600}>Tests</Text>
          </Group>

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              {order.items.map((item) => (
                <Tabs.Tab key={item.id} value={item.id}>
                  {item.testDefinition?.name ?? 'Unknown Test'}
                </Tabs.Tab>
              ))}
            </Tabs.List>

            {order.items.map((item) => {
              const ranges = getRangesForItem(item);
              const val = values[item.id] ?? { value: '', notes: '' };
              return (
                <Tabs.Panel key={item.id} value={item.id} pt="md">
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Unit</Table.Th>
                        <Table.Th>Reference Range</Table.Th>
                        <Table.Th>Result</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td>{item.testDefinition?.name ?? '—'}</Table.Td>
                        <Table.Td>{item.testDefinition?.uom?.name ?? '—'}</Table.Td>
                        <Table.Td style={{ maxWidth: 300 }}>
                          <Text size="sm" c="dimmed">
                            {formatRange(ranges)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            size="sm"
                            value={val.value}
                            onChange={(e) =>
                              setValues((prev) => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], value: e.currentTarget.value },
                              }))
                            }
                            placeholder="Enter result"
                            style={{ width: 120 }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Badge color={statusColor(item.status)}>{item.status}</Badge>
                        </Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>

                  {/* Reference range summary */}
                  {ranges.length > 0 && (
                    <Paper withBorder p="sm" mt="sm" bg="gray.0">
                      <Text size="sm" c="dimmed">
                        {ranges.map((r) => (
                          <span key={r.id}>
                            {r.alias}: {r.lowValue} - {r.highValue} {r.unit?.name ?? ''} |{' '}
                          </span>
                        ))}
                      </Text>
                    </Paper>
                  )}

                  {/* Comment */}
                  <Textarea
                    mt="sm"
                    placeholder="Comment"
                    value={val.notes}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], notes: e.currentTarget.value },
                      }))
                    }
                    minRows={2}
                  />

                  {/* Select comment */}
                  <Select
                    mt="sm"
                    placeholder="Select comment"
                    data={[
                      { value: 'Normal', label: 'Normal' },
                      { value: 'High', label: 'High' },
                      { value: 'Low', label: 'Low' },
                      { value: 'Critical', label: 'Critical' },
                      { value: 'Pending review', label: 'Pending review' },
                    ]}
                    clearable
                    onChange={(v) => {
                      if (v) {
                        setValues((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], notes: v },
                        }));
                      }
                    }}
                  />
                </Tabs.Panel>
              );
            })}
          </Tabs>
        </Paper>

        {/* Save */}
        <Group>
          <Button
            color="violet"
            leftSection={<Save size={16} />}
            onClick={handleSave}
            loading={saving}
          >
            Save
          </Button>
        </Group>
      </Stack>

      {/* Patient Info Modal */}
      <Modal
        opened={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        title="Patient Information"
        size="md"
      >
        <Stack gap="sm">
          <Text>
            <strong>Name:</strong> {order.patientName}
          </Text>
          <Text>
            <strong>MRN:</strong> {order.patientId}
          </Text>
          <Text>
            <strong>Gender:</strong> {order.patientGender ?? '—'}
          </Text>
          <Text>
            <strong>Age:</strong> {order.patientAge ?? '—'}
          </Text>
          <Text>
            <strong>Date of Birth:</strong> {order.patientDateOfBirth ?? '—'}
          </Text>
          <Text>
            <strong>Order Status:</strong> <Badge color={statusColor(order.status)}>{order.status}</Badge>
          </Text>
        </Stack>
      </Modal>
    </>
  );
}

export default LisOrderReportPage;
