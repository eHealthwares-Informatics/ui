import {
  Combobox,
  Group,
  InputBase,
  Text,
  useCombobox,
} from '@mantine/core';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useGenericProductSearch } from './hooks';
import { green } from './components';

export function GenericSearchInput({
  onSelect,
  onSubmit,
  size = 'md',
  compact = false,
  placeholder = 'Search generic medicine…',
}: {
  onSelect: (gp: string) => void;
  onSubmit: (freeText: string) => void;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  placeholder?: string;
}) {
  const combobox = useCombobox();
  const [search, setSearch] = useState('');
  const { data } = useGenericProductSearch(search);
  const options = (data?.data ?? []).slice(0, compact ? 6 : 10).map((g) => ({
    value: g.code,
    label: g.name,
    averagePrice: g.averagePrice,
  }));

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => {
        onSelect(val);
        setSearch('');
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          aria-label="Search generic medicines"
          placeholder={placeholder}
          size={size}
          radius="xl"
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            combobox.openDropdown();
          }}
          onFocus={() => combobox.openDropdown()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSubmit(search);
              combobox.closeDropdown();
            }
          }}
          leftSection={<Search size={16} />}
          styles={{ input: { borderColor: '#CFE5D7', minWidth: 0 } }}
          w={compact ? 210 : undefined}
          style={compact ? { flexShrink: 0 } : { flex: 1, minWidth: 0 }}
        />
      </Combobox.Target>
      <Combobox.Dropdown style={{ backgroundColor: 'white', zIndex: 30 }}>
        <Combobox.Options style={{ maxHeight: 300, overflowY: 'auto' }}>
          {options.length === 0 ? (
            <Combobox.Empty>
              {search.trim().length < 2
                ? 'Type at least 2 characters…'
                : 'No matching generics'}
            </Combobox.Empty>
          ) : (
            options.map((o) => (
              <Combobox.Option key={o.value} value={o.value}>
                <Group justify="space-between" wrap="nowrap" gap={12}>
                  <Text size="sm" fw={600} lineClamp={1} style={{ flex: 1 }}>
                    {o.label}
                  </Text>
                  <Text size="xs" c={green} style={{ flexShrink: 0 }}>
                    {o.averagePrice != null
                      ? `₦${Number(o.averagePrice).toLocaleString()}`
                      : '—'}
                  </Text>
                </Group>
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}