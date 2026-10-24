import {
  Badge,
  Box,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Timeline,
} from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { Package, MapPin, CreditCard, Truck, Check, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { parseOrderParam } from '../order-query';
import { websiteApi } from '../website/api';
import { EmptyOrders } from '../website/empty-states';
import { useOrder } from '../website/hooks';
import { WebsiteLayout, green, ink, muted, line } from '../website/layout';
import { PageLoader } from '../website/loaders';

const statusColors: Record<string, string> = {
  pending: 'yellow',
  confirmed: 'blue',
  processing: 'violet',
  dispatched: 'orange',
  in_transit: 'cyan',
  delivered: 'green',
  cancelled: 'red',
};

const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

function timelineActive(order: { orderStatus: string; saleId: string | null }): number {
  if (order.orderStatus === 'cancelled') {
    return 1;
  }
  if (order.orderStatus === 'delivered') {
    return 7;
  }
  if (order.orderStatus === 'in_transit') {
    return 6;
  }
  if (order.orderStatus === 'dispatched') {
    return 5;
  }
  if (order.orderStatus === 'processing') {
    return 4;
  }
  if (order.orderStatus === 'confirmed') {
    return 3;
  }
  // pending — payment counts as done once a sale is attached.
  if (order.saleId) {
    return 2;
  }
  return 1;
}

export default function OrderDetailPage() {
  const { id: rawId } = useParams({ from: '/shop/orders_/$id' });
  // The order URL can arrive with the provider query encoded into the id
  // (`<id>%3FpaymentReference%3D…`), so recover both parts.
  const parsed = parseOrderParam(rawId);
  const orderId = parsed.orderId ?? rawId;
  const urlReference =
    typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('paymentReference') ?? undefined)
      : undefined;
  const paymentReference = parsed.paymentReference ?? urlReference;

  const { data: order, isLoading, refetch } = useOrder(orderId);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const confirmPayment = async () => {
    if (!paymentReference) {
      return;
    }
    setConfirming(true);
    setConfirmError(null);
    try {
      // Ask the provider and apply the result; then refresh the order state.
      await websiteApi.verifyPayment(paymentReference);
      await refetch();
    } catch (error) {
      setConfirmError(getApiErrorMessage(error));
    } finally {
      setConfirming(false);
    }
  };

  const awaitingPayment =
    !!order &&
    !order.saleId &&
    order.orderStatus !== 'cancelled' &&
    order.orderStatus !== 'delivered';

  return (
    <WebsiteLayout>
      <Container size="md" py={{ base: 28, md: 48 }}>
        {isLoading ? (
          <PageLoader />
        ) : !order ? (
          <EmptyOrders
            title="Order not found"
            message="We couldn't find an order with that ID. It may have been removed or the link may be incorrect."
          />
        ) : (
          <Stack gap="xl">
            <Box>
              <Group gap="sm">
                <Title order={1} className="damorex-heading" style={{ color: ink }}>
                  Order {order.orderNumber || `#${order.id.slice(0, 8)}`}
                </Title>
                <Badge size="lg" radius="xl" color={statusColors[order.orderStatus] || 'gray'}>
                  {statusLabel(order.orderStatus)}
                </Badge>
              </Group>
              <Text c={muted} size="sm">
                {new Date(order.createdAt).toLocaleDateString()}
              </Text>
            </Box>

            {awaitingPayment && paymentReference && (
              <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
                <Group justify="space-between" wrap="wrap" gap="sm">
                  <Stack gap={2}>
                    <Text fw={800}>Already paid?</Text>
                    <Text size="sm" c={muted}>
                      Re-check the payment provider for this order.
                    </Text>
                    {confirmError && (
                      <Text size="sm" c="red">
                        {confirmError}
                      </Text>
                    )}
                  </Stack>
                  <Button
                    radius="xl"
                    color="green"
                    leftSection={<RefreshCw size={18} />}
                    loading={confirming}
                    onClick={() => void confirmPayment()}
                    data-testid="order-confirm-payment"
                  >
                    Confirm payment status
                  </Button>
                </Group>
              </Paper>
            )}

            <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
              <Title order={3} className="damorex-heading" mb="md">
                Delivery Details
              </Title>
              <Stack gap="sm">
                {order.delivery ? (
                  <Group gap={8}>
                    <MapPin size={18} color={green} />
                    <Text>
                      {order.delivery.address}
                      {order.delivery.city ? `, ${order.delivery.city}` : ''}
                      {order.delivery.state ? `, ${order.delivery.state}` : ''}
                    </Text>
                  </Group>
                ) : null}
                {order.paymentMethod ? (
                  <Group gap={8}>
                    <CreditCard size={18} color={green} />
                    <Text>{order.paymentMethod}</Text>
                  </Group>
                ) : null}
              </Stack>
            </Paper>

            <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
              <Title order={3} className="damorex-heading" mb="md">
                Order Timeline
              </Title>
              <Timeline active={timelineActive(order)} bulletSize={24} lineWidth={2}>
                <Timeline.Item bullet={<Package size={12} />} title="Order Placed">
                  <Text size="sm" c={muted}>
                    {new Date(order.createdAt).toLocaleString()}
                  </Text>
                </Timeline.Item>
                <Timeline.Item bullet={<CreditCard size={12} />} title="Payment">
                  <Text size="sm" c={muted}>
                    {order.saleId
                      ? `Paid via ${order.paymentMethod || 'online payment'}`
                      : 'Awaiting payment'}
                  </Text>
                </Timeline.Item>
                <Timeline.Item bullet={<Check size={12} />} title="Confirmed" />
                <Timeline.Item bullet={<Truck size={12} />} title="Processing" />
                <Timeline.Item bullet={<MapPin size={12} />} title="Dispatched" />
                <Timeline.Item bullet={<Truck size={12} />} title="In Transit" />
                <Timeline.Item bullet={<Check size={12} />} title="Delivered" />
              </Timeline>
            </Paper>

            {order.items?.length ? (
              <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
                <Title order={3} className="damorex-heading" mb="md">
                  Items
                </Title>
                <Stack gap="sm">
                  {order.items.map((item, i) => (
                    <Group key={item.id || i} justify="space-between">
                      <Text>
                        {item.freetextName ??
                          (item.itemId ? `Product #${item.itemId.slice(0, 8)}` : 'Item')}
                      </Text>
                      <Group gap="md">
                        <Text c={muted}>x{item.quantity}</Text>
                        <Text fw={800}>₦{item.unitPrice?.toLocaleString() || 0}</Text>
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        )}
      </Container>
    </WebsiteLayout>
  );
}
