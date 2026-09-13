import { Box, Container, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { MapPin, Phone, Clock3, ChevronRight } from 'lucide-react';
import { useBranches } from '../website/hooks';
import { WebsiteLayout, green, ink, muted, line } from '../website/layout';

export default function BranchesPage() {
  const { data: branches, isLoading } = useBranches();
  const navigate = useNavigate();

  return (
    <WebsiteLayout>
      <Container size="md" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              Our Branches
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              Visit any of our pharmacy locations.
            </Text>
          </Box>

          {isLoading ? (
            <Text>Loading branches...</Text>
          ) : !branches?.length ? (
            <Text c={muted}>No branches listed yet.</Text>
          ) : (
            <Stack gap="sm">
              {branches.map((branch) => (
                <Paper
                  key={branch.id}
                  className="lift-card"
                  radius={24}
                  p="lg"
                  withBorder
                  style={{ borderColor: line, cursor: 'pointer' }}
                  onClick={() => navigate({ to: `/shop/branches/${branch.id}` })}
                >
                  <Group justify="space-between">
                    <Stack gap={6}>
                      <Text fw={900} size="lg">
                        {branch.name}
                      </Text>
                      <Group gap={6}>
                        <MapPin size={14} color={muted} />
                        <Text size="sm" c={muted}>
                          {branch.address}
                        </Text>
                      </Group>
                      {branch.openingHours ? (
                        <Group gap={6}>
                          <Clock3 size={14} color={muted} />
                          <Text size="sm" c={muted}>
                            {branch.openingHours}
                          </Text>
                        </Group>
                      ) : null}
                      {branch.phone ? (
                        <Group gap={6}>
                          <Phone size={14} color={muted} />
                          <Text size="sm" c={muted}>
                            {branch.phone}
                          </Text>
                        </Group>
                      ) : null}
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
