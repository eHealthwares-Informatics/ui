import {
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  ActionIcon,
  Tooltip,
  TextInput,
  NumberInput,
  Table,
  Timeline,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import {
  ShoppingCart,
  CircleCheck,
  CircleX,
  Truck,
  MapPin,
  PackageSearch,
  AlertTriangle,
  Eye,
  List,
} from 'lucide-react';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { DataPageShell } from '../../../components/page/data-page-shell';
import { RxPage } from '../../../components/page/rx-page';
import { websiteOrdersConfig } from './schema';

const STATUS_COLORS: Record<string, string> = {
  pending: 'yellow',
  confirmed: 'cyan',
  processing: 'blue',
  dispatched: 'violet',
  in_transit: 'indigo',
  delivered: 'green',
  cancelled: 'red',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <ShoppingCart size={16} />,
  confirmed: <CircleCheck size={16} />,
  processing: <PackageSearch size={16} />,
  dispatched: <Truck size={16} />,
  in_transit: <MapPin size={16} />,
  delivered: <CircleCheck size={16} />,
  cancelled: <CircleX size={16} />,
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['dispatched', 'cancelled'],
  dispatched: ['in_transit'],
  in_transit: ['delivered'],
  delivered: [],
  cancelled: [],
};

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RxWebsiteOrdersPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // Post as Sale state
  const [postSaleOpen, setPostSaleOpen] = useState(false);
  const [postSaleOrderId, setPostSaleOrderId] = useState<string | null>(null);
  const [stockLocationId, setStockLocationId] = useState<string | null>(null);
  const [postOrgId, setPostOrgId] = useState<string | null>(null);
  const [matchCheckOpen, setMatchCheckOpen] = useState(false);
  const [matchCheckOrder, setMatchCheckOrder] = useState<any>(null);
  const [unmatchedItems, setUnmatchedItems] = useState<any[]>([]);
  // Reconciliation state
  const [reconcileOrder, setReconcileOrder] = useState<any>(null);
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [reconcileVersion, setReconcileVersion] = useState(0);
  // Track orders reconciled client-side so icon disappears immediately
  const [reconciledOrderIds, setReconciledOrderIds] = useState<Set<string>>(new Set());

  const { data: locations = [] } = useQuery({
    queryKey: ['stock-locations', 'all'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/stock-locations', { params: { limit: 200 } });
      return data?.data ?? data ?? [];
    },
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations', 'all'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/organizations', { params: { limit: 200 } });
      return data?.data ?? data ?? [];
    },
  });

  const invalidateOrders = () => {
    qc.invalidateQueries({ queryKey: ['rxsoft-data-page'] });
    qc.invalidateQueries({ queryKey: ['website-orders'] });
    qc.invalidateQueries({ queryKey: ['website-order-detail'] });
  };

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await rxsoftApi.patch(`/website/admin/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      notifications.show({ message: 'Status updated.', color: 'green' });
      invalidateOrders();
    },
    onError: (err: any) => {
      notifications.show({ message: err?.response?.data?.message ?? 'Status update failed.', color: 'red' });
    },
  });

  const postSaleMutation = useMutation({
    mutationFn: async () => {
      await rxsoftApi.post(`/website/admin/orders/${postSaleOrderId}/post-sale`, {
        stockLocationId: stockLocationId || undefined,
        organizationId: postOrgId || undefined,
      });
    },
    onSuccess: () => {
      notifications.show({ message: 'Order posted as sale.', color: 'green' });
      invalidateOrders();
      setPostSaleOpen(false);
      setStockLocationId(null);
      setPostOrgId(null);
    },
    onError: (err: any) => {
      notifications.show({ message: err?.response?.data?.message ?? 'Post sale failed.', color: 'red' });
    },
  });

  function openDetail(order: any) {
    setSelectedOrder(order);
    setDetailOpen(true);
  }

  function openReconcile(order: any) {
    setReconcileOrder(order);
    setReconcileOpen(true);
  }

  function handlePostSaleClick(order: any) {
    const unmatched = (order.items ?? []).filter((i: any) => !i.itemId);
    if (unmatched.length > 0) {
      setMatchCheckOrder(order);
      setUnmatchedItems(unmatched);
      setMatchCheckOpen(true);
      return;
    }
    setPostSaleOrderId(order.id);
    setStockLocationId(null);
    setPostOrgId(order.organizationId ?? null);
    setPostSaleOpen(true);
  }

  const config = useMemo(() => {
    const actionsColumn = {
      key: 'actions',
      label: '',
      render: (row: any) => {
        const hasFreetext = !reconciledOrderIds.has(row.id) && row.items?.some((i: any) => !i.itemId && !i.genericItemCode);
        return (
          <Group gap="xs">
            <Tooltip label="View order">
              <ActionIcon variant="light" onClick={() => openDetail(row)}>
                <Eye size={16} />
              </ActionIcon>
            </Tooltip>
            {row.items?.some((i: any) => !i.itemId && !i.genericItemCode) && (
              <Tooltip label={hasFreetext ? 'Reconcile items' : 'View reconciled items'}>
                <ActionIcon
                  color={hasFreetext ? 'orange' : 'blue'}
                  variant="light"
                  onClick={() => openReconcile(row)}
                >
                  {hasFreetext ? <AlertTriangle size={16} /> : <List size={16} />}
                </ActionIcon>
              </Tooltip>
            )}
            {!row.saleId && row.orderStatus !== 'cancelled' && row.orderStatus !== 'delivered' && (
              <Button
                size="compact-xs"
                variant="filled"
                color="green"
                onClick={() => handlePostSaleClick(row)}
              >
                Post as Sale
              </Button>
            )}
            <Select
              size="xs"
              placeholder="Change"
              data={(STATUS_TRANSITIONS[row.orderStatus ?? 'pending']?.map((s) => ({
                value: s,
                label: statusLabel(s || '-'),
              })) ?? [])}
              onChange={(v) => v && statusUpdateMutation.mutate({ id: row.id, status: v })}
              clearable
              style={{ width: 110 }}
            />
          </Group>
        );
      },
    };
    return {
      ...websiteOrdersConfig,
      columns: websiteOrdersConfig.columns
        .filter((c) => c.key !== 'createdAt')
        .map((c) =>
          c.key === 'status'
            ? {
                ...c,
                render: (row: any) => (
                  <Badge color={STATUS_COLORS[row.orderStatus ?? 'pending'] ?? 'gray'}>
                    {statusLabel(row.orderStatus ?? 'pending')}
                  </Badge>
                ),
              }
            : c,
        ).concat([
        {
          key: 'sale',
          label: 'Sale',
          render: (row: any) =>
            row.saleId ? (
              <Badge
                color="green"
                variant="light"
                size="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate({ to: '/rxsoft/sales-lines', search: { saleId: row.saleId } })}
              >
                {row.saleNumber ?? row.sale?.saleNumber ?? 'Posted'}
              </Badge>
            ) : (
              <Badge color="gray" variant="light" size="sm">—</Badge>
            ),
        },
        {
          key: 'createdAt',
          label: 'Date',
          render: (row: any) =>
            row.createdAt ? new Date(row.createdAt).toLocaleString() : '-',
        },
        actionsColumn,
      ]),
    };
  }, [statusUpdateMutation, reconcileVersion, reconciledOrderIds]);

  return (
    <RxPage title="Website Orders" description="Manage and fulfill orders placed via the website.">
      
          <DataPageShell
            config={config}
          />
      {/* Post as Sale — matching validation modal */}
      <Modal opened={matchCheckOpen} onClose={() => setMatchCheckOpen(false)} title="Check and Validate" centered>
        <Stack>
          <Alert icon={<AlertTriangle size={16} />} color="orange" title="Some items are unmatched">
            <Text size="sm">
              {unmatchedItems.length} of {matchCheckOrder?.items?.length ?? 0} items still need to be matched to catalog items before this order can be posted as a sale:
            </Text>
            <Stack gap={2} mt="xs">
              {unmatchedItems.map((item) => (
                <Text key={item.id} size="sm">
                  • {[item.freetextName, item.genericItemCode, item.id].filter(Boolean).join(' · ')}
                  {item.genericItemCode ? ' (generic)' : ''} — qty {item.quantity}
                </Text>
              ))}
            </Stack>
          </Alert>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setMatchCheckOpen(false)}>Cancel</Button>
            <Button
              color="orange"
              onClick={() => {
                setMatchCheckOpen(false);
                if (matchCheckOrder) { openReconcile(matchCheckOrder); }
              }}
            >
              Match items now
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Post as Sale Modal */}
      <Modal opened={postSaleOpen} onClose={() => { setPostSaleOpen(false); setStockLocationId(null); setPostOrgId(null); }} title="Post Order as Sale" centered>
        <Stack>
          <Text size="sm" c="dimmed">This will create a draft sale record from this order. Stock won&apos;t be depleted until the sale is completed.</Text>
          <Select
            label="Organisation (optional)"
            value={postOrgId}
            onChange={setPostOrgId}
            data={(Array.isArray(organizations) ? organizations : []).map((o: any) => ({ value: o.id, label: o.name }))}
            searchable
            clearable
          />
          <Select
            label="Stock Location (optional)"
            value={stockLocationId}
            onChange={setStockLocationId}
            data={(Array.isArray(locations) ? locations : []).map((l: any) => ({ value: l.id, label: l.name }))}
            searchable
            clearable
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { setPostSaleOpen(false); setStockLocationId(null); setPostOrgId(null); }}>Cancel</Button>
            <Button onClick={() => postSaleMutation.mutate()} loading={postSaleMutation.isPending}>
              Confirm & Post Sale
            </Button>
          </Group>
        </Stack>
      </Modal>

      <ReconcileModal
        order={reconcileOrder}
        opened={reconcileOpen}
        onClose={() => { setReconcileOpen(false); setReconcileOrder(null); }}
        onReconciled={() => {
          invalidateOrders();
          setReconcileVersion((v) => v + 1);
          if (reconcileOrder?.id) {
            setReconciledOrderIds((prev) => new Set(prev).add(reconcileOrder.id));
          }
        }}
        organizations={Array.isArray(organizations) ? organizations : []}
        defaultOrgId={organizations[0]?.id ?? null}
      />

      <DetailModal
        orderId={selectedOrder?.id}
        opened={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedOrder(null); }}
        onStatusChange={invalidateOrders}
      />
    </RxPage>
  );
}
function ReconcileModal({
  order, opened, onClose, onReconciled, organizations = [], defaultOrgId = null,
}: {
  order: any; opened: boolean; onClose: () => void; onReconciled: () => void; organizations?: any[]; defaultOrgId?: string | null;
}) {
  const qc = useQueryClient();
  // per-line editable state, keyed by order item id
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [orgId, setOrgId] = useState<string | null>(defaultOrgId);
  const [saving, setSaving] = useState<string | null>(null);

  const freetextItems = order?.items?.filter((i: any) => !i.itemId) ?? [];

  const genericQuery = useQuery({
    queryKey: ['generic-products', 'all'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/generic-products', { params: { limit: 100 } });
      return data?.data ?? [];
    },
  });
  const genericOptions = (Array.isArray(genericQuery.data) ? genericQuery.data : []).map((g: any) => ({
    value: g.id,
    label: g.name,
  }));

  // item search state
  const [itemSearch, setItemSearch] = useState('');
  const { data: itemResults = [] } = useQuery({
    queryKey: ['items-search', itemSearch],
    queryFn: async () => {
      if (itemSearch.trim().length < 2) { return []; }
      const { data } = await rxsoftApi.get('/items', { params: { search: itemSearch, page: 1, limit: 20 } });
      return data?.data ?? [];
    },
    enabled: itemSearch.trim().length >= 2,
  });
  const itemOptions = (Array.isArray(itemResults) ? itemResults : []).map((r: any) => ({
    value: r.id,
    label: `${r.displayName ?? r.name}${r.code ? ` (${r.code})` : ''}`,
  }));

  // Resolve names for already-linked item ids so the select shows the label & can be disabled.
  const linkedItemIds = freetextItems
    .map((i: any) => draft[i.id]?.itemId ?? i.itemId)
    .filter(Boolean);
  const { data: linkedItems = [] } = useQuery({
    queryKey: ['items', 'by-ids', linkedItemIds.join(',')],
    queryFn: async () => {
      if (!linkedItemIds.length) { return []; }
      const { data } = await rxsoftApi.get('/items', { params: { ids: linkedItemIds.join(','), limit: 50 } });
      return data?.data ?? [];
    },
    enabled: linkedItemIds.length > 0,
  });
  const linkedMap = useMemo(() => {
    const m = new Map<string, any>();
    (Array.isArray(linkedItems) ? linkedItems : []).forEach((it: any) => m.set(it.id, it));
    return m;
  }, [linkedItems]);

  // Map for looking up full item data by id (search results + linked items)
  const itemDataMap = useMemo(() => {
    const m = new Map<string, any>();
    (Array.isArray(itemResults) ? itemResults : []).forEach((r: any) => m.set(r.id, r));
    linkedMap.forEach((v, k) => m.set(k, v));
    return m;
  }, [itemResults, linkedMap]);

  const saveMutation = useMutation({
    mutationFn: async ({ item }: { item: any }) => {
      const d = draft[item.id] ?? {};
      await rxsoftApi.post(`/orders/admin/orders/${order.id}/items/${item.id}/reconcile`, {
        itemId: d.itemId ?? undefined,
        genericItemCode: d.genericProductId ?? undefined,
        freetextName: d.freetextName !== undefined ? d.freetextName : item.freetextName ?? undefined,
        unitPrice: d.unitPrice !== undefined ? String(d.unitPrice) : item.unitPrice !== undefined ? String(item.unitPrice) : undefined,
        organizationId: orgId || undefined,
      });
    },
    onSuccess: () => {
      notifications.show({ message: 'Item saved.', color: 'green' });
      qc.invalidateQueries({ queryKey: ['website-orders'] });
      qc.invalidateQueries({ queryKey: ['website-order-detail'] });
      onReconciled();
    },
    onError: (err: any) => {
      notifications.show({ message: err?.response?.data?.message ?? 'Save failed.', color: 'red' });
    },
  });

  if (!opened) { return null; }

  return (
    <Modal opened={opened} onClose={onClose} title={`Reconcile Items — ${order?.orderNumber ?? ''}`} size="90%" centered>
      <Stack>
        <Text size="sm" c="dimmed">
          Link freetext items to a catalog item and/or generic product. Any changed field can be saved
          independently.
        </Text>

        <Select
          label="Organisation (optional)"
          placeholder="Assign order to an organisation"
          value={orgId}
          onChange={setOrgId}
          data={(Array.isArray(organizations) ? organizations : []).map((o: any) => ({ value: o.id, label: o.name }))}
          searchable
          clearable
        />

        {freetextItems.length === 0 ? (
          <Text c="dimmed" size="sm">No freetext items in this order.</Text>
        ) : (
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th>Generic Product</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Qty</Table.Th>
                <Table.Th>Amount (unit)</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th w={90} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {freetextItems.map((item: any) => {
                const d = draft[item.id] ?? {};
                const isLinked = !!item.itemId;
                const total = (d.unitPrice ?? item.unitPrice ?? 0) * (item.quantity ?? 1);
                const isDirty =
                  (d.itemId ?? null) !== (item.itemId ?? null) ||
                  (d.genericProductId ?? null) !== (item.genericItemCode ?? null) ||
                  (d.freetextName ?? item.freetextName ?? '') !== (item.freetextName ?? '') ||
                  (d.unitPrice ?? item.unitPrice ?? 0) !== (item.unitPrice ?? 0);
                return (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <Select
                        size="xs"
                        placeholder="Select item..."
                        data={(() => {
                          const selectedId = d.itemId ?? item.itemId;
                          if (selectedId) {
                            const linked = linkedMap.get(selectedId);
                            const searched = itemOptions.find((o) => o.value === selectedId);
                            const label = linked?.name ?? searched?.label ?? selectedId;
                            return [{ value: selectedId, label }];
                          }
                          return itemOptions;
                        })()}
                        value={d.itemId ?? item.itemId ?? null}
                        onChange={(v) => {
                          const patch: any = { itemId: v };
                          if (v) {
                            const found = itemDataMap.get(v);
                            if (found) {
                              patch.genericProductId = found.genericProductId ?? found.genericItemCode ?? null;
                              patch.freetextName = found.displayName ?? found.name ?? '';
                            }
                          }
                          setDraft((prev) => ({ ...prev, [item.id]: { ...prev[item.id], ...patch } }));
                        }}
                        onSearchChange={setItemSearch}
                        searchable
                        clearable
                        disabled={isLinked}
                        style={{ minWidth: 220 }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Select
                        size="xs"
                        placeholder="Generic product"
                        data={genericOptions}
                        value={d.genericProductId ?? item.genericItemCode ?? null}
                        onChange={(v) => setDraft((prev) => ({ ...prev, [item.id]: { ...prev[item.id], genericProductId: v } }))}
                        searchable
                        clearable
                        disabled={!!(d.itemId ?? item.itemId)}
                        style={{ minWidth: 180 }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        value={d.freetextName ?? item.freetextName ?? ''}
                        onChange={(e) => setDraft((prev) => ({ ...prev, [item.id]: { ...prev[item.id], freetextName: e.currentTarget.value } }))}
                        disabled={!!(d.itemId ?? item.itemId)}
                      />
                    </Table.Td>
                    <Table.Td>{item.quantity}</Table.Td>
                    <Table.Td>
                      <NumberInput
                        size="xs"
                        value={d.unitPrice ?? item.unitPrice ?? 0}
                        onChange={(v) => setDraft((prev) => ({ ...prev, [item.id]: { ...prev[item.id], unitPrice: Number(v) || 0 } }))}
                        min={0}
                        style={{ width: 110 }}
                      />
                    </Table.Td>
                    <Table.Td>{(+total).toLocaleString()}</Table.Td>
                    <Table.Td>
                      <Button
                        size="compact-xs"
                        color="green"
                        loading={saving === item.id}
                        disabled={!isDirty}
                        onClick={() => {
                          setSaving(item.id);
                          saveMutation.mutate({ item }, {
                            onSettled: () => setSaving(null),
                          });
                        }}
                      >
                        Save
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}

        {freetextItems.length > 0 && (() => {
          const grandTotal = freetextItems.reduce((sum: number, item: any) => {
            const d = draft[item.id] ?? {};
            return sum + (d.unitPrice ?? item.unitPrice ?? 0) * (item.quantity ?? 1);
          }, 0);
          return (
            <Group justify="flex-end" mt="sm">
              <Text fw={700} size="lg">Grand Total: {grandTotal.toLocaleString()}</Text>
            </Group>
          );
        })()}

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>Close</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function DetailModal({
  orderId, opened, onClose, onStatusChange,
}: {
  orderId: string | null; opened: boolean; onClose: () => void; onStatusChange: () => void;
}) {
  const qc = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['website-order-detail', orderId],
    queryFn: async () => {
      if (!orderId) {return null;}
      const { data } = await rxsoftApi.get(`/website/admin/orders/${orderId}`);
      return data;
    },
    enabled: !!orderId && opened,
  });

  const { data: statusHistory = [] } = useQuery({
    queryKey: ['website-order-status-history', orderId],
    queryFn: async () => {
      if (!orderId) {return [];}
      const { data } = await rxsoftApi.get(`/website/admin/orders/${orderId}/status-history`);
      return data?.data ?? data ?? [];
    },
    enabled: !!orderId && opened,
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async (status: string) => {
      await rxsoftApi.patch(`/website/admin/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      notifications.show({ message: 'Status updated.', color: 'green' });
      qc.invalidateQueries({ queryKey: ['website-order-detail', orderId] });
      onStatusChange();
      setSelectedStatus(null);
    },
    onError: (err: any) => {
      notifications.show({ message: err?.response?.data?.message ?? 'Failed.', color: 'red' });
    },
  });

  const status = order?.orderStatus ?? 'pending';
  const allowed = STATUS_TRANSITIONS[status] ?? [];
  const timelineOrder = ['pending', 'confirmed', 'processing', 'dispatched', 'in_transit', 'delivered'];
  const currentIdx = timelineOrder.indexOf(status);

  return (
    <Modal opened={opened} onClose={onClose} title={`Order ${order?.orderNumber ?? ''}`} size="lg" centered>
      {isLoading ? (
        <Text c="dimmed">Loading...</Text>
      ) : !order ? (
        <Text c="dimmed">Order not found.</Text>
      ) : (
        <Stack>
          <Group>
            <Badge color={STATUS_COLORS[status] ?? 'gray'} size="lg">{statusLabel(status)}</Badge>
          </Group>

          {order.items?.some((i: any) => !i.itemId) && (
            <Badge color="orange" variant="light" size="lg">Contains freetext items — reconcile before posting</Badge>
          )}

          <Timeline active={currentIdx} bulletSize={24} lineWidth={2}>
            {timelineOrder.map((s) => (
              <Timeline.Item key={s} bullet={STATUS_ICONS[s]} title={statusLabel(s)}>
                <Text size="xs" c="dimmed">
                  {s === status ? 'Current status' : s === 'delivered' ? 'Final' : ''}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>

          {statusHistory.length > 0 && (
            <Card withBorder p="sm">
              <Text fw={600} mb="xs">Status History</Text>
              <Table striped withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>From</Table.Th>
                    <Table.Th>To</Table.Th>
                    <Table.Th>When</Table.Th>
                    <Table.Th>By</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {statusHistory.map((h: any) => (
                    <Table.Tr key={h.id}>
                      <Table.Td>{h.fromStatus ? statusLabel(h.fromStatus) : '—'}</Table.Td>
                      <Table.Td><Badge color={STATUS_COLORS[h.toStatus] ?? 'gray'} size="sm">{statusLabel(h.toStatus)}</Badge></Table.Td>
                      <Table.Td>{new Date(h.changedAt).toLocaleString()}</Table.Td>
                      <Table.Td>{h.changedBy ?? '—'}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          )}

          {order.delivery ? (
            <Card withBorder p="sm">
              <Text fw={600} mb="xs">Delivery</Text>
              <Stack gap={4}>
                <Text size="sm"><b>Address:</b> {order.delivery.address}</Text>
                {order.delivery.city && <Text size="sm"><b>City:</b> {order.delivery.city}</Text>}
                {order.delivery.state && <Text size="sm"><b>State:</b> {order.delivery.state}</Text>}
                {order.delivery.phone && <Text size="sm"><b>Phone:</b> {order.delivery.phone}</Text>}
                {order.delivery.shippingMethod && <Text size="sm"><b>Shipping:</b> {order.delivery.shippingMethod}</Text>}
              </Stack>
            </Card>
          ) : null}

          {order.notes && (
            <Card withBorder p="sm">
              <Text size="sm"><b>Notes:</b> {order.notes}</Text>
            </Card>
          )}

          {order.sale && (
            <Card withBorder p="sm">
              <Text fw={600} mb="xs">Linked Sale</Text>
              <Stack gap={4}>
                <Text size="sm"><b>Sale #:</b> {order.sale.saleNumber}</Text>
                <Text size="sm"><b>Status:</b> <Badge color={order.sale.status === 'posted' ? 'green' : 'yellow'} size="sm">{order.sale.status}</Badge></Text>
              </Stack>
            </Card>
          )}

          {order.items?.length > 0 && (
            <Card withBorder p="sm">
              <Text fw={600} mb="xs">Items</Text>
              <Table striped withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>#</Table.Th>
                    <Table.Th>Item</Table.Th>
                    <Table.Th>Qty</Table.Th>
                    <Table.Th>Price</Table.Th>
                    <Table.Th>Total</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {order.items.map((l: any, i: number) => (
                    <Table.Tr key={l.id}>
                      <Table.Td>{i + 1}</Table.Td>
                      <Table.Td>
                        {[l.freetextName, l.genericItemCode, l.itemId].filter(Boolean).join(' · ')}
                      </Table.Td>
                      <Table.Td>{l.quantity}</Table.Td>
                      <Table.Td>{(+l.unitPrice).toLocaleString()}</Table.Td>
                      <Table.Td>{(+l.unitPrice * +l.quantity).toLocaleString()}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          )}

          {allowed.length > 0 && (
            <Group>
              <Select
                label="Update Status"
                placeholder="Select status"
                value={selectedStatus}
                onChange={(v) => {
                  setSelectedStatus(v);
                  if (v) {statusUpdateMutation.mutate(v);}
                }}
                data={allowed.map((s) => ({ value: s, label: statusLabel(s) }))}
                style={{ width: 220 }}
              />
            </Group>
          )}
        </Stack>
      )}
    </Modal>
  );
}
