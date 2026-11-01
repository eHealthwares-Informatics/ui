import {
  Badge,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Grid,
  Group,
  Image,
  Modal,
  Paper,
  Radio,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ClipboardList,
  Clock3,
  CreditCard,
  FileText,
  MessageCircle,
  Phone,
  Pill,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useAccountDrawerStore } from '../website/account-drawer-store';
import { websiteApi } from '../website/api';
import { useAuthStore } from '../website/auth-store';
import {
  useBranches,
  useClaimPrescription,
  useOrderPrescription,
  usePrescription,
} from '../website/hooks';
import {
  WebsiteLayout,
  buttonStyles,
  darkGreen,
  green,
  ink,
  line,
  muted,
  soft,
} from '../website/layout';
import { PageLoader } from '../website/loaders';
import { getPrescriptionAccess } from '../website/prescription-access';
import type { PrescriptionDetailView, PrescriptionLineView } from '../website/types';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'yellow',
  'Under Review': 'blue',
  Approved: 'green',
  Rejected: 'red',
  Fulfilled: 'teal',
};

function naira(value: number | null | undefined) {
  if (value == null) return '—';
  return `₦${Number(value).toLocaleString()}`;
}

function withMediaToken(url: string | null | undefined, token: string | null): string {
  if (!url) return '';
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

function dateLabel(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function stepState(detail: PrescriptionDetailView) {
  return [
    { label: 'Uploaded', done: true, at: detail.steps.uploadedAt },
    { label: 'Verified', done: !!detail.steps.verifiedAt, at: detail.steps.verifiedAt },
    {
      label: 'Transcribed',
      done: !!detail.steps.transcribedAt,
      at: detail.steps.transcribedAt,
    },
    { label: 'Ordered', done: !!detail.steps.orderedAt, at: detail.steps.orderedAt },
  ];
}

function StepBar({ detail }: { detail: PrescriptionDetailView }) {
  const steps = stepState(detail);
  return (
    <Group gap="lg" wrap="wrap">
      {steps.map((step, index) => (
        <Group key={step.label} gap={8} wrap="nowrap">
          <ThemeIcon
            radius="xl"
            size={22}
            variant={step.done ? 'filled' : 'light'}
            color={step.done ? 'green' : 'gray'}
          >
            {step.done ? <Check size={12} /> : <Text size="xs">{index + 1}</Text>}
          </ThemeIcon>
          <Stack gap={0}>
            <Text size="xs" fw={700} c={step.done ? darkGreen : muted}>
              {step.label}
            </Text>
            <Text size="10px" c={muted}>
              {step.at ? dateLabel(step.at) : '—'}
            </Text>
          </Stack>
        </Group>
      ))}
    </Group>
  );
}

function LineCard({
  med,
  selected,
  onToggle,
  onOrder,
  disabled,
}: {
  med: PrescriptionLineView;
  selected: boolean;
  onToggle: () => void;
  onOrder: () => void;
  disabled: boolean;
}) {
  const stock =
    med.stockStatus === 'in_stock'
      ? { label: 'In stock', color: 'green' as const }
      : med.stockStatus === 'low_stock'
        ? { label: 'Low stock', color: 'orange' as const }
        : med.stockStatus === 'out_of_stock'
          ? { label: 'Out of stock', color: 'red' as const }
          : null;
  return (
    <Paper
      radius={18}
      p="md"
      withBorder
      style={{
        borderColor: selected ? green : line,
        background: selected ? '#F7FBF9' : '#fff',
        cursor: disabled ? 'default' : 'pointer',
      }}
      onClick={() => !disabled && onToggle()}
    >
      <Group align="flex-start" wrap="nowrap" gap="sm">
        {!disabled ? (
          <Checkbox checked={selected} onChange={onToggle} mt={2} />
        ) : (
          <ThemeIcon radius="xl" variant="light" color="green" size={24}>
            <Check size={12} />
          </ThemeIcon>
        )}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Box>
              <Text fw={800} size="sm">
                {med.name}
              </Text>
              <Text size="xs" c={muted}>
                {[med.strength, med.code].filter(Boolean).join(' · ') || 'Medication'}
              </Text>
            </Box>
            <Box ta="right">
              <Text fw={800} size="md" c={ink}>
                {naira(med.unitPrice)}
              </Text>
              <Text size="xs" c={muted}>
                per unit
              </Text>
            </Box>
          </Group>

          <Stack gap={4} mt={6}>
            {med.instruction ? (
              <Group gap={6} wrap="nowrap">
                <Clock3 size={12} color={green} />
                <Text size="xs" c={muted}>
                  {med.instruction}
                </Text>
              </Group>
            ) : null}
            <Group gap={6} wrap="nowrap">
              <ClipboardList size={12} color={green} />
              <Text size="xs" c={muted}>
                {[med.frequency, med.durationDays ? `Duration ${med.durationDays} days` : null]
                  .filter(Boolean)
                  .join(' · ') || 'As directed'}
                {' · '}
                Dispense <strong>{med.quantity}</strong>
              </Text>
            </Group>
          </Stack>

          <Group justify="space-between" mt={8} wrap="nowrap">
            <Group gap={6}>
              {stock ? (
                <Badge size="xs" radius="xl" variant="light" color={stock.color}>
                  {stock.label}
                </Badge>
              ) : null}
              <Text size="xs" fw={700} c={ink}>
                {naira(med.lineTotal)}
              </Text>
            </Group>
            <Button
              size="compact-xs"
              radius="xl"
              variant="light"
              color="green"
              leftSection={<ShoppingCart size={12} />}
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                onOrder();
              }}
            >
              Order
            </Button>
          </Group>
        </Box>
      </Group>
    </Paper>
  );
}

export default function PrescriptionDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { id?: string };
  const id = params.id ?? '';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openAccountDrawer = useAccountDrawerStore((s) => s.open);

  const { data, isLoading, isError } = usePrescription(id);
  const orderMutation = useOrderPrescription(id);
  const claimMutation = useClaimPrescription(id);
  const { data: branches = [] } = useBranches();
  const { data: providers = [] } = useQuery({
    queryKey: ['website', 'payment-providers'],
    queryFn: () => websiteApi.listPaymentProviders(),
    staleTime: 60_000,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLineIds, setSheetLineIds] = useState<string[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<'dispatch' | 'pickup'>('dispatch');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [phone, setPhone] = useState('');
  const [branchId, setBranchId] = useState<string | null>(null);
  const [payNow, setPayNow] = useState(false);
  const [placed, setPlaced] = useState<{ orderId: string; orderNumber: string | null } | null>(
    null
  );
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!data) return;
    if (data.order) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(data.lines.map((l) => l.id)));
  }, [data]);

  const ordered = !!data?.order;
  const locked = ordered || data?.status === 'Rejected';
  const selectedLines = useMemo(
    () => (data?.lines ?? []).filter((l) => selected.has(l.id)),
    [data, selected]
  );
  const selectedTotal = selectedLines.reduce((sum, l) => sum + Number(l.lineTotal ?? 0), 0);
  const sheetLines = useMemo(
    () => (data?.lines ?? []).filter((l) => sheetLineIds.includes(l.id)),
    [data, sheetLineIds]
  );
  const sheetTotal = sheetLines.reduce((sum, l) => sum + Number(l.lineTotal ?? 0), 0);

  // Anonymous uploads need the capability token on media URLs too — <img>
  // requests cannot carry the X-Prescription-Token header.
  const accessToken = id ? getPrescriptionAccess(id) : null;
  const hasAnonymousAccess = !!accessToken;

  function toggleLine(lineId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  }

  function openSheet(lineIds: string[]) {
    if (!lineIds.length) {
      notifications.show({ message: 'Select at least one medication', color: 'orange' });
      return;
    }
    setSheetLineIds(lineIds);
    setDeliveryMode('dispatch');
    setPayNow(false);
    setSheetOpen(true);
  }

  async function placeOrder() {
    if (payNow && !isAuthenticated) {
      openAccountDrawer('signin');
      return;
    }
    if (deliveryMode === 'dispatch' && (!address.trim() || !phone.trim())) {
      notifications.show({
        message: 'Enter a delivery address and phone number',
        color: 'orange',
      });
      return;
    }
    if (deliveryMode === 'pickup' && !branchId) {
      notifications.show({ message: 'Choose a pickup pharmacy', color: 'orange' });
      return;
    }

    setPlacing(true);
    try {
      const result = await orderMutation.mutateAsync({
        lineIds: sheetLineIds,
        paymentMethod: payNow ? 'Card' : 'Cash',
        origin: 'website',
        delivery:
          deliveryMode === 'pickup'
            ? { pickupBranchId: branchId ?? undefined, phone, shippingMethod: 'pickup' }
            : {
                address: address.trim(),
                city: city.trim() || undefined,
                state: stateName.trim() || undefined,
                phone: phone.trim(),
                shippingMethod: 'standard',
              },
      });

      if (payNow) {
        const provider = providers[0];
        const init = await websiteApi.initializeWebPayment({
          amount: result.totalAmount ?? sheetTotal,
          sourceType: 'order',
          sourceId: result.orderId,
          providerId: provider?.id,
          returnUrl: `${window.location.origin}/shop/orders/${result.orderId}`,
        });
        if (init.checkoutUrl) {
          window.location.href = init.checkoutUrl;
          return;
        }
      }

      setSheetOpen(false);
      setPlaced({ orderId: result.orderId, orderNumber: result.orderNumber });
    } catch (error) {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    } finally {
      setPlacing(false);
    }
  }

  if (isLoading) {
    return (
      <WebsiteLayout>
        <PageLoader />
      </WebsiteLayout>
    );
  }

  if (isError || !data) {
    return (
      <WebsiteLayout>
        <Container size="sm" py={80}>
          <Paper radius={28} p="xl" withBorder style={{ borderColor: line, textAlign: 'center' }}>
            <ThemeIcon radius="xl" size={64} color="gray" variant="light" mx="auto">
              <FileText size={30} />
            </ThemeIcon>
            <Title order={3} className="damorex-heading" mt="md">
              Prescription not available
            </Title>
            <Text c={muted} mt="xs" lh={1.7}>
              This prescription may belong to another account, or the link you opened on this device
              is no longer valid.
            </Text>
            <Group justify="center" mt="lg">
              {!isAuthenticated ? (
                <Button
                  radius="xl"
                  color="green"
                  styles={buttonStyles}
                  style={{ background: green }}
                  onClick={() => openAccountDrawer('signin')}
                >
                  Sign in
                </Button>
              ) : null}
              <Button
                radius="xl"
                variant="light"
                color="green"
                leftSection={<Upload size={16} />}
                onClick={() => navigate({ to: '/shop/upload-prescription' })}
              >
                Upload prescription
              </Button>
              <Button
                radius="xl"
                variant="subtle"
                onClick={() => navigate({ to: '/shop/my-prescriptions' })}
              >
                My prescriptions
              </Button>
            </Group>
          </Paper>
        </Container>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <Container size="md" py={{ base: 24, md: 40 }}>
        <Stack gap="lg" pb={locked ? 0 : 120}>
          <Group justify="space-between" align="flex-start">
            <Group gap="sm">
              <Button
                variant="subtle"
                radius="xl"
                p={6}
                onClick={() => navigate({ to: '/shop/my-prescriptions' })}
              >
                <ArrowLeft size={18} />
              </Button>
              <Box>
                <Title order={2} className="damorex-heading" style={{ color: ink }}>
                  Prescription Details
                </Title>
                <Text size="sm" c={muted}>
                  #{data.id.slice(0, 8).toUpperCase()} · Uploaded {dateLabel(data.createdAt)}
                </Text>
              </Box>
            </Group>
            <Badge
              radius="xl"
              size="lg"
              color={STATUS_COLORS[data.status] ?? 'gray'}
              variant="light"
            >
              {data.stage ?? data.status}
            </Badge>
          </Group>

          {isAuthenticated && !data.userId ? (
            <Paper radius={16} p="md" withBorder style={{ borderColor: line, background: soft }}>
              <Group justify="space-between" wrap="wrap" gap="sm">
                <Text size="sm" c={muted}>
                  Save this prescription to your account so you can reopen it on any device.
                </Text>
                <Button
                  size="xs"
                  radius="xl"
                  variant="light"
                  color="green"
                  loading={claimMutation.isPending}
                  onClick={() =>
                    claimMutation.mutate(undefined, {
                      onSuccess: () =>
                        notifications.show({
                          message: 'Prescription saved to your account',
                          color: 'green',
                        }),
                    })
                  }
                >
                  Save to my account
                </Button>
              </Group>
            </Paper>
          ) : null}

          <Paper radius={20} p="lg" withBorder style={{ borderColor: line }}>
            <StepBar detail={data} />
          </Paper>

          {/* Files */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Text fw={900} size="lg" style={{ color: ink }}>
                Prescription Image
              </Text>
              <Text size="xs" c={muted}>
                {data.files.length} file{data.files.length === 1 ? '' : 's'}
              </Text>
            </Group>
            {data.files.length === 0 ? (
              <Paper radius={18} p="lg" withBorder style={{ borderColor: line }}>
                <Text size="sm" c={muted}>
                  No files were attached to this prescription.
                </Text>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {data.files.map((file) =>
                  file.mime?.startsWith('image/') ? (
                    <Paper
                      key={file.id}
                      radius={18}
                      p={6}
                      withBorder
                      style={{ borderColor: line, cursor: 'zoom-in' }}
                      onClick={() => setPreviewFile(withMediaToken(file.fileUrl, accessToken))}
                    >
                      <Image
                        src={withMediaToken(file.fileUrl, accessToken)}
                        alt={file.originalName}
                        h={200}
                        fit="cover"
                        radius={12}
                      />
                      <Text size="xs" c={muted} mt={6} lineClamp={1}>
                        {file.originalName}
                      </Text>
                    </Paper>
                  ) : (
                    <Paper
                      key={file.id}
                      radius={18}
                      p="md"
                      withBorder
                      style={{ borderColor: line }}
                    >
                      <Group justify="space-between">
                        <Text size="sm" lineClamp={1}>
                          {file.originalName}
                        </Text>
                        <Button
                          size="compact-xs"
                          variant="light"
                          component="a"
                          href={withMediaToken(file.fileUrl, accessToken)}
                          target="_blank"
                        >
                          Open
                        </Button>
                      </Group>
                    </Paper>
                  )
                )}
              </SimpleGrid>
            )}
          </Box>

          {/* Pharmacy */}
          <Paper radius={20} p="lg" withBorder style={{ borderColor: line }}>
            <Group justify="space-between" mb="sm">
              <Text fw={900} size="lg" style={{ color: ink }}>
                Dispensing Pharmacy
              </Text>
              {data.preferredPharmacyName ? (
                <Badge radius="xl" variant="light" color="green">
                  Preferred: {data.preferredPharmacyName}
                </Badge>
              ) : null}
            </Group>
            <Group gap="md" wrap="nowrap" align="flex-start">
              <ThemeIcon radius="xl" size={48} variant="light" color="green">
                <Store size={24} />
              </ThemeIcon>
              <Box style={{ flex: 1 }}>
                <Group gap={6}>
                  <Text fw={800}>{data.pharmacy.name}</Text>
                  <BadgeCheck size={15} color={green} />
                </Group>
                <Text size="xs" c={muted}>
                  {data.pharmacy.address ?? 'Address shared after review'}
                </Text>
                {data.pharmacy.phone ? (
                  <Text size="xs" c={muted}>
                    {data.pharmacy.phone}
                  </Text>
                ) : null}
              </Box>
            </Group>
            <Group mt="sm" gap="xs">
              {data.pharmacy.phone ? (
                <Button
                  size="xs"
                  radius="xl"
                  variant="light"
                  color="green"
                  leftSection={<Phone size={13} />}
                  component="a"
                  href={`tel:${data.pharmacy.phone}`}
                >
                  Call pharmacy
                </Button>
              ) : null}
              <Button
                size="xs"
                radius="xl"
                variant="light"
                color="green"
                leftSection={<MessageCircle size={13} />}
                onClick={() => navigate({ to: '/shop/consult-pharmacist' })}
              >
                Chat pharmacist
              </Button>
            </Group>
          </Paper>

          {/* Transcription */}
          <Paper radius={20} p="lg" withBorder style={{ borderColor: line }}>
            <Group justify="space-between" mb="sm">
              <Text fw={900} size="lg" style={{ color: ink }}>
                Transcription
              </Text>
              <Badge
                radius="xl"
                variant="light"
                color={data.transcription.transcribedAt ? 'green' : 'gray'}
              >
                {data.transcription.transcribedAt ? 'Clinically verified' : 'Awaiting review'}
              </Badge>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <Box>
                <Text size="xs" c={muted}>
                  Pharmacist
                </Text>
                <Text size="sm" fw={700}>
                  {data.transcription.pharmacistName ?? '—'}
                </Text>
              </Box>
              <Box>
                <Text size="xs" c={muted}>
                  PCN registration
                </Text>
                <Text size="sm" fw={700}>
                  {data.transcription.pharmacistPcn ?? '—'}
                </Text>
              </Box>
              <Box>
                <Text size="xs" c={muted}>
                  Prescriber
                </Text>
                <Text size="sm" fw={700}>
                  {data.transcription.prescriberName ?? '—'}
                </Text>
              </Box>
              <Box>
                <Text size="xs" c={muted}>
                  Facility
                </Text>
                <Text size="sm" fw={700}>
                  {data.transcription.facilityName ?? '—'}
                </Text>
              </Box>
            </SimpleGrid>
            {data.pharmacistNotes ? (
              <Paper
                radius={14}
                mt="md"
                p="md"
                style={{ background: '#FDF8EE', border: '1px solid #F2E6CE' }}
              >
                <Text size="xs" style={{ color: '#8A5A0B' }} lh={1.7}>
                  <strong>Pharmacist note:</strong> {data.pharmacistNotes}
                </Text>
              </Paper>
            ) : null}
          </Paper>

          {/* Medications */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Text fw={900} size="lg" style={{ color: ink }}>
                Medications ({data.lines.length})
              </Text>
              {!locked ? (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="green"
                  onClick={() =>
                    setSelected(
                      selected.size === data.lines.length
                        ? new Set()
                        : new Set(data.lines.map((l) => l.id))
                    )
                  }
                >
                  {selected.size === data.lines.length ? 'Clear all' : 'Select all'}
                </Button>
              ) : null}
            </Group>

            {data.lines.length === 0 ? (
              <Paper radius={18} p="lg" withBorder style={{ borderColor: line }}>
                <Text size="sm" c={muted}>
                  A pharmacist is transcribing your prescription. Medication lines will appear here
                  once reviewed.
                </Text>
              </Paper>
            ) : (
              <Stack gap="sm">
                {data.lines.map((line) => (
                  <LineCard
                    key={line.id}
                    med={line}
                    selected={selected.has(line.id)}
                    disabled={locked}
                    onToggle={() => toggleLine(line.id)}
                    onOrder={() => openSheet([line.id])}
                  />
                ))}
              </Stack>
            )}

            {!locked ? (
              <Paper
                radius={14}
                mt="sm"
                p="md"
                style={{ background: soft, border: `1px solid ${line}` }}
              >
                <Group gap="sm" align="flex-start" wrap="nowrap">
                  <ShieldCheck size={18} color={darkGreen} />
                  <Box>
                    <Text size="sm" fw={800} style={{ color: ink }}>
                      Dispensed only on pharmacist approval
                    </Text>
                    <Text size="xs" c={muted} lh={1.7}>
                      Each medication line was transcribed from your uploaded prescription by a
                      licensed pharmacist. Quantities may be adjusted at dispensing based on stock
                      and clinical judgement.
                    </Text>
                  </Box>
                </Group>
              </Paper>
            ) : null}
          </Box>

          {data.order ? (
            <Paper radius={18} p="lg" withBorder style={{ borderColor: line, background: soft }}>
              <Group justify="space-between" wrap="wrap" gap="sm">
                <Box>
                  <Text fw={800}>Order placed</Text>
                  <Text size="sm" c={muted}>
                    {data.order.orderNumber ?? data.order.id}
                    {data.order.orderStatus ? ` · ${data.order.orderStatus}` : ''}
                  </Text>
                </Box>
                <Button
                  radius="xl"
                  color="green"
                  styles={buttonStyles}
                  style={{ background: green }}
                  onClick={() =>
                    data.order &&
                    navigate({ to: '/shop/orders/$id', params: { id: data.order.id } })
                  }
                >
                  Track this order
                </Button>
              </Group>
            </Paper>
          ) : null}
        </Stack>
      </Container>

      {/* Action bar */}
      {!locked && data.lines.length > 0 ? (
        <Box
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#fff',
            borderTop: `1px solid ${line}`,
            boxShadow: '0 -12px 30px rgba(15,23,42,0.08)',
            zIndex: 40,
          }}
        >
          <Container size="md" py="sm">
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <Checkbox
                  checked={selected.size === data.lines.length && data.lines.length > 0}
                  onChange={() =>
                    setSelected(
                      selected.size === data.lines.length
                        ? new Set()
                        : new Set(data.lines.map((l) => l.id))
                    )
                  }
                />
                <Box>
                  <Text size="sm" fw={800}>
                    {selected.size} of {data.lines.length} selected
                  </Text>
                  <Text size="xs" c={muted}>
                    Selected total {naira(selectedTotal)}
                  </Text>
                </Box>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <Button
                  radius="xl"
                  variant="light"
                  color="green"
                  onClick={() => openSheet(data.lines.map((l) => l.id))}
                >
                  Whole Rx
                </Button>
                <Button
                  radius="xl"
                  color="green"
                  styles={buttonStyles}
                  style={{ background: green }}
                  disabled={selected.size === 0}
                  onClick={() => openSheet([...selected])}
                >
                  Order Selected
                </Button>
              </Group>
            </Group>
          </Container>
        </Box>
      ) : null}

      {/* File preview */}
      <Modal opened={!!previewFile} onClose={() => setPreviewFile(null)} size="xl" centered>
        {previewFile ? <Image src={previewFile} alt="Prescription" fit="contain" /> : null}
      </Modal>

      {/* Order sheet */}
      <Modal
        opened={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Review your order"
        size="lg"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c={muted}>
            {sheetLines.length} medication{sheetLines.length === 1 ? '' : 's'} from{' '}
            {data.pharmacy.name}
          </Text>
          <Stack gap={6}>
            {sheetLines.map((line) => (
              <Group key={line.id} justify="space-between" wrap="nowrap">
                <Box style={{ minWidth: 0 }}>
                  <Text size="sm" fw={700} lineClamp={1}>
                    {line.name}
                  </Text>
                  <Text size="xs" c={muted}>
                    {line.frequency ?? 'As directed'} · {line.quantity} unit
                    {line.quantity === 1 ? '' : 's'}
                  </Text>
                </Box>
                <Text size="sm" fw={700}>
                  {naira(line.lineTotal)}
                </Text>
              </Group>
            ))}
          </Stack>
          <Divider />
          <Group justify="space-between">
            <Text size="sm" c={muted}>
              Subtotal
            </Text>
            <Text fw={800}>{naira(sheetTotal)}</Text>
          </Group>
          <Text size="xs" c={muted}>
            Delivery fee and any dispensing adjustments are confirmed by the pharmacy.
          </Text>

          <Radio.Group
            value={deliveryMode}
            onChange={(v) => setDeliveryMode(v as 'dispatch' | 'pickup')}
          >
            <Stack gap="xs">
              <Radio value="dispatch" label="Home delivery" />
              <Radio value="pickup" label="Store pickup" />
            </Stack>
          </Radio.Group>

          {deliveryMode === 'dispatch' ? (
            <Stack gap="xs">
              <TextInput
                label="Delivery address"
                value={address}
                onChange={(e) => setAddress(e.currentTarget.value)}
                placeholder="Street, area"
              />
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <TextInput
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.currentTarget.value)}
                />
                <TextInput
                  label="State"
                  value={stateName}
                  onChange={(e) => setStateName(e.currentTarget.value)}
                />
              </SimpleGrid>
              <TextInput
                label="Phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
                placeholder="+234"
              />
            </Stack>
          ) : (
            <Stack gap="xs">
              <Select
                label="Pickup pharmacy"
                placeholder="Choose a pharmacy"
                data={branches.map((b) => ({
                  value: b.id,
                  label: `${b.name}${b.city ? ` · ${b.city}` : ''}`,
                }))}
                value={branchId}
                onChange={setBranchId}
                searchable
              />
              <TextInput
                label="Phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
              />
            </Stack>
          )}

          <Radio.Group value={payNow ? 'now' : 'delivery'} onChange={(v) => setPayNow(v === 'now')}>
            <Stack gap="xs">
              <Radio value="delivery" label="Pay on delivery" />
              <Radio value="now" label="Pay now with card" />
            </Stack>
          </Radio.Group>
          {payNow && !isAuthenticated ? (
            <Text size="xs" c="orange">
              Sign in to pay with card. You can still place the order and pay on delivery.
            </Text>
          ) : null}

          <Button
            radius="xl"
            size="md"
            color="green"
            styles={buttonStyles}
            style={{ background: green }}
            leftSection={payNow ? <CreditCard size={16} /> : <Truck size={16} />}
            loading={placing || orderMutation.isPending}
            onClick={() => void placeOrder()}
          >
            Place Order · {naira(sheetTotal)}
          </Button>
        </Stack>
      </Modal>

      {/* Success */}
      <Modal opened={!!placed} onClose={() => setPlaced(null)} centered withCloseButton={false}>
        {placed ? (
          <Stack align="center" gap="sm" py="md">
            <ThemeIcon radius="xl" size={64} color="green">
              <Check size={32} />
            </ThemeIcon>
            <Title order={3} className="damorex-heading">
              Order placed
            </Title>
            <Text size="sm" c={muted} ta="center" lh={1.7}>
              Your medications have been sent to {data.pharmacy.name}. A pharmacist will confirm
              shortly.
            </Text>
            <Badge radius="xl" size="lg" variant="light" color="green">
              {placed.orderNumber ?? placed.orderId}
            </Badge>
            <Group mt="sm">
              <Button
                radius="xl"
                color="green"
                styles={buttonStyles}
                style={{ background: green }}
                onClick={() => navigate({ to: '/shop/orders/$id', params: { id: placed.orderId } })}
              >
                Track this order
              </Button>
              <Button radius="xl" variant="light" color="green" onClick={() => setPlaced(null)}>
                Back to prescription
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>

      {hasAnonymousAccess && !isAuthenticated ? (
        <Box
          style={{
            position: 'fixed',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
          }}
        >
          <Paper
            radius="xl"
            px="md"
            py={8}
            withBorder
            style={{ borderColor: line, background: '#fff' }}
          >
            <Text size="xs" c={muted}>
              This prescription is saved on this device. Sign in to keep it across devices.
            </Text>
          </Paper>
        </Box>
      ) : null}
    </WebsiteLayout>
  );
}
