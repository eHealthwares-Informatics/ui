/**
 * Shared shell for the locator pages: hero band, filter bar (name search +
 * state/LGA selects + page-supplied extra selects), results list with
 * pagination on the left and the sticky Leaflet map on the right.
 */
import type { ReactNode } from 'react';
import {
  Alert,
  Anchor,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Loader as MantineLoader,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Select as MantineSelect,
} from '@mantine/core';
import { AlertTriangle, RotateCcw, Search, X } from 'lucide-react';
import { LocatorMap, type MapFocus, type MapPoint } from './locator-map';
import type { ConceptsState, ListMeta } from './api';

export const locatorTheme = {
  green: '#16A34A',
  darkGreen: '#0F6F35',
  teal: '#0D9488',
  ink: '#0F172A',
  muted: '#64748B',
  line: '#DDE7E2',
  soft: '#F7FBF9',
  /** Light text used on the dark map popups. */
  text: '#E2E8F0',
};

export interface ExtraFilter {
  key: string;
  placeholder: string;
  value: string | null;
  onChange: (v: string | null) => void;
  options: { value: string; label: string }[];
  loading?: boolean;
  disabled?: boolean;
  /** Server-side search: called as the user types in the dropdown. */
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
}

export interface LocatorShellProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  states: ConceptsState[];
  lgas?: { code: string; name: string }[];
  search: string;
  onSearchChange: (v: string) => void;
  stateCode: string | null;
  onStateChange: (v: string | null) => void;
  lgaCode?: string | null;
  onLgaChange?: (v: string | null) => void;
  /** Page-supplied selects rendered after the LGA select. */
  extraFilters?: ExtraFilter[];
  /**
   * Optional control rendered beside the Reset button (e.g. the "Near me"
   * toggle). Reset does NOT clear it — the page owns its lifecycle.
   */
  action?: ReactNode;
  /** When true (nearby mode), the name/location filters are inert. */
  filtersDisabled?: boolean;
  filtersHint?: string | null;
  meta: ListMeta | null;
  page: number;
  onPageChange: (p: number) => void;
  loading: boolean;
  error: boolean;
  resultCount: number;
  mapPoints: MapPoint[];
  mapFitKey: string;
  highlightKey: string | null;
  /** Click-to-zoom: fly the map to the selected record. */
  focus?: MapFocus | null;
  /** The user's position, rendered as a pulsing blue dot on the map. */
  userLocation?: { latitude: number; longitude: number } | null;
  children: ReactNode;
  emptyHint?: string;
}

export function LocatorShell(props: LocatorShellProps) {
  const {
    title,
    subtitle,
    searchPlaceholder,
    states,
    lgas,
    search,
    onSearchChange,
    stateCode,
    onStateChange,
    lgaCode,
    onLgaChange,
    extraFilters,
    action,
    filtersDisabled = false,
    filtersHint,
    meta,
    page,
    onPageChange,
    loading,
    error,
    resultCount,
    mapPoints,
    mapFitKey,
    highlightKey,
    focus,
    userLocation,
    children,
    emptyHint,
  } = props;

  const extraActive = (extraFilters ?? []).some((f) => Boolean(f.value));
  const hasFilters = Boolean(search || stateCode || lgaCode) || extraActive;
  const resetAll = () => {
    onSearchChange('');
    onStateChange(null);
    onLgaChange?.(null);
    (extraFilters ?? []).forEach((f) => f.value !== null && f.onChange(null));
  };
  // Pharmacies meta carries only { page, limit, total } — derive totalPages.
  const totalPages = meta
    ? Math.max(1, Math.min(meta.totalPages ?? Math.ceil(meta.total / (meta.limit || 1)), 500))
    : 1;

  return (
    <Box>
      {/* Hero */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${locatorTheme.teal} 0%, ${locatorTheme.darkGreen} 100%)`,
          padding: '40px 0',
        }}
      >
        <Stack gap={6} px="xl">
          <Text fw={900} fz={34} c="white">
            {title}
          </Text>
          <Text size="lg" c="rgba(255,255,255,0.92)" maw={720}>
            {subtitle}
          </Text>
        </Stack>
      </Box>

      {/* Filters */}
      <Paper radius={0} withBorder style={{ borderColor: locatorTheme.line }} py="md">
        <Stack gap="sm" px="xl">
          {filtersHint ? (
            <Text size="sm" c={locatorTheme.muted}>
              {filtersHint}
            </Text>
          ) : null}
          <Group gap="md" wrap="wrap" align="flex-end">
            <TextInput
              flex={2}
              miw={220}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
              leftSection={<Search size={16} />}
              disabled={filtersDisabled}
              rightSection={
                search ? (
                  <Anchor
                    c="dimmed"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </Anchor>
                ) : undefined
              }
            />
            <MantineSelect
              flex={1}
              miw={160}
              placeholder="All states"
              data={(states ?? []).map((s) => ({ value: s.code, label: s.name }))}
              value={stateCode}
              onChange={(v) => onStateChange(v ?? null)}
              searchable
              clearable
              disabled={filtersDisabled}
            />
            {lgas && onLgaChange ? (
              <MantineSelect
                flex={1}
                miw={160}
                placeholder="All LGAs"
                data={lgas.map((l) => ({ value: l.code, label: l.name }))}
                value={lgaCode ?? null}
                onChange={(v) => onLgaChange?.(v ?? null)}
                searchable
                clearable
                disabled={!stateCode || filtersDisabled}
              />
            ) : null}
            {action}
            {hasFilters ? (
              <Button
                variant="subtle"
                color="gray"
                leftSection={<RotateCcw size={14} />}
                onClick={resetAll}
              >
                Reset
              </Button>
            ) : null}
          </Group>
          {(extraFilters ?? []).length > 0 ? (
            <Group gap="md" wrap="wrap" align="flex-end">
              {extraFilters!.map((f) => (
                <MantineSelect
                  key={f.key}
                  flex={1}
                  miw={160}
                  placeholder={f.placeholder}
                  data={f.options}
                  value={f.value}
                  onChange={(v) => f.onChange(v ?? null)}
                  searchable={f.onSearchChange ? true : f.options.length > 12}
                  searchValue={f.onSearchChange ? f.searchQuery : undefined}
                  onSearchChange={f.onSearchChange}
                  clearable
                  disabled={f.disabled}
                  leftSection={f.loading ? <MantineLoader size={12} /> : undefined}
                />
              ))}
            </Group>
          ) : null}
        </Stack>
      </Paper>

      {/* Results + map */}
      <Grid px="xl" py="lg" m={0}>
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={800} size="lg" c={locatorTheme.ink}>
                {loading ? 'Searching…' : `${formatCount(meta?.total ?? resultCount)} found`}
              </Text>
              {meta && meta.total > (meta.limit ?? 0) ? (
                <Text size="sm" c={locatorTheme.muted}>
                  Page {meta.page} of {totalPages}
                </Text>
              ) : null}
            </Group>

            {error ? (
              <Alert
                icon={<AlertTriangle size={18} />}
                color="red"
                variant="light"
                title="Could not load results"
              >
                The facility registry service is unreachable right now. Please try
                again in a moment.
              </Alert>
            ) : loading && resultCount === 0 ? (
              <Stack gap="sm">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} height={104} radius="lg" />
                ))}
              </Stack>
            ) : !loading && resultCount === 0 ? (
              <Paper withBorder radius="lg" p="xl" style={{ borderColor: locatorTheme.line }}>
                <Stack align="center" gap="xs" py="md">
                  <Search size={28} color={locatorTheme.muted} />
                  <Text fw={700}>No matches found</Text>
                  <Text size="sm" c={locatorTheme.muted} ta="center" maw={380}>
                    {emptyHint ??
                      'Try a shorter name, or clear the location filters to widen the search.'}
                  </Text>
                  {hasFilters ? (
                    <Button mt="xs" variant="light" onClick={resetAll}>
                      Clear filters
                    </Button>
                  ) : null}
                </Stack>
              </Paper>
            ) : (
              <>
                <Stack gap="sm">{children}</Stack>
                {meta && totalPages > 1 ? (
                  <Group justify="center" pt="xs">
                    <Pagination
                      value={Math.min(page, totalPages)}
                      onChange={onPageChange}
                      total={totalPages}
                      siblings={1}
                      color={locatorTheme.teal}
                    />
                  </Group>
                ) : null}
              </>
            )}
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Box
            style={{
              position: 'sticky',
              top: 16,
            }}
          >
            <LocatorMap
              points={mapPoints}
              fitKey={mapFitKey}
              highlightKey={highlightKey}
              focus={focus}
              userLocation={userLocation}
              height="min(70vh, 640px)"
            />
            <Text size="xs" c={locatorTheme.muted} mt={6}>
              {mapPoints.length > 0
                ? 'Showing the current page of results on the map. Click a pin for details.'
                : 'Map will show results once records with locations are found.'}
            </Text>
          </Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

export function ResultCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Card
      withBorder
      radius="lg"
      padding="md"
      onClick={onClick}
      style={{
        borderColor: selected ? locatorTheme.teal : locatorTheme.line,
        borderWidth: selected ? 2 : 1,
        cursor: 'pointer',
        transition: 'box-shadow 150ms ease, border-color 150ms ease',
        boxShadow: selected ? `0 0 0 3px ${locatorTheme.teal}22` : undefined,
      }}
    >
      {children}
    </Card>
  );
}

function formatCount(n: number): string {
  return n.toLocaleString();
}
