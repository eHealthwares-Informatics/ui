import { Box, Container, Group, Loader, SimpleGrid, Stack, Text } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { SectionHeading, NewsCard } from '../website/components';
import { useNews } from '../website/hooks';
import { WebsiteLayout, apmBlue, muted, soft } from '../website/layout';

export default function NewsPage() {
  const { data, isLoading } = useNews();

  return (
    <WebsiteLayout>
      <Box
        py={80}
        style={{ background: `linear-gradient(135deg, ${soft} 0%, #DBEAFE 30%, #ffffff 100%)` }}
      >
        <Container size="xl">
          <SectionHeading
            title="News & Media"
            subtitle="Latest updates, policy announcements, and campaign coverage."
          />
        </Container>
      </Box>
      <Box py={80} style={{ background: '#fff' }}>
        <Container size="xl">
          {isLoading ? (
            <Group justify="center">
              <Loader color={apmBlue} />
            </Group>
          ) : !data?.items?.length ? (
            <Text ta="center" style={{ color: muted }}>
              No news articles yet.
            </Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={24}>
              {data.items.map((article) => (
                <NewsCard
                  key={article.id}
                  title={article.title}
                  excerpt={article.excerpt ?? ''}
                  category={article.category ?? 'News'}
                  publishedAt={article.publishedAt}
                  authorName={article.authorName ?? ''}
                  slug={article.slug}
                />
              ))}
            </SimpleGrid>
          )}
        </Container>
      </Box>
    </WebsiteLayout>
  );
}
