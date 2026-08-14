import { useState } from 'react';
import { Card, Stack, Text, Table, Button, NumberInput, Paper, Group, Badge } from '@mantine/core';
import { Printer, CheckCircle2 } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { useOrderContext } from '../OrderContext';

export function PrintLabelsSection() {
  const { state } = useOrderContext();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [printed, setPrinted] = useState<Record<string, boolean>>({});

  const labels = [
    { key: 'order', label: 'Order Label', content: state.orderNumber ?? 'N/A' },
    ...state.samples.map((s, i) => ({
      key: `sample-${i}`,
      label: `Sample #${i + 1} Label`,
      content: `${s.barcode}${s.sampleType ? ` (${s.sampleType})` : ''}`,
    })),
  ];

  const handlePrint = (key: string) => {
    const qty = quantities[key] ?? 1;
    notifications.show({
      title: 'Printing',
      message: `Printing ${qty} copy(ies) of ${key}`,
      color: 'blue',
    });
    setPrinted((prev) => ({ ...prev, [key]: true }));
  };

  const handlePrintAll = () => {
    labels.forEach((l) => {
      if (!printed[l.key]) {
        handlePrint(l.key);
      }
    });
  };

  const allPrinted = labels.every((l) => printed[l.key]);

  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Print Labels</Text>
          {allPrinted && (
            <Badge color="green" variant="light" leftSection={<CheckCircle2 size={14} />}>
              All Printed
            </Badge>
          )}
        </Group>

        <Paper withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Label</Table.Th>
                <Table.Th>Content</Table.Th>
                <Table.Th>Quantity</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {labels.map((l) => (
                <Table.Tr key={l.key}>
                  <Table.Td>
                    <Text size="sm">{l.label}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace">
                      {l.content}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      size="xs"
                      min={0}
                      max={10}
                      value={quantities[l.key] ?? 1}
                      onChange={(v) => setQuantities((prev) => ({ ...prev, [l.key]: v === '' ? 1 : Number(v) }))}
                      w={70}
                    />
                  </Table.Td>
                  <Table.Td>
                    {printed[l.key] ? (
                      <Badge size="sm" color="green" variant="light">
                        Printed
                      </Badge>
                    ) : (
                      <Badge size="sm" color="gray" variant="light">
                        Pending
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Button size="xs" leftSection={<Printer size={14} />} onClick={() => handlePrint(l.key)}>
                      Print
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>

        <Button leftSection={<Printer size={16} />} onClick={handlePrintAll} disabled={allPrinted}>
          Print All Labels
        </Button>
      </Stack>
    </Card>
  );
}
