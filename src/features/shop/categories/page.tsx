import { Box, Container, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import {
  Pill,
  Sparkles,
  HeartPulse,
  Stethoscope,
  Baby,
  UsersRound,
  PackageCheck,
  ShoppingCart,
} from 'lucide-react';
import { EmptyCategories } from '../website/empty-states';
import { useCategories } from '../website/hooks';
import { WebsiteLayout, green, ink, muted, line } from '../website/layout';
import { SectionLoader } from '../website/loaders';

const icons = [
  Pill,
  Sparkles,
  HeartPulse,
  Stethoscope,
  Baby,
  UsersRound,
  PackageCheck,
  ShoppingCart,
  Pill,
];

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const navigate = useNavigate();

  return (
    <WebsiteLayout>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              Categories
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              Browse all product categories.
            </Text>
          </Box>

          {isLoading ? (
            <SectionLoader />
          ) : !categories?.length ? (
            <EmptyCategories />
          ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
              {categories.map((cat: any, i: number) => {
                const Icon = icons[i % icons.length];
                return (
                  <Paper
                    key={cat.id}
                    className="lift-card"
                    radius={24}
                    p="lg"
                    withBorder
                    style={{ borderColor: line, cursor: 'pointer' }}
                    // Filter the shop listing by this category instead of a
                    // separate per-category page — /shop/shop reads the param
                    // and pre-selects it in the Category filter.
                    onClick={() => navigate({ to: '/shop/shop', search: { category: cat.code } as any })}
                  >
                    <Stack align="center" gap="sm">
                      <ThemeIcon radius="xl" size={52} color="green" variant="light">
                        <Icon size={24} />
                      </ThemeIcon>
                      <Text fw={900} ta="center">
                        {cat.name}
                      </Text>
                    </Stack>
                  </Paper>
                );
              })}
            </SimpleGrid>
          )}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
