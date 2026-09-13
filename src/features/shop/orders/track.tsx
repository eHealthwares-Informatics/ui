import { Badge, Box, Container, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { Input, Button } from '@mantine/core';
import { Package, Search, MapPin } from 'lucide-react';
import { useState } from 'react';
import { EmptyOrders } from '../website/empty-states';
import { useTrackOrder } from '../website/hooks';
import { WebsiteLayout, green, ink, muted, line, buttonStyles } from '../website/layout';
import { PageLoader } from '../website/loaders';

export default function TrackOrderPage() {
  const [code, setCode] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const { data: order, isLoading } = useTrackOrder(searchCode);

  const handleSearch = () => setSearchCode(code);

  return (
    <WebsiteLayout>
      <Container size="sm" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              Track Order
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              Enter your tracking code to see real-time delivery updates.
            </Text>
          </Box>

          <Paper radius={24} p="lg" withBorder style={{ borderColor: line }}>
            <Group>
              <Input
                placeholder="Enter tracking code"
                radius="xl"
                size="lg"
                value={code}
                onChange={(e) => setCode(e.currentTarget.value)}
                style={{ flex: 1 }}
                leftSection={<Search size={18} />}
                styles={{ input: { borderColor: '#CFE5D7' } }}
              />
              <Button
                radius="xl"
                size="lg"
                styles={buttonStyles}
                style={{ background: green }}
                onClick={handleSearch}
                loading={isLoading}
              >
                Track
              </Button>
            </Group>
          </Paper>

          {isLoading ? (
            <PageLoader />
          ) : searchCode && order ? (
            <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={900} size="lg">
                    Order {order.orderNumber || `#${order.id.slice(0, 8)}`}
                  </Text>
                  <Badge size="lg" radius="xl" color={
                    order.orderStatus === 'delivered' ? 'green' : order.orderStatus === 'cancelled' ? 'red' : 'yellow'
                  }>
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1).replace(/_/g, ' ')}
                  </Badge>
                </Group>
                {order.delivery?.address ? (
                  <Group gap={8}>
                    <MapPin size={18} color={green} />
                    <Text c={muted}>{order.delivery.address}</Text>
                  </Group>
                ) : null}
                <Text size="sm" c={muted}>
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </Text>
              </Stack>
            </Paper>
          ) : searchCode && !isLoading ? (
            <EmptyOrders
              title="Order not found"
              message="Check your tracking code and try again."
            />
          ) : null}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
