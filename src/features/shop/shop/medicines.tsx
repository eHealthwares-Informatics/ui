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
import { BrandCountLink } from '../website/components';
import { websiteApi } from '../website/api';
import { useGenericDrugs, useTherapeuticClasses, useClassifications } from '../website/hooks';
import {
  WebsiteLayout,
  green,
  ink,
  muted,
  line,
  buttonStyles,
} from '../website/layout';
import { useCartStore } from '../website/cart-store';
import { ListPagination } from '../website/components';

import { SkeletonCards } from '../website/loaders';
import { GenericDrugView } from '../website/types';

const CLASSIFICATION_SOURCES: Record<string, string> = {
  therapeutic: 'drugs.com',
  pharmaceutical: 'goodrx',
  ndf: 'NDF/EDL',
  emdex: 'EMDEx (ATC)',
};

export default function ShopMedicinesPage() {
  const [search, setSearch] = useState('');
  const [tClass, setTClass] = useState<string | null>(null);
  const [classification, setClassification] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { data, isLoading } = useGenericDrugs({
    search,
    therapeuticClass: tClass || '',
    classificationCode: classification || '',
    page,
    limit: 20,
  });
  const { data: classesData } = useTherapeuticClasses();
  const { data: therapeuticCls } = useClassifications('therapeutic');
  const { data: pharmaceuticalCls } = useClassifications('pharmaceutical');
  const { data: ndfCls } = useClassifications('ndf');
  const { data: emdexCls } = useClassifications('emdex');
  const addGenericDrug = useCartStore((s) => s.addGenericDrug);

  const list = data?.data ?? [];

  // Unified classification options: one select combining all four labeled
  // sources (each classification keeps its source type for display).
  const classificationOptions = [
    ...(therapeuticCls?.data ?? []).map((c) => ({ value: c.code, label: `[Therapeutic] ${c.name}`, type: c.type })),
    ...(pharmaceuticalCls?.data ?? []).map((c) => ({ value: c.code, label: `[Pharmaceutical] ${c.name}`, type: c.type })),
    ...(ndfCls?.data ?? []).map((c) => ({ value: c.code, label: `[NDF/EDL] ${c.name}`, type: c.type })),
    ...(emdexCls?.data ?? []).map((c) => ({ value: c.code, label: `[EMDEx] ${c.name}`, type: c.type })),
  ];
  const selectedClassification = classificationOptions.find((o) => o.value === classification);

  const classOptions = (() => {
    const seen = new Set<string>();
    const out: Array<{ value: string; label: string }> = [];
    for (const c of classesData?.data ?? []) {
      for (const label of [c.genericClass, c.pharmaceuticalClass]) {
        if (!label) { continue; }
        if (seen.has(label)) { continue; }
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
              {/* <PaperSearch search={search} onSearchChange={onSearchChange} /> */}
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
                    size="sm"
                    radius="xl"
                    value={search}
                    onChange={(e) => {
                      onSearchChange(e.currentTarget.value);
                    }}
                    leftSection={<Search size={18} />}
                    style={{ flex: 1 }}
                    styles={{ input: { borderColor: '#CFE5D7', color: ink } }}
                  />  
            <Box style={{ flex: 1 }}>
              <Select
                placeholder="Classification"
                data={classificationOptions}
                value={classification}
                onChange={(v) => {
                  setClassification(v);
                  setPage(1);
                }}
                radius="xl"
                clearable
                searchable
                limit={50}
                maxDropdownHeight={280}
                nothingFoundMessage="No classifications found"
              />
            </Box>
                </Group>
              </Stack>
            </Box>

          
          </Group>

          {selectedClassification ? (
            <Text size="sm" c={muted}>
              Filtering by <strong>{selectedClassification.label}</strong> — source:{' '}
              {CLASSIFICATION_SOURCES[selectedClassification.type] ?? selectedClassification.type}
            </Text>
          ) : null}

          {data ? (
            <ListPagination
              withCount
              total={data.total}
              limit={data.limit || 20}
              page={page}
              onChange={setPage}
            />
          ) : null}

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

          <ListPagination
            total={data?.total}
            limit={data?.limit || 20}
            page={page}
            onChange={setPage}
          />
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
          size="sm"
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