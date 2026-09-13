import { Badge, Box, Container, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { MessageCircle, Phone, Video } from 'lucide-react';
import { EmptyConsultations } from '../website/empty-states';
import { useConsultations } from '../website/hooks';
import { WebsiteLayout, green, ink, muted, line } from '../website/layout';
import { PageLoader } from '../website/loaders';

const channelIcons: Record<string, React.ReactNode> = {
  WhatsApp: <MessageCircle size={16} />,
  Phone: <Phone size={16} />,
  'Video Call': <Video size={16} />,
};

export default function ConsultationsPage() {
  const { data: consultations, isLoading } = useConsultations();

  return (
    <WebsiteLayout>
      <Container size="md" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              My Consultations
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              History of your pharmacist consultations.
            </Text>
          </Box>

          {isLoading ? (
            <PageLoader />
          ) : !consultations?.length ? (
            <EmptyConsultations />
          ) : (
            <Stack gap="sm">
              {consultations.map((c) => (
                <Paper key={c.id} radius={20} p="lg" withBorder style={{ borderColor: line }}>
                  <Group justify="space-between">
                    <Stack gap={4}>
                      <Group gap={8}>
                        <Text fw={900}>{c.name}</Text>
                        <Badge
                          radius="xl"
                          color={
                            c.status === 'Completed'
                              ? 'green'
                              : c.status === 'In Progress'
                                ? 'blue'
                                : 'yellow'
                          }
                        >
                          {c.status}
                        </Badge>
                      </Group>
                      {c.symptoms ? (
                        <Text size="sm" c={muted}>
                          {c.symptoms}
                        </Text>
                      ) : null}
                      <Text size="xs" c={muted}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </Text>
                    </Stack>
                    {channelIcons[c.channel] || null}
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
