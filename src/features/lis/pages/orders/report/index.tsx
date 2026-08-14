import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Group,
  Menu,
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
  Mail,
  MessageCircle,
  Printer,
  Save,
  Share2,
  Smartphone,
  User,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { RxPage } from '@/features/components/page/rx-page';
import { lisApi } from '@/lib/lis-api';
import { buildReportHtml, printReportHtml, type PrintReportData } from './report-print';

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
  collectedDate?: string | null;
  completedDate?: string | null;
  updatedAt?: string;
  diagnosis?: string | null;
  clinicalNotes?: string | null;
  notes?: string | null;
  internalReference?: string | null;
  externalReference?: string | null;
  requesterPhone?: string | null;
  priority?: { name: string } | null;
  samples?: Array<{ sampleTypeName?: string | null; barcode?: string }>;
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
  unit: { id: string; name: string } | null;
  unitId?: string | null;
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
      const res = await lisApi.get('/lis/results', { params: { limit: 200 } });
      return (res.data?.data ?? []) as ResultItem[];
    },
    enabled: !!orderId,
  });

  const rangesQuery = useQuery({
    queryKey: ['reference-ranges'],
    queryFn: async () => {
      const res = await lisApi.get('/lis/reference-ranges', { params: { limit: 200 } });
      return (res.data?.data ?? []) as RefRange[];
    },
  });

  const order = orderQuery.data;
  const allResults = resultsQuery.data ?? [];
  const allRanges = rangesQuery.data ?? [];

  /* ---------- Local state ---------- */
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [values, setValues] = useState<
    Record<string, { value: string; notes: string; referenceRangeId?: string }>
  >({});
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
    const map: Record<string, { value: string; notes: string; referenceRangeId?: string }> = {};
    for (const item of order.items) {
      const result = allResults.find((r) => r.orderItemId === item.id);
      const ranges = getRangesForItem(item);
      map[item.id] = {
        value: result?.value ?? item.resultValue ?? '',
        notes: result?.notes ?? item.notes ?? '',
        referenceRangeId:
          result?.referenceRangeId ??
          pickDefaultRange(ranges, order)?.id ??
          ranges[0]?.id,
      };
    }
    setValues(map);
    if (order.items.length > 0 && !activeTab) {
      setActiveTab(order.items[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, allResults, allRanges]);

  /* ---------- Helpers ---------- */
  const getRangesForItem = (item: OrderItem) => {
    const testId = item.testDefinitionId ?? item.testDefinition?.id;
    if (!testId) return [];
    return allRanges.filter((r) => r.testId === testId);
  };

  /** Picks the reference range that best matches the patient (gender, then age), falling back to the first range. */
  const pickDefaultRange = (ranges: RefRange[], order: Order): RefRange | undefined => {
    if (!ranges.length) {
      return undefined;
    }
    const gender = order.patientGender;
    const age = order.patientAge ?? undefined;
    const genderRanges =
      gender === 'MALE' || gender === 'FEMALE'
        ? ranges.filter((r) => r.gender === gender)
        : ranges.filter((r) => r.gender === 'DEFAULT');
    const pool = genderRanges.length ? genderRanges : ranges;
    const ageRanges = age !== undefined
      ? pool.filter((r) => age >= r.minAge && (r.maxAge === 0 || age <= r.maxAge))
      : pool;
    return (ageRanges.length ? ageRanges : pool)[0];
  };

  /** Builds the printable report data from order + results + ranges + current form values. */
  const buildPrintData = (
    order: Order,
    results: ResultItem[],
    ranges: RefRange[],
    vals: Record<string, { value: string; notes: string; referenceRangeId?: string }>
  ): PrintReportData => {
    const flagFor = (value: string, range: RefRange | undefined): PrintReportData['groups'][number]['rows'][number]['flag'] => {
      const v = Number(value);
      if (!range || value.trim() === '' || Number.isNaN(v)) {
        return '';
      }
      const low = Number(range.lowValue);
      const high = Number(range.highValue);
      if (!Number.isNaN(low) && v < low) {
        return 'Low';
      }
      if (!Number.isNaN(high) && v > high) {
        return 'High';
      }
      return 'Normal';
    };

    const groups: PrintReportData['groups'] = [];
    for (const item of order.items ?? []) {
      const td = item.testDefinition;
      const testId = item.testDefinitionId ?? td?.id;
      const itemRanges = testId ? ranges.filter((r) => r.testId === testId) : [];
      const result = results.find((r) => r.orderItemId === item.id);
      const val = vals[item.id] ?? {};
      const chosenRange =
        itemRanges.find((r) => r.id === val.referenceRangeId) ?? pickDefaultRange(itemRanges, order);
      const value = val.value ?? result?.value ?? item.resultValue ?? '';
      const title = `${td?.name ?? 'Test'}:`;
      const group = groups.find((g) => g.title === title) ?? { title, rows: [] };
      if (!groups.includes(group)) {
        groups.push(group);
      }
      group.rows.push({
        name: td?.name ?? 'Test',
        value,
        range: chosenRange ? `${chosenRange.lowValue}-${chosenRange.highValue}` : '',
        units: chosenRange?.unit?.name ?? td?.uom?.name ?? '',
        flag: flagFor(value, chosenRange),
      });
    }

    const fmt = (d: string | null | undefined): string => {
      if (!d) {
        return '—';
      }
      const date = new Date(d);
      if (Number.isNaN(date.getTime())) {
        return d;
      }
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const spec = order.samples?.[0];

    return {
      brand: 'SYNLAB',
      patient: {
        name: order.patientName ?? '—',
        sex: order.patientGender ?? '—',
        idNumber: order.patientId ?? '—',
        dateOfBirth: order.patientDateOfBirth ?? '—',
        age: order.patientAge != null ? String(order.patientAge) : '—',
        phone: order.requesterPhone ?? '—',
        email: '—',
        address: '—',
      },
      report: {
        requisitionNumber: order.orderNumber ?? '—',
        orderReference: order.internalReference ?? order.externalReference ?? '—',
        collectionDate: fmt(order.collectedDate),
        requestDate: fmt(order.requestedDate),
        reportDate: fmt(order.completedDate ?? order.updatedAt),
        reportUpdatedDate: 'N/A',
        reportType: order.status === 'COMPLETED' ? 'FINAL REPORT' : order.status ?? '—',
        priority: order.priority?.name ?? 'ROUTINE',
        specimenType: spec?.sampleTypeName ?? '—',
        comments: order.clinicalNotes ?? order.notes ?? '—',
        diagnosis: order.diagnosis ?? '—',
        testsRequested:
          (order.items ?? []).map((i) => i.testDefinition?.name ?? 'Test').join(', ') || '—',
      },
      groups,
    };
  };

  /** Maps the entered result against the selected reference range to a red→green background.
   *  Below the low bound clamps to red, above the high bound clamps to green. */
  const resultGradient = (value: string, range?: RefRange): string | undefined => {
    const num = Number(value);
    if (!range || value.trim() === '' || Number.isNaN(num)) {
      return undefined;
    }
    const low = Number(range.lowValue);
    const high = Number(range.highValue);
    if (Number.isNaN(low) || Number.isNaN(high) || high <= low) {
      return undefined;
    }
    const t = Math.max(0, Math.min(1, (num - low) / (high - low)));
    const hue = Math.round(t * 120);
    return `linear-gradient(90deg, hsl(${hue} 80% 92%), hsl(${hue} 80% 92%))`;
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
    mutationFn: async (payload: {
      orderItemId: string;
      value: string;
      notes: string;
      referenceRangeId?: string;
      unitId?: string;
    }) => {
      const existing = allResults.find((r) => r.orderItemId === payload.orderItemId);
      const body = {
        value: payload.value,
        notes: payload.notes,
        referenceRangeId: payload.referenceRangeId,
        unitId: payload.unitId,
      };
      if (existing) {
        await lisApi.patch(`/lis/results/${existing.id}`, body);
      } else {
        await lisApi.post('/lis/results', {
          orderItemId: payload.orderItemId,
          ...body,
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
      const promises = Object.entries(values).map(([itemId, val]) => {
        const item = order?.items.find((i) => i.id === itemId);
        const selectedRange = item ? getRangesForItem(item).find((r) => r.id === val.referenceRangeId) : undefined;
        return saveResult.mutateAsync({
          orderItemId: itemId,
          value: val.value,
          notes: val.notes,
          referenceRangeId: val.referenceRangeId,
          unitId: selectedRange?.unit?.id ?? selectedRange?.unitId ?? undefined,
        });
      });
      await Promise.all(promises);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!order) {
      return;
    }
    try {
      printReportHtml(buildReportHtml(buildPrintData(order, allResults, allRanges, values)));
    } catch (err: any) {
      notifications.show({
        title: 'Print',
        message: err?.message ?? 'Unable to open print window',
        color: 'red',
      });
    }
  };

  /* ---------- Send Via ---------- */
  const sendVia = useMutation({
    mutationFn: async (payload: {
      via: 'whatsapp' | 'sms' | 'email';
      phone?: string;
      email?: string;
    }) => {
      await lisApi.post(`/lis/orders/${orderId}/send-report`, payload);
    },
    onSuccess: () => {
      notifications.show({
        title: 'Sent',
        message: 'Report queued for delivery',
        color: 'green',
        icon: <CheckCircle2 size={16} />,
      });
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Send failed',
        message: err?.response?.data?.message ?? err?.message ?? 'Failed to send report',
        color: 'red',
      });
    },
  });

  const handleSendVia = (via: 'whatsapp' | 'sms' | 'email') => {
    const phone = order?.requesterPhone || undefined;
    const email = '';
    sendVia.mutate({ via, phone, email });
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
          <Menu position="bottom-end" shadow="md" width={200}>
            <Menu.Target>
              <Button
                color="indigo"
                variant="light"
                leftSection={<Share2 size={16} />}
                loading={sendVia.isPending}
              >
                Send Via
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Deliver report via</Menu.Label>
              <Menu.Item
                leftSection={<MessageCircle size={16} />}
                onClick={() => handleSendVia('whatsapp')}
              >
                WhatsApp
              </Menu.Item>
              <Menu.Item
                leftSection={<Smartphone size={16} />}
                onClick={() => handleSendVia('sms')}
              >
                SMS
              </Menu.Item>
              <Menu.Item
                leftSection={<Mail size={16} />}
                onClick={() => handleSendVia('email')}
              >
                Email
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
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
              const selectedRange = ranges.find((r) => r.id === val.referenceRangeId);
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
                        <Table.Td>
                          {selectedRange?.unit?.name ?? item.testDefinition?.uom?.name ?? '—'}
                        </Table.Td>
                        <Table.Td style={{ maxWidth: 260 }}>
                          <Select
                            size="sm"
                            placeholder="Select reference range"
                            data={ranges.map((r) => ({
                              value: r.id,
                              label: `${r.alias}: ${r.lowValue} - ${r.highValue}${r.unit?.name ? ` ${r.unit.name}` : ''}`,
                            }))}
                            value={val.referenceRangeId ?? null}
                            onChange={(v) =>
                              setValues((prev) => ({
                                ...prev,
                                [item.id]: { ...(prev[item.id] ?? {}), referenceRangeId: v ?? undefined },
                              }))
                            }
                            clearable
                            style={{ minWidth: 220 }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            size="sm"
                            value={val.value}
                            onChange={(e) => {
                              const value = e.currentTarget.value;
                              setValues((prev) => ({
                                ...prev,
                                [item.id]: { ...(prev[item.id] ?? {}), value },
                              }));
                            }}
                            placeholder="Enter result"
                            style={{
                              width: 120,
                              ...(resultGradient(val.value, selectedRange)
                                ? {
                                    background: resultGradient(val.value, selectedRange),
                                  }
                                : {}),
                            }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Badge color={statusColor(item.status)}>{item.status}</Badge>
                        </Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>

                  {/* Reference range summary */}
                  {selectedRange && (
                    <Paper withBorder p="sm" mt="sm" bg="gray.0">
                      <Text size="sm" c="dimmed">
                        {selectedRange.alias}: {selectedRange.lowValue} - {selectedRange.highValue}{' '}
                        {selectedRange.unit?.name ?? ''} | {selectedRange.gender} (min {selectedRange.minAge} - max {selectedRange.maxAge} years)
                      </Text>
                    </Paper>
                  )}

                  {/* Comment */}
                  <Textarea
                    mt="sm"
                    placeholder="Comment"
                    value={val.notes}
                    onChange={(e) => {
                      const notes = e.currentTarget.value;
                      setValues((prev) => ({
                        ...prev,
                        [item.id]: { ...(prev[item.id] ?? {}), notes },
                      }));
                    }}
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
                          [item.id]: { ...(prev[item.id] ?? {}), notes: v },
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
