import { useQuery } from '@tanstack/react-query';
import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Card,
  Center,
  Grid,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApiProvider } from '@/context/module-context';
import { Field, Option } from '@/features/rxsoft/types';
import { DataPageForm } from '@/features/components/page/data-page-form';
import { AsyncSelectField } from './async-field';
import { FieldGroup } from './FieldGroup';

type AccordionArrayProps = {
  field: Field;
  items: any[];
  parentFormState?: Record<string, unknown>;
  onChange?: (items: any[]) => void;
};

export function AccordionArrayField({ field, items, parentFormState, onChange }: AccordionArrayProps) {
  const [editItem, setEditItem] = useState<{ item: any; index: number } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const parentId = field.relationshipId ? parentFormState?.id : undefined;
  const childConfig = useMemo(() => {
    if (!field.itemEditConfig || !field.relationshipId) {
      return field.itemEditConfig;
    }
    return {
      ...field.itemEditConfig,
      createFieldGroups: (field.itemEditConfig.createFieldGroups ?? []).map(
        (group: any) => ({
          ...group,
          fields: (group.fields ?? []).map((f: any) =>
            f.name === field.relationshipId ? { ...f, type: 'hidden' as const } : f
          ),
        })
      ),
      defaultState: {
        ...(field.itemEditConfig.defaultState ?? {}),
        [field.relationshipId]: parentId,
      },
    };
  }, [field.itemEditConfig, field.relationshipId, parentId]);

  const childInitialData = useMemo(() => {
    if (!field.relationshipId) return undefined;
    return { [field.relationshipId]: parentId };
  }, [field.relationshipId, parentId]);

  const upsertItem = (index: number, updated: any) => {
    const next = [...(items ?? [])];
    next[index] = updated;
    onChange?.(next);
    setEditItem(null);
    setIsAdding(false);
  };

  const addItem = (created: any) => {
    onChange?.([...(items ?? []), created]);
    setIsAdding(false);
  };

  const removeItem = (index: number) => {
    const next = [...(items ?? [])];
    next.splice(index, 1);
    onChange?.(next);
  };

  return (
    <Box>
      {items.length === 0 ? (
        <Text size="sm" c="dimmed">No items</Text>
      ) : (
        <Accordion>
          {items.map((item, itemIndex) => {
            const label = field.itemRender
              ? field.itemRender(item)
              : item[field.itemLabelKey ?? 'name'] ?? String(item.id ?? itemIndex);
            return (
              <Accordion.Item key={item.id ?? itemIndex} value={String(item.id ?? itemIndex)}>
                <Accordion.Control>
                  <Group justify="space-between" wrap="nowrap">
                    <Text truncate style={{ flex: 1 }}>
                      {String(label)}
                    </Text>
                    {field.itemEditConfig && (
                      <ActionIcon
                        component="span"
                        variant="subtle"
                        color="gray"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setEditItem({
                            item: { ...item, ...(childInitialData ?? {}) },
                            index: itemIndex,
                          });
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <Pencil size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Grid>
                    {Object.entries(item)
                      .filter(
                        ([key]) =>
                          !['id', '_id', field.itemLabelKey ?? 'name', field.relationshipId].includes(key),
                      )
                      .map(([key, val]) => (
                        <Grid.Col key={key} span={6}>
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed">
                              {key}
                            </Text>
                            <Text size="sm">
                              {val == null
                                ? '-'
                                : typeof val === 'object'
                                  ? JSON.stringify(val)
                                  : String(val)}
                            </Text>
                          </Stack>
                        </Grid.Col>
                      ))}
                  </Grid>
                  <Group justify="flex-end" mt="xs">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => removeItem(itemIndex)}
                    >
                      <Trash2 size={14} />
                    </ActionIcon>
                  </Group>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}

      {field.itemEditConfig && (
        <Button
          variant="light"
          size="xs"
          mt="xs"
          leftSection={<Plus size={14} />}
          onClick={() => setIsAdding(true)}
        >
          Add {field.itemEditConfig?.title ?? 'Item'}
        </Button>
      )}

      {isAdding && (
        <Modal
          opened
          onClose={() => setIsAdding(false)}
          title={`Add ${field.itemEditConfig?.title ?? 'Item'}`}
          size="xl"
        >
          <DataPageForm
            config={childConfig}
            initialData={childInitialData}
            mode="create"
            onSaved={addItem}
          />
        </Modal>
      )}

      {editItem && (
        <Modal
          opened
          onClose={() => setEditItem(null)}
          title={`Edit ${field.itemEditConfig?.title ?? 'Item'}`}
          size="xl"
        >
          <DataPageForm
            config={childConfig}
            initialData={editItem.item}
            mode="edit"
            onSaved={(updated) => upsertItem(editItem.index, updated)}
          />
        </Modal>
      )}
    </Box>
  );
}

type AccordionSingleProps = {
  field: Field;
  value?: string | null;
  onChange?: (value: string | null) => void;
};

export function JsonAccordionArrayField({ field, items, onChange }: AccordionArrayProps) {
  const [editItem, setEditItem] = useState<{ item: any; index: number } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const upsertItem = (index: number, updated: any) => {
    const next = [...(items ?? [])];
    next[index] = updated;
    onChange?.(next);
    setEditItem(null);
    setIsAdding(false);
  };

  const addItem = (created: any) => {
    onChange?.([...(items ?? []), created]);
    setIsAdding(false);
  };

  const removeItem = (index: number) => {
    const next = [...(items ?? [])];
    next.splice(index, 1);
    onChange?.(next);
  };

  const itemConfig = field.itemEditConfig;

  return (
    <Box>
      {items.length === 0 ? (
        <Text size="sm" c="dimmed">No items</Text>
      ) : (
        <Accordion>
          {items.map((item, itemIndex) => {
            const label = field.itemRender
              ? field.itemRender(item)
              : item[field.itemLabelKey ?? 'name'] ?? String(item.id ?? itemIndex);
            return (
              <Accordion.Item key={item.id ?? itemIndex} value={String(item.id ?? itemIndex)}>
                <Accordion.Control>
                  <Group justify="space-between" wrap="nowrap">
                    <Text truncate style={{ flex: 1 }}>
                      {String(label)}
                    </Text>
                    {itemConfig && (
                      <ActionIcon
                        component="span"
                        variant="subtle"
                        color="gray"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setEditItem({ item, index: itemIndex });
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <Pencil size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap={4}>
                    {Object.entries(item)
                      .filter(
                        ([key]) =>
                          !['id', '_id', field.itemLabelKey ?? 'name'].includes(key),
                      )
                      .map(([key, val]) => (
                        <Group key={key} gap="xs" wrap="nowrap">
                          <Text size="xs" c="dimmed" style={{ width: 120 }}>
                            {key}
                          </Text>
                          <Text size="sm" truncate>
                            {val == null
                              ? '-'
                              : typeof val === 'object'
                                ? JSON.stringify(val)
                                : String(val)}
                          </Text>
                        </Group>
                      ))}
                  </Stack>
                  <Group justify="flex-end" mt="xs">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => removeItem(itemIndex)}
                    >
                      <Trash2 size={14} />
                    </ActionIcon>
                  </Group>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}

      {itemConfig && (
        <Button
          variant="light"
          size="xs"
          mt="xs"
          leftSection={<Plus size={14} />}
          onClick={() => setIsAdding(true)}
        >
          Add {itemConfig?.title ?? 'Item'}
        </Button>
      )}

      {isAdding && (
        <Modal
          opened
          onClose={() => setIsAdding(false)}
          title={`Add ${itemConfig?.title ?? 'Item'}`}
          size="xl"
        >
          <JsonItemEditor
            config={itemConfig}
            mode="create"
            onSaved={addItem}
            onCancel={() => setIsAdding(false)}
          />
        </Modal>
      )}

      {editItem && (
        <Modal
          opened
          onClose={() => setEditItem(null)}
          title={`Edit ${itemConfig?.title ?? 'Item'}`}
          size="xl"
        >
          <JsonItemEditor
            config={itemConfig}
            initialData={editItem.item}
            mode="edit"
            onSaved={(updated) => upsertItem(editItem.index, updated)}
            onCancel={() => setEditItem(null)}
          />
        </Modal>
      )}
    </Box>
  );
}

function JsonItemEditor({
  config,
  initialData,
  mode,
  onSaved,
  onCancel,
}: {
  config: any;
  initialData?: Record<string, unknown>;
  mode: 'create' | 'edit';
  onSaved: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [formState, setFormState] = useState<Record<string, unknown>>(() =>
    mode === 'edit' && initialData && config.buildFormState
      ? config.buildFormState(initialData)
      : (config.defaultState ?? {})
  );

  const updateField = (name: string, value: unknown) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const fieldGroups = config.createFieldGroups ?? [];

  const handleSave = () => {
    const payload = config.buildCreatePayload
      ? config.buildCreatePayload(formState)
      : formState;
    onSaved(payload);
  };

  return (
    <Stack gap="lg">
      {fieldGroups.map((fieldGroup: any, index: number) => (
        <FieldGroup
          key={index}
          index={index}
          fieldGroup={fieldGroup}
          formState={formState}
          updateField={updateField}
        />
      ))}
      <Group justify="flex-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>{mode === 'edit' ? 'Update' : 'Add'}</Button>
      </Group>
    </Stack>
  );
}

export function AccordionSingleField({ field, value, onChange }: AccordionSingleProps) {
  const apiProvider = useApiProvider();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [entityData, setEntityData] = useState<Record<string, unknown> | null>(null);

  const endpoint = field.searchParam?.endpoint ?? '';
  const labelKey = field.itemLabelKey ?? 'name';

  const valueId = value && typeof value === 'object' ? (value as any).value : value;
  const valueLabel = value && typeof value === 'object' ? (value as any).label : value;

  const entityQuery = useQuery({
    queryKey: [endpoint, valueId],
    queryFn: async () => {
      if (!valueId || !endpoint) {return null;}
      const response = await apiProvider!.get(`${endpoint}/${valueId}`);
      return (response.data?.data ?? response.data) as Record<string, unknown>;
    },
    enabled: !!valueId && !!endpoint,
  });

  const handleOpenEdit = () => {
    if (entityQuery.data) {
      setEntityData(entityQuery.data);
      setEditModalOpen(true);
    }
  };

  const label = valueId
    ? (entityQuery.data?.[labelKey] as string) ?? valueLabel ?? valueId
    : `Select ${field.label}`;

  return (
    <Accordion>
      <Accordion.Item value="single">
        <Accordion.Control>
          <Group gap="sm" wrap="nowrap">
            <Text truncate style={{ flex: 1 }}>
              {label}
            </Text>
            {valueId && (
              <ActionIcon
                component="span"
                variant="subtle"
                color="gray"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleOpenEdit();
                }}
                disabled={entityQuery.isLoading}
                style={{ cursor: 'pointer' }}
              >
                {entityQuery.isLoading ? <Loader size={16} /> : <Pencil size={16} />}
              </ActionIcon>
            )}
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="md" pt="md">
            <AsyncSelectField
              field={field}
              value={!valueId ? null : { value: valueId, label: entityQuery.data?.[labelKey] as string ?? valueLabel ?? valueId }}
              onChange={(option: Option | null) => {
                onChange?.(option?.value ?? null);
              }}
            />
            {valueId && entityQuery.data && (
              <DataPageForm
                config={field.itemEditConfig}
                initialData={entityQuery.data}
                mode="edit"
                onSave={() => entityQuery.refetch()}
              />
            )}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {editModalOpen && entityData && (
        <Modal
          opened
          onClose={() => setEditModalOpen(false)}
          title={`Edit ${field.itemEditConfig?.title ?? 'Item'}`}
          size="xl"
        >
          <DataPageForm
            config={field.itemEditConfig}
            initialData={entityData}
            mode="edit"
            onSave={() => {
              setEditModalOpen(false);
              entityQuery.refetch();
            }}
          />
        </Modal>
      )}
    </Accordion>
  );
}
