/**
 * Shared hooks for the locator pages — debounced search inputs, concepts
 * reference data (states, LGAs, map centroids) and paginated result lists.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  getCentroids,
  getLgas,
  getLocalityOptions,
  getNearbyFacilities,
  getNearbyPharmacies,
  getStates,
  getWardOptions,
  searchFacilities,
  searchPharmacies,
  type Centroid,
  type ConceptsLga,
  type ConceptsState,
  type FacilityRecord,
  type ListMeta,
  type LocalityOption,
  type NearbyFacilityRecord,
  type NearbyPharmacyRecord,
  type PharmacyRecord,
  type WardOption,
} from './api';

export function useDebounced<T>(value: T, delayMs = 450): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function useStates(): ConceptsState[] {
  const [states, setStates] = useState<ConceptsState[]>([]);
  useEffect(() => {
    let cancelled = false;
    getStates()
      .then((s) => !cancelled && setStates(s))
      .catch(() => !cancelled && setStates([]));
    return () => {
      cancelled = true;
    };
  }, []);
  return useMemo(
    () => [...states].sort((a, b) => a.name.localeCompare(b.name)),
    [states],
  );
}

export function useLgas(stateCode: string | null): ConceptsLga[] {
  const [lgas, setLgas] = useState<ConceptsLga[]>([]);
  useEffect(() => {
    if (!stateCode) {
      setLgas([]);
      return;
    }
    let cancelled = false;
    getLgas(stateCode)
      .then((l) => !cancelled && setLgas(l))
      .catch(() => !cancelled && setLgas([]));
    return () => {
      cancelled = true;
    };
  }, [stateCode]);
  return lgas;
}

export function useCentroids(by: 'state' | 'lga'): Centroid[] {
  const [centroids, setCentroids] = useState<Centroid[]>([]);
  useEffect(() => {
    let cancelled = false;
    getCentroids(by)
      .then((c) => !cancelled && setCentroids(c))
      .catch(() => !cancelled && setCentroids([]));
    return () => {
      cancelled = true;
    };
  }, [by]);
  return centroids;
}

export type AsyncState = 'idle' | 'loading' | 'error' | 'done';

interface PagedResult<T> {
  rows: T[];
  meta: ListMeta | null;
  state: AsyncState;
}

/** Paginated facility search driven by debounced name + code filters. */
export function useFacilitySearch(
  search: string,
  stateCode: string | null,
  lgaCode: string | null,
  wardName: string | null,
  page: number,
  limit = 12,
): PagedResult<FacilityRecord> {
  const [rows, setRows] = useState<FacilityRecord[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [state, setState] = useState<AsyncState>('idle');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    searchFacilities({
      search: search || undefined,
      state: stateCode || undefined,
      lga: lgaCode || undefined,
      wardName: wardName || undefined,
      page,
      limit,
    })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data ?? []);
        setMeta(res.meta ?? null);
        setState('done');
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setMeta(null);
        setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [search, stateCode, lgaCode, wardName, page, limit]);

  return { rows, meta, state };
}

export interface PharmacyFilters {
  search: string;
  stateCode: string | null;
  lgaCode?: string | null;
  wardName?: string | null;
  areaName?: string | null;
  neighbourhoodName?: string | null;
  settlementName?: string | null;
}

/** Paginated pharmacy search driven by debounced name + location filters. */
export function usePharmacySearch(
  filters: PharmacyFilters,
  page: number,
  limit = 12,
): PagedResult<PharmacyRecord> {
  const [rows, setRows] = useState<PharmacyRecord[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [state, setState] = useState<AsyncState>('idle');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    searchPharmacies({
      search: filters.search || undefined,
      state: filters.stateCode || undefined,
      lgaCode: filters.lgaCode || undefined,
      wardName: filters.wardName || undefined,
      areaName: filters.areaName || undefined,
      neighbourhoodName: filters.neighbourhoodName || undefined,
      settlementName: filters.settlementName || undefined,
      page,
      limit,
    })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data ?? []);
        setMeta(res.meta ?? null);
        setState('done');
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setMeta(null);
        setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [
    filters.search,
    filters.stateCode,
    filters.lgaCode,
    filters.wardName,
    filters.areaName,
    filters.neighbourhoodName,
    filters.settlementName,
    page,
    limit,
  ]);

  return { rows, meta, state };
}

/**
 * Server-searched ward names for filter dropdowns (wards table is large, so
 * options are fetched per query with an optional LGA scope).
 */
export function useWardOptions(
  search: string,
  lgaCode: string | null,
  stateCode: string | null,
  enabled: boolean,
): { options: WardOption[]; loading: boolean } {
  const [options, setOptions] = useState<WardOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounced(search, 350);

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getWardOptions({
      search: debouncedSearch || undefined,
      lga: lgaCode || undefined,
      state: stateCode || undefined,
      limit: 100,
    })
      .then((w) => {
        if (cancelled) return;
        setOptions(w);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setOptions([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, debouncedSearch, lgaCode, stateCode]);

  return { options, loading };
}

/**
 * Server-searched locality options (area | neighbourhood | settlement) for
 * filter dropdowns — the localities tables hold thousands of rows each.
 */
export function useLocalityOptions(
  type: 'area' | 'neighbourhood' | 'settlement',
  search: string,
  enabled: boolean,
): { options: LocalityOption[]; loading: boolean } {
  const [options, setOptions] = useState<LocalityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounced(search, 350);

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getLocalityOptions(type, { search: debouncedSearch || undefined, limit: 100 })
      .then((l) => {
        if (cancelled) return;
        setOptions(l);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setOptions([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type, enabled, debouncedSearch]);

  return { options, loading };
}

// ── Near-me: browser geolocation + nearby search ──────────────────────────

export interface UserLocation {
  latitude: number;
  longitude: number;
  /** True when coordinates came from a non-GPS fallback (IP-level accuracy). */
  approx?: boolean;
}

export type GeoStatus = 'idle' | 'prompt' | 'locating' | 'granted' | 'denied' | 'error';

/**
 * Browser geolocation with graceful fallback: `navigator.geolocation` first;
 * if unavailable, blocked or errored, falls back to a low-accuracy IP lookup
 * (geolocation-db.com, CORS-open) so "near me" still works behind file://
 * or strict permission policies.
 */
export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const request = () => {
    if (status === 'locating') return;
    setErrorMessage(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('locating');
      fallbackIpLocate(setLocation, setStatus, setErrorMessage);
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setStatus('granted');
      },
      (err) => {
        // Permission denied or device error → try IP-level fallback once.
        fallbackIpLocate(setLocation, setStatus, setErrorMessage, err.code === 1 ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const reset = () => {
    setLocation(null);
    setStatus('idle');
    setErrorMessage(null);
  };

  return { location, status, errorMessage, request, reset };
}

function fallbackIpLocate(
  setLocation: (l: UserLocation) => void,
  setStatus: (s: GeoStatus) => void,
  setErrorMessage: (m: string | null) => void,
  primaryStatus: GeoStatus = 'error',
) {
  const finish = (lat: number, lng: number) => {
    if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
      setLocation({ latitude: lat, longitude: lng, approx: true });
      setStatus('granted');
    } else {
      setStatus(primaryStatus);
      setErrorMessage('Could not determine your location. Search by name or area instead.');
    }
  };
  const fail = () => {
    setStatus(primaryStatus);
    setErrorMessage('Could not determine your location. Search by name or area instead.');
  };
  // First provider is rate-limit/UA sensitive in some webviews; ipwho.is is
  // the CORS-open backup.
  fetch('https://ipwho.is/')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('ipwho.is failed'))))
    .then((d: { success?: boolean; latitude?: number; longitude?: number }) => {
      if (d?.success === false) return Promise.reject(new Error('ipwho.is no fix'));
      finish(Number(d?.latitude), Number(d?.longitude));
    })
    .catch(() =>
      fetch('https://geolocation-db.com/json/')
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('geolocation-db failed'))))
        .then((d: { latitude?: number; longitude?: number }) => finish(Number(d?.latitude), Number(d?.longitude)))
        .catch(fail),
    );
}

/** Facilities nearest the given point, ordered by distance (no pagination —
 * the endpoint returns the closest `limit` within `radiusKm`). */
export function useNearbyFacilities(
  location: UserLocation | null,
  radiusKm: number,
  limit = 20,
): PagedResult<NearbyFacilityRecord> {
  const [rows, setRows] = useState<NearbyFacilityRecord[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [state, setState] = useState<AsyncState>('idle');

  useEffect(() => {
    if (!location) {
      setRows([]);
      setMeta(null);
      setState('idle');
      return;
    }
    let cancelled = false;
    setState('loading');
    getNearbyFacilities(location.latitude, location.longitude, radiusKm, limit)
      .then((rows_) => {
        if (cancelled) return;
        setRows(rows_ ?? []);
        setMeta({ page: 1, limit, total: rows_?.length ?? 0 });
        setState('done');
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setMeta(null);
        setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [location?.latitude, location?.longitude, radiusKm, limit]);

  return { rows, meta, state };
}

/** Pharmacies nearest the given point, ordered by distance. */
export function useNearbyPharmacies(
  location: UserLocation | null,
  radiusKm: number,
  limit = 20,
): PagedResult<NearbyPharmacyRecord> {
  const [rows, setRows] = useState<NearbyPharmacyRecord[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [state, setState] = useState<AsyncState>('idle');

  useEffect(() => {
    if (!location) {
      setRows([]);
      setMeta(null);
      setState('idle');
      return;
    }
    let cancelled = false;
    setState('loading');
    getNearbyPharmacies(location.latitude, location.longitude, radiusKm, limit)
      .then((rows_) => {
        if (cancelled) return;
        setRows(rows_ ?? []);
        setMeta({ page: 1, limit, total: rows_?.length ?? 0 });
        setState('done');
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setMeta(null);
        setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [location?.latitude, location?.longitude, radiusKm, limit]);

  return { rows, meta, state };
}
