import { Box, Container, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { MapPin, Phone, Mail, Clock3 } from 'lucide-react';
import { useBranch } from '../website/hooks';
import { WebsiteLayout, green, ink, muted, line } from '../website/layout';

export default function BranchDetailPage() {
  const { id } = useParams({ from: '/shop/branches/$id' });
  const { data: branch, isLoading } = useBranch(id);

  return (
    <WebsiteLayout>
      <Container size="sm" py={{ base: 28, md: 48 }}>
        {isLoading ? (
          <Text>Loading branch...</Text>
        ) : !branch ? (
          <Text c={muted}>Branch not found.</Text>
        ) : (
          <Stack gap="xl">
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              {branch.name}
            </Title>

            <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
              <Stack gap="md">
                <Group gap="md">
                  <ThemeIcon radius="xl" color="green" variant="light" size={44}>
                    <MapPin size={22} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={900}>Address</Text>
                    <Text c={muted}>{branch.address}</Text>
                    {branch.city ? (
                      <Text size="sm" c={muted}>
                        {branch.city}
                      </Text>
                    ) : null}
                  </Box>
                </Group>

                {branch.openingHours ? (
                  <Group gap="md">
                    <ThemeIcon radius="xl" color="green" variant="light" size={44}>
                      <Clock3 size={22} />
                    </ThemeIcon>
                    <Box>
                      <Text fw={900}>Opening Hours</Text>
                      <Text c={muted}>{branch.openingHours}</Text>
                    </Box>
                  </Group>
                ) : null}

                {branch.phone ? (
                  <Group gap="md">
                    <ThemeIcon radius="xl" color="green" variant="light" size={44}>
                      <Phone size={22} />
                    </ThemeIcon>
                    <Box>
                      <Text fw={900}>Phone</Text>
                      <Text c={muted}>{branch.phone}</Text>
                    </Box>
                  </Group>
                ) : null}

                {branch.email ? (
                  <Group gap="md">
                    <ThemeIcon radius="xl" color="green" variant="light" size={44}>
                      <Mail size={22} />
                    </ThemeIcon>
                    <Box>
                      <Text fw={900}>Email</Text>
                      <Text c={muted}>{branch.email}</Text>
                    </Box>
                  </Group>
                ) : null}
              </Stack>
            </Paper>
          </Stack>
        )}
      </Container>
    </WebsiteLayout>
  );
}
