import { Badge, Box, Container, Group, Paper, Stack, Text, ThemeIcon, Title, Tooltip } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { Package, ChevronRight, AlertTriangle } from 'lucide-react';
import { EmptyOrders } from '../website/empty-states';
import { useOrders } from '../website/hooks';
import { WebsiteLayout, green, ink, muted, line, soft } from '../website/layout';
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

export default function OrdersPage() {
  const { data: orders, isLoading } = useOrders();
  const navigate = useNavigate();

  return (
    <WebsiteLayout>
      <Container size="md" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              My Orders
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              Track and manage your orders.
            </Text>
          </Box>

          {isLoading ? (
            <PageLoader />
          ) : !orders?.length ? (
            <EmptyOrders />
          ) : (
            <Stack gap="sm">
              {orders.map((order) => (
                <Paper
                  key={order.id}
                  radius={20}
                  p="lg"
                  withBorder
                  style={{ borderColor: line, cursor: 'pointer' }}
                  onClick={() => navigate({ to: `/damorex/orders/${order.id}` })}
                >
                  <Group justify="space-between">
                    <Stack gap={4}>
                      <Group gap={8}>
                        <Text fw={900}>{order.orderNumber || `#${order.id.slice(0, 8)}`}</Text>
                        <Badge radius="xl" color={statusColors[order.orderStatus] || 'gray'}>
                          {statusLabel(order.orderStatus)}
                        </Badge>
                        {order.items?.some((i: any) => !i.itemId) ? (
                          <Tooltip label="Contains freetext items — needs reconciliation">
                            <AlertTriangle size={16} color="orange" />
                          </Tooltip>
                        ) : null}
                      </Group>
                      <Text size="sm" c={muted}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Text>
                    </Stack>
                    <ChevronRight size={20} color={muted} />
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
