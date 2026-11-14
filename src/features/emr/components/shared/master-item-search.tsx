import { Badge, Combobox, Group, InputBase, Text, useCombobox } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { buildReferenceCode } from './master-item-meta';

export type MasterItemKind = 'STOCK_ITEM' | 'GENERIC_PRODUCT' | 'GENERIC_DRUG';

export type MasterItem = {
  id: string;
  label: string;
  code?: string;
  kind: MasterItemKind;
  /**
   * Stable cross-system reference sent to rxsoft / LIS with the request line.
   * Format: `<KIND>:<code-or-id>` so the receiving system can tell which
   * catalogue the code belongs to without extra context.
   */
  referenceCode?: string;
};

const KIND_LABEL: Record<MasterItemKind, string> = {
  STOCK_ITEM: 'Stock',
  GENERIC_PRODUCT: 'EMDEx',
  GENERIC_DRUG: 'NDF',
};

const DEFAULT_KINDS: MasterItemKind[] = ['STOCK_ITEM', 'GENERIC_PRODUCT', 'GENERIC_DRUG'];

const KIND_COLOR: Record<MasterItemKind, string> = {
  STOCK_ITEM: 'blue',
  GENERIC_PRODUCT: 'grape',
  GENERIC_DRUG: 'orange',
};

function displayFor(item: MasterItem): string {
  return item.label + (item.code ? ` (${item.code})` : '');
}

function referenceCodeFor(item: MasterItem): string {
  return buildReferenceCode(item);
}

/** Searchable flat list of stock items + generic products + generic drugs, tagged by source. */
export function MasterItemSearch({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  limit = 20,
  kinds = DEFAULT_KINDS,
}: {
  label?: string;
  placeholder?: string;
  value: MasterItem | null;
  onChange: (item: MasterItem | null) => void;
  required?: boolean;
  error?: React.ReactNode;
  disabled?: boolean;
  limit?: number;
  /** Restrict the searchable catalogues (defaults to all three). */
  kinds?: MasterItemKind[];
}) {
  const combobox = useCombobox();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const searchableKinds = kinds.length > 0 ? kinds : DEFAULT_KINDS;
  const kindsKey = searchableKinds.join(',');

  const { data = [], isLoading } = useQuery({
    queryKey: ['emr', 'master-items', debounced, limit, kindsKey],
    queryFn: async () => {
      const params = { search: debounced || undefined, limit, page: 1 };
      const [itemsRes, productsRes, drugsRes] = await Promise.all([
        searchableKinds.includes('STOCK_ITEM')
          ? rxsoftApi.get<{ data: Array<Record<string, unknown>> }>('/items', { params })
          : null,
        searchableKinds.includes('GENERIC_PRODUCT')
          ? codingConceptApi.get<{ data: Array<Record<string, unknown>> }>('/generic-products', {
              params,
            })
          : null,
        searchableKinds.includes('GENERIC_DRUG')
          ? codingConceptApi.get<{ data: Array<Record<string, unknown>> }>('/generic-drugs', {
              params,
            })
          : null,
      ]);
      const items: MasterItem[] = ((itemsRes?.data?.data ?? []) as Array<Record<string, unknown>>)
        .map((row) => ({
          id: String(row.id),
          label: String(row.name ?? ''),
          code: row.code != null ? String(row.code) : undefined,
          kind: 'STOCK_ITEM' as const,
        }))
        .filter((item) => item.label);
      const products: MasterItem[] = (
        (productsRes?.data?.data ?? []) as Array<Record<string, unknown>>
      )
        .map((row) => ({
          id: String(row.id),
          label: String(row.name ?? ''),
          code: row.code != null ? String(row.code) : undefined,
          kind: 'GENERIC_PRODUCT' as const,
        }))
        .filter((item) => item.label);
      const drugs: MasterItem[] = ((drugsRes?.data?.data ?? []) as Array<Record<string, unknown>>)
        .map((row) => ({
          id: String(row.id),
          label: String(row.name ?? ''),
          code: row.code != null ? String(row.code) : undefined,
          kind: 'GENERIC_DRUG' as const,
        }))
        .filter((item) => item.label);
      return [...products, ...drugs, ...items];
    },
    enabled: Boolean(debounced),
    staleTime: 60_000,
  });

  const emptyHint =
    searchableKinds.length === 1
      ? `No ${KIND_LABEL[searchableKinds[0]].toLowerCase()} entries found`
      : 'No items or drugs found';
  const idleHint =
    searchableKinds.length === 1
      ? `Type to search ${KIND_LABEL[searchableKinds[0]].toLowerCase()}`
      : 'Type to search items or drugs';

  const isSelected = (item: MasterItem) => value?.kind === item.kind && value.id === item.id;

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(selectedValue) => {
        const found = data.find((item) => `${item.kind}:${item.id}` === selectedValue);
        onChange(found ? { ...found, referenceCode: referenceCodeFor(found) } : null);
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
          placeholder={
            placeholder ??
            (searchableKinds.length === 1
              ? `Search ${KIND_LABEL[searchableKinds[0]].toLowerCase()}…`
              : 'Search items or drugs…')
          }
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
                {emptyHint}
              </Text>
            </Combobox.Empty>
          ) : !debounced ? (
            <Combobox.Empty>
              <Text size="sm" c="dimmed">
                {idleHint}
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
                      color={KIND_COLOR[item.kind]}
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
