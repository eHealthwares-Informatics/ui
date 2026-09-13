import { Box, Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { ProductCard } from '../website/components';
import { useCategoryBySlug } from '../website/hooks';
import { WebsiteLayout, green, ink, muted, line } from '../website/layout';

export default function CategoryProductsPage() {
  const { slug } = useParams({ from: '/shop/categories/$slug' });
  const { data, isLoading } = useCategoryBySlug(slug);

  return (
    <WebsiteLayout>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              {data?.category?.name || slug}
            </Title>
            {data?.category?.parent ? (
              <Text c={muted} size="sm">
                {data.category.parent.name}
              </Text>
            ) : null}
          </Box>

          {isLoading ? (
            <Text>Loading...</Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              {data?.products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </SimpleGrid>
          )}

          {data?.products?.length === 0 && !isLoading ? (
            <Text c={muted}>No products in this category.</Text>
          ) : null}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
