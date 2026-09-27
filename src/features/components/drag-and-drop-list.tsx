import { Table, Button, Modal, Text, Group } from '@mantine/core';
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

export type DragAndDropColumn<TItem> = {
  key: string;
  label: string;
  width?: string;
  render: (item: TItem) => React.ReactNode;
};

type DragAndDropListProps<TItem> = {
  items: TItem[];
  columns: DragAndDropColumn<TItem>[];
  getKey: (item: TItem, index: number) => string;
  onChange: (items: TItem[]) => void;
  onDelete?: (item: TItem, index: number) => void;
  emptyText?: string;
};

export function DragAndDropList<TItem>({
  items,
  columns,
  getKey,
  onChange,
  onDelete,
  emptyText = 'No items added yet.',
}: DragAndDropListProps<TItem>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const deleteTarget = useMemo(
    () => (deleteIndex == null ? null : (items[deleteIndex] ?? null)),
    [deleteIndex, items]
  );

  function moveItem(from: number, to: number) {
    if (from === to || to < 0 || to >= items.length) {
      return;
    }

    const nextItems = [...items];
    const [moved] = nextItems.splice(from, 1);
    nextItems.splice(to, 0, moved);
    onChange(nextItems);
  }

  function confirmDelete() {
    if (deleteTarget != null && deleteIndex != null) {
      const nextItems = items.filter((_, i) => i !== deleteIndex);
      onDelete?.(deleteTarget, deleteIndex);
      onChange(nextItems);
    }
    setDeleteIndex(null);
  }

  return (
    <>
      <div className="overflow-hidden rounded-md border">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 60 }}>#</Table.Th>
              <Table.Th style={{ width: 60 }}>Drag</Table.Th>

              {columns.map((col) => (
                <Table.Th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </Table.Th>
              ))}

              <Table.Th style={{ width: 160 }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length + 3}>
                  <Text ta="center" c="dimmed" py="md">
                    {emptyText}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : null}

            {items.map((item, index) => (
              <Table.Tr
                key={getKey(item, index)}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex != null) {
                    moveItem(dragIndex, index);
                  }
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
              >
                <Table.Td>{index + 1}</Table.Td>

                <Table.Td>
                  <GripVertical size={16} style={{ opacity: 0.6 }} />
                </Table.Td>

                {columns.map((col) => (
                  <Table.Td key={col.key}>{col.render(item)}</Table.Td>
                ))}

                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      disabled={index === 0}
                      onClick={() => moveItem(index, index - 1)}
                    >
                      <ArrowUp size={14} />
                    </Button>

                    <Button
                      size="xs"
                      variant="light"
                      disabled={index === items.length - 1}
                      onClick={() => moveItem(index, index + 1)}
                    >
                      <ArrowDown size={14} />
                    </Button>

                    {onDelete && (
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        onClick={() => setDeleteIndex(index)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>

      <Modal
        opened={deleteTarget != null}
        onClose={() => setDeleteIndex(null)}
        title="Delete item"
        centered
      >
        <Text size="sm" c="dimmed">
          This action removes the selected row from the current list.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setDeleteIndex(null)}>
            Cancel
          </Button>

          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
}
