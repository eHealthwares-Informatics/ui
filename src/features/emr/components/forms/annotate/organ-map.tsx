import {
  Alert,
  Button,
  Checkbox,
  Group,
  Radio,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { organCatalog, organDisplayName, type OrganStructure } from './organ-catalog';

export type OrganMapFieldProps = {
  value: readonly string[];
  onChange: (value: string[]) => void;
  /** Organ slug, e.g. 'heart'. */
  organ?: string;
  /** Restrict selection to these structure ids (defaults to all). */
  structureIds?: readonly string[];
  multiple?: boolean;
  label?: string;
};

/**
 * Clickable organ-structure picker. Structure catalogue extracted from
 * OrganUI's organ components (MIT).
 */
export function OrganMapField({
  value,
  onChange,
  organ,
  structureIds,
  multiple = true,
  label,
}: OrganMapFieldProps) {
  const [search, setSearch] = useState('');
  const all = useMemo<OrganStructure[]>(() => (organ ? (organCatalog[organ] ?? []) : []), [organ]);
  const allowed = structureIds?.length ? new Set(structureIds) : null;
  const selected = new Set(value);
  const query = search.trim().toLowerCase();
  const filtered = (allowed ? all.filter((s) => allowed.has(s.id)) : all).filter(
    (s) => !query || s.label.toLowerCase().includes(query) || s.id.includes(query)
  );

  const groups = useMemo(() => {
    const map = new Map<string, OrganStructure[]>();
    for (const structure of filtered) {
      const key = structure.group ?? 'Structures';
      const list = map.get(key) ?? [];
      list.push(structure);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered]);

  function toggle(id: string) {
    if (multiple) {
      onChange(selected.has(id) ? value.filter((item) => item !== id) : [...value, id]);
    } else {
      onChange(selected.has(id) ? [] : [id]);
    }
  }

  if (!organ) {
    return <Alert color="red">No organ is configured for this field.</Alert>;
  }
  if (!all.length) {
    return <Alert color="red">No structures are available for {organDisplayName(organ)}.</Alert>;
  }

  return (
    <Stack gap="sm" role="group" aria-label={label ?? `${organDisplayName(organ)} structures`}>
      <TextInput
        placeholder="Search structures…"
        leftSection={<Search size={14} />}
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />
      <ScrollArea.Autosize mah={280} type="auto">
        <Stack gap="sm">
          {groups.map(([group, structures]) => (
            <div key={group}>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                {group}
              </Text>
              <Stack gap={2} mt={4}>
                {structures.map((structure) =>
                  multiple ? (
                    <Checkbox
                      key={structure.id}
                      checked={selected.has(structure.id)}
                      onChange={() => toggle(structure.id)}
                      label={structure.label}
                    />
                  ) : (
                    <Radio
                      key={structure.id}
                      checked={selected.has(structure.id)}
                      onChange={() => toggle(structure.id)}
                      label={structure.label}
                    />
                  )
                )}
              </Stack>
            </div>
          ))}
          {groups.length === 0 && (
            <Text size="sm" c="dimmed">
              No structures match “{search}”.
            </Text>
          )}
        </Stack>
      </ScrollArea.Autosize>

      {selected.size > 0 && (
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            {selected.size} selected
          </Text>
          <Group gap={6}>
            {[...selected].map((id) => {
              const structure = all.find((item) => item.id === id);
              return (
                <Button
                  key={id}
                  size="compact-xs"
                  variant="light"
                  color="teal"
                  rightSection={<X size={12} />}
                  aria-label={`Remove ${structure?.label ?? id}`}
                  onClick={() => toggle(id)}
                >
                  {structure?.label ?? id}
                </Button>
              );
            })}
            <Button size="compact-xs" variant="subtle" color="gray" onClick={() => onChange([])}>
              Clear all
            </Button>
          </Group>
        </Stack>
      )}
    </Stack>
  );
}
