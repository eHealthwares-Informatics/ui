import { Badge, Combobox, Group, InputBase, Text, useCombobox } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { lisApi } from '@/lib/lis-api';

export type LoincTest = {
  id: string;
  code: string;
  name: string;
  system: string | null;
};

function displayFor(test: LoincTest): string {
  return `${test.name} — ${test.code}`;
}

/**
 * Searchable LOINC test picker backed by the LIS `lis/loinc` catalogue.
 * Selecting a test yields the LOINC code used as the LIS test-definition
 * reference when the request is synced.
 */
export function LoincTestSearch({
  label,
  placeholder = 'Search LOINC tests…',
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  limit = 20,
}: {
  label?: string;
  placeholder?: string;
  value: LoincTest | null;
  onChange: (test: LoincTest | null) => void;
  required?: boolean;
  error?: React.ReactNode;
  disabled?: boolean;
  limit?: number;
}) {
  const combobox = useCombobox();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data = [], isLoading } = useQuery({
    queryKey: ['emr', 'loinc-tests', debounced, limit],
    queryFn: async () => {
      const res = await lisApi.get<{ data: Array<Record<string, unknown>> }>(
        '/lis/loinc',
        { params: { search: debounced || undefined, limit, page: 1 } },
      );
      return ((res.data?.data ?? []) as Array<Record<string, unknown>>)
        .map((row) => ({
          id: String(row.id),
          code: String(row.code ?? ''),
          name: String(row.name ?? ''),
          system: row.system != null ? String(row.system) : null,
        }))
        .filter((test) => test.code && test.name);
    },
    enabled: Boolean(debounced),
    staleTime: 60_000,
  });

  const isSelected = (test: LoincTest) => value?.id === test.id;

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(selectedValue) => {
        const found = data.find((test) => test.id === selectedValue);
        onChange(found ?? null);
        setQuery(found ? displayFor(found) : '');
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          label={label}
          required={required}
          error={error}
          disabled={disabled}
          placeholder={placeholder}
          rightSection={isLoading ? <Loader size={16} /> : <Combobox.Chevron />}
          rightSectionPointerEvents="none"
          value={value ? displayFor(value) : query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            combobox.openDropdown();
            if (!event.currentTarget.value) {
              onChange(null);
            }
          }}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => combobox.closeDropdown()}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options style={{ maxHeight: 260, overflowY: 'auto' }}>
          {isLoading ? (
            <Combobox.Empty>
              <Text size="sm" c="dimmed">
                Searching…
              </Text>
            </Combobox.Empty>
          ) : debounced && data.length === 0 ? (
            <Combobox.Empty>
              <Text size="sm" c="dimmed">
                No LOINC tests found
              </Text>
            </Combobox.Empty>
          ) : !debounced ? (
            <Combobox.Empty>
              <Text size="sm" c="dimmed">
                Type to search LOINC tests
              </Text>
            </Combobox.Empty>
          ) : (
            data.map((test) => (
              <Combobox.Option key={test.id} value={test.id} active={isSelected(test)}>
                <Group justify="space-between" gap="xs" wrap="nowrap">
                  <Text size="sm" truncate>
                    {displayFor(test)}
                  </Text>
                  <Badge
                    size="xs"
                    variant="light"
                    color="teal"
                    style={{ flexShrink: 0 }}
                  >
                    {test.system ?? 'LOINC'}
                  </Badge>
                </Group>
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
