import { Box, Container, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { SectionHeading, PrimaryButton } from '../website/components';
import { useEvent } from '../website/hooks';
import { WebsiteLayout, apmBlue, ink, muted, soft } from '../website/layout';

export default function EventDetailPage() {
  const { id } = useParams({ from: '/apm/events/$id' });
  const { data: event, isLoading } = useEvent(id);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <WebsiteLayout>
        <Container size="xl" py={120}>
          <Group justify="center">
            <Loader color={apmBlue} />
          </Group>
        </Container>
      </WebsiteLayout>
    );
  }

  if (!event) {
    return (
      <WebsiteLayout>
        <Container size="xl" py={120}>
          <Text ta="center" style={{ color: muted }}>
            Event not found.
          </Text>
        </Container>
      </WebsiteLayout>
    );
  }

  const date = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <WebsiteLayout>
      <Box py={80} style={{ background: soft }}>
        <Container size="md">
          {event.category && (
            <Text
              size="xs"
              fw={600}
              style={{
                color: apmBlue,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 16,
              }}
            >
              {event.category}
            </Text>
          )}
          <Title
            order={1}
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: ink,
              lineHeight: 1.3,
              marginBottom: 24,
            }}
          >
            {event.title}
          </Title>
          <Stack gap="sm" mb={32}>
            {event.location && (
              <Group gap={8}>
                <MapPin size={18} color={apmBlue} />
                <Text size="md" style={{ color: ink, fontWeight: 500 }}>
                  {event.location}
                </Text>
              </Group>
            )}
            {date && (
              <Group gap={8}>
                <Calendar size={18} color={apmBlue} />
                <Text size="md" style={{ color: ink, fontWeight: 500 }}>
                  {date}
                </Text>
              </Group>
            )}
            {event.eventTime && (
              <Group gap={8}>
                <Clock size={18} color={apmBlue} />
                <Text size="md" style={{ color: ink, fontWeight: 500 }}>
                  {event.eventTime}
                </Text>
              </Group>
            )}
          </Stack>
        </Container>
      </Box>
      <Box py={64} style={{ background: '#fff' }}>
        <Container size="md">
          {event.description && (
            <Text size="lg" style={{ color: ink, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
              {event.description}
            </Text>
          )}
          <Group justify="center" mt={48}>
            <PrimaryButton onClick={() => navigate({ to: '/apm/events' })}>
              Back to Events
            </PrimaryButton>
          </Group>
        </Container>
      </Box>
    </WebsiteLayout>
  );
}
