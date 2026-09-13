import { Box, Container, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { MapPin, Truck, Clock3 } from 'lucide-react';
import { useDeliveryAreas } from '../website/hooks';
import { WebsiteLayout, green, darkGreen, ink, muted, line, soft } from '../website/layout';

export default function DeliveryAreasPage() {
  const { data: areas, isLoading } = useDeliveryAreas();

  const grouped =
    areas?.reduce<Record<string, typeof areas>>((acc, area) => {
      if (!acc[area.state]) {acc[area.state] = [];}
      acc[area.state].push(area);
      return acc;
    }, {}) || {};

  return (
    <WebsiteLayout>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              Delivery Coverage
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              We deliver across Lagos, Ogun, Oyo and surrounding areas.
            </Text>
          </Box>

          {isLoading ? (
            <Text>Loading delivery areas...</Text>
          ) : !areas?.length ? (
            <Paper radius={24} p="xl" withBorder style={{ borderColor: line, textAlign: 'center' }}>
              <ThemeIcon radius="xl" size={56} color="green" variant="light" mx="auto">
                <Truck size={26} />
              </ThemeIcon>
              <Text fw={900} mt="md">
                No delivery areas listed yet
              </Text>
            </Paper>
          ) : (
            Object.entries(grouped).map(([state, stateAreas]) => (
              <Box key={state}>
                <Title order={3} className="damorex-heading" mb="md" c={ink}>
                  {state}
                </Title>
                <Stack gap="sm">
                  {stateAreas.map((area) => (
                    <Paper
                      key={area.id}
                      radius={20}
                      p="md"
                      withBorder
                      style={{ borderColor: line }}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="sm">
                          <ThemeIcon radius="xl" color="green" variant="light" size={36}>
                            <MapPin size={18} />
                          </ThemeIcon>
                          <Box>
                            <Text fw={900}>{area.city}</Text>
                            {area.estimatedDeliveryHours ? (
                              <Group gap={4}>
                                <Clock3 size={12} color={muted} />
                                <Text size="xs" c={muted}>
                                  {area.estimatedDeliveryHours}h estimated
                                </Text>
                              </Group>
                            ) : null}
                          </Box>
                        </Group>
                        <Box ta="right">
                          <Text fw={950} c={darkGreen}>
                            ₦{area.deliveryFee.toLocaleString()}
                          </Text>
                          {area.freeDeliveryAbove ? (
                            <Text size="xs" c={muted}>
                              Free above ₦{area.freeDeliveryAbove.toLocaleString()}
                            </Text>
                          ) : null}
                        </Box>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            ))
          )}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
