import { useState, useEffect } from 'react';
import { lisApi } from '@/lib/lis-api';

export function useSampleTypeNameMap(): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    lisApi
      .get('/lis/sample-types', { params: { limit: 100 } })
      .then((res) => {
        if (cancelled) {
          return;
        }
        const entries = (res.data?.data ?? []) as Array<{ id: string; name: string }>;
        setMap(Object.fromEntries(entries.map((e) => [e.id, e.name])));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return map;
}
