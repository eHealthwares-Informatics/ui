import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Image,
  Modal,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check, CircleCheck, FilePlus2, Pencil, Send, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getAccessToken } from '@/lib/auth-tokens';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { resolveMediaUrl } from '@/lib/media-url';
import { useHasPermission } from '@/lib/permissions';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { useAuthStore } from '@/stores/auth-store';
import { RxPage } from '../../../components/page/rx-page';
import {
  mapParsedInstruction,
  parsePrescription,
  summariseParse,
  type ParseSummary,
} from './line-instruction-parser';

type PrescriptionFile = {
  id: string;
  fileUrl: string;
  mime: string;
  originalName: string;
  size: number | null;
};

type PrescriptionLine = {
  id: string;
  lineNumber: number;
  itemId: string | null;
  genericItemCode?: string | null;
  genericDrugCode?: string | null;
  freetextName?: string | null;
  sourceType?: 'item' | 'generic_product' | 'generic_drug' | 'freetext';
  name: string;
  code: string | null;
  imageUrl: string | null;
  strength: string | null;
  frequency: string | null;
  instruction: string | null;
  durationDays: number | null;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number;
  notes: string | null;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
  availableQuantity: number | null;
};

type PrescriptionDetail = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  stage: string;
  createdAt: string;
  updatedAt: string;
  pharmacistNotes: string | null;
  adminNotes: string | null;
  preferredPharmacyName: string | null;
  pharmacy: { name: string; logoUrl: string | null; address: string | null; phone: string | null };
  transcription: {
    pharmacistName: string | null;
    pharmacistPcn: string | null;
    prescriberName: string | null;
    facilityName: string | null;
    transcribedAt: string | null;
    verifiedAt: string | null;
  };
  steps: {
    uploadedAt: string | null;
    verifiedAt: string | null;
    transcribedAt: string | null;
    orderedAt: string | null;
  };
  files: PrescriptionFile[];
  lines: PrescriptionLine[];
  lineCount: number;
  order: { id: string; orderNumber: string | null; orderStatus: string | null } | null;
};

type LineSource = 'item' | 'generic_product' | 'generic_drug' | 'freetext';

type LineDraft = {
  /** Selected option in the unified medication picker, e.g. `item:<uuid>`. */
  sourceKey: string | null;
  source: LineSource;
  /** Human label kept locally so the Select never falls back to the raw id. */
  selectedLabel: string;
  itemId: string | null;
  genericItemCode: string | null;
  genericDrugCode: string | null;
  freetextName: string;
  strength: string;
  frequency: string;
  instruction: string;
  durationDays: number | '';
  quantity: number;
  unitPrice: number | '';
  notes: string;
};

const emptyDraft: LineDraft = {
  sourceKey: null,
  source: 'freetext',
  selectedLabel: '',
  itemId: null,
  genericItemCode: null,
  genericDrugCode: null,
  freetextName: '',
  strength: '',
  frequency: '',
  instruction: '',
  durationDays: '',
  quantity: 1,
  unitPrice: '',
  notes: '',
};

const statusColor: Record<string, string> = {
  Pending: 'gray',
  'Under Review': 'yellow',
  Approved: 'green',
  Rejected: 'red',
  Fulfilled: 'blue',
};

function naira(value: number | null | undefined) {
  if (value == null) return '—';
  return `₦${Number(value).toLocaleString()}`;
}

function withMediaToken(url: string | null | undefined, token: string | null): string {
  const resolved = resolveMediaUrl(url);
  if (!resolved) return '';
  if (!token) return resolved;
  const sep = resolved.includes('?') ? '&' : '?';
  return `${resolved}${sep}token=${encodeURIComponent(token)}`;
}

function dateLabel(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function StepDot({ done, label }: { done: boolean; label: string }) {
  return (
    <Group gap={6} wrap="nowrap">
      <Badge
        circle
        size="sm"
        color={done ? 'green' : 'gray'}
        variant={done ? 'filled' : 'light'}
        px={6}
      >
        {done ? <Check size={10} /> : ''}
      </Badge>
      <Text size="xs" fw={600} c={done ? 'green' : 'dimmed'}>
        {label}
      </Text>
    </Group>
  );
}

export function RxWebsitePrescriptionDetailPage({ prescriptionId }: { prescriptionId: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const canWrite = useHasPermission('rxsoft.website.prescriptions.create');

  const [lineModal, setLineModal] = useState(false);
  const [editingLine, setEditingLine] = useState<PrescriptionLine | null>(null);
  const [draft, setDraft] = useState<LineDraft>(emptyDraft);
  const [instructionText, setInstructionText] = useState('');
  const [parsedDrugText, setParsedDrugText] = useState('');
  const [parseSummary, setParseSummary] = useState<ParseSummary | null>(null);
  const [filePreview, setFilePreview] = useState<PrescriptionFile | null>(null);
  const [itemSearch, setItemSearch] = useState('');
  const [drugSearch, setDrugSearch] = useState('');
  const authUser = useAuthStore((s) => s.user);
  const mediaToken = getAccessToken();
  const isPharmacist = authUser?.roles?.includes('pharmacist') ?? false;
  const [form, setForm] = useState({
    pharmacistName: '',
    pharmacistPcn: '',
    prescriberName: '',
    facilityName: '',
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['website-prescription-detail', prescriptionId],
    queryFn: async () => {
      const { data } = await rxsoftApi.get<PrescriptionDetail>(
        `/website/admin/prescriptions/${prescriptionId}`
      );
      return data;
    },
    enabled: !!prescriptionId,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      // Pharmacists transcribing get their own name prefilled; admins can type.
      pharmacistName:
        data.transcription.pharmacistName ?? (isPharmacist ? (authUser?.username ?? '') : ''),
      pharmacistPcn: data.transcription.pharmacistPcn ?? '',
      prescriberName: data.transcription.prescriberName ?? '',
      facilityName: data.transcription.facilityName ?? '',
      notes: data.pharmacistNotes ?? '',
    });
  }, [data, isPharmacist, authUser?.username]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['website-prescription-detail', prescriptionId] });
    qc.invalidateQueries({ queryKey: ['rxsoft-data-page'] });
  };

  const finalised = data?.status === 'Fulfilled' || data?.status === 'Rejected';
  const editable = !!data && !finalised && canWrite;

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { data } = await rxsoftApi.patch(
        `/website/admin/prescriptions/${prescriptionId}/status`,
        { status }
      );
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Status updated', color: 'green' });
      invalidate();
    },
    onError: (err) => notifications.show({ color: 'red', message: getApiErrorMessage(err) }),
  });

  const transcriptionMutation = useMutation({
    mutationFn: async () => {
      const { data } = await rxsoftApi.patch(
        `/website/admin/prescriptions/${prescriptionId}/transcription`,
        {
          pharmacistName: form.pharmacistName || undefined,
          pharmacistPcn: form.pharmacistPcn || undefined,
          prescriberName: form.prescriberName || undefined,
          facilityName: form.facilityName || undefined,
          notes: form.notes || undefined,
        }
      );
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Transcription saved', color: 'green' });
      invalidate();
    },
    onError: (err) => notifications.show({ color: 'red', message: getApiErrorMessage(err) }),
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      const { data } = await rxsoftApi.post(
        `/website/admin/prescriptions/${prescriptionId}/convert/order`,
        { paymentMethod: 'cash', origin: 'website' }
      );
      return data;
    },
    onSuccess: (res: any) => {
      notifications.show({
        message: `Order ${res?.orderNumber ?? ''} created`,
        color: 'green',
        icon: <CircleCheck size={16} />,
      });
      invalidate();
    },
    onError: (err) => notifications.show({ color: 'red', message: getApiErrorMessage(err) }),
  });

  const saveLineMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        itemId: draft.itemId || undefined,
        genericItemCode: draft.genericItemCode || undefined,
        genericDrugCode: draft.genericDrugCode || undefined,
        freetextName: draft.freetextName || undefined,
        strength: draft.strength || undefined,
        frequency: draft.frequency || undefined,
        instruction: draft.instruction || undefined,
        durationDays: draft.durationDays === '' ? undefined : Number(draft.durationDays),
        quantity: Number(draft.quantity) || 1,
        unitPrice: draft.unitPrice === '' ? undefined : Number(draft.unitPrice),
        notes: draft.notes || undefined,
      };
      if (editingLine) {
        const { data } = await rxsoftApi.patch(
          `/website/admin/prescriptions/${prescriptionId}/lines/${editingLine.id}`,
          payload
        );
        return data;
      }
      const { data } = await rxsoftApi.post(
        `/website/admin/prescriptions/${prescriptionId}/lines`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: editingLine ? 'Line updated' : 'Line added', color: 'green' });
      setLineModal(false);
      setEditingLine(null);
      setDraft(emptyDraft);
      invalidate();
    },
    onError: (err) => notifications.show({ color: 'red', message: getApiErrorMessage(err) }),
  });

  const deleteLineMutation = useMutation({
    mutationFn: async (lineId: string) => {
      await rxsoftApi.delete(`/website/admin/prescriptions/${prescriptionId}/lines/${lineId}`);
    },
    onSuccess: () => {
      notifications.show({ message: 'Line removed', color: 'green' });
      invalidate();
    },
    onError: (err) => notifications.show({ color: 'red', message: getApiErrorMessage(err) }),
  });

  // ── Medication pickers (catalog / generic product / generic drug / free text) ──
  const { data: itemResults = [] } = useQuery({
    queryKey: ['items-search', itemSearch],
    queryFn: async () => {
      if (itemSearch.trim().length < 2) return [];
      const { data } = await rxsoftApi.get('/items', {
        params: { search: itemSearch, page: 1, limit: 20 },
      });
      return data?.data ?? [];
    },
    enabled: lineModal && itemSearch.trim().length >= 2,
  });
  const itemOptions = (Array.isArray(itemResults) ? itemResults : [])
    .filter((r: any) => r?.id)
    .map((r: any) => ({
      value: `item:${String(r.id)}`,
      label: `${String(r.displayName ?? r.name ?? r.id)}${r.code ? ` (${r.code})` : ''}`,
      type: 'item' as const,
    }));

  const { data: genericProducts = [] } = useQuery({
    queryKey: ['generic-products', 'all'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/generic-products', { params: { limit: 100 } });
      return data?.data ?? [];
    },
    enabled: lineModal,
  });
  const genericProductOptions = (Array.isArray(genericProducts) ? genericProducts : [])
    .filter((g: any) => g?.id)
    .map((g: any) => ({
      value: `generic_product:${String(g.id)}`,
      label: String(g.name ?? g.id),
      type: 'generic_product' as const,
    }));

  const { data: drugResults = [] } = useQuery({
    queryKey: ['generic-drugs-search', drugSearch],
    queryFn: async () => {
      if (drugSearch.trim().length < 2) return [];
      const { data } = await rxsoftApi.get('/generic-drugs', {
        params: { search: drugSearch, page: 1, limit: 20 },
      });
      return data?.data ?? [];
    },
    enabled: lineModal && drugSearch.trim().length >= 2,
  });
  const drugOptions = (Array.isArray(drugResults) ? drugResults : [])
    .filter((g: any) => g?.code)
    .map((g: any) => ({
      value: `generic_drug:${String(g.code)}`,
      label: `${String(g.name ?? g.code)}${g.code ? ` (${g.code})` : ''}`,
      type: 'generic_drug' as const,
    }));

  const SOURCE_META: Record<string, { label: string; color: string; dot: string }> = {
    item: { label: 'Catalog item', color: 'blue', dot: '#2563EB' },
    generic_product: { label: 'Generic product', color: 'violet', dot: '#7C3AED' },
    generic_drug: { label: 'Generic drug', color: 'teal', dot: '#0D9488' },
    freetext: { label: 'Free text', color: 'gray', dot: '#6B7280' },
  };

  type SourceOption = { value: string; label: string; type: LineSource };

  // Clickable catalogue matches derived from the parsed instruction's drug name.
  const suggestions = useMemo<SourceOption[]>(() => {
    const q = parsedDrugText.trim().toLowerCase();
    if (!q) return [];
    const pool: SourceOption[] = [
      ...itemOptions,
      ...genericProductOptions,
      ...drugOptions,
    ] as SourceOption[];
    const seen = new Set<string>();
    const out: SourceOption[] = [];
    for (const option of pool) {
      if (!option.label.toLowerCase().includes(q)) continue;
      if (seen.has(option.value)) continue;
      seen.add(option.value);
      out.push(option);
      if (out.length >= 8) break;
    }
    return out;
  }, [parsedDrugText, itemOptions, genericProductOptions, drugOptions]);

  const selectSuggestion = (option: SourceOption) => {
    const [kind, ...rest] = option.value.split(':');
    const payloadValue = rest.join(':');
    const source = (option.type ?? kind) as LineSource;
    setDraft((current) => ({
      ...current,
      source,
      sourceKey: option.value,
      selectedLabel: option.label,
      itemId: source === 'item' ? payloadValue : null,
      genericItemCode: source === 'generic_product' ? payloadValue : null,
      genericDrugCode: source === 'generic_drug' ? payloadValue : null,
      freetextName: source === 'freetext' ? current.freetextName : '',
    }));
  };

  const currentSourceOption =
    draft.source !== 'freetext' && draft.sourceKey
      ? {
          value: draft.sourceKey,
          label: draft.selectedLabel || draft.sourceKey,
          type: draft.source,
        }
      : null;
  const allSourceOptions = [
    ...itemOptions,
    ...genericProductOptions,
    ...drugOptions,
    ...(currentSourceOption &&
    ![...itemOptions, ...genericProductOptions, ...drugOptions].some(
      (o) => o.value === currentSourceOption.value
    )
      ? [currentSourceOption]
      : []),
    { value: 'free', label: 'Enter a name manually', type: 'freetext' as const },
  ];
  const sourceSelectData = Object.entries(SOURCE_META)
    .map(([type, meta]) => ({
      group: meta.label,
      items: allSourceOptions.filter((o) => o.type === type),
    }))
    .filter((group) => group.items.length > 0);

  const lines = data?.lines ?? [];
  const totalValue = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.lineTotal ?? 0), 0),
    [lines]
  );

  function openAddLine() {
    setEditingLine(null);
    setDraft(emptyDraft);
    setInstructionText('');
    setParsedDrugText('');
    setParseSummary(null);
    setItemSearch('');
    setDrugSearch('');
    setLineModal(true);
  }

  function openEditLine(line: PrescriptionLine) {
    const source: LineSource =
      line.sourceType ??
      (line.itemId
        ? 'item'
        : line.genericItemCode
          ? 'generic_product'
          : line.genericDrugCode
            ? 'generic_drug'
            : 'freetext');
    const keyValue =
      source === 'item'
        ? line.itemId
        : source === 'generic_product'
          ? line.genericItemCode
          : source === 'generic_drug'
            ? line.genericDrugCode
            : null;
    setEditingLine(line);
    setDraft({
      sourceKey: source === 'freetext' ? null : `${source}:${keyValue ?? ''}`,
      source,
      selectedLabel: line.name,
      itemId: line.itemId,
      genericItemCode: line.genericItemCode ?? null,
      genericDrugCode: line.genericDrugCode ?? null,
      freetextName: source === 'freetext' ? (line.freetextName ?? line.name) : '',
      strength: line.strength ?? '',
      frequency: line.frequency ?? '',
      instruction: line.instruction ?? '',
      durationDays: line.durationDays ?? '',
      quantity: line.quantity,
      unitPrice: line.unitPrice ?? '',
      notes: line.notes ?? '',
    });
    setItemSearch('');
    setDrugSearch('');
    setInstructionText('');
    setParsedDrugText('');
    setParseSummary(null);
    setLineModal(true);
  }

  /** Parse the pasted instruction and distribute it across the line fields. */
  function handleParseInstruction() {
    // The vendored parser is untyped (@ts-nocheck); treat its result as `any`.
    const result = parsePrescription(instructionText) as any;
    const mapped = mapParsedInstruction(result);
    setParseSummary(summariseParse(result));
    const drugText = String(result?.drug?.text ?? '').trim();
    setParsedDrugText(drugText);
    // Kick the catalogue/generic-drug searches so clickable suggestions appear.
    if (drugText.length >= 2) {
      setItemSearch(drugText);
      setDrugSearch(drugText);
    }
    setDraft((current) => ({
      ...current,
      ...mapped,
      // A parsed drug name only replaces the medication when no catalogue
      // item/generic was explicitly chosen.
      ...(mapped.freetextName &&
      current.source !== 'item' &&
      current.source !== 'generic_product' &&
      current.source !== 'generic_drug'
        ? {
            source: 'freetext' as const,
            sourceKey: null,
            itemId: null,
            genericItemCode: null,
            genericDrugCode: null,
          }
        : {}),
    }));
  }

  if (isLoading) {
    return (
      <RxPage title="Prescription" onBack={() => navigate({ to: '/rxsoft/website-prescriptions' })}>
        <Text c="dimmed">Loading prescription…</Text>
      </RxPage>
    );
  }

  if (!data) {
    return (
      <RxPage title="Prescription" onBack={() => navigate({ to: '/rxsoft/website-prescriptions' })}>
        <Text c="dimmed">Prescription not found.</Text>
      </RxPage>
    );
  }

  return (
    <RxPage
      title={`Prescription ${data.id.slice(0, 8)}`}
      description={[data.name, data.phone, data.email].filter(Boolean).join(' · ')}
      breadcrumbs={[
        { label: 'Prescriptions', href: '/rxsoft/website-prescriptions' },
        { label: 'Detail' },
      ]}
      onBack={() => navigate({ to: '/rxsoft/website-prescriptions' })}
      actions={
        <Group gap="xs">
          <Badge color={statusColor[data.status] ?? 'gray'} variant="light" size="lg">
            {data.status}
          </Badge>
          {!finalised && canWrite ? (
            <>
              <Button
                size="xs"
                variant="light"
                color="yellow"
                onClick={() => statusMutation.mutate('Under Review')}
                loading={statusMutation.isPending}
              >
                Verify
              </Button>
              <Button
                size="xs"
                variant="light"
                color="green"
                onClick={() => statusMutation.mutate('Approved')}
                loading={statusMutation.isPending}
              >
                Transcribe
              </Button>
              <Button
                size="xs"
                variant="light"
                color="red"
                leftSection={<X size={14} />}
                onClick={() => statusMutation.mutate('Rejected')}
                loading={statusMutation.isPending}
              >
                Reject
              </Button>
            </>
          ) : null}
        </Group>
      }
    >
      <Grid>
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Stack gap="md">
            {/* Status / steps */}
            <Card withBorder radius="md" p="md">
              <Stack gap="sm">
                <Group justify="space-between" wrap="wrap">
                  <Text fw={700}>Workflow</Text>
                  <Text size="xs" c="dimmed">
                    Uploaded {dateLabel(data.createdAt)}
                  </Text>
                </Group>
                <Group gap="lg" wrap="wrap">
                  <StepDot done label="Uploaded" />
                  <StepDot done={!!data.steps.verifiedAt} label="Verified" />
                  <StepDot done={!!data.steps.transcribedAt} label="Transcribed" />
                  <StepDot done={!!data.steps.orderedAt} label="Ordered" />
                </Group>
                {data.order ? (
                  <Group gap="sm">
                    <Badge color="blue" variant="light">
                      Order {data.order.orderNumber ?? data.order.id}
                    </Badge>
                    <Anchor
                      size="sm"
                      onClick={() =>
                        data.order &&
                        navigate({
                          to: '/rxsoft/website-orders/$orderId',
                          params: { orderId: data.order.id },
                        })
                      }
                    >
                      Open order
                    </Anchor>
                  </Group>
                ) : null}
              </Stack>
            </Card>

            {/* Files */}
            <Card withBorder radius="md" p="md">
              <Stack gap="sm">
                <Text fw={700}>Prescription files</Text>
                {data.files.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No files attached.
                  </Text>
                ) : (
                  <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                    {data.files.map((file) =>
                      file.mime?.startsWith('image/') ? (
                        <Card key={file.id} withBorder padding={4} radius="sm">
                          <Image
                            src={withMediaToken(file.fileUrl, mediaToken)}
                            alt={file.originalName}
                            h={120}
                            fit="cover"
                            style={{ cursor: 'zoom-in' }}
                            onClick={() => setFilePreview(file)}
                          />
                        </Card>
                      ) : (
                        <Card key={file.id} withBorder padding="sm" radius="sm">
                          <Stack gap={4} align="center">
                            <Text size="xs" lineClamp={1}>
                              {file.originalName}
                            </Text>
                            <Anchor
                              href={withMediaToken(file.fileUrl, mediaToken)}
                              target="_blank"
                              rel="noreferrer"
                              size="xs"
                            >
                              Open PDF
                            </Anchor>
                          </Stack>
                        </Card>
                      )
                    )}
                  </SimpleGrid>
                )}
              </Stack>
            </Card>

            {/* Submitted details from the checkout (prescriber type, license,
                phone, shopper notes). */}
            {data.adminNotes ? (
              <Card withBorder radius="md" p="md">
                <Stack gap="xs">
                  <Text fw={700}>Submitted details (from checkout)</Text>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {data.adminNotes}
                  </Text>
                </Stack>
              </Card>
            ) : null}

            {/* Transcription */}
            <Card withBorder radius="md" p="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={700}>Transcription</Text>
                  {data.transcription.transcribedAt ? (
                    <Badge color="green" variant="light">
                      Transcribed {dateLabel(data.transcription.transcribedAt)}
                    </Badge>
                  ) : null}
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  <TextInput
                    label="Pharmacist name"
                    value={form.pharmacistName}
                    disabled={!editable}
                    onChange={(e) => {
                      const value = e.currentTarget.value;
                      setForm((f) => ({ ...f, pharmacistName: value }));
                    }}
                  />
                  <TextInput
                    label="PCN registration no."
                    value={form.pharmacistPcn}
                    disabled={!editable}
                    onChange={(e) => {
                      const value = e.currentTarget.value;
                      setForm((f) => ({ ...f, pharmacistPcn: value }));
                    }}
                  />
                  <TextInput
                    label="Prescriber"
                    value={form.prescriberName}
                    disabled={!editable}
                    onChange={(e) => {
                      const value = e.currentTarget.value;
                      setForm((f) => ({ ...f, prescriberName: value }));
                    }}
                  />
                  <TextInput
                    label="Facility"
                    value={form.facilityName}
                    disabled={!editable}
                    onChange={(e) => {
                      const value = e.currentTarget.value;
                      setForm((f) => ({ ...f, facilityName: value }));
                    }}
                  />
                </SimpleGrid>
                <Textarea
                  label="Pharmacist note (shown to the shopper)"
                  minRows={3}
                  value={form.notes}
                  disabled={!editable}
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    setForm((f) => ({ ...f, notes: value }));
                  }}
                />
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Dispensing pharmacy: {data.pharmacy.name}
                    {data.pharmacy.address ? ` · ${data.pharmacy.address}` : ''}
                  </Text>
                  <Button
                    size="sm"
                    leftSection={<Check size={14} />}
                    disabled={!editable}
                    loading={transcriptionMutation.isPending}
                    onClick={() => transcriptionMutation.mutate()}
                  >
                    Save transcription
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>

        {/* Lines */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Card withBorder radius="md" p="md">
            <Stack gap="sm">
              <Group justify="space-between">
                <Stack gap={0}>
                  <Text fw={700}>Medications ({data.lineCount})</Text>
                  <Text size="xs" c="dimmed">
                    Total {naira(totalValue)}
                  </Text>
                </Stack>
                {editable ? (
                  <Button size="xs" leftSection={<FilePlus2 size={14} />} onClick={openAddLine}>
                    Add line
                  </Button>
                ) : null}
              </Group>

              {lines.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No medication lines yet. Add lines as you transcribe the prescription.
                </Text>
              ) : (
                <Table.ScrollContainer minWidth={520}>
                  <Table verticalSpacing="xs" highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>#</Table.Th>
                        <Table.Th>Medication</Table.Th>
                        <Table.Th>Dose</Table.Th>
                        <Table.Th>Qty</Table.Th>
                        <Table.Th>Price</Table.Th>
                        <Table.Th />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {lines.map((line) => (
                        <Table.Tr key={line.id}>
                          <Table.Td>{line.lineNumber}</Table.Td>
                          <Table.Td>
                            <Stack gap={0}>
                              <Text size="sm" fw={600}>
                                {line.name}
                              </Text>
                              <Group gap={6} mt={2}>
                                {(() => {
                                  const source =
                                    line.sourceType ??
                                    (line.itemId
                                      ? 'item'
                                      : line.genericItemCode
                                        ? 'generic_product'
                                        : line.genericDrugCode
                                          ? 'generic_drug'
                                          : 'freetext');
                                  const meta = SOURCE_META[source];
                                  return meta ? (
                                    <Badge size="xs" radius="xl" variant="light" color={meta.color}>
                                      {meta.label}
                                    </Badge>
                                  ) : null;
                                })()}
                                <Text size="xs" c="dimmed">
                                  {[line.strength, line.code].filter(Boolean).join(' · ') || '—'}
                                </Text>
                              </Group>
                              {line.stockStatus !== 'unknown' ? (
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color={
                                    line.stockStatus === 'in_stock'
                                      ? 'green'
                                      : line.stockStatus === 'low_stock'
                                        ? 'orange'
                                        : 'red'
                                  }
                                >
                                  {line.stockStatus === 'in_stock'
                                    ? 'In stock'
                                    : line.stockStatus === 'low_stock'
                                      ? 'Low stock'
                                      : 'Out of stock'}
                                </Badge>
                              ) : null}
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">
                              {[line.frequency, line.durationDays ? `${line.durationDays}d` : null]
                                .filter(Boolean)
                                .join(' · ') || '—'}
                            </Text>
                            {line.instruction ? (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {line.instruction}
                              </Text>
                            ) : null}
                          </Table.Td>
                          <Table.Td>{line.quantity}</Table.Td>
                          <Table.Td>
                            <Text size="sm">{naira(line.unitPrice)}</Text>
                            <Text size="xs" c="dimmed">
                              {naira(line.lineTotal)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4} wrap="nowrap">
                              <Tooltip label="Edit line">
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  disabled={!editable}
                                  onClick={() => openEditLine(line)}
                                >
                                  <Pencil size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Remove line">
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  color="red"
                                  disabled={!editable}
                                  loading={deleteLineMutation.isPending}
                                  onClick={() => deleteLineMutation.mutate(line.id)}
                                >
                                  <Trash2 size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}

              <Divider />
              <Button
                variant="light"
                leftSection={<Send size={14} />}
                disabled={!canWrite || !!data.order || lines.length === 0}
                loading={convertMutation.isPending}
                onClick={() => convertMutation.mutate()}
              >
                {data.order ? 'Already converted to an order' : 'Convert to order'}
              </Button>
              <Text size="xs" c="dimmed">
                Converting creates a website order for every line. Post it as a sale from the order
                page when dispensing.
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* File preview */}
      <Modal
        opened={!!filePreview}
        onClose={() => setFilePreview(null)}
        title={filePreview?.originalName}
        size="xl"
        centered
      >
        {filePreview ? (
          <Image
            src={withMediaToken(filePreview.fileUrl, mediaToken)}
            alt={filePreview.originalName}
            fit="contain"
          />
        ) : null}
      </Modal>

      {/* Line editor */}
      <Modal
        opened={lineModal}
        onClose={() => setLineModal(false)}
        title={editingLine ? 'Edit medication line' : 'Add medication line'}
        size="lg"
        centered
      >
        <Stack gap="sm">
          {/* Free-text instruction parser: distributes a pasted instruction
              into the line fields below (strength, frequency, duration,
              quantity, route, name). */}
          <Paper
            withBorder
            radius="md"
            p="sm"
            style={{ background: 'var(--mantine-color-gray-0)' }}
          >
            <Stack gap="xs">
              <Text size="sm" fw={600}>
                Paste instruction
              </Text>
              <Textarea
                placeholder="e.g. Amoxicillin 500mg: take 1 capsule by mouth three times daily for 7 days"
                minRows={2}
                autosize
                value={instructionText}
                onChange={(e) => setInstructionText(e.currentTarget.value)}
                data-testid="prescription-instruction-input"
              />
              <Group justify="space-between" align="center" wrap="wrap">
                <Text size="xs" c="dimmed">
                  Fills the medication, strength, frequency, duration, quantity and route.
                </Text>
                <Button
                  size="compact-sm"
                  variant="light"
                  onClick={handleParseInstruction}
                  disabled={!instructionText.trim()}
                  data-testid="prescription-instruction-parse"
                >
                  Parse &amp; fill
                </Button>
              </Group>
              {parseSummary ? (
                <Alert
                  color={parseSummary.status === 'ok' ? 'green' : 'orange'}
                  variant="light"
                  title={
                    parseSummary.status === 'ok'
                      ? 'Parsed cleanly'
                      : `Needs review — ${parseSummary.status}`
                  }
                >
                  <Stack gap={2}>
                    {parseSummary.warnings.slice(0, 6).map((warning) => (
                      <Text key={warning} size="xs">
                        • {warning}
                      </Text>
                    ))}
                    {parseSummary.unparsed.length ? (
                      <Text size="xs">Unparsed: {parseSummary.unparsed.join(', ')}</Text>
                    ) : null}
                    {!parseSummary.warnings.length && !parseSummary.unparsed.length ? (
                      <Text size="xs">Every component was recognised.</Text>
                    ) : null}
                  </Stack>
                </Alert>
              ) : null}

              {parsedDrugText ? (
                suggestions.length > 0 ? (
                  <Stack gap={4}>
                    <Text size="xs" fw={600} c="dimmed">
                      Suggested medications — click to select
                    </Text>
                    <Group gap={6} wrap="wrap">
                      {suggestions.map((option) => (
                        <Button
                          key={option.value}
                          size="compact-xs"
                          radius="xl"
                          variant="light"
                          color={SOURCE_META[option.type]?.color ?? 'gray'}
                          onClick={() => selectSuggestion(option)}
                          data-testid={`prescription-suggestion-${option.value}`}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </Group>
                  </Stack>
                ) : (
                  <Text size="xs" c="dimmed">
                    No catalogue match for “{parsedDrugText}”. You can still save it as a free-text
                    line.
                  </Text>
                )
              ) : null}
            </Stack>
          </Paper>

          <Select
            label="Medication"
            placeholder="Search catalog items, generic products or generic drugs…"
            data={sourceSelectData}
            searchable
            clearable
            value={draft.source === 'freetext' ? 'free' : draft.sourceKey}
            onSearchChange={(q) => {
              setItemSearch(q);
              setDrugSearch(q);
            }}
            onChange={(value) => {
              if (!value) {
                setDraft((d) => ({
                  ...d,
                  sourceKey: null,
                  selectedLabel: '',
                  itemId: null,
                  genericItemCode: null,
                  genericDrugCode: null,
                }));
                return;
              }
              const isFree = value === 'free';
              const [kind, ...rest] = value.split(':');
              const payloadValue = rest.join(':');
              const source = (isFree ? 'freetext' : kind) as LineSource;
              const label = isFree
                ? 'Free text'
                : (allSourceOptions.find((o) => o.value === value)?.label ?? payloadValue);
              setDraft((d) => ({
                ...d,
                source,
                sourceKey: isFree ? null : value,
                selectedLabel: label,
                itemId: source === 'item' ? payloadValue : null,
                genericItemCode: source === 'generic_product' ? payloadValue : null,
                genericDrugCode: source === 'generic_drug' ? payloadValue : null,
                freetextName: source === 'freetext' ? d.freetextName : '',
              }));
              // Clear the search so the chosen label (not the raw id) stays shown.
              setItemSearch('');
              setDrugSearch('');
            }}
            nothingFoundMessage="Type at least 2 characters"
            renderOption={({ option }) => {
              const type = (option as any).type as LineSource | undefined;
              const meta = type ? SOURCE_META[type] : undefined;
              return (
                <Group gap={8} wrap="nowrap">
                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 99,
                      background: meta?.dot ?? '#6B7280',
                      flexShrink: 0,
                    }}
                  />
                  <Text size="sm" style={{ flex: 1 }}>
                    {(option as any).label}
                  </Text>
                  {meta ? (
                    <Badge size="xs" radius="xl" variant="light" color={meta.color}>
                      {meta.label}
                    </Badge>
                  ) : null}
                </Group>
              );
            }}
          />
          {draft.source === 'freetext' ? (
            <TextInput
              label="Medication name"
              placeholder="e.g. Amoxicillin 500mg capsules"
              value={draft.freetextName}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setDraft((d) => ({ ...d, freetextName: value }));
              }}
            />
          ) : draft.sourceKey ? (
            <Group gap={8}>
              <Badge size="sm" radius="xl" variant="light" color={SOURCE_META[draft.source].color}>
                {SOURCE_META[draft.source].label}
              </Badge>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {draft.selectedLabel}
              </Text>
            </Group>
          ) : null}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            <TextInput
              label="Strength"
              placeholder="500mg"
              value={draft.strength}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setDraft((d) => ({ ...d, strength: value }));
              }}
            />
            <TextInput
              label="Frequency"
              placeholder="3x daily"
              value={draft.frequency}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setDraft((d) => ({ ...d, frequency: value }));
              }}
            />
            <NumberInput
              label="Duration (days)"
              min={1}
              value={draft.durationDays}
              onChange={(v) => setDraft((d) => ({ ...d, durationDays: v === '' ? '' : Number(v) }))}
            />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <NumberInput
              label="Quantity"
              min={1}
              value={draft.quantity}
              onChange={(v) => setDraft((d) => ({ ...d, quantity: Number(v) || 1 }))}
            />
            <NumberInput
              label="Unit price (₦)"
              min={0}
              value={draft.unitPrice}
              onChange={(v) => setDraft((d) => ({ ...d, unitPrice: v === '' ? '' : Number(v) }))}
            />
          </SimpleGrid>
          <TextInput
            label="Instruction"
            placeholder="Take after meals"
            value={draft.instruction}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setDraft((d) => ({ ...d, instruction: value }));
            }}
          />
          <Textarea
            label="Line notes"
            minRows={2}
            value={draft.notes}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setDraft((d) => ({ ...d, notes: value }));
            }}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setLineModal(false)}>
              Cancel
            </Button>
            <Button
              loading={saveLineMutation.isPending}
              leftSection={editingLine ? <Check size={14} /> : <FilePlus2 size={14} />}
              onClick={() => saveLineMutation.mutate()}
            >
              {editingLine ? 'Save line' : 'Add line'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </RxPage>
  );
}
