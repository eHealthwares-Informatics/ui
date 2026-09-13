import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Image,
  Input,
  Pagination,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ChevronDown, ChevronUp, Pill, Search, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useGenericProducts } from '../website/hooks';
import {
  WebsiteLayout,
  green,
  ink,
  muted,
  line,
  buttonStyles,
} from '../website/layout';
import { useCartStore } from '../website/cart-store';
import { GenericMedicineView } from '../website/types';

export default function ShopMedicinesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { data, isLoading } = useGenericProducts({ search, page, limit: 20 });
  const addGenericItem = useCartStore((s) => s.addGenericItem);
  const addItem = useCartStore((s) => s.addItem);

  const list = data?.data ?? [];

  function toggle(code: string) {
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));
  }

  function addGeneric(g: GenericMedicineView) {
    addGenericItem({
      name: g.name,
      genericProductCode: g.code,
      // No variant chosen: still create the order line as freetext; unit price
      // is reconciled by the pharmacist (0 here).
      unitPrice: 0,
    });
    notifications.show({
      message: `${g.name} added to cart`,
      color: 'green',
      icon: <ShoppingCart size={18} />,
    });
  }

  function addVariant(id: string) {
    addItem(id, 1);
    notifications.show({
      message: `${name} added to cart`,
      color: 'green',
      icon: <ShoppingCart size={18} />,
    });
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
              Browse medicines by generic name. Pick a variant (brand/strength) or add the generic
              directly.
            </Text>
          </Box>

          <PaperSearch search={search} onSearchChange={setSearch} />

          {isLoading ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} radius={20} withBorder padding="md" style={{ borderColor: line }}>
                  <Stack gap={6}>
                    <Box style={{ height: 12, background: '#E8F0EC', borderRadius: 8, width: '60%' }} />
                    <Box style={{ height: 16, background: '#E8F0EC', borderRadius: 8, width: '80%' }} />
                    <Box style={{ height: 34, background: '#E8F0EC', borderRadius: 16, marginTop: 6 }} />
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          ) : list.length === 0 ? (
            <Text c={muted}>No generic medicines found.</Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {list.map((g) => {
                const open = !!expanded[g.code];
                const hasVariants = (g.variants?.length ?? 0) > 0;
                return (
                  <Card key={g.code} radius={20} withBorder padding="md" style={{ borderColor: line }}>
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <Box style={{ flex: 1 }}>
                          <Text fw={900} lh={1.25}>
                            {g.name}
                          </Text>
                          <Text size="xs" c={muted}>
                            {g.code}
                          </Text>
                        </Box>
                        {g.isPrescriptionRequired ? (
                          <Badge color="orange" variant="light" radius="xl" size="sm">
                            Rx
                          </Badge>
                        ) : (
                          <Badge color="green" variant="light" radius="xl" size="sm">
                            OTC
                          </Badge>
                        )}
                      </Group>

                      {hasVariants ? (
                        <Button
                          size="xs"
                          radius="xl"
                          variant="light"
                          color="green"
                          rightSection={open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          onClick={() => toggle(g.code)}
                        >
                          {open ? 'Hide variants' : `Choose variant (${g.variants?.length})`}
                        </Button>
                      ) : null}

                      {open && hasVariants ? (
                        <>
                          <Divider />
                          <Stack gap={6}>
                            {(g.variants ?? []).map((v) => (
                              <Group key={v.id} justify="space-between" wrap="nowrap">
                                <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                  <Image
                                    src={v.mediumImageUrl || v.imageUrl || undefined}
                                    alt={v.name}
                                    w={36}
                                    h={36}
                                    fit="contain"
                                    style={{
                                      borderRadius: 8,
                                      background: '#F1F8F4',
                                      border: `1px solid ${line}`,
                                    }}
                                  />
                                  <Text size="sm" fw={700} lineClamp={2}>
                                    {v.name}
                                  </Text>
                                </Group>
                                <Group gap={6} wrap="nowrap">
                                  {v.unitPrice != null ? (
                                    <Text size="sm" c={green} fw={800}>
                                      ₦{Number(v.unitPrice).toLocaleString()}
                                    </Text>
                                  ) : null}
                                  <Button
                                    size="xs"
                                    radius="xl"
                                    variant="light"
                                    color="green"
                                    leftSection={<ShoppingCart size={14} />}
                                    onClick={() => addVariant(v.id)}
                                  >
                                    Add
                                  </Button>
                                </Group>
                              </Group>
                            ))}
                          </Stack>
                        </>
                      ) : null}

                      <Button
                        radius="xl"
                        size="sm"
                        style={{ background: green }}
                        leftSection={<ShoppingCart size={16} />}
                        styles={buttonStyles}
                        onClick={() => addGeneric(g)}
                      >
                        Add Generic
                      </Button>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}

          {data && data.total > data.limit ? (
            <Group justify="center">
              <Pagination
                total={Math.ceil(data.total / data.limit)}
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
          placeholder="Search generic medicines by name or code..."
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