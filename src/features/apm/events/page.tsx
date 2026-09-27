import { Box, Container, Group, Loader, SimpleGrid, Text } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { SectionHeading, EventCard } from '../website/components';
import { useEvents } from '../website/hooks';
import { WebsiteLayout, apmBlue, muted, soft } from '../website/layout';

export default function EventsPage() {
  const { data, isLoading } = useEvents();
  const navigate = useNavigate();

  return (
    <WebsiteLayout>
      <Box
        py={80}
        style={{ background: `linear-gradient(135deg, ${soft} 0%, #DBEAFE 30%, #ffffff 100%)` }}
      >
        <Container size="xl">
          <SectionHeading
            title="Events"
            subtitle="Join us at town halls, stakeholder meetings, and community engagements across Oyo State."
          />
        </Container>
      </Box>
      <Box py={80} style={{ background: '#fff' }}>
        <Container size="xl">
          {isLoading ? (
            <Group justify="center">
              <Loader color={apmBlue} />
            </Group>
          ) : !data?.length ? (
            <Text ta="center" style={{ color: muted }}>
              No events at this time. Join our newsletter to stay informed.
            </Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={24}>
              {data.map((event) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  description={event.description ?? ''}
                  location={event.location ?? ''}
                  eventDate={event.eventDate}
                  eventTime={event.eventTime ?? ''}
                  category={event.category ?? 'Event'}
                  onClick={() => navigate({ to: `/apm/events/${event.id}` })}
                />
              ))}
            </SimpleGrid>
          )}
        </Container>
      </Box>
    </WebsiteLayout>
  );
}
