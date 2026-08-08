import { useQuery } from '@tanstack/react-query';
import {
  Accordion,
  ActionIcon,
  Box,
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
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useApiProvider } from '@/context/module-context';
import { Field, Option } from '@/features/rxsoft/types';
import { DataPageForm } from '@/features/components/page/data-page-form';
import { AsyncSelectField } from './async-field';

type AccordionArrayProps = {
  field: Field;
  items: any[];
  parentFormState?: Record<string, unknown>;
};

export function AccordionArrayField({ field, items, parentFormState }: AccordionArrayProps) {
  const [editItem, setEditItem] = useState<{ item: any } | null>(null);

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
                          const itemWithParent = field.relationshipId
                            ? { ...item, [field.relationshipId]: parentFormState?.id }
                            : item;
                          setEditItem({ item: itemWithParent });
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
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}

      {editItem && (
        <Modal
          opened
          onClose={() => setEditItem(null)}
          title={`Edit ${field.itemEditConfig?.title ?? 'Item'}`}
          size="xl"
        >
          <DataPageForm
            config={field.itemEditConfig}
            initialData={editItem.item}
            mode="edit"
            onSave={() => setEditItem(null)}
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
