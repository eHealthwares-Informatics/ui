/**
 * Direct client for the Healthcare Concepts service (facilities + pharmacies
 * registries). Concepts CORS is fully open, so the browser talks to it
 * straight from the locator pages — no rxsoft proxy in between.
 *
 * Base URL: VITE_CONCEPTS_API_URL (default http://localhost:8004/api).
 */
import axios from 'axios';

const CONCEPTS_BASE_URL =
  import.meta.env.VITE_CONCEPTS_API_URL || 'https://api.ehealthwares.com/concepts';

const conceptsApi = axios.create({
  baseURL: CONCEPTS_BASE_URL,
  timeout: 20000,
});

// ── Shapes (only the fields the locator pages consume) ────────────────────

export interface ConceptsState {
  id: string;
  code: string;
  name: string;
}

export interface ConceptsLga {
  id: string;
  code: string;
  name: string;
  stateCode?: string | null;
}

export interface FacilityRecord {
  id: string;
  facilityId: string;
  facilityName: string | null;
  alternativeName: string | null;
  registrationStatus: string | null;
  operationalStatusCode: string | null;
  licenseStatus: string | null;
  emailAddress: string | null;
  phoneNumber: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  state: { code: string; name: string } | null;
  lga: { code: string; name: string } | null;
  ward: { code: string; name: string } | null;
  facilityType: { code: string; name: string } | null;
  facilityLevel: { code: string; name: string } | null;
}

export interface PharmacyRecord {
  id: string;
  premisesId: string;
  premisesName: string | null;
  premisesAddress: string | null;
  premisesState: string | null;
  pharmacist: string | null;
  pharmacistFirstName: string | null;
  pharmacistLastName: string | null;
  certificateNo: string | null;
  category: string | null;
  yearLicenced: string | null;
  dateApproved: string | null;
  stateCode: string | null;
  stateName: string | null;
  lgaName: string | null;
  wardName: string | null;
  area: string | null;
  neighbourhood: string | null;
  settlement: string | null;
  lga: { code: string; name: string } | null;
  settlementX: string | null;
  settlementY: string | null;
}

export interface Centroid {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  facilityCount: number;
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export interface FacilitySearchParams {
  search?: string;
  state?: string;
  lga?: string;
  wardName?: string;
  page?: number;
  limit?: number;
}

export interface PharmacySearchParams {
  search?: string;
  state?: string;
  lgaCode?: string;
  wardName?: string;
  areaName?: string;
  neighbourhoodName?: string;
  settlementName?: string;
  page?: number;
  limit?: number;
}

export interface NearbyFacilityRecord {
  id: string;
  facilityId: string;
  facilityName: string | null;
  latitude: number;
  longitude: number;
  coordinatesCorrected: boolean;
  distanceKm: number;
  state: { code: string; name: string } | null;
  lga: { code: string; name: string } | null;
  ward: { code: string; name: string } | null;
  facilityType: { code: string; name: string } | null;
  facilityLevel: { code: string; name: string } | null;
  phoneNumber: string | null;
  emailAddress: string | null;
  website: string | null;
}

export interface NearbyPharmacyRecord {
  id: string;
  premisesId: string;
  premisesName: string | null;
  premisesAddress: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  pharmacist: string | null;
  category: string | null;
  certificateNo: string | null;
  stateName: string | null;
  lgaName: string | null;
  wardName: string | null;
  areaName: string | null;
}

export interface WardOption {
  name: string;
  lgaCode: string | null;
}

export interface LocalityOption {
  id: string;
  name: string;
  type: string;
}

// ── API calls ──────────────────────────────────────────────────────────────

export async function searchFacilities(
  params: FacilitySearchParams,
): Promise<{ data: FacilityRecord[]; meta: ListMeta }> {
  const res = await conceptsApi.get('/v1/facilities', {
    params: {
      search: params.search,
      state: params.state,
      lga: params.lga,
      ward_name: params.wardName,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
  return res.data;
}

export async function searchPharmacies(
  params: PharmacySearchParams,
): Promise<{ data: PharmacyRecord[]; meta: ListMeta }> {
  // Pharmacies API takes free-text `search`; named location filters go through
  // its shared filter DSL (field=TYPE|value|).
  const filterParams: Record<string, string | number> = {};
  if (params.search) filterParams.search = params.search;
  if (params.state) filterParams['state.code'] = `EQUALS|${params.state}|`;
  if (params.lgaCode) filterParams['lga.code'] = `EQUALS|${params.lgaCode}|`;
  if (params.wardName) filterParams['ward.name'] = `EQUALS|${params.wardName}|`;
  if (params.areaName) filterParams['area.name'] = `EQUALS|${params.areaName}|`;
  if (params.neighbourhoodName)
    filterParams['neighbourhood.name'] = `EQUALS|${params.neighbourhoodName}|`;
  if (params.settlementName)
    filterParams['settlement.name'] = `EQUALS|${params.settlementName}|`;
  return conceptsApi
    .get('/v1/pharmacies', {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        ...filterParams,
      },
    })
    .then((res) => res.data);
}

export async function getStates(): Promise<ConceptsState[]> {
  const res = await conceptsApi.get('/v1/facilities/states');
  return res.data.data;
}

export async function getLgas(stateCode: string): Promise<ConceptsLga[]> {
  const res = await conceptsApi.get('/v1/facilities/lgas');
  const all: ConceptsLga[] = res.data.data ?? [];
  return stateCode ? all.filter((l) => l.stateCode === stateCode) : all;
}

export async function getWardOptions(
  opts: { search?: string; lga?: string; state?: string; limit?: number } = {},
): Promise<WardOption[]> {
  const res = await conceptsApi.get('/v1/facilities/wards-lite', { params: opts });
  return res.data.data;
}

export async function getLocalityOptions(
  type: 'area' | 'neighbourhood' | 'settlement',
  opts: { search?: string; limit?: number } = {},
): Promise<LocalityOption[]> {
  const res = await conceptsApi.get('/v1/localities/options', {
    params: { type, ...opts },
  });
  return res.data.data;
}

export async function getCentroids(by: 'state' | 'lga'): Promise<Centroid[]> {
  const res = await conceptsApi.get('/v1/facilities/centroids', {
    params: { by },
  });
  return res.data.data;
}

/**
 * Haversine nearest-search on the facilities registry, ordered by distance.
 * The backend computes against the correct orientation per row (the source
 * registry has transposed coordinates for a band of northern states) and
 * flags those rows via `coordinatesCorrected`.
 */
export async function getNearbyFacilities(
  lat: number,
  lng: number,
  radiusKm: number,
  limit = 20,
): Promise<NearbyFacilityRecord[]> {
  const res = await conceptsApi.get('/v1/facilities/nearby', {
    params: { lat, lng, radius: radiusKm, limit },
  });
  return res.data.data;
}

/**
 * Haversine nearest-search on the pharmacies registry (settlement
 * coordinates — settlementY is latitude, settlementX is longitude per the
 * register), ordered by distance.
 */
export async function getNearbyPharmacies(
  lat: number,
  lng: number,
  radiusKm: number,
  limit = 20,
): Promise<NearbyPharmacyRecord[]> {
  const res = await conceptsApi.get('/v1/pharmacies/nearby', {
    params: { lat, lng, radius: radiusKm, limit },
  });
  return res.data.data;
}
