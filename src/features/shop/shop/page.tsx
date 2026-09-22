import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Combobox,
  Container,
  Group,
  Input,
  InputBase,
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
import { useMemo, useState } from 'react';
import { EmptyProducts, EmptySearchResults } from '../website/empty-states';
import { ProductCard, ListPagination } from '../website/components';
import { useProducts, useCategories, useGenericProductSearch, useTherapeuticCategories, useClassifications } from '../website/hooks';
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
  { id: 'search', label: 'Search', desc: 'Free-text search across product names and descriptions', icon: '🔍' },
  { id: 'category', label: 'Category', desc: 'Browse by therapeutic category and product groupings', icon: '📁' },
  { id: 'sort', label: 'Sort', desc: 'Order results by newest, name, or price', icon: '↕' },
  { id: 'gp', label: 'Generic Product', desc: 'Filter by generic name from the EMDEx drug database', icon: '💊' },
  { id: 'classification', label: 'Classification', desc: 'Filter by drug classification type — therapeutic, pharmaceutical, NDF, or EMDEx', icon: '🏷' },
];

const CLASSIFICATION_SOURCES: Record<string, string> = {
  therapeutic: 'drugs.com',
  pharmaceutical: 'goodrx',
  ndf: 'NDF/EDL',
  emdex: 'EMDEx (ATC)',
};

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
}: {
  value: string | null;
  onChange: (v: string | null) => void;
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
        <Box className="shop-filter-pill" style={{ width: '100%' }}>
          <span className="shop-filter-icon">
            <Pill size={14} />
          </span>
          <input
            className="shop-filter-input"
            type="text"
            placeholder="Generic product..."
            value={q || selectedLabel || ''}
            onChange={(e) => {
              const val = e.currentTarget.value;
              setQ(val);
              if (val === '' && value) {
                onChange(null);
              }
              combobox.openDropdown();
            }}
            onFocus={() => combobox.openDropdown()}
            onBlur={() => setQ('')}
          />
          {value && (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => { onChange(null); setQ(''); }}
              style={{ marginLeft: 4, flexShrink: 0 }}
            >
              <X size={12} />
            </ActionIcon>
          )}
        </Box>
      </Combobox.Target>
      <Combobox.Dropdown style={{ backgroundColor: 'white', zIndex: 20, borderRadius: 6 }}>
        <Combobox.Options style={{ maxHeight: 240, overflowY: 'auto' }}>
          {options.length === 0 ? (
            <Combobox.Empty>
              {q.length < 2 ? 'Type at least 2 characters…' : 'No generic products found'}
            </Combobox.Empty>
          ) : (
            options.slice(0, 12).map((o) => (
              <Combobox.Option key={o.value} value={o.value}>
                <Group justify="space-between" wrap="nowrap" gap={12}>
                  <Text size="xs" fw={600} lineClamp={1} style={{ flex: 1 }}>
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

export interface ShopPageProps {
  /**
   * Pre-select a category on first render (e.g. 'supermarket' for the
   * Shop Supermarket Items menu). Matched against real catalog categories
   * by code or name; the shopper's own pick (or clearing it) always wins.
   */
  presetCategory?: string;
  heading?: string;
  subheading?: string;
  /**
   * Server-side sort applied on first render (e.g. 'generic' for the
   * supermarket listing). The shopper's own sort pick always wins. Ordering is
   * resolved by the backend (`/website/products?sortBy=`).
   */
  defaultSort?: string;
}

export default function ShopPage({
  presetCategory,
  heading = 'Shop Medicines',
  subheading = 'Browse our catalog of authentic medicines and healthcare products.',
  defaultSort = 'purchases',
}: ShopPageProps) {
  const urlParams = new URLSearchParams(window.location.search);
  const qFromUrl = urlParams.get('q');
  const gpFromUrl = urlParams.get('gp');
  const classificationFromUrl = urlParams.get('classificationCode');
  // Clicking a category on /shop/categories lands here with ?category=<code>.
  const categoryFromUrl = urlParams.get('category');
  const [search, setSearch] = useState(typeof qFromUrl === 'string' ? qFromUrl : '');
  const [category, setCategory] = useState<string | null>(
    typeof categoryFromUrl === 'string' && categoryFromUrl ? categoryFromUrl : null,
  );
  const [page, setPage] = useState(1);
  // Defaults to Regularly Purchased (approved spec); server falls back to
  // createdAt when a sort value is unknown.
  const [sort, setSort] = useState<string>(defaultSort);
  // Compound option values (name_desc / price_desc) split into the API pair.
  const [sortField, sortDirRaw] = sort.split('_');
  const sortDir = sortDirRaw === 'desc' ? 'desc' : 'asc';
  const [gp, setGp] = useState<string | null>(
    typeof gpFromUrl === 'string' ? gpFromUrl : null,
  );
  const [classification, setClassification] = useState<string | null>(
    typeof classificationFromUrl === 'string' ? classificationFromUrl : null,
  );
  const [tClass, setTClass] = useState<string | null>(null);
  const [visibleFilters, setVisibleFilters] = useState<string[]>(
    FILTER_DEFS.map((f) => f.id),
  );

  const { data: categories } = useCategories();

  // Resolve the preset label against the real catalog: exact code/name first,
  // then a contains-match (so 'supermarket' finds 'supermarket-essentials').
  const presetCode = useMemo(() => {
    if (!presetCategory || !categories?.length) return null;
    const q = presetCategory.toLowerCase();
    const list = categories as Array<{ code?: string; name?: string }>;
    const exact = list.find(
      (c) => c.code?.toLowerCase() === q || c.name?.toLowerCase() === q,
    );
    if (exact?.code) return exact.code;
    const partial = list.find(
      (c) =>
        c.code?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q),
    );
    return partial?.code ?? null;
  }, [presetCategory, categories]);

  // Manual category picks (including clearing) take precedence over the preset.
  const [categoryTouched, setCategoryTouched] = useState(false);
  const activeCategory = categoryTouched ? category : (category ?? presetCode);

  const { data: productsData, isPending, isFetching } = useProducts({
    search,
    category: activeCategory || '',
    genericProductCode: gp || '',
    therapeuticCategory: tClass || '',
    classificationCode: classification || '',
    // Drives GET /website/products?sortBy=&sortOrder= — whitelisted server-side.
    sortBy: sortField,
    sortOrder: sortDir,
    page,
    limit: 20,
  });

  const { data: therCategories } = useTherapeuticCategories();
  const { data: therapeuticCls } = useClassifications('therapeutic');
  const { data: pharmaceuticalCls } = useClassifications('pharmaceutical');
  const { data: ndfCls } = useClassifications('ndf');
  const { data: emdexCls } = useClassifications('emdex');
  const showSearch = visibleFilters.includes('search');
  const showCategory = visibleFilters.includes('category');
  const showSort = visibleFilters.includes('sort');
  const showGp = visibleFilters.includes('gp');
  const showTClass = FILTER_DEFS.findIndex((el) => el.id ==='tClass') > -1 && visibleFilters.includes('tClass');
  const showClassification = visibleFilters.includes('classification');

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
      <style>{`
        .shop-filter-pill {
          display: inline-flex;
          align-items: center;
          background: #F7FBF9;
          border: 2px solid #CFE5D7;
          border-radius: 999px;
          padding: 0 .75rem;
          min-height: 36px;
          transition: border-color .25s, background .25s, width .35s cubic-bezier(0.22,1,0.36,1);
        }
        .shop-filter-pill:focus-within {
          border-color: ${green};
          background: #fff;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.08);
        }
        .shop-filter-pill .shop-filter-icon {
          display: flex;
          color: ${muted};
          flex-shrink: 0;
          margin-right: .5rem;
        }
        .shop-filter-pill .shop-filter-input {
          border: none !important;
          background: transparent !important;
          outline: none !important;
          color: ${ink};
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          padding: 0 !important;
          min-width: 0;
          width: 100%;
        }
        .shop-filter-pill .shop-filter-input::placeholder {
          color: ${muted};
          opacity: 1;
        }
        .shop-filter-pill .mantine-InputInput-root,
        .shop-filter-pill .mantine-Select-input {
          border: none !important;
          background: transparent !important;
          outline: none !important;
          padding: 0 !important;
          height: auto !important;
          min-height: auto !important;
        }
        .shop-filter-pill .mantine-InputWrapper-wrapper {
          border: none !important;
          background: transparent !important;
        }
        .shop-filter-pill .mantine-Input-leftSection {
          display: none;
        }
        .shop-filter-pill .mantine-Input-rightSection {
          right: 0;
        }
      `}</style>
      <Container size="xl" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>            <Title order={1} className="damorex-heading" style={{ color: ink, letterSpacing: '-0.03em' }}>
              {heading}
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              {subheading}
            </Text>
          </Box>

          <Paper radius={24} p="md" withBorder style={{ borderColor: line, background: soft }}>
            {/*
              Flex row instead of Grid: hidden filters collapse to zero width
              instead of freeing a column, so the right-aligned Filters button
              stays pinned while controls are toggled on and off. Controls flex
              and shrink (min-width floor) so the row never overflows and no
              select hangs past the paper edge.
            */}
            <Group align="center" gap="sm" wrap="nowrap" justify="space-between">
              {/* <Group align="center" gap="sm" wrap="nowrap" style={{ flex: '1 1 auto', minWidth: 0 }}> */}
                {showSearch && (
                  <Box style={{ flex: '1 1 0', minWidth: 0 }}>
                    <Box className="shop-filter-pill" style={{ width: '100%' }}>
                      <span className="shop-filter-icon">
                        <Search size={14} />
                      </span>
                      <input
                        className="shop-filter-input"
                        type="search"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.currentTarget.value);
                          setPage(1);
                        }}
                      />
                    </Box>
                  </Box>
                )}
                {showGp && (
                  <Box style={{ flex: '1 1 0', minWidth: 0 }}>
                    <GenericFilter
                      value={gp}
                      onChange={(v) => {
                        setGp(v);
                        setPage(1);
                      }}
                    />
                  </Box>
                )}
                {showTClass && (
                  <Box style={{ flex: '1 1 0', minWidth: 0 }}>
                    <Box className="shop-filter-pill" style={{ width: '100%' }}>
                      <span className="shop-filter-icon">
                        <ChevronDown size={14} />
                      </span>
                      <Select
                        placeholder="Therapeutic class"
                        data={classOptions}
                        value={tClass}
                        onChange={(v) => { setTClass(v); setPage(1); }}
                        searchable
                        clearable
                        limit={50}
                        maxDropdownHeight={280}
                        nothingFoundMessage="No classes found"
                        size="xs"
                        variant="unstyled"
                        style={{ flex: 1, minWidth: 0 }}
                      />
                    </Box>
                  </Box>
                )}
                {showClassification && (
                  <Box style={{ flex: '1 1 0', minWidth: 0 }}>
                    <Box className="shop-filter-pill" style={{ width: '100%' }}>
                      <span className="shop-filter-icon">
                        <ChevronDown size={14} />
                      </span>
                      <Select
                        placeholder="Classification"
                        data={classificationOptions}
                        value={classification}
                        onChange={(v) => { setClassification(v); setPage(1); }}
                        searchable
                        clearable
                        limit={50}
                        maxDropdownHeight={280}
                        nothingFoundMessage="No classifications found"
                        size="xs"
                        variant="unstyled"
                        style={{ flex: 1, minWidth: 0 }}
                      />
                    </Box>
                  </Box>
                )}
                {showCategory && (
                  <Box style={{ flex: '1 1 0', minWidth: 0 }}>
                    <Box className="shop-filter-pill" style={{ width: '100%' }}>
                      <span className="shop-filter-icon">
                        <ChevronDown size={14} />
                      </span>
                      <Select
                        placeholder="Category"
                        data={[
                          { value: '', label: 'All Categories' },
                          ...(categories || []).map((c: any) => ({
                            value: c.code,
                            label: c.name,
                          })),
                        ]}
                        value={activeCategory}
                        onChange={(v) => {
                          // Manual selection (or clearing) beats the preset.
                          setCategoryTouched(true);
                          setCategory(v);
                          setPage(1);
                        }}
                        clearable
                        maxDropdownHeight={280}
                        size="xs"
                        variant="unstyled"
                        style={{ flex: 1, minWidth: 0 }}
                      />
                    </Box>
                  </Box>
                )}
                {showSort && (
                  <Box style={{ flex: '1 1 0', minWidth: 0 }}>
                    <Box className="shop-filter-pill" style={{ width: '100%' }}>
                      <span className="shop-filter-icon">
                        <ChevronDown size={14} />
                      </span>
                      <select
                        className="shop-filter-input"
                        aria-label="Sort products"
                        value={sort}
                        onChange={(e) => {
                          setSort(e.currentTarget.value);
                          setPage(1);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="purchases">Regularly Purchased</option>
                        <option value="generic">Generic (image first)</option>
                        <option value="name">Name A-Z</option>
                        <option value="name_desc">Name Z-A</option>
                        <option value="price">Lowest – Highest Price</option>
                        <option value="price_desc">Highest – Lowest Price</option>
                        <option value="createdAt">Newest</option>
                      </select>
                    </Box>
                  </Box>
                )}
              {/* </Group> */}
              <Box style={{ flexShrink: 0 }}>
                <Popover width={300} position="bottom-end" withArrow shadow="md">
                  <Popover.Target>
                    <Button
                      radius="xl"
                      size="md"
                      variant="light"
                      color="green"
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
              </Box>
            </Group>
          </Paper>

          {productsData && productsData.total > productsData.limit ? (
            <ListPagination
              withCount
              total={productsData.total}
              limit={productsData.limit}
              page={page}
              onChange={setPage}
            />
          ) : null}

          {isFetching && <ThinProgress />}

          {selectedClassification ? (
            <Text size="sm" c={muted}>
              Filtering by <strong>{selectedClassification.label}</strong> — source:{' '}
              {CLASSIFICATION_SOURCES[selectedClassification.type] ?? selectedClassification.type}
            </Text>
          ) : null}

          {isPending ? (
            <SkeletonCards cols={{ base: 1, sm: 2, lg: 4 }} count={8} />
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              {productsData?.data?.length ? (
                productsData.data.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : search || gp || tClass || activeCategory || classification ? (
                <EmptySearchResults />
              ) : (
                <EmptyProducts />
              )}
            </SimpleGrid>
          )}

          {productsData && productsData.total > productsData.limit ? (
            <ListPagination
              total={productsData.total}
              limit={productsData.limit}
              page={page}
              onChange={setPage}
            />
          ) : null}
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}