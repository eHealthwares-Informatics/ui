import { Badge, Combobox, Group, InputBase, Text, useCombobox } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { rxsoftApi } from '@/lib/rxsoft-api';

export type MasterItemKind = 'STOCK_ITEM' | 'GENERIC_PRODUCT';

export type MasterItem = {
  id: string;
  label: string;
  code?: string;
  kind: MasterItemKind;
};

const KIND_LABEL: Record<MasterItemKind, string> = {
  STOCK_ITEM: 'StockItem',
  GENERIC_PRODUCT: 'Generic Product',
};

function displayFor(item: MasterItem): string {
  return item.label + (item.code ? ` (${item.code})` : '');
}

/** Searchable flat list of stock items + generic products, tagged by kind. */
export function MasterItemSearch({
  label,
  placeholder = 'Search items or drugs…',
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  limit = 20,
}: {
  label?: string;
  placeholder?: string;
  value: MasterItem | null;
  onChange: (item: MasterItem | null) => void;
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
    queryKey: ['emr', 'master-items', debounced, limit],
    queryFn: async () => {
      const [itemsRes, productsRes] = await Promise.all([
        rxsoftApi.get<{ data: Array<Record<string, unknown>> }>('/items', {
          params: { search: debounced || undefined, limit, page: 1 },
        }),
        codingConceptApi.get<{ data: Array<Record<string, unknown>> }>('/generic-products', {
          params: { search: debounced || undefined, limit, page: 1 },
        }),
      ]);
      const items: MasterItem[] = ((itemsRes.data?.data ?? []) as Array<Record<string, unknown>>)
        .map((row) => ({
          id: String(row.id),
          label: String(row.name ?? ''),
          code: row.code != null ? String(row.code) : undefined,
          kind: 'STOCK_ITEM' as const,
        }))
        .filter((item) => item.label);
      const products: MasterItem[] = (
        (productsRes.data?.data ?? []) as Array<Record<string, unknown>>
      )
        .map((row) => ({
          id: String(row.id),
          label: String(row.name ?? ''),
          code: row.code != null ? String(row.code) : undefined,
          kind: 'GENERIC_PRODUCT' as const,
        }))
        .filter((item) => item.label);
      return [...products, ...items];
    },
    enabled: Boolean(debounced),
    staleTime: 60_000,
  });

  const isSelected = (item: MasterItem) =>
    value?.kind === item.kind && value.id === item.id;

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(selectedValue) => {
        const found = data.find((item) => `${item.kind}:${item.id}` === selectedValue);
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
        <Combobox.Options
          style={{ maxHeight: 260, overflowY: 'auto' }}
        >
          {isLoading ? (
            <Combobox.Empty>
              <Text size="sm" c="dimmed">
                Searching…
              </Text>
            </Combobox.Empty>
          ) : debounced && data.length === 0 ? (
            <Combobox.Empty>
              <Text size="sm" c="dimmed">
                No items or drugs found
              </Text>
            </Combobox.Empty>
          ) : !debounced ? (
            <Combobox.Empty>
              <Text size="sm" c="dimmed">
                Type to search items or drugs
              </Text>
            </Combobox.Empty>
          ) : (
            data.map((item) => {
              const isSel = isSelected(item);
              return (
                <Combobox.Option
                  key={`${item.kind}:${item.id}`}
                  value={`${item.kind}:${item.id}`}
                  active={isSel}
                >
                  <Group justify="space-between" gap="xs" wrap="nowrap">
                    <Text size="sm" truncate>
                      {displayFor(item)}
                    </Text>
                    <Badge
                      size="xs"
                      variant="light"
                      color={item.kind === 'STOCK_ITEM' ? 'blue' : 'grape'}
                      style={{ flexShrink: 0 }}
                    >
                      {KIND_LABEL[item.kind]}
                    </Badge>
                  </Group>
                </Combobox.Option>
              );
            })
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}