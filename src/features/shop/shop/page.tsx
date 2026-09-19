import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Combobox,
  Container,
  Grid,
  Group,
  Input,
  InputBase,
  Pagination,
  Paper,
  Popover,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
  useCombobox,
} from '@mantine/core';
import { ChevronDown, Search, SlidersHorizontal, Pill, X } from 'lucide-react';
import { useState } from 'react';
import { EmptyProducts, EmptySearchResults } from '../website/empty-states';
import { ProductCard } from '../website/components';
import { useProducts, useCategories, useGenericProductSearch, useTherapeuticCategories } from '../website/hooks';
import {
  WebsiteLayout,
  green,
  ink,
  muted,
  line,
  soft,
  buttonStyles,
} from '../website/layout';
import { SkeletonCards } from '../website/loaders';

const FILTER_DEFS = [
  { id: 'search', label: 'Search', desc: 'Free-text search' },
  { id: 'category', label: 'Category', desc: 'Filter by category' },
  { id: 'sort', label: 'Sort', desc: 'Order products' },
  { id: 'gp', label: 'Generic Product', desc: 'Filter by generic (EMDEx) product' },
  { id: 'tClass', label: 'Therapeutic Class', desc: 'Filter by drug class' },
];

function ThinProgress() {
  return (
    <Box
      style={{
        height: 3,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 99,
        background: '#E5F1E9',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '30%',
          background: `linear-gradient(90deg, transparent, ${green}, transparent)`,
          animation: 'damorex-slide 1.1s linear infinite',
        }}
      />
    </Box>
  );
}

function GenericFilter({
  value,
  onChange,
  size = 'md',
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const combobox = useCombobox();
  const [q, setQ] = useState('');
  const { data } = useGenericProductSearch(q);
  const options = (data?.data ?? []).map((g) => ({
    value: g.code,
    label: g.name,
    averagePrice: g.averagePrice,
  }));
  const selectedLabel = options.find((o) => o.value === value)?.label ?? value ?? '';

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => {
        onChange(val);
        setQ('');
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          size={size}
          radius="xl"
          placeholder="Generic product (GP)..."
          value={q || selectedLabel || ''}
          onChange={(e) => {
            const val = e.currentTarget.value;
            setQ(val);
            // Clearing the input with the cursor should also clear the selected
            // generic (otherwise the code would reappear as "selected").
            if (val === '' && value) {
              onChange(null);
            }
            combobox.openDropdown();
          }}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => setQ('')}
          leftSection={<Pill size={16} />}
          rightSection={
            value ? (
              <ActionIcon variant="subtle" color="gray" onClick={() => { onChange(null); setQ(''); }}>
                <X size={14} />
              </ActionIcon>
            ) : (
              <ChevronDown size={14} />
            )
          }
          rightSectionPointerEvents={value ? 'auto' : 'none'}
        />
      </Combobox.Target>
      <Combobox.Dropdown style={{ backgroundColor: 'white', zIndex: 20 }}>
        <Combobox.Options style={{ maxHeight: 280, overflowY: 'auto' }}>
          {options.length === 0 ? (
            <Combobox.Empty>
              {q.length < 2 ? 'Type at least 2 characters…' : 'No generic products found'}
            </Combobox.Empty>
          ) : (
            options.slice(0, 12).map((o) => (
              <Combobox.Option key={o.value} value={o.value}>
                <Group justify="space-between" wrap="nowrap" gap={12}>
                  <Text size="sm" fw={600} lineClamp={1} style={{ flex: 1 }}>
                    {o.label}
                  </Text>
                  <Text size="xs" c={green} style={{ flexShrink: 0 }}>
                    {o.averagePrice != null
                      ? `₦${Number(o.averagePrice).toLocaleString()}`
                      : '—'}
                  </Text>
                </Group>
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

export default function ShopPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const qFromUrl = urlParams.get('q');
  const gpFromUrl = urlParams.get('gp');
  const [search, setSearch] = useState(typeof qFromUrl === 'string' ? qFromUrl : '');
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | null>('createdAt');
  const [gp, setGp] = useState<string | null>(
    typeof gpFromUrl === 'string' ? gpFromUrl : null,
  );
  const [tClass, setTClass] = useState<string | null>(null);
  const [visibleFilters, setVisibleFilters] = useState<string[]>(
    FILTER_DEFS.map((f) => f.id),
  );

  const { data: productsData, isPending, isFetching } = useProducts({
    search,
    category: category || '',
    genericProductCode: gp || '',
    therapeuticCategory: tClass || '',
    page,
    limit: 20,
  });

  const { data: categories } = useCategories();
  const { data: therCategories } = useTherapeuticCategories();
  const showSearch = visibleFilters.includes('search');
  const showCategory = visibleFilters.includes('category');
  const showSort = visibleFilters.includes('sort');
  const showGp = visibleFilters.includes('gp');
  const showTClass = visibleFilters.includes('tClass');

  const classOptions = (() => {
    const out: Array<{ value: string; label: string }> = [];
    const seen = new Set<string>();
    for (const c of therCategories?.data ?? []) {
      if (!c.name || seen.has(c.code)) {continue;}
      seen.add(c.code);
      out.push({ value: c.code, label: c.name });
    }
    return out.sort((a, b) => a.label.localeCompare(b.label));
  })();

  function toggleFilter(id: string, on: boolean) {
    setVisibleFilters((prev) =>
      on ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((f) => f !== id),
    );
  }

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
            <Grid align="center" gap="sm">
              {showSearch && (
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <Input
                    placeholder="Search…"
                    size="md"
                    radius="xl"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.currentTarget.value);
                      setPage(1);
                    }}
                    leftSection={<Search size={16} />}
                    styles={{ input: { borderColor: '#CFE5D7' } }}
                  />
                </Grid.Col>
              )}
              {showGp && (
                <Grid.Col span={{ base: 6, md: 2 }}>
                  <GenericFilter
                    size="md"
                    value={gp}
                    onChange={(v) => {
                      setGp(v);
                      setPage(1);
                    }}
                  />
                </Grid.Col>
              )}
              {showTClass && (
                <Grid.Col span={{ base: 6, md: 2 }}>
                  <Select
                    placeholder="Therapeutic class"
                    size="md"
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
                </Grid.Col>
              )}
              {showCategory && (
                <Grid.Col span={{ base: 6, md: 2 }}>
                  <Select
                    placeholder="Category"
                    size="md"
                    data={[
                      { value: '', label: 'All Categories' },
                      ...(categories || []).map((c: any) => ({
                        value: c.code,
                        label: c.name,
                      })),
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
              )}
              {showSort && (
                <Grid.Col span={{ base: 6, md: 2 }}>
                  <Select
                    placeholder="Sort"
                    size="md"
                    data={[
                      { value: 'createdAt', label: 'Newest' },
                      { value: 'name', label: 'Name A-Z' },
                    ]}
                    value={sort}
                    onChange={setSort}
                    radius="xl"
                  />
                </Grid.Col>
              )}
              <Grid.Col span={{ base: 6, md: 2 }} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Popover width={300} position="bottom-end" withArrow shadow="md">
                  <Popover.Target>
                    <Button
                      radius="xl"
                      size="md"
                      variant="light"
                      color="green"
                      fullWidth
                      leftSection={<SlidersHorizontal size={16} />}
                      styles={buttonStyles}
                    >
                      Filters
                    </Button>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Stack gap="xs" p="xs">
                      <Text size="sm" fw={700} style={{ color: ink }}>
                        Show / Hide filters
                      </Text>
                      {FILTER_DEFS.map((f) => (
                        <Checkbox
                          key={f.id}
                          checked={visibleFilters.includes(f.id)}
                          onChange={(e) => toggleFilter(f.id, e.currentTarget.checked)}
                          label={`${f.label}`}
                          description={f.desc}
                          size="sm"
                        />
                      ))}
                    </Stack>
                  </Popover.Dropdown>
                </Popover>
              </Grid.Col>
            </Grid>
          </Paper>

          {isFetching && <ThinProgress />}

          {isPending ? (
            <SkeletonCards cols={{ base: 1, sm: 2, lg: 4 }} count={8} />
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              {productsData?.data?.length ? (
                productsData.data.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : search || gp || tClass || category ? (
                <EmptySearchResults />
              ) : (
                <EmptyProducts />
              )}
            </SimpleGrid>
          )}

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