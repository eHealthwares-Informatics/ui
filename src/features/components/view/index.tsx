import { useState } from 'react';
import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Card,
  Center,
  Divider,
  Grid,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { Pencil } from 'lucide-react';
import { View } from '@/features/rxsoft/types';
import { DataPageForm } from '@/features/components/page/data-page-form';

type Props<T> = {
  view: View<T>;
  data?: T | null;
};

export function GenericViewComponent<T>({ view, data }: Props<T>) {
  const isLoading = !data || (typeof data === 'object' && Object.keys(data as object).length === 0);

  const [editAccordionItem, setEditAccordionItem] = useState<{
    item: any;
    config: any;
  } | null>(null);

  const [editOpen, setEditOpen] = useState(false);

  return (
    <Stack gap="lg">
      {/* PAGE TITLE */}
      <Group justify="space-between" align="center">
        {view.title && <Title order={2}>{view.title}</Title>}
        {view.editConfig && !isLoading && (
          <Button
            leftSection={<Pencil size={16} />}
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
        )}
      </Group>

      {/* FIELD GROUPS */}
      {view.fieldGroups?.map((group, groupIndex) => (
        <Card key={groupIndex} withBorder radius="md" p="lg">
          {group.title && (
            <>
              <Title order={4} mb="md">
                {group.title}
              </Title>
              <Divider mb="lg" />
            </>
          )}

          {isLoading ? (
            <Center py="xl">
              <Loader size="md" />
            </Center>
          ) : (
            <Grid>
              {group.fields.map((field) => {
                let value: any;

                if ((field.key as string).includes('.')) {
                  const parts = (field.key as string).split('.');
                  const node = parts[0];
                  const nested = (data as any)?.[node];
                  if (Array.isArray(nested)) {
                    const code = parts[1];
                    value = nested.find(
                      (cc: any) => cc.attribute?.code === code,
                    )?.value;
                  } else if (nested != null && typeof nested === 'object') {
                    value = parts.reduce((acc: any, k: string) => acc?.[k], data);
                  } else {
                    value = undefined;
                  }
                } else {
                  value = (data as any)?.[field.key];
                }

                return (
                  <Grid.Col key={String(field.key)} span={field.col || 3}>
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        {field.label}
                      </Text>
                      <Box>
                        {field.render ? field.render(value, data) : String(value ?? '-')}
                      </Box>
                    </Stack>
                  </Grid.Col>
                );
              })}
            </Grid>
          )}
        </Card>
      ))}

      {/* TABLE SECTIONS */}
      {view.lists?.map((list, listIndex) => {
        const rows = isLoading ? [] : ((data as any)[list.key] as any[]) || [];

        return (
          <Card key={listIndex} withBorder radius="md" p="lg">
            <Title order={4} mb="md">
              {list.title}
            </Title>

            {isLoading ? (
              <Center py="xl">
                <Loader size="md" />
              </Center>
            ) : (
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    {list.columns.map((column) => (
                      <Table.Th key={String(column.key)}>{column.label}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {rows.map((row, rowIndex) => (
                    <Table.Tr key={rowIndex}>
                      {list.columns.map((column) => {
                        const value = row[column.key];

                        return (
                          <Table.Td key={String(column.key)}>
                            {column.render
                              ? column.render(value, row)
                              : String(value ?? '-')}
                          </Table.Td>
                        );
                      })}
                    </Table.Tr>
                  ))}
                </Table.Tbody>

                {list.footer && (
                  <Table.Tfoot>
                    <Table.Tr>{list.footer(rows)}</Table.Tr>
                  </Table.Tfoot>
                )}
              </Table>
            )}
          </Card>
        );
      })}

      {/* ACCORDION SECTIONS */}
      {view.accordions?.map((accordionSection, sectionIndex) => {
        const items: any[] = isLoading
          ? []
          : ((data as any)[accordionSection.key as string] as any[]) || [];
        console.log({items})
        return (
          <Card key={sectionIndex} withBorder radius="md" p="lg">
            <Title order={4} mb="md">
              {accordionSection.title}
            </Title>

            {isLoading ? (
              <Center py="xl">
                <Loader size="md" />
              </Center>
            ) : items.length === 0 ? (
              <Text size="sm" c="dimmed">
                No items
              </Text>
            ) : (
              <Accordion>
                {(items).map((item, itemIndex) => {
                  const label = accordionSection.renderLabel
                    ? accordionSection.renderLabel(item)
                    : (item[accordionSection.labelKey ?? 'name'] ?? String(item.id ?? itemIndex));

                  return (
                    <Accordion.Item key={item.id ?? itemIndex} value={String(item.id ?? itemIndex)}>
                      <Accordion.Control>
                        <Group justify="space-between" wrap="nowrap">
                          <Text truncate style={{ flex: 1 }}>
                            {label}
                          </Text>
                          {accordionSection.itemEditConfig && (
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditAccordionItem({
                                  item,
                                  config: accordionSection.itemEditConfig,
                                });
                              }}
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
                              ([key, _v]) =>
                                !['id', '_id', accordionSection.labelKey ?? 'name'].includes(key),
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
          </Card>
        );
      })}

      {/* ACCORDION ITEM EDIT MODAL */}
      {editAccordionItem && (
        <Modal
          opened
          onClose={() => setEditAccordionItem(null)}
          title={`Edit ${editAccordionItem.config?.title ?? 'Item'}`}
          size="xl"
        >
          <DataPageForm
            config={editAccordionItem.config}
            initialData={editAccordionItem.item}
            mode="edit"
            onSave={() => setEditAccordionItem(null)}
          />
        </Modal>
      )}

      {/* RECORD EDIT MODAL */}
      {view.editConfig && (
        <Modal
          opened={editOpen}
          onClose={() => setEditOpen(false)}
          title={`Edit ${view.editConfig?.title ?? 'Record'}`}
          size="xl"
        >
          <DataPageForm
            config={view.editConfig}
            initialData={data as any}
            mode="edit"
            onSave={() => setEditOpen(false)}
          />
        </Modal>
      )}
    </Stack>
  );
}
