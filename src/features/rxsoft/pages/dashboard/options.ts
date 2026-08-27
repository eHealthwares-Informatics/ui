import { rxsoftApi } from '@/lib/rxsoft-api';

export type FilterOption = {
  value: string;
  label: string;
};

function normalizeList<T>(body: unknown): T[] {
  if (Array.isArray(body)) {
    return body as T[];
  }
  if (body && typeof body === 'object' && 'data' in body) {
    const data = (body as { data: unknown }).data;
    if (Array.isArray(data)) {
      return data as T[];
    }
  }
  return [];
}

export async function fetchOptions(
  endpoint: string,
  valueKey: string,
  labelKey: string
): Promise<FilterOption[]> {
  const { data } = await rxsoftApi.get(endpoint, { params: { limit: 200 } });
  return normalizeList<Record<string, unknown>>(data).map((item) => ({
    value: String(item[valueKey] ?? ''),
    label: String(item[labelKey] ?? ''),
  }));
}
