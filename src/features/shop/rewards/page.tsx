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
} from '@mantine/core';
import { Button } from '@mantine/core';
import { Star, Gift, Users, Ticket } from 'lucide-react';
import { EmptyRewards } from '../website/empty-states';
import { useRewards } from '../website/hooks';
import {
  WebsiteLayout,
  green,
  darkGreen,
  ink,
  muted,
  line,
  soft,
  buttonStyles,
} from '../website/layout';
import { PageLoader } from '../website/loaders';

export default function RewardsPage() {
  const { data, isLoading } = useRewards();

  if (isLoading) {
    return (
      <WebsiteLayout>
        <PageLoader />
      </WebsiteLayout>
    );
  }

  if (!data || (!data.totalPoints && !data.transactions?.length)) {
    return (
      <WebsiteLayout>
        <Container size="md" py={{ base: 28, md: 48 }}>
          <EmptyRewards />
        </Container>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <Container size="md" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Paper radius={30} p="xl" style={{ background: darkGreen, color: '#fff' }}>
            <Stack align="center" gap="md">
              <ThemeIcon radius="xl" size={64} style={{ background: 'rgba(255,255,255,0.16)' }}>
                <Star size={28} />
              </ThemeIcon>
              <Title order={2} className="damorex-heading">
                {`${data?.totalPoints || 0}`}
              </Title>
              <Text c="rgba(255,255,255,0.82)" size="lg">
                Reward Points
              </Text>
            </Stack>
          </Paper>

          <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
            <Title order={3} className="damorex-heading" mb="md">
              How to Earn Points
            </Title>
            <Stack gap="md">
              {[
                {
                  icon: ShoppingCartIcon,
                  title: 'Make a Purchase',
                  text: 'Earn points on every medicine order.',
                },
                {
                  icon: Users,
                  title: 'Refer a Friend',
                  text: 'Earn bonus points when friends sign up and order.',
                },
                { icon: Gift, title: 'Birthday Bonus', text: 'Special points on your birthday.' },
                {
                  icon: Ticket,
                  title: 'Promotions',
                  text: 'Earn bonus points during promotional periods.',
                },
              ].map((item) => (
                <Group key={item.title} gap="md">
                  <ThemeIcon radius="xl" color="green" variant="light" size={44}>
                    <item.icon size={22} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={900}>{item.title}</Text>
                    <Text size="sm" c={muted}>
                      {item.text}
                    </Text>
                  </Box>
                </Group>
              ))}
            </Stack>
          </Paper>

          {data?.transactions && data.transactions.length > 0 ? (
            <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
              <Title order={3} className="damorex-heading" mb="md">
                Transaction History
              </Title>
              <Stack gap="sm">
                {data.transactions.map((t) => (
                  <Group key={t.id} justify="space-between">
                    <Box>
                      <Text size="sm" fw={800}>
                        {t.type === 'earned'
                          ? 'Points Earned'
                          : t.type === 'redeemed'
                            ? 'Points Redeemed'
                            : t.type === 'referral_bonus'
                              ? 'Referral Bonus'
                              : 'Expired'}
                      </Text>
                      {t.description ? (
                        <Text size="xs" c={muted}>
                          {t.description}
                        </Text>
                      ) : null}
                    </Box>
                    <Text
                      fw={950}
                      c={t.type === 'earned' || t.type === 'referral_bonus' ? green : 'red'}
                    >
                      {t.type === 'earned' || t.type === 'referral_bonus' ? '+' : '-'}
                      {t.points}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          ) : null}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}

function ShoppingCartIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
