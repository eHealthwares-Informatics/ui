import {
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Group,
  Image,
  Input,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, Calendar, ChevronRight, Clock3, Search, User } from 'lucide-react';
import { useState } from 'react';
import { SectionHeading } from '../website/components';
import { EmptyBlog } from '../website/empty-states';
import { useArticles } from '../website/hooks';
import { WebsiteLayout, green, ink, muted, line } from '../website/layout';
import type { BlogArticleView } from '../website/types';

const BLOG_CATEGORIES = [
  'All Articles',
  'Medications',
  'Wellness',
  'Disease Management',
  'Nutrition',
  'Mental Health',
  'First Aid',
  'Pharmacy News',
];

const PLACEHOLDER_IMG = 'https://placehold.co/600x400/16A34A/white?text=Article';

const PER_PAGE = 9;

function ArticleCard({ article, featured }: { article: BlogArticleView; featured?: boolean }) {
  const navigate = useNavigate();

  return (
    <Paper
      className="lift-card"
      radius={24}
      withBorder
      style={{
        borderColor: line,
        cursor: 'pointer',
        height: '100%',
        overflow: 'hidden',
        background: '#fff',
      }}
      onClick={() => navigate({ to: `/shop/blog/${article.slug}` })}
    >
      <Box style={{ position: 'relative', overflow: 'hidden' }}>
        <Image
          src={article.imageUrl || PLACEHOLDER_IMG}
          alt={article.title}
          h={featured ? 320 : 200}
          fit="cover"
          style={{
            transition: 'transform 400ms cubic-bezier(0.22,1,0.36,1)',
          }}
          className="lift-card"
        />
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: featured
              ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)'
              : undefined,
          }}
        />
        <Badge
          size="sm"
          radius="xl"
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(22, 163, 74, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(4px)',
          }}
        >
          Health Education
        </Badge>
      </Box>
      <Stack p="lg" gap="sm" style={{ flex: 1 }}>
        <Text fw={900} lh={1.3} c={ink} style={{ fontSize: featured ? 20 : 16 }}>
          {article.title}
        </Text>
        {article.excerpt ? (
          <Text
            size="sm"
            c={muted}
            lh={1.7}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: featured ? 4 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.excerpt}
          </Text>
        ) : null}
        <Group gap="xs" mt="auto" wrap="wrap">
          {article.authorName ? (
            <Group gap={4}>
              <User size={12} color={muted} />
              <Text size="xs" c={muted}>
                {article.authorName}
              </Text>
            </Group>
          ) : null}
          {article.readingTime ? (
            <Group gap={4}>
              <Clock3 size={12} color={muted} />
              <Text size="xs" c={muted}>
                {article.readingTime} min
              </Text>
            </Group>
          ) : null}
          {article.publishedAt ? (
            <Group gap={4}>
              <Calendar size={12} color={muted} />
              <Text size="xs" c={muted}>
                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </Group>
          ) : null}
        </Group>
        <Group gap={4} mt={4}>
          <Text size="sm" c={green} fw={800}>
            Read Article
          </Text>
          <ChevronRight size={14} color={green} />
        </Group>
      </Stack>
    </Paper>
  );
}

function ArticleCardSkeleton() {
  return (
    <Paper radius={24} withBorder style={{ borderColor: line, overflow: 'hidden' }}>
      <Skeleton h={200} radius={0} />
      <Stack p="lg" gap="sm">
        <Skeleton h={20} w="80%" />
        <Skeleton h={14} w="100%" />
        <Skeleton h={14} w="60%" />
        <Group gap="xs" mt="sm">
          <Skeleton h={12} w={80} />
          <Skeleton h={12} w={60} />
        </Group>
      </Stack>
    </Paper>
  );
}

export default function BlogListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Articles');
  const [page, setPage] = useState(1);

  const params: Record<string, string | number> = { page, limit: PER_PAGE };
  if (search) {params.search = search;}

  const { data, isLoading, isFetching } = useArticles(params);
  const articles = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasMore = articles.length < total;

  const featured = articles[0];

  const filteredArticles = articles.slice(1);

  return (
    <WebsiteLayout>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <SectionHeading
            eyebrow="Blog & Health Education Center"
            title="Practical health education from the pharmacy team"
            text="Expert advice, medication guides, wellness tips, and trusted health information from Damorex pharmacists."
          />

          <Group gap="sm" wrap="nowrap" style={{ overflowX: 'auto' }} pb={4}>
            {BLOG_CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                radius="xl"
                size="lg"
                style={{
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: cat === activeCategory ? green : 'transparent',
                  color: cat === activeCategory ? '#fff' : muted,
                  border: `1px solid ${cat === activeCategory ? green : line}`,
                  fontWeight: 800,
                  padding: '8px 18px',
                  transition: 'all 220ms cubic-bezier(0.22,1,0.36,1)',
                  flexShrink: 0,
                }}
                onClick={() => {
                  setActiveCategory(cat);
                  setPage(1);
                }}
              >
                {cat}
              </Badge>
            ))}
          </Group>

          <Input
            placeholder="Search articles..."
            radius="xl"
            size="md"
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
            leftSection={<Search size={18} color={muted} />}
            styles={{ input: { borderColor: line } }}
            maw={420}
          />

          {isLoading ? (
            <Stack gap="lg">
              <Skeleton h={320} radius={24} />
              <Grid>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid.Col key={i} span={{ base: 12, sm: 6, md: 4 }}>
                    <ArticleCardSkeleton />
                  </Grid.Col>
                ))}
              </Grid>
            </Stack>
          ) : articles.length === 0 ? (
            <EmptyBlog
              title={search ? 'No Articles Found' : undefined}
              message={
                search
                  ? `No articles match "${search}". Try adjusting your search terms.`
                  : undefined
              }
            />
          ) : (
            <>
              {featured ? (
                <Box>
                  <Text tt="uppercase" size="xs" fw={900} c={green} lts={1.4} mb="sm">
                    Featured Article
                  </Text>
                  <ArticleCard article={featured} featured />
                </Box>
              ) : null}

              <Grid>
                {filteredArticles.map((article) => (
                  <Grid.Col key={article.id} span={{ base: 12, sm: 6, md: 4 }}>
                    <ArticleCard article={article} />
                  </Grid.Col>
                ))}
              </Grid>

              {isFetching ? (
                <Grid>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Grid.Col key={i} span={{ base: 12, sm: 6, md: 4 }}>
                      <ArticleCardSkeleton />
                    </Grid.Col>
                  ))}
                </Grid>
              ) : null}

              {hasMore ? (
                <Group justify="center" mt="md">
                  <Button
                    radius="xl"
                    size="lg"
                    variant="light"
                    color="green"
                    leftSection={<ArrowRight size={18} />}
                    loading={isFetching}
                    onClick={() => setPage((p) => p + 1)}
                    styles={{
                      root: {
                        transition:
                          'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease',
                      },
                    }}
                  >
                    Load More Articles
                  </Button>
                </Group>
              ) : null}

              {articles.length > 0 ? (
                <Text ta="center" size="sm" c={muted}>
                  Showing {articles.length} of {total} articles
                </Text>
              ) : null}
            </>
          )}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
