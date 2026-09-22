/**
 * Pharmacy Drug Store Locator — search the 7.9k licensed-pharmacy register by
 * name/pharmacist/address and state, or find the nearest premises to your
 * location. In browse mode pins aggregate as count bubbles on their LGA
 * centroid (the register carries no point coordinates); in nearby mode the
 * registry's settlement coordinates give precise, distance-sorted pins.
 */
import { Badge, Box, Button, Divider, Group, SegmentedControl, Select, Stack, Text } from '@mantine/core';
import { ListFilter, LocateFixed, MapPin, Navigation } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { NearbyPharmacyRecord, PharmacyRecord } from './api';
import {
  useCentroids,
  useDebounced,
  useLgas,
  useLocalityOptions,
  useNearbyPharmacies,
  usePharmacySearch,
  useStates,
  useUserLocation,
  useWardOptions,
} from './hooks';
import { WebsiteLayout } from '../website/layout';
import { locatorTheme, LocatorShell, ResultCard } from './locator-shell';
import { escapeHtml, type MapFocus, type MapPoint } from './locator-map';

const RADIUS_OPTIONS = [
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
  { value: '25', label: 'Within 25 km' },
  { value: '50', label: 'Within 50 km' },
  { value: '100', label: 'Within 100 km' },
];

export default function PharmacyLocatorPage() {
  const [searchInput, setSearchInput] = useState('');
  const [stateCode, setStateCode] = useState<string | null>(null);
  const [lgaCode, setLgaCode] = useState<string | null>(null);
  const [wardName, setWardName] = useState<string | null>(null);
  const [areaName, setAreaName] = useState<string | null>(null);
  const [neighbourhoodName, setNeighbourhoodName] = useState<string | null>(null);
  const [settlementName, setSettlementName] = useState<string | null>(null);
  const [wardSearch, setWardSearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [neighbourhoodSearch, setNeighbourhoodSearch] = useState('');
  const [settlementSearch, setSettlementSearch] = useState('');
  const [page, setPage] = useState(1);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const [nearby, setNearby] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);

  const locationCtl = useUserLocation();
  const nearbyActive = nearby && Boolean(locationCtl.location);

  const debouncedSearch = useDebounced(searchInput, 450);
  const states = useStates();
  const lgas = useLgas(stateCode);
  const lgaCentroids = useCentroids('lga');
  const wardOptions = useWardOptions(wardSearch, lgaCode, stateCode, true && !nearbyActive);
  const areaOptions = useLocalityOptions('area', areaSearch, true);
  const neighbourhoodOptions = useLocalityOptions('neighbourhood', neighbourhoodSearch, true);
  const settlementOptions = useLocalityOptions('settlement', settlementSearch, true);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stateCode, lgaCode, wardName, areaName, neighbourhoodName, settlementName]);

  const browse = usePharmacySearch(
    {
      search: debouncedSearch,
      stateCode,
      lgaCode,
      wardName,
      areaName,
      neighbourhoodName,
      settlementName,
    },
    page,
    12,
  );
  const near = useNearbyPharmacies(locationCtl.location, radiusKm, 50);
  const loadState = nearbyActive ? near.state : browse.state;
  const loading = loadState === 'loading';
  const errored = loadState === 'error';

  const mapPoints = useMemo<MapPoint[]>(() => {
    if (nearbyActive) {
      return near.rows.map((p) => ({
        key: `p-${p.id}`,
        latitude: p.latitude,
        longitude: p.longitude,
        title: p.premisesName || 'Unnamed premises',
        subtitle: `${[p.wardName, p.lgaName, p.stateName].filter(Boolean).join(', ')} · ${formatDistance(p.distanceKm)}`,
        pinKind: 'pharmacy' as const,
        detail: pharmacyContactHtml(p),
      }));
    }
    // Browse mode: aggregate this page's records as count bubbles per LGA.
    // Centroid lookup prefers the LGA *name* (the shared currency between the
    // pharmacy and facility registries) — LGA codes come from two different
    // coding schemes and can collide across registries. Fall back to code.
    // Centroid lookup: prefer the LGA *name* (the shared currency between the
    // pharmacy and facility registries) — LGA codes come from two different
    // coding schemes and can collide across registries. Fall back to code.
    const byCode = new Map(lgaCentroids.map((c) => [c.code, c]));
    const byName = new Map(lgaCentroids.map((c) => [c.name.trim().toLowerCase(), c]));
    const centroidFor = (p: PharmacyRecord) =>
      byName.get((p.lga?.name ?? p.lgaName ?? '').trim().toLowerCase()) ||
      (p.lga?.code && byCode.get(p.lga.code)) ||
      undefined;

    const byKey = new Map<string, { label: string; pharmacies: PharmacyRecord[] }>();
    for (const p of browse.rows) {
      const areaKey = p.lga?.code ?? p.lgaName ?? p.stateCode ?? p.premisesState ?? '?';
      const label =
        p.lga?.name ?? p.lgaName ?? p.stateName ?? p.premisesState ?? 'Unknown area';
      const bucket = byKey.get(areaKey) ?? { label, pharmacies: [] };
      bucket.pharmacies.push(p);
      byKey.set(areaKey, bucket);
    }
    return [...byKey.entries()].map(([areaKey, bucket]) => {
      const centroid = centroidFor(bucket.pharmacies[0]);
      return {
        key: `pb-${areaKey}`,
        latitude: centroid?.latitude ?? 9.082,
        longitude: centroid?.longitude ?? 8.6753,
        title: `${bucket.pharmacies.length} pharmacy${bucket.pharmacies.length === 1 ? '' : 'ies'} — ${bucket.label}`,
        subtitle: 'Licensed premises in this area',
        pinKind: 'pharmacy' as const,
        bubble: { count: bucket.pharmacies.length, label: bucket.label },
        detail: `<div style="margin-top:6px">${bucket.pharmacies
          .slice(0, 6)
          .map(
            (p) =>
              `<div style="font-size:12px;color:${locatorTheme.text}">• ${escapeHtml(
                p.premisesName || 'Unnamed premises',
              )}</div>`,
          )
          .join('')}${
          bucket.pharmacies.length > 6
            ? `<div style="font-size:12px;color:${locatorTheme.text}">+ ${bucket.pharmacies.length - 6} more on this page</div>`
            : ''
        }</div>`,
      } satisfies MapPoint;
    });
  }, [nearbyActive, near.rows, browse.rows, lgaCentroids]);

  // Click-to-zoom: nearby mode flies to the pharmacy's precise pin; browse
  // mode flies to its area bubble.
  const focus = useMemo<MapFocus | null>(() => {
    if (!highlightKey) return null;
    if (nearbyActive) {
      const point = mapPoints.find((pt) => pt.key === highlightKey);
      return point ? { key: highlightKey, latitude: point.latitude, longitude: point.longitude, zoom: 15 } : null;
    }
    const p = browse.rows.find((r) => `p-${r.id}` === highlightKey);
    if (!p) return null;
    const areaKey = p.lga?.code ?? p.lgaName ?? p.stateCode ?? p.premisesState ?? '?';
    const point = mapPoints.find((pt) => pt.key === `pb-${areaKey}`);
    if (point) {
      return { key: highlightKey, latitude: point.latitude, longitude: point.longitude, zoom: 13 };
    }
    return null;
  }, [highlightKey, nearbyActive, browse.rows, mapPoints]);

  const mapFitKey = useMemo(
    () =>
      nearbyActive
        ? `nearby|${locationCtl.location?.latitude},${locationCtl.location?.longitude}|${radiusKm}`
        : `${debouncedSearch}|${stateCode}|${lgaCode}|${wardName}|${areaName}|${neighbourhoodName}|${settlementName}|${page}`,
    [nearbyActive, locationCtl.location, radiusKm, debouncedSearch, stateCode, lgaCode, wardName, areaName, neighbourhoodName, settlementName, page],
  );

  const count = nearbyActive ? (near.meta?.total ?? near.rows.length) : (browse.meta?.total ?? browse.rows.length);

  const toggleNearby = (active: boolean) => {
    setNearby(active);
    setHighlightKey(null);
    if (active) {
      locationCtl.request();
    } else {
      locationCtl.reset();
    }
  };

  return (
    <WebsiteLayout>
      <LocatorShell
        title="Pharmacy & Drug Store Locator"
        subtitle="Find licensed pharmacies and drug stores across Nigeria by name, pharmacist or location — or see the ones nearest to you."
        searchPlaceholder="Search by premises, pharmacist or address (e.g. Sahad Pharmacy)…"
        states={states}
        search={searchInput}
        onSearchChange={setSearchInput}
        stateCode={stateCode}
        onStateChange={(v) => {
          setStateCode(v);
          setLgaCode(null);
          setWardName(null);
        }}
        lgas={lgas}
        onLgaChange={(v) => {
          setLgaCode(v);
          setWardName(null);
        }}
        extraFilters={
          nearbyActive
            ? []
            : [
                {
                  key: 'ward',
                  placeholder: 'All wards',
                  value: wardName,
                  onChange: (v) => setWardName(v),
                  options: wardOptions.options.map((w) => ({ value: w.name, label: w.name })),
                  loading: wardOptions.loading,
                  disabled: !lgaCode,
                  onSearchChange: setWardSearch,
                  searchQuery: wardSearch,
                },
                {
                  key: 'area',
                  placeholder: 'All areas',
                  value: areaName,
                  onChange: (v) => setAreaName(v),
                  options: areaOptions.options.map((a) => ({ value: a.name, label: a.name })),
                  loading: areaOptions.loading,
                  onSearchChange: setAreaSearch,
                  searchQuery: areaSearch,
                },
                {
                  key: 'neighbourhood',
                  placeholder: 'All neighbourhoods',
                  value: neighbourhoodName,
                  onChange: (v) => setNeighbourhoodName(v),
                  options: neighbourhoodOptions.options.map((n) => ({ value: n.name, label: n.name })),
                  loading: neighbourhoodOptions.loading,
                  onSearchChange: setNeighbourhoodSearch,
                  searchQuery: neighbourhoodSearch,
                },
                {
                  key: 'settlement',
                  placeholder: 'All settlements',
                  value: settlementName,
                  onChange: (v) => setSettlementName(v),
                  options: settlementOptions.options.map((s) => ({ value: s.name, label: s.name })),
                  loading: settlementOptions.loading,
                  onSearchChange: setSettlementSearch,
                  searchQuery: settlementSearch,
                },
              ]
        }
        action={
          <Group gap="sm" align="center" wrap="nowrap">
            {nearbyActive ? (
              <Select
                w={150}
                data={RADIUS_OPTIONS}
                value={String(radiusKm)}
                onChange={(v) => setRadiusKm(Number(v ?? 10))}
                allowDeselect={false}
              />
            ) : null}
            <SegmentedControl
              value={nearby ? 'near' : 'browse'}
              onChange={(v) => toggleNearby(v === 'near')}
              data={[
                {
                  value: 'browse',
                  label: (
                    <Group gap={6} wrap="nowrap" miw={72} justify="center">
                      <ListFilter size={14} />
                      <span>Browse</span>
                    </Group>
                  ),
                },
                {
                  value: 'near',
                  label: (
                    <Group gap={6} wrap="nowrap" miw={72} justify="center">
                      <LocateFixed size={14} />
                      <span>Near me</span>
                    </Group>
                  ),
                },
              ]}
              color={locatorTheme.teal}
            />
          </Group>
        }
        filtersDisabled={nearbyActive}
        filtersHint={
          !nearby
            ? null
            : locationCtl.status === 'locating'
              ? 'Determining your location…'
              : locationCtl.status === 'denied' || locationCtl.status === 'error'
                ? (locationCtl.errorMessage ??
                   'Location unavailable — allow location access in your browser, or switch to Browse and search by name.')
                : locationCtl.location?.approx
                  ? `Using an approximate location (±~10 km). Showing pharmacies within ${radiusKm} km.`
                  : `Showing pharmacies within ${radiusKm} km of your location.`
        }
        userLocation={nearbyActive ? locationCtl.location : null}
        meta={
          nearbyActive
            ? { page: 1, limit: 50, total: count }
            : browse.meta
        }
        page={page}
        onPageChange={(p) => {
          setPage(p);
          setHighlightKey(null);
        }}
        loading={loading}
        error={errored}
        resultCount={nearbyActive ? near.rows.length : browse.rows.length}
        mapPoints={mapPoints}
        mapFitKey={mapFitKey}
        highlightKey={highlightKey}
        focus={focus}
        emptyHint={
          nearbyActive
            ? 'No pharmacies found within this radius. Try widening the radius, or switch to Browse to search by name.'
            : undefined
        }
      >
        {nearbyActive
          ? near.rows.map((p) => {
              const key = `p-${p.id}`;
              return (
                <ResultCard
                  key={key}
                  selected={highlightKey === key}
                  onClick={() => setHighlightKey(highlightKey === key ? null : key)}
                >
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Box flex={1} miw={0}>
                      <Text fw={800} size="md" c={locatorTheme.ink} truncate="end">
                        {p.premisesName || 'Unnamed premises'}
                      </Text>
                      <Group gap={6} mt={4} wrap="wrap">
                        {p.category ? (
                          <Badge size="sm" variant="light" color="orange">
                            {p.category}
                          </Badge>
                        ) : null}
                      </Group>
                      {p.premisesAddress ? (
                        <Text size="sm" c={locatorTheme.muted} mt={6}>
                          <MapPin size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                          {p.premisesAddress}
                        </Text>
                      ) : null}
                      <Text size="sm" c={locatorTheme.muted} mt={4}>
                        {[p.wardName, p.lgaName, p.stateName].filter(Boolean).join(', ')}
                      </Text>
                    </Box>
                    <Badge
                      leftSection={<Navigation size={11} />}
                      variant="light"
                      color={highlightKey === key ? 'teal' : 'green'}
                      size="lg"
                    >
                      {formatDistance(p.distanceKm)}
                    </Badge>
                  </Group>
                  {pharmacistName(p) || p.certificateNo ? (
                    <>
                      <Divider my="xs" color={locatorTheme.line} />
                      <Group gap="md">
                        {pharmacistName(p) ? (
                          <Text size="xs" c={locatorTheme.muted}>
                            Superintendent: {pharmacistName(p)}
                          </Text>
                        ) : null}
                        {p.certificateNo ? (
                          <Text size="xs" c={locatorTheme.muted}>
                            Cert. {p.certificateNo}
                          </Text>
                        ) : null}
                      </Group>
                    </>
                  ) : null}
                </ResultCard>
              );
            })
          : browse.rows.map((p) => {
          const key = `p-${p.id}`;
          return (
            <ResultCard
              key={key}
              selected={highlightKey === key}
              onClick={() => setHighlightKey(highlightKey === key ? null : key)}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Box flex={1} miw={0}>
                  <Text fw={800} size="md" c={locatorTheme.ink} truncate="end">
                    {p.premisesName || 'Unnamed premises'}
                  </Text>
                  <Group gap={6} mt={4} wrap="wrap">
                    {p.category ? (
                      <Badge size="sm" variant="light" color="orange">
                        {p.category}
                      </Badge>
                    ) : null}
                    {p.yearLicenced ? (
                      <Badge size="sm" variant="light" color="gray">
                        Lic. {p.yearLicenced}
                      </Badge>
                    ) : null}
                  </Group>
                  {p.premisesAddress ? (
                    <Text size="sm" c={locatorTheme.muted} mt={6}>
                      <MapPin size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                      {p.premisesAddress}
                    </Text>
                  ) : null}
                  <Text size="sm" c={locatorTheme.muted} mt={4}>
                    {areaLine(p)}
                  </Text>
                </Box>
              </Group>
              {pharmacistName(p) || p.certificateNo ? (
                <>
                  <Divider my="xs" color={locatorTheme.line} />
                  <Group gap="md">
                    {pharmacistName(p) ? (
                      <Text size="xs" c={locatorTheme.muted}>
                        Superintendent: {pharmacistName(p)}
                      </Text>
                    ) : null}
                    {p.certificateNo ? (
                      <Text size="xs" c={locatorTheme.muted}>
                        Cert. {p.certificateNo}
                      </Text>
                      ) : null}
                  </Group>
                </>
              ) : null}
            </ResultCard>
          );
        })}
      </LocatorShell>
    </WebsiteLayout>
  );
}

function pharmacistName(p: PharmacyRecord | NearbyPharmacyRecord): string | null {
  if ('pharmacist' in p && p.pharmacist && p.pharmacist.trim()) return p.pharmacist.trim();
  if ('pharmacistFirstName' in p) {
    const parts = [p.pharmacistFirstName, p.pharmacistLastName].filter(Boolean);
    return parts.length ? parts.join(' ') : null;
  }
  return null;
}

function areaLine(p: PharmacyRecord): string {
  const parts = [p.lga?.name ?? p.lgaName, p.stateName ?? p.premisesState].filter(Boolean);
  return parts.join(', ');
}

function pharmacyContactHtml(p: NearbyPharmacyRecord): string {
  const rows: string[] = [];
  if (p.category) {
    rows.push(`<div style="font-size:12px;color:${locatorTheme.text}">${escapeHtml(p.category)}</div>`);
  }
  if (p.pharmacist) {
    rows.push(`<div style="font-size:12px;color:${locatorTheme.text}">Superintendent: ${escapeHtml(p.pharmacist)}</div>`);
  }
  return rows.length ? `<div style="margin-top:6px">${rows.join('')}</div>` : '';
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
