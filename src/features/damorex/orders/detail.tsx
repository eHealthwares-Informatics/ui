import {
  Badge,
  Box,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Timeline,
} from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { Package, MapPin, CreditCard, Truck, Check } from 'lucide-react';
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

export default function OrderDetailPage() {
  const { id } = useParams({ from: '/damorex/orders_/$id' });
  const { data: order, isLoading } = useOrder(id);

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
              <Timeline active={3} bulletSize={24} lineWidth={2}>
                <Timeline.Item bullet={<Package size={12} />} title="Order Placed">
                  <Text size="sm" c={muted}>
                    {new Date(order.createdAt).toLocaleString()}
                  </Text>
                </Timeline.Item>
                <Timeline.Item bullet={<Check size={12} />} title="Confirmed" />
                <Timeline.Item bullet={<Truck size={12} />} title="Processing" />
                <Timeline.Item bullet={<MapPin size={12} />} title="Dispatched" />
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
                        {item.freetextName ?? (item.itemId ? `Product #${item.itemId.slice(0, 8)}` : 'Item')}
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
