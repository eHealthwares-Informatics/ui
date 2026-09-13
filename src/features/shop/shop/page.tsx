import {
  Box,
  Button,
  Container,
  Grid,
  Group,
  Input,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Pagination,
} from '@mantine/core';
import { Search, SlidersHorizontal, Pill } from 'lucide-react';
import { useState } from 'react';
import { ProductCard } from '../website/components';
import { EmptyProducts, EmptySearchResults } from '../website/empty-states';
import { useProducts, useCategories } from '../website/hooks';
import {
  WebsiteLayout,
  green,
  darkGreen,
  ink,
  muted,
  line,
  soft,
  buttonStyles,
} from '../website/layout';
import { ProductLoader } from '../website/loaders';

export default function ShopPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | null>('createdAt');

  const { data: productsData, isLoading } = useProducts({
    search,
    category: category || '',
    page,
    limit: 20,
    // sortBy: sort || 'createdAt',
    // sortOrder: 'DESC',
  });

  const { data: categories } = useCategories();

  return (
    <WebsiteLayout>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title
              order={1}
              className="damorex-heading"
              style={{ color: ink, letterSpacing: '-0.03em' }}
            >
              Shop Medicines
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              Browse our catalog of authentic medicines and healthcare products.
            </Text>
          </Box>

          <Paper radius={24} p="md" withBorder style={{ borderColor: line, background: soft }}>
            <Grid align="center" gap="md">
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Input
                  placeholder="Search medicines, brands, or generics..."
                  size="lg"
                  radius="xl"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.currentTarget.value);
                    setPage(1);
                  }}
                  leftSection={<Search size={18} />}
                  styles={{ input: { borderColor: '#CFE5D7' } }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 3 }}>
                <Select
                  placeholder="Category"
                  data={[
                    { value: '', label: 'All Categories' },
                    ...(categories || []).map((c: any) => ({ value: c.code, label: c.name })),
                  ]}
                  value={category}
                  onChange={(v) => {
                    setCategory(v);
                    setPage(1);
                  }}
                  radius="xl"
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 2 }}>
                <Select
                  placeholder="Sort"
                  data={[
                    { value: 'createdAt', label: 'Newest' },
                    { value: 'name', label: 'Name A-Z' },
                  ]}
                  value={sort}
                  onChange={setSort}
                  radius="xl"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 2 }}>
                <Button
                  radius="xl"
                  variant="light"
                  color="green"
                  fullWidth
                  leftSection={<SlidersHorizontal size={16} />}
                  styles={buttonStyles}
                >
                  Filters
                </Button>
              </Grid.Col>
            </Grid>
          </Paper>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {isLoading ? (
              <ProductLoader />
            ) : productsData?.data?.length ? (
              productsData.data.map((product) => <ProductCard key={product.id} product={product} />)
            ) : search ? (
              <EmptySearchResults />
            ) : (
              <EmptyProducts />
            )}
          </SimpleGrid>

          {productsData && productsData.total > productsData.limit ? (
            <Group justify="center">
              <Pagination
                total={Math.ceil(productsData.total / productsData.limit)}
                value={page}
                onChange={setPage}
                radius="xl"
                color="green"
              />
            </Group>
          ) : null}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
