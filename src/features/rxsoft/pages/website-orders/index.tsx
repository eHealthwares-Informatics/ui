import {
  Badge,
  Button,
  Card,
  CopyButton,
  Group,
  Modal,
  Radio,
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
  Anchor,
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
  ReceiptText,
  CornerDownRight,
  Link2,
  Ban,
  Copy,
} from 'lucide-react';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { DataPageShell } from '../../../components/page/data-page-shell';
import { RxPage } from '../../../components/page/rx-page';
import { websiteOrdersConfig } from './schema';
import { NotificationSettingsButton } from './notification-settings';
import { flattenChildRows } from './order-children';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

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
  // Unreconciled-post options chosen in the "Cannot Post unreconciled Items" warning
  const [postIgnoreUnreconciled, setPostIgnoreUnreconciled] = useState(false);
  const [postCreateChildOrder, setPostCreateChildOrder] = useState(false);
  // Answer to "has payment been made, or should it post as a receivable?"
  const [postPaymentIntent, setPostPaymentIntent] = useState<'paid' | 'receivable'>('paid');
  // Post-confirmation: invoice + payment balance link
  const [postConfirmOpen, setPostConfirmOpen] = useState(false);
  const [postResult, setPostResult] = useState<{ orderId: string | null; saleNumber: string | null; childOrderNumber: string | null; paymentLinkUrl: string | null } | null>(null);
  const [paymentLinkState, setPaymentLinkState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null);
  const [paymentLinkError, setPaymentLinkError] = useState<string | null>(null);
  const [matchCheckOpen, setMatchCheckOpen] = useState(false);
  const [matchCheckOrder, setMatchCheckOrder] = useState<any>(null);
  const [unmatchedItems, setUnmatchedItems] = useState<any[]>([]);
  // Reconciliation state
  const [reconcileOrder, setReconcileOrder] = useState<any>(null);
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [reconcileVersion, setReconcileVersion] = useState(0);
  // Track orders reconciled client-side so icon disappears immediately
  const [reconciledOrderIds, setReconciledOrderIds] = useState<Set<string>>(new Set());
  // Cancel-cascade prompt: parent order awaiting the "cancel children too?" answer
  const [cascadeCancelOrder, setCascadeCancelOrder] = useState<any>(null);
  // Per-row payment-link action state: `${orderId}:${token}` while a revoke is in flight
  const [linkBusyKey, setLinkBusyKey] = useState<string | null>(null);

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

  /** Patches one order's paymentLink inside every cached orders-list page. */
  function patchRowLinkInCache(orderId: string, link: any) {
    const patchRows = (rows: any[]) =>
      rows.map((r) => (r?.id === orderId ? { ...r, paymentLink: link } : r));
    const updater = (payload: any) => {
      if (Array.isArray(payload)) {return patchRows(payload);}
      if (Array.isArray(payload?.data)) {return { ...payload, data: patchRows(payload.data) };}
      return payload;
    };
    qc.setQueriesData<any>({ queryKey: ['rxsoft-data-page', '/website/admin/orders'] }, updater);
    qc.setQueriesData<any>({ queryKey: ['website-orders'] }, updater);
  }

  /**
   * Fetches the order's current payment link (GET payment-link endpoint) and
   * patches just that row in the cached lists — no full-list refetch.
   */
  async function refreshRowLink(orderId: string): Promise<any | null> {
    try {
      const { data } = await rxsoftApi.get(`/orders/admin/orders/${orderId}/payment-link`);
      patchRowLinkInCache(orderId, data ?? null);
      return data ?? null;
    } catch {
      return null;
    }
  }

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status, cascadeCancelChildren }: { id: string; status: string; cascadeCancelChildren?: boolean }) => {
      const { data } = await rxsoftApi.patch(`/website/admin/orders/${id}/status`, {
        status,
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
      invalidateOrders();
    },
    onError: (err: any) => {
      notifications.show({ message: getApiErrorMessage(err), color: 'red' });
    },
  });

  const postSaleMutation = useMutation({
    mutationFn: async () => {
      const { data } = await rxsoftApi.post(`/website/admin/orders/${postSaleOrderId}/post-sale`, {
        stockLocationId: stockLocationId || undefined,
        organizationId: postOrgId || undefined,
        ignoreUnreconciled: postIgnoreUnreconciled || undefined,
        createChildOrder: postCreateChildOrder || undefined,
        paymentIntent: postPaymentIntent || undefined,
      });
      return data;
    },
    onSuccess: (data: any) => {
      notifications.show({ message: 'Order posted as sale.', color: 'green' });
      invalidateOrders();
      setPostSaleOpen(false);
      setStockLocationId(null);
      setPostOrgId(null);
      setPostIgnoreUnreconciled(false);
      setPostCreateChildOrder(false);
      // Post-confirmation: invoice + payment balance link (useful when the
      // eventual payment doesn't match the order total).
      setPostResult({
        orderId: postSaleOrderId,
        saleNumber: data?.sale?.saleNumber ?? data?.saleNumber ?? null,
        childOrderNumber: data?.childOrderNumber ?? null,
        paymentLinkUrl: data?.paymentLinkUrl ?? null,
      });
      // Receivable posts come back with an auto-generated payment link —
      // show it ready-to-copy immediately; otherwise start idle with a
      // "Generate payment balance link" action.
      if (data?.paymentLinkUrl) {
        setPaymentLinkUrl(data.paymentLinkUrl);
        setPaymentLinkState('ready');
        setPaymentLinkError(null);
      } else {
        setPaymentLinkState('idle');
        setPaymentLinkUrl(null);
        setPaymentLinkError(null);
      }
      setPostConfirmOpen(true);
    },
    onError: (err: any) => {
      notifications.show({ message: getApiErrorMessage(err), color: 'red' });
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
    startPostSale(order, false, false);
  }

  /** Opens the Post-as-Sale modal with the chosen unreconciled-post options. */
  function startPostSale(order: any, ignoreUnreconciled: boolean, createChildOrder: boolean) {
    setPostSaleOrderId(order.id);
    setStockLocationId(null);
    setPostOrgId(order.organizationId ?? null);
    setPostIgnoreUnreconciled(ignoreUnreconciled);
    setPostCreateChildOrder(createChildOrder);
    setPostPaymentIntent('paid');
    setPostSaleOpen(true);
  }

  const cancellableChildrenOf = (row: any): any[] =>
    (row?.childOrders ?? []).filter(
      (c: any) =>
        (c.orderStatus === 'pending' || c.orderStatus === 'confirmed') &&
        (c.items ?? []).some((i: any) => !i.itemId),
    );

  /** Status select hook: intercept parent cancels that would strand children. */
  function handleStatusSelect(row: any, status: string) {
    if (status === 'cancelled' && cancellableChildrenOf(row).length > 0) {
      setCascadeCancelOrder(row);
      return;
    }
    statusUpdateMutation.mutate({ id: row.id, status });
  }

  function confirmCascadeCancel(cascade: boolean) {
    const order = cascadeCancelOrder;
    setCascadeCancelOrder(null);
    if (!order) {return;}
    statusUpdateMutation.mutate({ id: order.id, status: 'cancelled', cascadeCancelChildren: cascade });
  }

  /** Generates an order payment link (customer /shop/pay/:token URL) after posting. */
  async function handleGeneratePaymentLink() {
    if (!postResult?.orderId) {return;}
    setPaymentLinkState('loading');
    setPaymentLinkError(null);
    try {
      const { data } = await rxsoftApi.post('/payment-links', {
        type: 'order_payment',
        orderId: postResult.orderId,
      });
      const url = data?.url ?? (data?.link?.token ? `/shop/pay/${data.link.token}` : null);
      if (!url) {throw new Error('No link URL returned');}
      setPaymentLinkUrl(url);
      setPaymentLinkState('ready');
      // Learn the new link into the cached list row without a full refetch.
      if (postResult.orderId) {await refreshRowLink(postResult.orderId);}
    } catch (err: any) {
      setPaymentLinkError(getApiErrorMessage(err));
      setPaymentLinkState('error');
    }
  }

  const handleGenerateLink = async (order: any) => {
    setLinkBusyKey(`${order.id}:create`);
    try {
      const { data } = await rxsoftApi.post(`/orders/admin/orders/${order.id}/payment-link`);
      if (data?.url) {
        notifications.show({ message: `Payment link created for ${order.orderNumber}`, color: 'green' });
        // Refresh just this row's link instead of refetching the whole list.
        await refreshRowLink(order.id);
      } else {
        notifications.show({ message: 'Could not create a payment link.', color: 'red' });
      }
    } catch (err: any) {
      notifications.show({ message: getApiErrorMessage(err), color: 'red' });
    } finally {
      setLinkBusyKey(null);
    }
  };

  const handleRevokeLink = async (order: any) => {
    const token = order?.paymentLink?.token;
    if (!token) {return;}
    setLinkBusyKey(`${order.id}:revoke`);
    try {
      const { data } = await rxsoftApi.post(`/orders/admin/orders/${order.id}/payment-link/revoke`, { token });
      if (data === true) {
        notifications.show({ message: 'Payment link revoked', color: 'orange' });
        // Refresh just this row's link (flips the row to its revoked badge)
        // instead of refetching the whole list.
        await refreshRowLink(order.id);
      } else {
        notifications.show({ message: 'No active payment link to revoke.', color: 'red' });
      }
    } catch (err: any) {
      notifications.show({ message: getApiErrorMessage(err), color: 'red' });
    } finally {
      setLinkBusyKey(null);
    }
  };

  const config = useMemo(() => {
    const actionsColumn = {
      key: 'actions',
      label: '',
      render: (row: any) => {
        const hasFreetext = !reconciledOrderIds.has(row.id) && row.items?.some((i: any) => !i.itemId && !i.genericItemCode);
        return (
          <Group gap="xs">
            {row.parentOrderId && (
              <Tooltip label={`Child of order ${row.parentOrderNumber ?? row.parentOrderId}`}>
                <Badge color="grape" variant="light" size="sm">child</Badge>
              </Tooltip>
            )}
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
              onChange={(v) => v && handleStatusSelect(row, v)}
              clearable
              style={{ width: 110 }}
            />
          </Group>
        );
      },
    };
    return {
      ...websiteOrdersConfig,
      transformRows: flattenChildRows,
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
        )
        .map((c) =>
          c.key === 'orderNumber'
            ? {
                ...c,
                render: (row: any) =>
                  row._isChildRow ? (
                    <Group gap={6} wrap="nowrap" ml={22}>
                      <CornerDownRight size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                      <Text size="sm" fw={600} c="dark">
                        {row.orderNumber}
                      </Text>
                      <Text size="xs" c="dimmed">{row.items?.length ?? 0} items</Text>
                      {row.items?.some((i: any) => !i.itemId) ? (
                        <Badge color="orange" variant="light" size="xs">unreconciled</Badge>
                      ) : (
                        <Badge color="green" variant="light" size="xs">reconciled</Badge>
                      )}
                    </Group>
                  ) : (
                    <Group gap={6} wrap="nowrap">
                      {row.parentOrderId && <Badge color="grape" variant="light" size="sm">child</Badge>}
                      <Text size="sm" fw={600} c="dark">{row.orderNumber}</Text>
                    </Group>
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
          key: 'paymentLink',
          label: 'Payment link',
          render: (row: any) => {
            const link = row.paymentLink;
            if (row._isChildRow) {return null;}
            if (!link) {
              return row.orderStatus === 'cancelled' ? null : (
                <Tooltip label="Generate a customer payment link (/shop/pay)">
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    color="gray"
                    loading={linkBusyKey === `${row.id}:create`}
                    onClick={() => handleGenerateLink(row)}
                  >
                    + Link
                  </Button>
                </Tooltip>
              );
            }
            const linkAbsolute = `${window.location.origin}${link.url}`;
            const revoked = link.status !== 'active';
            return (
              <Group gap={4} wrap="nowrap">
                <Anchor
                  href={linkAbsolute}
                  target="_blank"
                  size="xs"
                  style={{ fontFamily: 'monospace' }}
                  onClick={(e) => {
                    if (revoked) {e.preventDefault();}
                  }}
                >
                  /shop/pay/{link.token.slice(0, 6)}…
                </Anchor>
                {!revoked && (
                  <CopyButton value={linkAbsolute}>
                    {({ copied, copy }: { copied: boolean; copy: () => void }) => (
                      <Tooltip label={copied ? 'Copied!' : 'Copy link'}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color={copied ? 'teal' : 'blue'}
                          onClick={() => {
                            copy();
                            // Copy stays instant; the row's link state refreshes
                            // in the background (picks up used/revoked flips).
                            void refreshRowLink(row.id);
                          }}
                        >
                          {copied ? <CircleCheck size={14} /> : <Copy size={14} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                )}
                {!revoked ? (
                  <Tooltip label="Revoke link">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      loading={linkBusyKey === `${row.id}:revoke`}
                      onClick={() => handleRevokeLink(row)}
                    >
                      <Ban size={14} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <Badge color={link.status === 'used' ? 'green' : 'gray'} variant="light" size="xs">
                    {link.status}
                  </Badge>
                )}
              </Group>
            );
          },
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
  }, [statusUpdateMutation, reconcileVersion, reconciledOrderIds, linkBusyKey]);  return (
    <RxPage
      title="Website Orders"
      description="Manage and fulfill orders placed via the website."
      actions={<NotificationSettingsButton />}
    >
          
          <DataPageShell
            config={config}
          />
      {/* Post as Sale — unreconciled warning with the 3 post options */}
      <Modal opened={matchCheckOpen} onClose={() => setMatchCheckOpen(false)} title="Cannot Post unreconciled Items" centered>
        <Stack>
          <Alert icon={<AlertTriangle size={16} />} color="orange" title="Some items are unmatched">
            <Text size="sm">
              {unmatchedItems.length} of {matchCheckOrder?.items?.length ?? 0} items are not reconciled to catalog items. Choose how to continue:
            </Text>
            <Stack gap={2} mt="xs">
              {unmatchedItems.map((item) => (
                <Text key={item.id} size="sm">
                  • {[item.freetextName, item.genericItemCode, item.genericDrugCode, item.id].filter(Boolean).join(' · ')}
                  {(item.genericItemCode || item.genericDrugCode) ? ' (generic)' : ''} — qty {item.quantity}
                </Text>
              ))}
            </Stack>
          </Alert>
          <Stack gap="xs">
            <Button
              fullWidth
              variant="light"
              color="orange"
              onClick={() => {
                setMatchCheckOpen(false);
                if (matchCheckOrder) { startPostSale(matchCheckOrder, true, false); }
              }}
            >
              Post reconciled and ignore
            </Button>
            <Button
              fullWidth
              color="orange"
              onClick={() => {
                setMatchCheckOpen(false);
                if (matchCheckOrder) { startPostSale(matchCheckOrder, true, true); }
              }}
            >
              Post reconciled and create child order
            </Button>
            <Button fullWidth variant="subtle" color="gray" onClick={() => setMatchCheckOpen(false)}>
              Cancel
            </Button>
          </Stack>
          <Anchor
            size="xs"
            ta="center"
            onClick={() => {
              setMatchCheckOpen(false);
              if (matchCheckOrder) { openReconcile(matchCheckOrder); }
            }}
          >
            Or match items now before posting
          </Anchor>
        </Stack>
      </Modal>

      {/* Post as Sale Modal */}
      <Modal opened={postSaleOpen} onClose={() => { setPostSaleOpen(false); setStockLocationId(null); setPostOrgId(null); }} title="Post Order as Sale" centered>
        <Stack>
          <Text size="sm" c="dimmed">This will create a draft sale record from this order. Stock won&apos;t be depleted until the sale is completed.</Text>
          {postIgnoreUnreconciled && (
            <Alert icon={<AlertTriangle size={16} />} color="orange">
              <Text size="sm">
                Posting with unreconciled items {postCreateChildOrder ? '— a child order will be created for them.' : '— they will be excluded from the sale.'}
              </Text>
            </Alert>
          )}
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
          <Radio.Group
            label="Payment"
            description="Has the customer paid in full, or should the balance be pursued as a receivable?"
            value={postPaymentIntent}
            onChange={(v) => v && setPostPaymentIntent(v as 'paid' | 'receivable')}
          >
            <Group mt="xs" gap="lg">
              <Radio value="paid" label="Payment made in full" />
              <Radio value="receivable" label="Post as receivable (customer pays later)" />
            </Group>
          </Radio.Group>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { setPostSaleOpen(false); setStockLocationId(null); setPostOrgId(null); }}>Cancel</Button>
            <Button onClick={() => postSaleMutation.mutate()} loading={postSaleMutation.isPending}>
              Confirm & Post Sale
            </Button>
          </Group>
        </Stack>
      </Modal>

      <PostConfirmationModal
        opened={postConfirmOpen}
        onClose={() => setPostConfirmOpen(false)}
        result={postResult}
        linkState={paymentLinkState}
        linkUrl={paymentLinkUrl}
        linkError={paymentLinkError}
        onGenerateLink={handleGeneratePaymentLink}
      />

      <CascadeCancelModal
        order={cascadeCancelOrder}
        cancellableChildren={cancellableChildrenOf(cascadeCancelOrder)}
        onConfirm={confirmCascadeCancel}
        onCancel={() => setCascadeCancelOrder(null)}
      />

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
        onCascadeCancelPrompt={(o) => setCascadeCancelOrder(o)}
        onOpenOrder={(target) => {
          // Breadcrumb navigation: swap the open detail modal to the related
          // order. Invalidate cached detail/history so nothing stale lingers.
          setSelectedOrder({ id: target.id, orderNumber: target.orderNumber });
          qc.invalidateQueries({ queryKey: ['website-order-detail', target.id] });
          qc.invalidateQueries({ queryKey: ['website-order-status-history', target.id] });
        }}
      />
    </RxPage>
  );
}
function CascadeCancelModal({
  order, cancellableChildren, onConfirm, onCancel,
}: {
  order: any;
  cancellableChildren: any[];
  onConfirm: (cascade: boolean) => void;
  onCancel: () => void;
}) {
  if (!order) {return null;}
  return (
    <Modal opened={!!order} onClose={onCancel} title="Cancel child orders too?" centered>
      <Stack>
        <Alert icon={<AlertTriangle size={16} />} color="orange" title="This parent has open child orders">
          <Text size="sm">
            {cancellableChildren.length} child order(s) created for leftover unreconciled items are still open:
          </Text>
          <Stack gap={2} mt="xs">
            {cancellableChildren.map((c: any) => (
              <Text key={c.id} size="sm">
                • {c.orderNumber} — {c.unreconciledItems} of {c.totalItems} item(s) unreconciled
              </Text>
            ))}
          </Stack>
        </Alert>
        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={onCancel}>
            Go back
          </Button>
          <Button variant="light" color="red" onClick={() => onConfirm(false)}>
            Cancel parent only
          </Button>
          <Button color="red" onClick={() => onConfirm(true)}>
            Cancel parent + children
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function PostConfirmationModal({
  opened, onClose, result, linkState, linkUrl, linkError, onGenerateLink,
}: {
  opened: boolean;
  onClose: () => void;
  result: { orderId: string | null; saleNumber: string | null; childOrderNumber: string | null; paymentLinkUrl: string | null } | null;
  linkState: 'idle' | 'loading' | 'ready' | 'error';
  linkUrl: string | null;
  linkError: string | null;
  onGenerateLink: () => void;
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="Order Posted" centered>
      <Stack>
        <Alert icon={<ReceiptText size={18} />} color="blue" title="Send Customer Invoice with Payment Balance link">
          <Text size="sm">
            Send the customer an invoice with a payment balance link — use this if the eventual
            payment doesn&apos;t match the order total.
          </Text>
        </Alert>

        <Stack gap={4}>
          {result?.saleNumber && (
            <Text size="sm"><b>Sale:</b> {result.saleNumber}</Text>
          )}
          {result?.childOrderNumber && (
            <Text size="sm" c="orange">
              <b>Child order created:</b> {result.childOrderNumber} (holds the unreconciled items)
            </Text>
          )}
        </Stack>

        {linkState === 'ready' && linkUrl ? (
          <Group justify="space-between" gap="xs" wrap="nowrap">
            <Text size="sm" style={{ wordBreak: 'break-all' }}>{linkUrl}</Text>
            <CopyButton value={linkUrl}>
              {({ copied, copy }) => (
                <Button size="compact-sm" variant={copied ? 'light' : 'filled'} color={copied ? 'green' : 'blue'} onClick={copy}>
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
              )}
            </CopyButton>
          </Group>
        ) : null}

        {linkState === 'error' && (
          <Text size="sm" c="red">{linkError ?? 'Could not generate a payment link.'}</Text>
        )}

        <Group justify="flex-end" mt="xs">
          {linkState !== 'ready' && (
            <Button variant="light" color="blue" onClick={onGenerateLink} loading={linkState === 'loading'}>
              Generate payment balance link
            </Button>
          )}
          <Button variant="light" onClick={onClose}>Done</Button>
        </Group>
      </Stack>
    </Modal>
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
  // Stock lookup: chosen location + fetched balances for every selected item
  const [locationId, setLocationId] = useState<string | null>(null);
  const { data: modalLocations = [] } = useQuery({
    queryKey: ['stock-locations', 'reconcile', orgId ?? 'default'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/stock-locations', { params: { limit: 200, ...(orgId ? { organizationId: orgId } : {}) } });
      return data?.data ?? data ?? [];
    },
    enabled: opened,
  });

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

  // generic drug search state (NDF/crosswalk generic drugs)
  const [drugSearch, setDrugSearch] = useState('');
  const { data: drugResults = [] } = useQuery({
    queryKey: ['generic-drugs-search', drugSearch],
    queryFn: async () => {
      if (drugSearch.trim().length < 2) { return []; }
      const { data } = await rxsoftApi.get('/generic-drugs', { params: { search: drugSearch, page: 1, limit: 20 } });
      return data?.data ?? [];
    },
    enabled: drugSearch.trim().length >= 2,
  });
  const drugOptions = (Array.isArray(drugResults) ? drugResults : []).map((g: any) => ({
    value: g.code,
    label: `${g.name}${g.code ? ` (${g.code})` : ''}`,
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

  // Stock on hand for every currently-selected item at the chosen location.
  const selectedLinkedIds = freetextItems
    .map((i: any) => draft[i.id]?.itemId ?? i.itemId)
    .filter(Boolean) as string[];
  const { data: stockByItem = {} as Record<string, number | null> } = useQuery({
    queryKey: ['reconcile-stock', orgId ?? 'default', locationId, selectedLinkedIds.join(',')],
    queryFn: async () => {
      if (!locationId || !selectedLinkedIds.length) { return {}; }
      const { data } = await rxsoftApi.get('/inventory/stock-balances', {
        params: { locationId, itemIds: selectedLinkedIds.join(','), limit: 200 },
      });
      const rows: any[] = data?.data ?? data ?? [];
      const acc: Record<string, number> = {};
      rows.forEach((b) => {
        const key = b.itemId ?? b.item?.id;
        if (key) { acc[key] = (acc[key] ?? 0) + Number(b.quantityOnHand ?? 0); }
      });
      const result: Record<string, number | null> = {};
      selectedLinkedIds.forEach((id) => { result[id] = acc[id] ?? 0; });
      return result;
    },
    enabled: !!locationId && selectedLinkedIds.length > 0,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ item }: { item: any }) => {
      const d = draft[item.id] ?? {};
      await rxsoftApi.post(`/orders/admin/orders/${order.id}/items/${item.id}/reconcile`, {
        itemId: d.itemId ?? undefined,
        genericItemCode: d.genericProductId ?? undefined,
        genericDrugCode: d.genericDrugId ?? item.genericDrugCode ?? undefined,
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
      notifications.show({ message: getApiErrorMessage(err), color: 'red' });
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

        <Group grow align="flex-end">
          <Select
            label="Organisation (optional)"
            placeholder="Assign order to an organisation"
            value={orgId}
            onChange={(v) => { setOrgId(v); setLocationId(null); }}
            data={(Array.isArray(organizations) ? organizations : []).map((o: any) => ({ value: o.id, label: o.name }))}
            searchable
            clearable
          />
          <Select
            label="Stock location"
            placeholder="Pick a location to see stock"
            value={locationId}
            onChange={setLocationId}
            data={(Array.isArray(modalLocations) ? modalLocations : []).map((l: any) => ({ value: l.id, label: l.name }))}
            searchable
            clearable
          />
        </Group>

        {freetextItems.length === 0 ? (
          <Text c="dimmed" size="sm">No freetext items in this order.</Text>
        ) : (
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th>Generic Product</Table.Th>
                <Table.Th>Generic Drug</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Qty</Table.Th>
                <Table.Th>Amount (unit)</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Stock</Table.Th>
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
                  (d.genericDrugId ?? null) !== (item.genericDrugCode ?? null) ||
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
                      <Select
                        size="xs"
                        placeholder="Generic drug"
                        data={drugOptions}
                        value={d.genericDrugId ?? item.genericDrugCode ?? null}
                        onChange={(v) => setDraft((prev) => ({ ...prev, [item.id]: { ...prev[item.id], genericDrugId: v } }))}
                        onSearchChange={setDrugSearch}
                        searchable
                        clearable
                        nothingFoundMessage="Type at least 2 characters"
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
                      {(() => {
                        const linkedId = d.itemId ?? item.itemId;
                        if (!linkedId || !locationId) {return <Text size="xs" c="dimmed">—</Text>;}
                        const qty = stockByItem[linkedId];
                        if (qty === undefined || qty === null) {return <Text size="xs" c="dimmed">…</Text>;}
                        const needed = item.quantity ?? 1;
                        return (
                          <Badge color={qty >= needed ? 'green' : 'orange'} variant="light" size="sm">
                            {qty} on hand{qty < needed ? ` (need ${needed})` : ''}
                          </Badge>
                        );
                      })()}
                    </Table.Td>
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
  orderId, opened, onClose, onStatusChange, onCascadeCancelPrompt, onOpenOrder,
}: {
  orderId: string | null; opened: boolean; onClose: () => void; onStatusChange: () => void;
  onCascadeCancelPrompt: (order: any) => void;
  /** Opens another order's detail modal (breadcrumb navigation between related orders). */
  onOpenOrder: (orderLike: { id: string; orderNumber: string }) => void;
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
      notifications.show({ message: getApiErrorMessage(err), color: 'red' });
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
          {/* Parent ↔ child linkage — clickable in both directions. */}
          {Boolean(order.parentOrderId || order.childOrders?.length) && (
            <Group gap="xs">
              {order.parentOrderId && (
                <Anchor
                  size="sm"
                  underline="hover"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenOrder({ id: order.parentOrderId, orderNumber: order.parentOrderNumber ?? order.parent?.orderNumber ?? order.parentOrderId });
                  }}
                >
                  ↑ Parent: {order.parentOrderNumber ?? order.parent?.orderNumber ?? order.parentOrderId}
                </Anchor>
              )}
              {(order.childOrders ?? []).map((c: any) => (
                <Anchor
                  key={c.id}
                  size="sm"
                  underline="hover"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenOrder({ id: c.id, orderNumber: c.orderNumber });
                  }}
                >
                  ↓ {c.orderNumber} · {statusLabel(c.orderStatus)}{c.unreconciledItems > 0 ? ` · ${c.unreconciledItems} to reconcile` : ''}
                </Anchor>
              ))}
            </Group>
          )}

          <Group>
            <Badge color={STATUS_COLORS[status] ?? 'gray'} size="lg">{statusLabel(status)}</Badge>
            {order.parentOrderId && (
              <Badge color="grape" variant="light" size="lg">Child of {order.parentOrderNumber ?? order.parent?.orderNumber ?? order.parentOrderId}</Badge>
            )}
            {order.paymentIntent === 'receivable' && (
              <Badge color="orange" variant="light" size="lg">Receivable</Badge>
            )}
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
                  if (!v) {return;}
                  // Parents with open unreconciled children get the cascade prompt.
                  if (
                    v === 'cancelled' &&
                    (order.childOrders ?? []).some(
                      (c: any) =>
                        (c.orderStatus === 'pending' || c.orderStatus === 'confirmed') &&
                        (c.items ?? []).some((i: any) => !i.itemId),
                    )
                  ) {
                    setSelectedStatus(null);
                    onCascadeCancelPrompt(order);
                    return;
                  }
                  setSelectedStatus(v);
                  statusUpdateMutation.mutate(v);
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
