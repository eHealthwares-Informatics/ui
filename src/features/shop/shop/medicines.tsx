import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  HoverCard,
  Input,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Pill, Search, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { websiteApi } from '../website/api';
import { useGenericDrugs, useTherapeuticClasses } from '../website/hooks';
import {
  WebsiteLayout,
  green,
  ink,
  muted,
  line,
  buttonStyles,
} from '../website/layout';
import { useCartStore } from '../website/cart-store';
import { SkeletonCards } from '../website/loaders';
import { GenericDrugView } from '../website/types';

function BrandCountLink({ code, brandCount }: { code: string; brandCount: number }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const { data } = useQuery({
    queryKey: ['generic-drug-brands', code],
    queryFn: () => websiteApi.getGenericDrug(code),
    enabled: hovered,
    staleTime: 60_000,
  });
  const brands = data?.similarBrands ?? [];

  return (
    <HoverCard
      width={280}
      shadow="md"
      position="bottom-start"
      openDelay={120}
      closeDelay={50}
      onOpen={() => setHovered(true)}
      onClose={() => setHovered(false)}
    >
      <HoverCard.Target>
        <Anchor
          size="sm"
          c={green}
          fw={700}
          onClick={() => navigate({ to: '/shop/medicines/$code', params: { code } })}
        >
          {brandCount} brand{brandCount === 1 ? '' : 's'}
        </Anchor>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Stack gap={4} p="xs">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
            Brands under this generic
          </Text>
          {brands.length === 0 ? (
            <Text size="xs" c="dimmed">
              Loading brands…
            </Text>
          ) : (
            brands.slice(0, 6).map((b) => (
              <Group key={b.id} justify="space-between" wrap="nowrap" gap={8}>
                <Text size="xs" fw={500} lineClamp={1} style={{ flex: 1 }}>
                  {b.name}
                </Text>
                <Text size="xs" c={green} style={{ flexShrink: 0 }}>
                  {b.unitPrice != null ? `₦${Number(b.unitPrice).toLocaleString()}` : '—'}
                </Text>
              </Group>
            ))
          )}
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}

export default function ShopMedicinesPage() {
  const [search, setSearch] = useState('');
  const [tClass, setTClass] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { data, isLoading } = useGenericDrugs({
    search,
    therapeuticClass: tClass || '',
    page,
    limit: 20,
  });
  const { data: classesData } = useTherapeuticClasses();
  const addGenericDrug = useCartStore((s) => s.addGenericDrug);

  const list = data?.data ?? [];

  const classOptions = (() => {
    const seen = new Set<string>();
    const out: Array<{ value: string; label: string }> = [];
    for (const c of classesData?.data ?? []) {
      for (const label of [c.genericClass, c.pharmaceuticalClass]) {
        if (!label) {continue;}
        if (seen.has(label)) {continue;}
        seen.add(label);
        out.push({ value: label, label });
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label));
  })();

  function addGeneric(g: GenericDrugView) {
    addGenericDrug({
      name: g.name,
      genericDrugCode: g.code,
      // Avg of available brands; the pharmacist assigns the real brand (and its
      // price) at reconcile.
      unitPrice: g.averagePrice ?? 0,
    });
    const count = useCartStore.getState().totalItems;
    notifications.show({
      position: 'bottom-right',
      title: 'Added to cart',
      message: `${g.name} added — ${count} item${count === 1 ? '' : 's'} in cart`,
      color: 'green',
      icon: <ShoppingCart size={18} />,
    });
  }

  function onSearchChange(v: string) {
    setSearch(v);
    setPage(1);
  }

  return (
    <WebsiteLayout>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              Shop Medicines
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              Browse medicines by generic name. Choose a brand, or add the generic and our
              pharmacist will dispense any available brand.
            </Text>
          </Box>

          <Group align="center" grow>
            <Box style={{ flex: 3 }}>
              <PaperSearch search={search} onSearchChange={onSearchChange} />
            </Box>
            <Box style={{ flex: 1 }}>
              <Select
                placeholder="Therapeutic class"
                data={classOptions}
                value={tClass}
                onChange={(v) => {
                  setTClass(v);
                  setPage(1);
                }}
                radius="xl"
                clearable
                searchable
                nothingFoundMessage="No classes found"
              />
            </Box>
          </Group>

          {isLoading ? (
            <SkeletonCards cols={{ base: 1, sm: 2, lg: 3 }} count={6} />
          ) : list.length === 0 ? (
            <Text c={muted}>
              {search ? `No medicines match "${search}".` : 'No generic medicines found.'}
            </Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {list.map((g) => (
                <Card key={g.code} radius={20} withBorder padding="md" style={{ borderColor: line }}>
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={900} lh={1.25} lineClamp={2}>
                          {g.name}
                        </Text>
                        <Text size="xs" c={muted}>
                          {g.code}
                        </Text>
                      </Box>
                      <Badge color="green" variant="light" radius="xl" size="sm">
                        Generic
                      </Badge>
                    </Group>

                    {g.genericClass ? (
                      <Text size="sm" c={muted} lineClamp={1}>
                        {g.genericClass}
                      </Text>
                    ) : null}

                    <Divider />

                    <Group justify="space-between" align="baseline" wrap="nowrap" gap={4}>
                      <Text size="sm" c={muted}>
                        {g.brandCount > 0 ? (
                          <BrandCountLink code={g.code} brandCount={g.brandCount} />
                        ) : (
                          'No brands yet'
                        )}
                      </Text>
                      <Box ta="right">
                        {g.averagePrice != null ? (
                          <Text size="lg" fw={800} c={green}>
                            ₦{Number(g.averagePrice).toLocaleString()}
                          </Text>
                        ) : (
                          <Text size="sm" c={muted}>
                            Price on dispense
                          </Text>
                        )}
                        {g.averagePrice != null ? (
                          <Text fz={11} c={muted} maw={200}>
                            avg — may be higher or lower (generics vary by brand)
                          </Text>
                        ) : null}
                      </Box>
                    </Group>

                    <Group gap="xs" wrap="nowrap">
                      <Button
                        radius="xl"
                        size="sm"
                        style={{ background: green, flex: 1 }}
                        styles={buttonStyles}
                        leftSection={<ShoppingCart size={16} />}
                        onClick={() => addGeneric(g)}
                      >
                        Add Generic
                      </Button>
                      <Button
                        radius="xl"
                        size="sm"
                        variant="light"
                        color="green"
                        rightSection={<ChevronRight size={16} />}
                        onClick={() => navigate({ to: '/shop/medicines/$code', params: { code: g.code } })}
                      >
                        View
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}

          {data && (data.limit || 20) > 0 && data.total > (data.limit || 20) ? (
            <Group justify="center">
              <Pagination
                total={Math.ceil(data.total / (data.limit || 20))}
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

function PaperSearch({ search, onSearchChange }: { search: string; onSearchChange: (v: string) => void }) {
  return (
    <Stack
      p="md"
      style={{
        background: '#F7FBF9',
        borderRadius: 24,
        border: `1px solid ${line}`,
      }}
    >
      <Group align="center">
        <ThemeIcon radius="xl" size={40} color="green" variant="light">
          <Pill size={20} />
        </ThemeIcon>
        <Input
          placeholder="Search medicines by generic name or code..."
          size="lg"
          radius="xl"
          value={search}
          onChange={(e) => {
            onSearchChange(e.currentTarget.value);
          }}
          leftSection={<Search size={18} />}
          style={{ flex: 1 }}
          styles={{ input: { borderColor: '#CFE5D7', color: ink } }}
        />
      </Group>
    </Stack>
  );
}