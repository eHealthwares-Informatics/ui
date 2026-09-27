import { Box, Container, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';
import { SectionHeading, PrimaryButton } from '../website/components';
import { useNewsArticle } from '../website/hooks';
import { WebsiteLayout, apmBlue, ink, muted, soft } from '../website/layout';

export default function NewsArticlePage() {
  const { slug } = useParams({ from: '/apm/news/$slug' });
  const { data: article, isLoading } = useNewsArticle(slug);
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

  if (!article) {
    return (
      <WebsiteLayout>
        <Container size="xl" py={120}>
          <Text ta="center" style={{ color: muted }}>
            Article not found.
          </Text>
        </Container>
      </WebsiteLayout>
    );
  }

  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <WebsiteLayout>
      <Box py={80} style={{ background: soft }}>
        <Container size="md">
          {article.category && (
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
              {article.category}
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
              marginBottom: 16,
            }}
          >
            {article.title}
          </Title>
          <Group gap="xs" mb={32}>
            {date && (
              <Text size="sm" style={{ color: muted }}>
                {date}
              </Text>
            )}
            {article.authorName && (
              <>
                <Text size="sm" style={{ color: muted }}>
                  ·
                </Text>
                <Text size="sm" style={{ color: muted }}>
                  By {article.authorName}
                </Text>
              </>
            )}
          </Group>
        </Container>
      </Box>
      <Box py={64} style={{ background: '#fff' }}>
        <Container size="md">
          <Text
            style={{ color: ink, lineHeight: 1.9, fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}
          >
            {article.content}
          </Text>
          <Group justify="center" mt={48}>
            <PrimaryButton onClick={() => navigate({ to: '/apm/news' })}>
              Back to News
            </PrimaryButton>
          </Group>
        </Container>
      </Box>
    </WebsiteLayout>
  );
}
