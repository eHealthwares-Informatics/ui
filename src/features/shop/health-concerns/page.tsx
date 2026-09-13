import { Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { HealthConcernCard } from '../website/components';
import { EmptyHealthConcerns } from '../website/empty-states';
import { useHealthConcerns } from '../website/hooks';
import { WebsiteLayout, ink, muted } from '../website/layout';
import { SectionLoader } from '../website/loaders';

export default function HealthConcernsPage() {
  const { data: concerns, isLoading } = useHealthConcerns();

  return (
    <WebsiteLayout>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Title order={1} className="damorex-heading" style={{ color: ink }}>
            Health Concerns
          </Title>
          <Text c={muted} size="lg" lh={1.7}>
            Browse medicines and educational content organized by health condition.
          </Text>

          {isLoading ? (
            <SectionLoader />
          ) : !concerns?.length ? (
            <EmptyHealthConcerns />
          ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
              {concerns.map((concern, i) => (
                <HealthConcernCard key={concern.id} concern={concern} index={i} />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
