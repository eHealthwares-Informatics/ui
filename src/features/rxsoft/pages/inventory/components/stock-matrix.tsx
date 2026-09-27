import { Card, Table, Text, Badge, Stack, Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';

type StockMatrixProps = {
  itemId?: string;
};

export function StockMatrix({ itemId }: StockMatrixProps) {
  const { data: balances = [], isLoading } = useQuery({
    queryKey: ['stock-matrix', itemId],
    queryFn: async () => {
      const params: Record<string, unknown> = { limit: 200 };
      if (itemId) {
        params.itemId = itemId;
      }
      const { data } = await rxsoftApi.get('/inventory/stock-balances', { params });
      return (data?.data ?? []) as Record<string, any>[];
    },
  });

  const { locations, matrix } = useMemo(() => {
    const locSet = new Set<string>();
    const itemMap = new Map<string, Record<string, number>>();

    for (const b of balances) {
      const locName = b.location?.name ?? b.locationId ?? 'Unknown';
      const itemName = b.item?.name ?? b.itemId ?? 'Unknown';
      locSet.add(locName);

      if (!itemMap.has(itemName)) {
        itemMap.set(itemName, {});
      }
      const row = itemMap.get(itemName)!;
      row[locName] = (row[locName] ?? 0) + Number(b.quantityOnHand ?? 0);
    }

    return {
      locations: Array.from(locSet),
      matrix: itemMap,
    };
  }, [balances]);

  if (isLoading) {
    return <Text c="dimmed">Loading stock matrix...</Text>;
  }

  if (balances.length === 0) {
    return <Text c="dimmed">No stock balances found.</Text>;
  }

  const itemNames = Array.from(matrix.keys());

  return (
    <Card withBorder p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Stock Quantity Matrix</Text>
          {itemId && <Badge>Filtered by item</Badge>}
        </Group>
        <Table striped withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              {locations.map((loc) => (
                <Table.Th key={loc}>{loc}</Table.Th>
              ))}
              <Table.Th>Total</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {itemNames.map((item) => {
              const row = matrix.get(item)!;
              const total = Object.values(row).reduce((s, v) => s + v, 0);
              return (
                <Table.Tr key={item}>
                  <Table.Td fw={500}>{item}</Table.Td>
                  {locations.map((loc) => (
                    <Table.Td key={loc}>
                      <Badge color={row[loc] > 0 ? 'green' : 'gray'} variant="light">
                        {row[loc] ?? 0}
                      </Badge>
                    </Table.Td>
                  ))}
                  <Table.Td>
                    <Badge color="blue">{total}</Badge>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Stack>
    </Card>
  );
}
