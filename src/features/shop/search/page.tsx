import {
  Box,
  Container,
  Group,
  Input,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useNavigate } from '@tanstack/react-router';
import { Search, Pill, BookOpen, HeartPulse, Tags } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProductCard } from '../website/components';
import { useSearch } from '../website/hooks';
import { WebsiteLayout, green, muted, line } from '../website/layout';
import { SearchLoader } from '../website/loaders';

export default function SearchPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(urlParams.get('q') ?? '');
  const [type] = useState<string | undefined>(urlParams.get('type') ?? undefined);
  const [debounced] = useDebouncedValue(query, 300);
  const results = useSearch(query, type);

  const navigate = useNavigate();

  // Keep the URL queryable so /shop/search?q=… is shareable and survives refresh.
  useEffect(() => {
    const p = new URLSearchParams();
    if (debounced.trim()) {p.set('q', debounced.trim());}
    if (type) {p.set('type', type);}
    const qs = p.toString();
    history.replaceState(null, '', qs ? `/shop/search?${qs}` : '/shop/search');
  }, [debounced, type]);

  return (
    <WebsiteLayout>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Paper radius={24} p="lg" withBorder style={{ borderColor: line }}>
            <Input
              placeholder="Search medicines, categories, articles, health concerns..."
              size="xl"
              radius="xl"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              leftSection={<Search size={22} />}
              styles={{ input: { borderColor: '#CFE5D7' } }}
              autoFocus
            />
          </Paper>

          {query.length < 2 ? (
            <Text c={muted} ta="center">
              Type at least 2 characters to search.
            </Text>
          ) : results.isLoading ? (
            <SearchLoader />
          ) : results.data ? (
            <Stack gap="xl">
              {results.data.medicines?.length ? (
                <Box>
                  <Group gap={8} mb="md">
                    <Pill size={20} color={green} />
                    <Title order={3} className="damorex-heading">
                      Medicines ({results.data.medicines.length})
                    </Title>
                  </Group>
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                    {results.data.medicines.map((product: any) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </SimpleGrid>
                </Box>
              ) : null}

              {results.data.categories?.length ? (
                <Box>
                  <Group gap={8} mb="md">
                    <Tags size={20} color={green} />
                    <Title order={3} className="damorex-heading">
                      Categories
                    </Title>
                  </Group>
                  <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                    {results.data.categories.map((cat: any) => (
                      <Paper
                        key={cat.id}
                        className="lift-card"
                        radius={20}
                        p="md"
                        withBorder
                        style={{ borderColor: line, cursor: 'pointer' }}
                        onClick={() => navigate({ to: `/shop/categories/${cat.code}` })}
                      >
                        <Text fw={900}>{cat.name}</Text>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Box>
              ) : null}

              {results.data.articles?.length ? (
                <Box>
                  <Group gap={8} mb="md">
                    <BookOpen size={20} color={green} />
                    <Title order={3} className="damorex-heading">
                      Articles
                    </Title>
                  </Group>
                  <Stack gap="sm">
                    {results.data.articles.map((article: any) => (
                      <Paper
                        key={article.id}
                        className="lift-card"
                        radius={20}
                        p="md"
                        withBorder
                        style={{ borderColor: line, cursor: 'pointer' }}
                        onClick={() => navigate({ to: `/shop/blog/${article.slug}` })}
                      >
                        <Text fw={900}>{article.title}</Text>
                        {article.excerpt ? (
                          <Text size="sm" c={muted}>
                            {article.excerpt}
                          </Text>
                        ) : null}
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              ) : null}

              {results.data.healthConcerns?.length ? (
                <Box>
                  <Group gap={8} mb="md">
                    <HeartPulse size={20} color={green} />
                    <Title order={3} className="damorex-heading">
                      Health Concerns
                    </Title>
                  </Group>
                  <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                    {results.data.healthConcerns.map((hc: any) => (
                      <Paper
                        key={hc.id}
                        className="lift-card"
                        radius={20}
                        p="md"
                        withBorder
                        style={{ borderColor: line, cursor: 'pointer' }}
                        onClick={() => navigate({ to: `/shop/health-concerns/${hc.slug}` })}
                      >
                        <Text fw={900}>{hc.name}</Text>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Box>
              ) : null}

              {!results.data.medicines?.length &&
              !results.data.categories?.length &&
              !results.data.articles?.length &&
              !results.data.healthConcerns?.length ? (
                <Text c={muted} ta="center">
                  No results found for &quot;{query}&quot;.
                </Text>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}