import { Card, Group, Table, Text, ThemeIcon } from '@mantine/core';
import type { LucideIcon } from 'lucide-react';

export function ReportsTable({
  title,
  description,
  columns,
  rows,
  icon: Icon,
}: {
  title: string;
  description: string;
  columns: string[];
  rows: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <Card withBorder radius="md" p="md" style={{ height: '100%' }}>
      <Group gap="sm" mb="md" wrap="nowrap">
        {Icon && (
          <ThemeIcon variant="light" size="md" radius="md" color="blue">
            <Icon size={18} />
          </ThemeIcon>
        )}
        <div>
          <Text fw={600} size="sm">
            {title}
          </Text>
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        </div>
      </Group>

      <Table
        striped
        highlightOnHover
        withTableBorder
        withColumnBorders
        horizontalSpacing="md"
        verticalSpacing="sm"
      >
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={column}>
                <Text size="xs" c="dimmed" fw={600} tt="uppercase" lh={1}>
                  {column}
                </Text>
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Card>
  );
}
