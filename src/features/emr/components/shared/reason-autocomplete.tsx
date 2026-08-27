import { Autocomplete } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';

/**
 * Free-text reason control with suggestions from previously recorded reasons.
 * Selecting a suggestion uses its text; anything else typed is used as-is.
 */
export function ReasonAutocomplete({
  label,
  value,
  onChange,
  source,
  placeholder = 'Search previous reasons or type a new one',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Where to load previous reasons from (a list endpoint returning records with `reason`). */
  source: { queryKey: string[]; endpoint: string };
  placeholder?: string;
  required?: boolean;
}) {
  const { data = [] } = useQuery({
    queryKey: source.queryKey,
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<{ reason: string | null }> }>(source.endpoint, {
        params: { limit: 200 },
      });
      const seen = new Set<string>();
      const reasons: string[] = [];
      for (const record of res.data.data) {
        const reason = record.reason?.trim();
        if (reason && !seen.has(reason)) {
          seen.add(reason);
          reasons.push(reason);
        }
      }
      return reasons;
    },
    staleTime: 60_000,
    placeholderData: (prev) => prev ?? [],
  });

  return (
    <Autocomplete
      label={label}
      required={required}
      value={value}
      onChange={onChange}
      data={data}
      limit={10}
      placeholder={placeholder}
    />
  );
}
