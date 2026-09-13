import { Box, Container, Grid, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { Package, FileText, Star, MessageCircle, Heart } from 'lucide-react';
import { useOrders, usePrescriptions, useConsultations, useRewards } from '../website/hooks';
import { WebsiteLayout, green, ink, muted, line, soft } from '../website/layout';
import { PageLoader } from '../website/loaders';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: prescriptions, isLoading: prescriptionsLoading } = usePrescriptions();
  const { data: consultations, isLoading: consultationsLoading } = useConsultations();
  const { data: rewards, isLoading: rewardsLoading } = useRewards();

  const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const activeOrders =
    orders?.filter((o) => !['delivered', 'cancelled'].includes(o.orderStatus))?.length || 0;
  const pendingPrescriptions = prescriptions?.filter((p) => p.status === 'Pending')?.length || 0;

  if (ordersLoading || prescriptionsLoading || consultationsLoading || rewardsLoading) {
    return (
      <WebsiteLayout>
        <PageLoader />
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Title order={1} className="damorex-heading" style={{ color: ink }}>
            My Dashboard
          </Title>

          <Grid>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <Paper
                className="lift-card"
                radius={24}
                p="lg"
                withBorder
                style={{ borderColor: line, cursor: 'pointer' }}
                onClick={() => navigate({ to: '/shop/orders' })}
              >
                <Stack align="center" gap="sm">
                  <ThemeIcon radius="xl" size={48} color="green" variant="light">
                    <Package size={24} />
                  </ThemeIcon>
                  <Text fw={950} size="xl">
                    {activeOrders}
                  </Text>
                  <Text size="sm" c={muted}>
                    Active Orders
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <Paper
                className="lift-card"
                radius={24}
                p="lg"
                withBorder
                style={{ borderColor: line, cursor: 'pointer' }}
                onClick={() => navigate({ to: '/shop/my-prescriptions' })}
              >
                <Stack align="center" gap="sm">
                  <ThemeIcon radius="xl" size={48} color="green" variant="light">
                    <FileText size={24} />
                  </ThemeIcon>
                  <Text fw={950} size="xl">
                    {pendingPrescriptions}
                  </Text>
                  <Text size="sm" c={muted}>
                    Pending Rx
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <Paper
                className="lift-card"
                radius={24}
                p="lg"
                withBorder
                style={{ borderColor: line, cursor: 'pointer' }}
                onClick={() => navigate({ to: '/shop/consultations' })}
              >
                <Stack align="center" gap="sm">
                  <ThemeIcon radius="xl" size={48} color="green" variant="light">
                    <MessageCircle size={24} />
                  </ThemeIcon>
                  <Text fw={950} size="xl">
                    {consultations?.length || 0}
                  </Text>
                  <Text size="sm" c={muted}>
                    Consultations
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <Paper
                className="lift-card"
                radius={24}
                p="lg"
                withBorder
                style={{ borderColor: line, cursor: 'pointer' }}
                onClick={() => navigate({ to: '/shop/rewards' })}
              >
                <Stack align="center" gap="sm">
                  <ThemeIcon radius="xl" size={48} color="green" variant="light">
                    <Star size={24} />
                  </ThemeIcon>
                  <Text fw={950} size="xl">
                    {rewards?.totalPoints || 0}
                  </Text>
                  <Text size="sm" c={muted}>
                    Reward Points
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
