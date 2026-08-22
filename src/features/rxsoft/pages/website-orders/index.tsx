import {
  Badge, Button, Card, Group, Modal, Select, Stack, Table, Text, Timeline, ActionIcon, Tooltip, TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ShoppingCart, CircleCheck, CircleX, Truck, MapPin, PackageSearch, AlertTriangle, Search } from 'lucide-react';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { RxPage } from '../../../components/page/rx-page';

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
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // Post as Sale state
  const [postSaleOpen, setPostSaleOpen] = useState(false);
  const [postSaleOrderId, setPostSaleOrderId] = useState<string | null>(null);
  const [stockLocationId, setStockLocationId] = useState<string | null>(null);
  const [postOrgId, setPostOrgId] = useState<string | null>(null);

  // Reconciliation state
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [reconcileOrder, setReconcileOrder] = useState<any>(null);

  const limit = 20;

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['website-orders', page, statusFilter],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (statusFilter) {params.status = statusFilter;}
      const { data } = await rxsoftApi.get('/website/admin/orders', { params });
      return data;
    },
  });

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

  const orders: any[] = ordersData?.data ?? [];
  const total = ordersData?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await rxsoftApi.patch(`/website/admin/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      notifications.show({ message: 'Status updated.', color: 'green' });
      qc.invalidateQueries({ queryKey: ['website-orders'] });
      qc.invalidateQueries({ queryKey: ['website-order-detail'] });
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
      qc.invalidateQueries({ queryKey: ['website-orders'] });
      qc.invalidateQueries({ queryKey: ['website-order-detail'] });
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

  return (
    <RxPage title="Website Orders" description="Manage and fulfill orders placed via the website.">
      <Stack gap="md">
        <Card withBorder p="md">
          <Group mb="sm">
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              data={[
                { value: '', label: 'All' },
                ...Object.keys(STATUS_COLORS).map((s) => ({ value: s, label: statusLabel(s) })),
              ]}
              clearable
              style={{ width: 220 }}
            />
          </Group>

          {isLoading ? (
            <Text c="dimmed" size="sm">Loading...</Text>
          ) : orders.length === 0 ? (
            <Text c="dimmed" size="sm">No orders found.</Text>
          ) : (
            <>
              <Table striped withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Order #</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Items</Table.Th>
                    <Table.Th>Freetext</Table.Th>
                    <Table.Th>Total</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Location</Table.Th>
                    <Table.Th>Sale</Table.Th>
                    <Table.Th w={220}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {orders.map((o: any) => {
                    const hasFreetext = o.items?.some((i: any) => !i.itemId);
                    return (
                      <Table.Tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(o)}>
                        <Table.Td>{o.orderNumber}</Table.Td>
                        <Table.Td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-'}</Table.Td>
                        <Table.Td>{o.items?.length ?? 0}</Table.Td>
                        <Table.Td>
                          {hasFreetext ? (
                            <Tooltip label="Contains freetext items — click to reconcile">
                              <ActionIcon
                                color="orange"
                                variant="light"
                                onClick={(e) => { e.stopPropagation(); openReconcile(o); }}
                              >
                                <AlertTriangle size={16} />
                              </ActionIcon>
                            </Tooltip>
                          ) : (
                            <Text size="sm" c="dimmed">—</Text>
                          )}
                        </Table.Td>
                        <Table.Td>{(+o.totalAmount).toLocaleString()}</Table.Td>
                        <Table.Td>
                          <Badge color={STATUS_COLORS[o.orderStatus ?? 'pending'] ?? 'gray'}>
                            {statusLabel(o.orderStatus ?? 'pending')}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {o.sale?.stockLocationId ? (
                            <Badge color="blue" variant="light" size="sm">
                              {o.sale.stockLocationId.slice(0, 8)}...
                            </Badge>
                          ) : (
                            <Text size="sm" c="dimmed">—</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          {o.saleId ? (
                            <Badge color="green" variant="light" size="sm">Posted</Badge>
                          ) : (
                            <Badge color="gray" variant="light" size="sm">—</Badge>
                          )}
                        </Table.Td>
                        <Table.Td onClick={(e) => e.stopPropagation()}>
                          <Group gap="xs">
                            {o.orderStatus === 'confirmed' && !o.saleId ? (
                              <Button
                                size="compact-xs" variant="filled" color="green"
                                onClick={() => {
                                  setPostSaleOrderId(o.id);
                                  setStockLocationId(null);
                                  setPostOrgId(o.organizationId ?? null);
                                  setPostSaleOpen(true);
                                }}
                              >
                                Post as Sale
                              </Button>
                            ) : null}
                            {(STATUS_TRANSITIONS[o.orderStatus ?? 'pending']?.length ?? 0) > 0 ? (
                              <Select
                                size="xs"
                                placeholder="Change"
                                data={STATUS_TRANSITIONS[o.orderStatus ?? 'pending']?.map((s) => ({
                                  value: s, label: statusLabel(s),
                                })) ?? []}
                                onChange={(v) => v && statusUpdateMutation.mutate({ id: o.id, status: v })}
                                clearable
                                style={{ width: 110 }}
                              />
                            ) : (
                              <Text size="xs" c="dimmed">No transitions</Text>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>

              {totalPages > 1 && (
                <Group justify="center" mt="md">
                  <Button variant="light" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Text size="sm">
                    Page {page} of {totalPages}
                  </Text>
                  <Button variant="light" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </Group>
              )}
            </>
          )}
        </Card>
      </Stack>

      {/* Post as Sale Modal */}
      <Modal opened={postSaleOpen} onClose={() => { setPostSaleOpen(false); setStockLocationId(null); setPostOrgId(null); }} title="Post Order as Sale" centered>
        <Stack>
          <Text size="sm" c="dimmed">This will create a draft sale record from this order. Stock won't be depleted until the sale is completed.</Text>
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
            <Button
              onClick={() => postSaleMutation.mutate()}
              loading={postSaleMutation.isPending}
            >
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
          qc.invalidateQueries({ queryKey: ['website-orders'] });
          qc.invalidateQueries({ queryKey: ['website-order-detail'] });
        }}
        organizations={Array.isArray(organizations) ? organizations : []}
      />

      <DetailModal
        orderId={selectedOrder?.id}
        opened={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedOrder(null); }}
        onStatusChange={() => qc.invalidateQueries({ queryKey: ['website-orders'] })}
      />
    </RxPage>
  );
}

function ReconcileModal({
  order, opened, onClose, onReconciled, organizations = [],
}: {
  order: any; opened: boolean; onClose: () => void; onReconciled: () => void; organizations?: any[];
}) {
  const qc = useQueryClient();
  const [itemSelections, setItemSelections] = useState<Record<string, string>>({});
  const [itemSearch, setItemSearch] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);

  const { data: searchResults = [] } = useQuery({
    queryKey: ['items-search', itemSearch],
    queryFn: async () => {
      if (!itemSearch || itemSearch.length < 2) return [];
      const { data } = await rxsoftApi.get('/items', { params: { search: itemSearch, page: 1, limit: 20 } });
      return data?.data ?? [];
    },
    enabled: itemSearch.length >= 2,
  });

  const freetextItems = order?.items?.filter((i: any) => !i.itemId) ?? [];

  const reconcileMutation = useMutation({
    mutationFn: async ({ orderItemId, itemId }: { orderItemId: string; itemId: string }) => {
      await rxsoftApi.post(`/orders/admin/orders/${order.id}/items/${orderItemId}/reconcile`, {
        itemId,
        organizationId: orgId || undefined,
      });
    },
    onSuccess: () => {
      notifications.show({ message: 'Item reconciled.', color: 'green' });
      qc.invalidateQueries({ queryKey: ['website-orders'] });
      qc.invalidateQueries({ queryKey: ['website-order-detail'] });
      onReconciled();
    },
    onError: (err: any) => {
      notifications.show({ message: err?.response?.data?.message ?? 'Reconciliation failed.', color: 'red' });
    },
  });

  const reconcileAllMutation = useMutation({
    mutationFn: async () => {
      const itemIds = freetextItems.reduce((acc: Record<string, string>, item: any) => {
        if (itemSelections[item.id]) acc[item.id] = itemSelections[item.id];
        return acc;
      }, {});
      if (!Object.keys(itemIds).length) throw new Error('No items selected');

      await rxsoftApi.post(`/orders/admin/orders/${order.id}/reconcile-all`, {
        itemIds,
        organizationId: orgId || undefined,
      });
    },
    onSuccess: () => {
      notifications.show({ message: 'All items reconciled.', color: 'green' });
      qc.invalidateQueries({ queryKey: ['website-orders'] });
      qc.invalidateQueries({ queryKey: ['website-order-detail'] });
      onReconciled();
      setItemSelections({});
    },
    onError: (err: any) => {
      notifications.show({ message: err?.response?.data?.message ?? 'Bulk reconciliation failed.', color: 'red' });
    },
  });

  const allSelected = freetextItems.every((i: any) => itemSelections[i.id]);

  return (
    <Modal opened={opened} onClose={onClose} title={`Reconcile Freetext Items — ${order?.orderNumber ?? ''}`} size="xl" centered>
      <Stack>
        <Text size="sm" c="dimmed">
          Link freetext items to real products. Each item must be linked before the order can be posted as a sale.
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

        <TextInput
          placeholder="Search items..."
          value={itemSearch}
          onChange={(e) => setItemSearch(e.currentTarget.value)}
          leftSection={<Search size={14} />}
        />

        {freetextItems.length === 0 ? (
          <Text c="dimmed" size="sm">No freetext items in this order.</Text>
        ) : (
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Freetext Name</Table.Th>
                <Table.Th>Qty</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Link to Item</Table.Th>
                <Table.Th w={80}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {freetextItems.map((item: any) => (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <Text fw={500}>{item.freetextName}</Text>
                  </Table.Td>
                  <Table.Td>{item.quantity}</Table.Td>
                  <Table.Td>{(+item.unitPrice * +item.quantity).toLocaleString()}</Table.Td>
                  <Table.Td>
                    <Select
                      size="xs"
                      placeholder="Select item..."
                      value={itemSelections[item.id] ?? null}
                      onChange={(v) => setItemSelections((prev) => ({ ...prev, [item.id]: v ?? '' }))}
                      data={searchResults.map((r: any) => ({ value: r.id, label: `${r.displayName ?? r.name}${r.code ? ` (${r.code})` : ''}` }))}
                      searchable
                      clearable
                      style={{ minWidth: 220 }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="compact-xs"
                      color="green"
                      disabled={!itemSelections[item.id]}
                      loading={reconcileMutation.isPending}
                      onClick={() => reconcileMutation.mutate({ orderItemId: item.id, itemId: itemSelections[item.id] })}
                    >
                      Link
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>Close</Button>
          <Button
            color="orange"
            disabled={!allSelected || freetextItems.length === 0}
            loading={reconcileAllMutation.isPending}
            onClick={() => reconcileAllMutation.mutate()}
          >
            Link All at Once
          </Button>
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
            <Text fw={600}>Status:</Text>
            <Badge color={STATUS_COLORS[status] ?? 'gray'} size="lg">
              {statusLabel(status)}
            </Badge>
          </Group>

          {order.items?.some((i: any) => !i.itemId) && (
            <Badge color="orange" variant="light" size="lg">
              Contains freetext items — reconcile before posting
            </Badge>
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

          {/* Delivery info */}
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
                {order.sale.stockLocationId && (
                  <Text size="sm"><b>Stock Location:</b> {order.sale.stockLocationId.slice(0, 8)}...</Text>
                )}
              </Stack>
            </Card>
          )}

          {/* Items */}
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
                        {l.freetextName ? (
                          <Text c="orange" size="sm">{l.freetextName}</Text>
                        ) : (
                          l.itemId
                        )}
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

          {/* Status update */}
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
