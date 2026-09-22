/**
 * Health Facility/Hospital Locator — search the 97k-facility registry by
 * name, state and LGA, or find the nearest facilities to your location
 * (browser geolocation, distance-sorted via the /v1/facilities/nearby
 * endpoint). Results render as cards on the left and clustered precise pins
 * on the map (facilities are ~98% geo-tagged); the few without coordinates
 * aggregate as count bubbles on their LGA centroid.
 */
import { Badge, Box, Button, Divider, Group, SegmentedControl, Select, Stack, Text } from '@mantine/core';
import { ListFilter, LocateFixed, MapPin, Navigation } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Centroid, FacilityRecord, NearbyFacilityRecord } from './api';
import {
  useCentroids,
  useDebounced,
  useFacilitySearch,
  useLgas,
  useNearbyFacilities,
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

export default function FacilityLocatorPage() {
  const [searchInput, setSearchInput] = useState('');
  const [stateCode, setStateCode] = useState<string | null>(null);
  const [lgaCode, setLgaCode] = useState<string | null>(null);
  const [wardName, setWardName] = useState<string | null>(null);
  const [wardSearch, setWardSearch] = useState('');
  const [page, setPage] = useState(1);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const [nearby, setNearby] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);

  const locationCtl = useUserLocation();
  const nearbyActive = nearby && Boolean(locationCtl.location);

  const debouncedSearch = useDebounced(searchInput, 450);
  const states = useStates();
  const lgas = useLgas(stateCode);
  const wardOptions = useWardOptions(wardSearch, lgaCode, stateCode, true && !nearbyActive);

  // Reset to page 1 whenever filters change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stateCode, lgaCode, wardName]);

  const browse = useFacilitySearch(
    debouncedSearch,
    stateCode,
    lgaCode,
    wardName,
    page,
    12,
  );
  const near = useNearbyFacilities(locationCtl.location, radiusKm, 50);

  const loadState = nearbyActive ? near.state : browse.state;
  const loading = loadState === 'loading';
  const errored = loadState === 'error';

  // LGA centroids power the bubble fallback for facilities without coords.
  const lgaCentroids = useCentroids('lga');

  type Row = { key: string; record: FacilityRecord | NearbyFacilityRecord; point: MapPoint };
  const rows = useMemo<Row[]>(() => {
    if (nearbyActive) {
      return near.rows.map((f) => ({
        key: `f-${f.id}`,
        record: f,
        point: {
          key: `f-${f.id}`,
          latitude: f.latitude,
          longitude: f.longitude,
          title: f.facilityName || 'Health facility',
          subtitle: `${locationLine(f)} · ${formatDistance(f.distanceKm)}${
            f.coordinatesCorrected ? ' · corrected coords' : ''
          }`,
          detail: contactHtml(f.phoneNumber, f.emailAddress, f.website),
        },
      }));
    }
    const pins: Row[] = [];
    const unlocatedByLga = new Map<
      string,
      { label: string; count: number; latitude: number; longitude: number }
    >();
    for (const f of browse.rows) {
      const lat = typeof f.latitude === 'number' ? f.latitude : Number(f.latitude);
      const lng = typeof f.longitude === 'number' ? f.longitude : Number(f.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
        pins.push({
          key: `f-${f.id}`,
          record: f,
          point: {
            key: `f-${f.id}`,
            latitude: lat,
            longitude: lng,
            title: f.facilityName || 'Health facility',
            subtitle: locationLine(f),
            detail: contactHtml(f.phoneNumber, f.emailAddress, f.website),
          },
        });
        continue;
      }
      // No coordinates → aggregate into a count bubble on the LGA centroid.
      const lga = f.lga?.code ?? f.lga?.name;
      const centroid = lga ? lgaCentroids.find((c) => c.code === lga) : undefined;
      if (!lga || !centroid) continue;
      const bucket = unlocatedByLga.get(lga) ?? {
        label: f.lga?.name ?? lga,
        count: 0,
        latitude: centroid.latitude,
        longitude: centroid.longitude,
      };
      bucket.count += 1;
      unlocatedByLga.set(lga, bucket);
    }
    const bubbles: Row[] = [...unlocatedByLga.entries()].map(([lga, b]) => ({
      key: `fb-${lga}`,
      record: browse.rows[0],
      point: {
        key: `fb-${lga}`,
        latitude: b.latitude,
        longitude: b.longitude,
        title: `${b.count} facilit${b.count === 1 ? 'y' : 'ies'} — ${b.label}`,
        subtitle: 'No exact coordinates for these facilities',
        bubble: { count: b.count },
      },
    }));
    return [...pins, ...bubbles];
  }, [nearbyActive, near.rows, browse.rows, lgaCentroids]);

  const mapPoints = useMemo<MapPoint[]>(() => rows.map((r) => r.point), [rows]);

  // Click-to-zoom: fly to the selected facility's exact pin, or its LGA
  // centroid when the record carries no coordinates (browse mode only —
  // nearby records always have coordinates).
  const focus = useMemo<MapFocus | null>(() => {
    if (!highlightKey) return null;
    const row = rows.find((r) => r.key === highlightKey);
    if (!row || row.point.bubble) return null;
    return {
      key: highlightKey,
      latitude: row.point.latitude,
      longitude: row.point.longitude,
      zoom: 15,
    };
  }, [highlightKey, rows]);

  const mapFitKey = useMemo(
    () =>
      nearbyActive
        ? `nearby|${locationCtl.location?.latitude},${locationCtl.location?.longitude}|${radiusKm}`
        : `${debouncedSearch}|${stateCode}|${lgaCode}|${wardName}|${page}`,
    [nearbyActive, locationCtl.location, radiusKm, debouncedSearch, stateCode, lgaCode, wardName, page],
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
        title="Health Facility & Hospital Locator"
        subtitle="Search Nigeria's registry of hospitals, clinics and health centres by name and location — or let the map find the ones nearest to you."
        searchPlaceholder="Search by facility name (e.g. Lagos University Teaching Hospital)…"
        states={states}
        lgas={lgas}
        search={searchInput}
        onSearchChange={setSearchInput}
        stateCode={stateCode}
        onStateChange={(v) => {
          setStateCode(v);
          setLgaCode(null);
        }}
        lgaCode={lgaCode}
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
                  onSearchChange: setWardSearch,
                  searchQuery: wardSearch,
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
                  ? `Using an approximate location (±~10 km). Showing facilities within ${radiusKm} km.`
                  : `Showing facilities within ${radiusKm} km of your location.`
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
            ? 'No facilities found within this radius. Try widening the radius, or switch to Browse to search by name.'
            : undefined
        }
      >
        {nearbyActive
          ? near.rows.map((f) => {
              const key = `f-${f.id}`;
              return (
                <ResultCard
                  key={key}
                  selected={highlightKey === key}
                  onClick={() => setHighlightKey(highlightKey === key ? null : key)}
                >
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Box flex={1} miw={0}>
                      <Text fw={800} size="md" c={locatorTheme.ink} truncate="end">
                        {f.facilityName || 'Unnamed facility'}
                      </Text>
                      <Group gap={6} mt={4} wrap="wrap">
                        {f.facilityType ? (
                          <Badge size="sm" variant="light" color="teal">
                            {f.facilityType.name || f.facilityType.code}
                          </Badge>
                        ) : null}
                        {f.facilityLevel ? (
                          <Badge size="sm" variant="light" color="green">
                            {f.facilityLevel.name || f.facilityLevel.code}
                          </Badge>
                        ) : null}
                      </Group>
                      <Text size="sm" c={locatorTheme.muted} mt={6}>
                        <MapPin size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                        {locationLine(f) || f.facilityId}
                      </Text>
                    </Box>
                    <Badge
                      leftSection={<Navigation size={11} />}
                      variant="light"
                      color={highlightKey === key ? 'teal' : 'green'}
                      size="lg"
                    >
                      {formatDistance(f.distanceKm)}
                    </Badge>
                  </Group>
                  {f.phoneNumber || f.emailAddress || f.website ? (
                    <>
                      <Divider my="xs" color={locatorTheme.line} />
                      <Group gap="md">
                        {f.phoneNumber ? <Text size="xs" c={locatorTheme.muted}>☎ {f.phoneNumber}</Text> : null}
                        {f.emailAddress ? <Text size="xs" c={locatorTheme.muted}>✉ {f.emailAddress}</Text> : null}
                        {f.website ? (
                          <Text
                            size="xs"
                            component="a"
                            href={normalizeUrl(f.website)}
                            target="_blank"
                            rel="noreferrer"
                            c={locatorTheme.teal}
                            style={{ textDecoration: 'underline' }}
                          >
                            Website
                          </Text>
                        ) : null}
                      </Group>
                    </>
                  ) : null}
                </ResultCard>
              );
            })
          : browse.rows.map((f) => {
              const key = `f-${f.id}`;
              return (
                <ResultCard
                  key={key}
                  selected={highlightKey === key}
                  onClick={() => setHighlightKey(highlightKey === key ? null : key)}
                >
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Box flex={1} miw={0}>
                      <Text fw={800} size="md" c={locatorTheme.ink} truncate="end">
                        {f.facilityName || 'Unnamed facility'}
                      </Text>
                      <Group gap={6} mt={4} wrap="wrap">
                        {f.facilityType ? (
                          <Badge size="sm" variant="light" color="teal">
                            {f.facilityType.name || f.facilityType.code}
                          </Badge>
                        ) : null}
                        {f.facilityLevel ? (
                          <Badge size="sm" variant="light" color="green">
                            {f.facilityLevel.name || f.facilityLevel.code}
                          </Badge>
                        ) : null}
                        {f.registrationStatus ? (
                          <Badge
                            size="sm"
                            variant="light"
                            color={/regis/i.test(f.registrationStatus) ? 'green' : 'gray'}
                          >
                            {f.registrationStatus}
                          </Badge>
                        ) : null}
                      </Group>
                      <Text size="sm" c={locatorTheme.muted} mt={6}>
                        <MapPin size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                        {locationLine(f) || f.facilityId}
                      </Text>
                    </Box>
                    {hasCoords(f) ? (
                      <Badge variant="light" color="teal" size="sm">
                        On map
                      </Badge>
                    ) : null}
                  </Group>
                  {f.phoneNumber || f.emailAddress || f.website ? (
                    <>
                      <Divider my="xs" color={locatorTheme.line} />
                      <Group gap="md">
                        {f.phoneNumber ? <Text size="xs" c={locatorTheme.muted}>☎ {f.phoneNumber}</Text> : null}
                        {f.emailAddress ? <Text size="xs" c={locatorTheme.muted}>✉ {f.emailAddress}</Text> : null}
                        {f.website ? (
                          <Text
                            size="xs"
                            component="a"
                            href={normalizeUrl(f.website)}
                            target="_blank"
                            rel="noreferrer"
                            c={locatorTheme.teal}
                            style={{ textDecoration: 'underline' }}
                          >
                            Website
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

function locationLine(f: FacilityRecord | NearbyFacilityRecord): string {
  const ward = 'wardName' in f ? f.wardName : f.ward?.name;
  const lga = 'lgaName' in f ? f.lgaName : f.lga?.name;
  const state = 'stateName' in f ? f.stateName : f.state?.name;
  const parts = [ward, lga, state].filter(Boolean);
  return parts.join(', ');
}

function hasCoords(f: FacilityRecord): boolean {
  const lat = typeof f.latitude === 'number' ? f.latitude : Number(f.latitude);
  const lng = typeof f.longitude === 'number' ? f.longitude : Number(f.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function contactHtml(phone: string | null, email: string | null, website: string | null): string {
  const rows: string[] = [];
  if (phone) {
    rows.push(
      `<div style="font-size:12px;color:${locatorTheme.text}">☎ ${escapeHtml(phone)}</div>`,
    );
  }
  if (email) {
    rows.push(
      `<div style="font-size:12px;color:${locatorTheme.text}">✉ ${escapeHtml(email)}</div>`,
    );
  }
  if (website) {
    const href = normalizeUrl(website);
    rows.push(
      `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer" style="font-size:12px">Website ↗</a>`,
    );
  }
  return rows.length ? `<div style="margin-top:6px">${rows.join('')}</div>` : '';
}

function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
