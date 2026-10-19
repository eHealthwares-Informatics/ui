import { Badge, Button, Card, Group, Select, Stack, Table, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { RxPage } from '../../../components/page/rx-page';
import { CancelReasonModal } from './components/cancel-reason-modal';
import { CascadeCancelModal } from './components/cascade-cancel-modal';
import { OrderProgress } from './components/order-progress';
import { STATUS_COLORS, STATUS_TRANSITIONS, statusLabel } from './status';

/**
 * Website order detail — a full sub-page (breadcrumb back to the list) rather
 * than a modal, with a left→right fulfilment progress and item NAMES.
 */
export function RxWebsiteOrderDetailPage({ orderId }: { orderId: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [cascadeOrder, setCascadeOrder] = useState<any>(null);
  const [pendingReason, setPendingReason] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['website-order-detail', orderId],
    queryFn: async () => {
      const { data } = await rxsoftApi.get(`/website/admin/orders/${orderId}`);
      return data;
    },
    enabled: !!orderId,
  });

  const { data: statusHistory = [] } = useQuery({
    queryKey: ['website-order-status-history', orderId],
    queryFn: async () => {
      const { data } = await rxsoftApi.get(`/website/admin/orders/${orderId}/status-history`);
      return data?.data ?? data ?? [];
    },
    enabled: !!orderId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['website-order-detail', orderId] });
    qc.invalidateQueries({ queryKey: ['website-order-status-history', orderId] });
    qc.invalidateQueries({ queryKey: ['rxsoft-data-page'] });
    qc.invalidateQueries({ queryKey: ['website-orders'] });
  };

  const statusUpdateMutation = useMutation({
    mutationFn: async ({
      status,
      reason,
      cascadeCancelChildren,
    }: {
      status: string;
      reason?: string;
      cascadeCancelChildren?: boolean;
    }) => {
      const { data } = await rxsoftApi.patch(`/website/admin/orders/${orderId}/status`, {
        status,
        reason: reason || undefined,
        cascadeCancelChildren: cascadeCancelChildren || undefined,
      });
      return data;
    },
    onSuccess: (data: any) => {
      notifications.show({ message: 'Status updated.', color: 'green' });
      if (Array.isArray(data?.cancelledChildren) && data.cancelledChildren.length > 0) {
        notifications.show({
          message: `Also cancelled child order(s): ${data.cancelledChildren.join(', ')}`,
          color: 'orange',
        });
      }
      setSelectedStatus(null);
      setReasonOpen(false);
      setPendingReason('');
      invalidate();
    },
    onError: (err: any) => {
      notifications.show({ message: getApiErrorMessage(err), color: 'red' });
    },
  });

  // Customer (Party) contact details. Guest orders have no linked customer —
  // saving creates one and links it to the order (server keeps the delivery
  // phone in step so notifications/payment links use the corrected number).
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const customerName0 = order?.customer?.name ?? '';
  const customerPhone0 = order?.customer?.phone ?? '';
  const customerEmail0 = order?.customer?.email ?? '';

  useEffect(() => {
    setCustomerName(customerName0);
    setCustomerPhone(customerPhone0);
    setCustomerEmail(customerEmail0);
  }, [order?.customer?.id, customerName0, customerPhone0, customerEmail0]);

  const customerDirty =
    customerName.trim() !== customerName0.trim() ||
    customerPhone.trim() !== customerPhone0.trim() ||
    customerEmail.trim() !== customerEmail0.trim();

  const customerSaveMutation = useMutation({
    mutationFn: async () => {
      const patch: Record<string, string | null> = {};
      const name = customerName.trim();
      const phone = customerPhone.trim();
      const email = customerEmail.trim();
      if (name !== customerName0.trim()) patch.name = name;
      if (phone !== customerPhone0.trim()) patch.phone = phone || null;
      if (email !== customerEmail0.trim()) patch.email = email || null;
      await rxsoftApi.patch(`/website/admin/orders/${orderId}/customer`, patch);
    },
    onSuccess: () => {
      notifications.show({
        message: order?.customer ? 'Customer updated.' : 'Customer created and linked.',
        color: 'green',
      });
      invalidate();
    },
    onError: (err: any) => {
      notifications.show({ message: getApiErrorMessage(err), color: 'red' });
    },
  });

  const status = order?.orderStatus ?? 'pending';
  const allowed = STATUS_TRANSITIONS[status] ?? [];
  const cancellableChildren = (order?.childOrders ?? []).filter(
    (c: any) =>
      (c.orderStatus === 'pending' || c.orderStatus === 'confirmed') &&
      (c.items ?? []).some((i: any) => !i.itemId)
  );

  function requestStatus(next: string) {
    if (next === 'cancelled') {
      setSelectedStatus(null);
      setReasonOpen(true);
      return;
    }
    setSelectedStatus(next);
    statusUpdateMutation.mutate({ status: next });
  }

  function confirmCancel(reason: string) {
    setPendingReason(reason);
    setReasonOpen(false);
    if (cancellableChildren.length > 0) {
      setCascadeOrder(order);
      return;
    }
    statusUpdateMutation.mutate({ status: 'cancelled', reason });
  }

  function confirmCascade(cascade: boolean) {
    setCascadeOrder(null);
    statusUpdateMutation.mutate({
      status: 'cancelled',
      reason: pendingReason,
      cascadeCancelChildren: cascade,
    });
  }

  if (isLoading) {
    return (
      <RxPage
        title="Order"
        breadcrumbs={[
          { label: 'Website Orders', href: '/rxsoft/website-orders' },
          { label: orderId },
        ]}
      >
        <Text c="dimmed">Loading...</Text>
      </RxPage>
    );
  }

  if (!order) {
    return (
      <RxPage
        title="Order"
        breadcrumbs={[
          { label: 'Website Orders', href: '/rxsoft/website-orders' },
          { label: orderId },
        ]}
      >
        <Text c="dimmed">Order not found.</Text>
      </RxPage>
    );
  }

  return (
    <RxPage
      title={`Order ${order.orderNumber}`}
      description="Fulfilment status, line items and delivery details."
      breadcrumbs={[
        { label: 'Website Orders', href: '/rxsoft/website-orders' },
        { label: order.orderNumber },
      ]}
      onBack={() => navigate({ to: '/rxsoft/website-orders' })}
      actions={
        <Group gap="xs">
          <Badge
            color={STATUS_COLORS[status] ?? 'gray'}
            size="lg"
            data-testid="order-detail-status"
          >
            {statusLabel(status)}
          </Badge>
          {order.paymentIntent === 'receivable' && (
            <Badge color="orange" variant="light" size="lg">
              Receivable
            </Badge>
          )}
        </Group>
      }
    >
      <Stack>
        {/* Parent ↔ child linkage */}
        {Boolean(order.parentOrderId || order.childOrders?.length) && (
          <Group gap="xs">
            {order.parentOrderId && (
              <Link to="/rxsoft/website-orders/$orderId" params={{ orderId: order.parentOrderId }}>
                <Text size="sm" td="underline">
                  ↑ Parent:{' '}
                  {order.parentOrderNumber ?? order.parent?.orderNumber ?? order.parentOrderId}
                </Text>
              </Link>
            )}
            {(order.childOrders ?? []).map((c: any) => (
              <Link key={c.id} to="/rxsoft/website-orders/$orderId" params={{ orderId: c.id }}>
                <Text size="sm" td="underline">
                  ↓ {c.orderNumber} · {statusLabel(c.orderStatus)}
                  {c.unreconciledItems > 0 ? ` · ${c.unreconciledItems} to reconcile` : ''}
                </Text>
              </Link>
            ))}
          </Group>
        )}

        <Card withBorder p="md">
          <OrderProgress status={status} />
        </Card>

        {allowed.length > 0 && (
          <Group>
            <Select
              label="Update Status"
              placeholder="Select status"
              data-testid="order-detail-status-select"
              value={selectedStatus}
              onChange={(v) => v && requestStatus(v)}
              data={allowed.map((s) => ({ value: s, label: statusLabel(s) }))}
              style={{ width: 220 }}
            />
          </Group>
        )}

        {statusHistory.length > 0 && (
          <Card withBorder p="sm">
            <Text fw={600} mb="xs">
              Status History
            </Text>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>From</Table.Th>
                  <Table.Th>To</Table.Th>
                  <Table.Th>Reason</Table.Th>
                  <Table.Th>When</Table.Th>
                  <Table.Th>By</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {statusHistory.map((h: any) => (
                  <Table.Tr key={h.id}>
                    <Table.Td>{h.fromStatus ? statusLabel(h.fromStatus) : '—'}</Table.Td>
                    <Table.Td>
                      <Badge color={STATUS_COLORS[h.toStatus] ?? 'gray'} size="sm">
                        {statusLabel(h.toStatus)}
                      </Badge>
                    </Table.Td>
                    <Table.Td data-testid="status-history-reason">{h.reason ?? '—'}</Table.Td>
                    <Table.Td>{new Date(h.changedAt).toLocaleString()}</Table.Td>
                    <Table.Td>{h.changedBy ?? '—'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        )}

        <Card withBorder p="sm" data-testid="order-detail-customer">
          <Group justify="space-between" mb="xs">
            <Text fw={600}>Customer</Text>
            {order.customer ? (
              <Badge variant="light" color={order.customer.userId ? 'green' : 'gray'} size="sm">
                {order.customer.userId ? 'Registered' : 'Customer record'}
              </Badge>
            ) : (
              <Badge variant="light" color="orange" size="sm">
                Guest checkout
              </Badge>
            )}
          </Group>
          <Stack gap="xs">
            {!order.customer && (
              <Text size="xs" c="dimmed">
                No customer is linked to this order. Saving creates a customer from the details
                below and links it to the order.
              </Text>
            )}
            <TextInput
              label="Name"
              size="xs"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.currentTarget.value)}
            />
            <TextInput
              label="Phone"
              size="xs"
              placeholder={
                order.delivery?.phone ? `Delivery: ${order.delivery.phone}` : 'Add a phone number'
              }
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.currentTarget.value)}
            />
            <TextInput
              label="Email"
              size="xs"
              placeholder="Add an email address"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.currentTarget.value)}
            />
            <Group justify="flex-end">
              <Button
                size="compact-sm"
                color="green"
                loading={customerSaveMutation.isPending}
                disabled={!customerDirty}
                onClick={() => customerSaveMutation.mutate()}
              >
                {order.customer ? 'Save customer' : 'Create customer'}
              </Button>
            </Group>
          </Stack>
        </Card>

        {order.delivery ? (
          <Card withBorder p="sm">
            <Text fw={600} mb="xs">
              Delivery
            </Text>
            <Stack gap={4}>
              <Text size="sm">
                <b>Address:</b> {order.delivery.address}
              </Text>
              {order.delivery.city && (
                <Text size="sm">
                  <b>City:</b> {order.delivery.city}
                </Text>
              )}
              {order.delivery.phone && (
                <Text size="sm">
                  <b>Phone:</b> {order.delivery.phone}
                </Text>
              )}
            </Stack>
          </Card>
        ) : null}

        {order.notes && (
          <Card withBorder p="sm">
            <Text size="sm">
              <b>Notes:</b> {order.notes}
            </Text>
          </Card>
        )}

        {order.sale && (
          <Card withBorder p="sm">
            <Text fw={600} mb="xs">
              Linked Sale
            </Text>
            <Text size="sm">
              <b>Sale #:</b> {order.sale.saleNumber}
            </Text>
          </Card>
        )}

        {order.items?.length > 0 && (
          <Card withBorder p="sm" data-testid="order-detail-items">
            <Text fw={600} mb="xs">
              Items
            </Text>
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
                      {l.item?.name ?? l.freetextName ?? l.genericItemCode ?? l.itemId ?? '—'}
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

        <Group justify="flex-end">
          <Button variant="light" onClick={() => navigate({ to: '/rxsoft/website-orders' })}>
            Back to orders
          </Button>
        </Group>
      </Stack>

      <CancelReasonModal
        opened={reasonOpen}
        onClose={() => setReasonOpen(false)}
        onConfirm={confirmCancel}
        loading={statusUpdateMutation.isPending}
      />
      <CascadeCancelModal
        order={cascadeOrder}
        cancellableChildren={cancellableChildren}
        onConfirm={confirmCascade}
        onCancel={() => setCascadeOrder(null)}
      />
    </RxPage>
  );
}
