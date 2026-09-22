import {
  Box,
  Combobox,
  Group,
  InputBase,
  Stack,
  Text,
  useCombobox,
} from '@mantine/core';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useGenericProductSearch } from './hooks';
import { green, ink, line, muted } from './components';

/**
 * Expand-on-hover search: collapses to an icon pill, expands on hover or
 * focus, and shows a labeled suggestions panel with product name, code and
 * price. Stays expanded while the input (or any suggestion) has focus.
 */
export function ExpandableSearch({
  onSelect,
  onSubmit,
  placeholder = 'Search medicines, products…',
}: {
  onSelect: (gp: string) => void;
  onSubmit: (freeText: string) => void;
  placeholder?: string;
}) {
  const combobox = useCombobox();
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expanded = hovered || focused;
  const { data } = useGenericProductSearch(search);
  const options = (data?.data ?? []).slice(0, 6).map((g) => ({
    value: g.code,
    label: g.name,
    code: g.code,
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
          aria-label="Search"
          size="sm"
          radius="xl"
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            combobox.openDropdown();
          }}
          onFocus={() => {
            setFocused(true);
            combobox.openDropdown();
          }}
          onBlur={() => {
            setFocused(false);
            combobox.closeDropdown();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSubmit(search);
              combobox.closeDropdown();
              e.currentTarget.blur();
            }
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          leftSection={<Search size={15} />}
          placeholder={expanded ? placeholder : ''}
          styles={{ input: { borderColor: '#CFE5D7', minWidth: 0 } }}
          style={{
            width: expanded ? 230 : 42,
            flexShrink: 0,
            transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </Combobox.Target>
      <Combobox.Dropdown
        style={{
          backgroundColor: 'white',
          zIndex: 30,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
        }}
      >
        <Box px="sm" pt={10} pb={6}>
          <Text size="xs" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
            Generic products
          </Text>
        </Box>
        <Combobox.Options style={{ maxHeight: 300, overflowY: 'auto' }}>
          {options.length === 0 ? (
            <Combobox.Empty>
              {search.trim().length < 2
                ? 'Type at least 2 characters…'
                : 'No matching generics'}
            </Combobox.Empty>
          ) : (
            options.map((o) => (
              <Combobox.Option key={o.value} value={o.value} px="sm" py={7}>
                <Group justify="space-between" wrap="nowrap" gap={12}>
                  <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={600} lineClamp={1} style={{ color: ink }}>
                      {o.label}
                    </Text>
                    <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                      {o.code}
                    </Text>
                  </Stack>
                  <Text size="sm" fw={700} c={green} style={{ flexShrink: 0 }}>
                    {o.averagePrice != null
                      ? `₦${Number(o.averagePrice).toLocaleString()}`
                      : '—'}
                  </Text>
                </Group>
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
        {search.trim() ? (
          <Box px="sm" py={8} style={{ borderTop: `1px solid ${line}` }}>
            <Text size="xs" c={muted}>
              Press <strong>Enter</strong> to search all products for “{search.trim()}”
            </Text>
          </Box>
        ) : null}
      </Combobox.Dropdown>
    </Combobox>
  );
}

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