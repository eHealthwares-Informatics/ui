import {
  Badge,
  Box,
  Checkbox,
  Divider,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { Search } from 'lucide-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { ModuleContext } from '@/context/module-context';

// ─── Catalog shapes (mirror the /permissions/modules response) ───────────────

export type CatalogAction = { code: string; name: string; description: string; action: string };

export type CatalogEntity = {
  resource: string;
  label: string;
  actions: CatalogAction[];
};

export type CatalogModule = {
  id: string;
  name: string;
  entities: CatalogEntity[];
};

/** Raw module payload from GET /permissions/modules */
export type RawPermission = {
  code: string;
  name: string;
  description: string;
  resource: string;
  action: string;
};

export type RawModule = {
  module: string;
  moduleDisplayName: string;
  permissions: RawPermission[];
};

// ─── Normalization ───────────────────────────────────────────────────────────

export function groupByResource(permissions: RawPermission[]): CatalogEntity[] {
  const map = new Map<string, CatalogEntity>();
  for (const p of permissions) {
    let entity = map.get(p.resource);
    if (!entity) {
      entity = {
        resource: p.resource,
        label: p.resource.charAt(0).toUpperCase() + p.resource.slice(1).replace(/_/g, ' '),
        actions: [],
      };
      map.set(p.resource, entity);
    }
    entity.actions.push({
      code: p.code,
      name: p.name,
      description: p.description,
      action: p.action,
    });
  }
  return [...map.values()];
}

export function toCatalog(raw: RawModule[]): CatalogModule[] {
  return raw.map((mod) => ({
    id: mod.module,
    name: mod.moduleDisplayName,
    entities: groupByResource(mod.permissions),
  }));
}

// ─── Selection helpers (pure — operate on a Set of codes) ───────────────────

export function entityCodes(entity: CatalogEntity): string[] {
  return entity.actions.map((a) => a.code);
}

export function moduleCodes(mod: CatalogModule): string[] {
  return mod.entities.flatMap((e) => entityCodes(e));
}

export function allCodes(catalog: CatalogModule[]): string[] {
  return catalog.flatMap((m) => moduleCodes(m));
}

export function isEntityChecked(selected: Set<string>, entity: CatalogEntity): boolean {
  return entityCodes(entity).every((c) => selected.has(c));
}

export function isEntityPartial(selected: Set<string>, entity: CatalogEntity): boolean {
  const any = entityCodes(entity).some((c) => selected.has(c));
  return any && !isEntityChecked(selected, entity);
}

export function isModuleChecked(selected: Set<string>, mod: CatalogModule): boolean {
  return moduleCodes(mod).every((c) => selected.has(c));
}

export function isModulePartial(selected: Set<string>, mod: CatalogModule): boolean {
  const any = moduleCodes(mod).some((c) => selected.has(c));
  return any && !isModuleChecked(selected, mod);
}

export function isAllChecked(selected: Set<string>, catalog: CatalogModule[]): boolean {
  return allCodes(catalog).every((c) => selected.has(c));
}

export function isAllPartial(selected: Set<string>, catalog: CatalogModule[]): boolean {
  const any = allCodes(catalog).some((c) => selected.has(c));
  return any && !isAllChecked(selected, catalog);
}

// ─── Component ───────────────────────────────────────────────────────────────

export type PermissionPickerProps = {
  /** Selected permission codes (controlled) */
  value: string[];
  onChange: (codes: string[]) => void;
  /** Static catalog — skips the API fetch (tests, storybook, embedded use) */
  modules?: RawModule[];
  /** Axios instance for GET /permissions/modules; defaults to the module context provider */
  apiProvider?: { get: (...args: any[]) => Promise<any> };
  disabled?: boolean;
  error?: string;
  /** Pane height; defaults to a modal-friendly 420px */
  height?: number;
};

type Focus = { moduleId: string; resource: string | null };

export function PermissionPicker({
  value,
  onChange,
  modules: modulesProp,
  apiProvider: apiProviderProp,
  disabled = false,
  error,
  height = 420,
}: PermissionPickerProps) {
  const ctx = useContext(ModuleContext);
  const apiProvider = apiProviderProp ?? ctx?.apiProvider;

  const [catalog, setCatalog] = useState<CatalogModule[]>([]);
  const [loading, setLoading] = useState(!modulesProp);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<Focus | null>(null);

  const selected = useMemo(() => new Set(value), [value]);

  // Load the permission catalog unless a static one was passed in
  useEffect(() => {
    if (modulesProp) {
      setCatalog(toCatalog(modulesProp));
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiProvider
      ?.get('/permissions/modules')
      .then((res: any) => {
        if (cancelled) {
          return;
        }
        setCatalog(toCatalog(Array.isArray(res.data) ? res.data : []));
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [modulesProp, apiProvider]);

  const toggleCode = (code: string, next: boolean) => {
    if (disabled) {
      return;
    }
    const out = next ? [...new Set([...value, code])] : value.filter((c) => c !== code);
    onChange(out);
  };

  const setCodes = (codes: string[], next: boolean) => {
    if (disabled) {
      return;
    }
    const out = next ? [...new Set([...value, ...codes])] : value.filter((c) => !codes.includes(c));
    onChange(out);
  };

  const toggleExpand = (moduleId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  // Search filter (module name or entity label, case-insensitive)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return catalog;
    }
    return catalog
      .map((mod) => {
        const modMatch = mod.name.toLowerCase().includes(q);
        const entities = modMatch
          ? mod.entities
          : mod.entities.filter((e) => e.label.toLowerCase().includes(q));
        if (!modMatch && entities.length === 0) {
          return null;
        }
        return { ...mod, entities };
      })
      .filter((m): m is CatalogModule => m !== null);
  }, [catalog, query]);

  const total = allCodes(catalog).length;
  const selectedCount = value.length;

  // The side panel follows the user's focus, falling back to the first module that
  // survives the current search filter so the panel never shows rows hidden by the search.
  const effectiveFocus: Focus | null =
    focus ?? (filtered.length > 0 ? { moduleId: filtered[0].id, resource: null } : null);
  const focusedModule =
    (effectiveFocus ? filtered.find((m) => m.id === effectiveFocus.moduleId) : undefined) ??
    filtered[0] ??
    null;
  const focusedEntity =
    focusedModule && effectiveFocus?.resource
      ? (focusedModule.entities.find((e) => e.resource === effectiveFocus.resource) ?? null)
      : null;

  if (loading) {
    return (
      <Box h={height} style={{ display: 'grid', placeItems: 'center' }}>
        <Loader size="sm" />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Text c="red" size="sm">
        Failed to load the permission catalog.
      </Text>
    );
  }

  return (
    <Box>
      {error ? (
        <Text c="red" size="xs" mb={4}>
          {error}
        </Text>
      ) : null}
      <Group
        justify="space-between"
        gap="sm"
        mb="xs"
        wrap="nowrap"
        style={{
          border: '1px solid var(--mantine-color-gray-3)',
          borderRadius: 8,
          padding: '8px 12px',
        }}
      >
        <Checkbox
          label={
            <Text fw={500} size="sm">
              Select All
            </Text>
          }
          checked={isAllChecked(selected, catalog)}
          indeterminate={isAllPartial(selected, catalog)}
          disabled={disabled || catalog.length === 0}
          onChange={(e) => setCodes(allCodes(catalog), e.currentTarget.checked)}
          aria-label="Select all permissions"
        />
        <Badge variant="light" color={selectedCount > 0 ? 'blue' : 'gray'}>
          {selectedCount} / {total} permissions
        </Badge>
      </Group>

      <Group gap="sm" align="stretch" wrap="nowrap" style={{ height }}>
        {/* ── Left pane: module/entity tree ── */}
        <Stack
          gap={0}
          w={260}
          style={{
            flexShrink: 0,
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <Box p="xs" pb={4}>
            <TextInput
              size="xs"
              placeholder="Search…"
              leftSection={<Search size={13} />}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              disabled={disabled}
            />
          </Box>
          <ScrollArea style={{ flex: 1 }} offsetScrollbars scrollbarSize={6}>
            <Stack gap={0} p="xs" pt={0}>
              {filtered.map((mod) => {
                const isOpen = expanded.has(mod.id) || query.trim().length > 0;
                const modActions = mod.entities.flatMap((e) => e.actions);
                return (
                  <Box key={mod.id}>
                    <Group
                      justify="space-between"
                      wrap="nowrap"
                      gap={4}
                      py={4}
                      style={{
                        borderRadius: 6,
                        background:
                          effectiveFocus?.moduleId === mod.id && !effectiveFocus?.resource
                            ? 'var(--mantine-color-blue-0)'
                            : undefined,
                      }}
                    >
                      <Group gap={6} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        <UnstyledButton
                          onClick={() => toggleExpand(mod.id)}
                          fz={11}
                          c="dimmed"
                          style={{ lineHeight: 1, flexShrink: 0, width: 14 }}
                          aria-label={isOpen ? `Collapse ${mod.name}` : `Expand ${mod.name}`}
                        >
                          {isOpen ? '▾' : '▸'}
                        </UnstyledButton>
                        <Checkbox
                          size="xs"
                          checked={isModuleChecked(selected, mod)}
                          indeterminate={isModulePartial(selected, mod)}
                          disabled={disabled}
                          onChange={(e) => setCodes(moduleCodes(mod), e.currentTarget.checked)}
                          aria-label={`Select all ${mod.name}`}
                        />
                        <UnstyledButton
                          onClick={() => setFocus({ moduleId: mod.id, resource: null })}
                          fz="sm"
                          fw={500}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {mod.name}
                        </UnstyledButton>
                      </Group>
                      <Badge size="xs" variant="light" color="gray">
                        {modActions.filter((a) => selected.has(a.code)).length}/{modActions.length}
                      </Badge>
                    </Group>

                    {isOpen &&
                      mod.entities.map((entity) => {
                        const active =
                          effectiveFocus?.moduleId === mod.id &&
                          effectiveFocus?.resource === entity.resource;
                        return (
                          <Group
                            key={entity.resource}
                            gap={6}
                            wrap="nowrap"
                            pl={22}
                            py={2}
                            style={{
                              borderRadius: 6,
                              background: active ? 'var(--mantine-color-blue-0)' : undefined,
                            }}
                          >
                            <Checkbox
                              size="xs"
                              checked={isEntityChecked(selected, entity)}
                              indeterminate={isEntityPartial(selected, entity)}
                              disabled={disabled}
                              onChange={(e) =>
                                setCodes(entityCodes(entity), e.currentTarget.checked)
                              }
                              aria-label={`Select all ${entity.label}`}
                            />
                            <UnstyledButton
                              onClick={() =>
                                setFocus({ moduleId: mod.id, resource: entity.resource })
                              }
                              fz={13}
                              c={active ? 'blue.7' : 'dark'}
                              style={{
                                flex: 1,
                                minWidth: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {entity.label}
                            </UnstyledButton>
                          </Group>
                        );
                      })}
                  </Box>
                );
              })}
              {filtered.length === 0 && (
                <Text size="xs" c="dimmed" ta="center" py="sm">
                  No matches
                </Text>
              )}
            </Stack>
          </ScrollArea>
        </Stack>

        {/* ── Right pane: actions of the focused node ── */}
        <Stack
          gap="xs"
          style={{
            flex: 1,
            minWidth: 0,
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 8,
          }}
          p="sm"
        >
          {focusedModule ? (
            <>
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <Box style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {focusedEntity ? focusedEntity.label : focusedModule.name}
                  </Text>
                  <Group gap={4}>
                    <Text size="xs" c="dimmed">
                      {focusedModule.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      ›
                    </Text>
                    <Text size="xs" c="dimmed">
                      {focusedEntity ? focusedEntity.label : 'all entities'}
                    </Text>
                  </Group>
                </Box>
                {focusedEntity ? (
                  <Checkbox
                    size="xs"
                    label="Select All"
                    checked={isEntityChecked(selected, focusedEntity)}
                    indeterminate={isEntityPartial(selected, focusedEntity)}
                    disabled={disabled}
                    onChange={(e) => setCodes(entityCodes(focusedEntity), e.currentTarget.checked)}
                    aria-label={`Select all ${focusedEntity.label} actions`}
                  />
                ) : null}
              </Group>
              <Divider />
              {focusedEntity ? (
                <ScrollArea style={{ flex: 1 }} offsetScrollbars scrollbarSize={6}>
                  <Stack gap="xs">
                    {focusedEntity.actions.map((action) => (
                      <Checkbox
                        key={action.code}
                        checked={selected.has(action.code)}
                        disabled={disabled}
                        onChange={(e) => toggleCode(action.code, e.currentTarget.checked)}
                        label={
                          <Box>
                            <Text size="sm">{action.name}</Text>
                            {action.description ? (
                              <Text size="xs" c="dimmed">
                                {action.description}
                              </Text>
                            ) : null}
                          </Box>
                        }
                      />
                    ))}
                  </Stack>
                </ScrollArea>
              ) : (
                <Stack gap={6} style={{ flex: 1 }}>
                  {focusedModule.entities.map((entity) => (
                    <UnstyledButton
                      key={entity.resource}
                      onClick={() =>
                        setFocus({ moduleId: focusedModule.id, resource: entity.resource })
                      }
                      p={6}
                      style={{
                        borderRadius: 6,
                        border: '1px solid var(--mantine-color-gray-2)',
                        textAlign: 'left',
                      }}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm">{entity.label}</Text>
                        <Group gap={6} wrap="nowrap">
                          <Checkbox
                            size="xs"
                            readOnly
                            disabled={disabled}
                            checked={isEntityChecked(selected, entity)}
                            indeterminate={isEntityPartial(selected, entity)}
                            tabIndex={-1}
                          />
                          <Text size="xs" c="dimmed">
                            {entity.actions.length} actions ›
                          </Text>
                        </Group>
                      </Group>
                    </UnstyledButton>
                  ))}
                </Stack>
              )}
            </>
          ) : (
            <Text size="sm" c="dimmed">
              Select a module to view its actions.
            </Text>
          )}
        </Stack>
      </Group>
    </Box>
  );
}
