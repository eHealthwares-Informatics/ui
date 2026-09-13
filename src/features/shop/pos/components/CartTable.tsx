import { ActionIcon, Image, NumberInput, Paper, ScrollArea, Select, Table, Text } from '@mantine/core';
import { Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { SaleSession } from '../types';

interface UomOption {
  id: string;
  name: string;
  code: string | null;
  factor: number;
  uomType: string;
  categoryId: string | null;
}

interface Props {
  session: SaleSession;
  onUpdateQty: (itemId: string, qty: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export function CartTable({ session, onUpdateQty, onRemoveItem }: Props) {
  const { data: allUoms = [] } = useQuery({
    queryKey: ['uoms', 'all'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/uoms', { params: { limit: 100 } });
      return (data?.data ?? data ?? []) as UomOption[];
    },
    staleTime: 300_000,
  });

  const uomMap = useMemo(() => {
    const map = new Map<string, UomOption>();
    for (const u of allUoms) {map.set(u.id, u);}
    return map;
  }, [allUoms]);

  return (
    <Paper radius={0} bg="#2f8a53" h="100%">
      <ScrollArea h="100%">
        <Table withTableBorder withColumnBorders stickyHeader>
          <Table.Thead bg="#f0d56a">
            <Table.Tr>
              <Table.Th w={50}>Image</Table.Th>
              <Table.Th>S/N</Table.Th>
              <Table.Th>CODE</Table.Th>
              <Table.Th>ITEM NAME</Table.Th>
              <Table.Th>PRICE</Table.Th>
              <Table.Th>UOM</Table.Th>
              <Table.Th>QTY</Table.Th>
              <Table.Th>TotalCost</Table.Th>
               {session.status !== 'completed' &&(<Table.Th />)}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {session.cart.map((item, index) => {
              const price =
                session.pricingMode === 'wholesale' ? item.wholesalePrice : item.retailPrice;
              return (
                <Table.Tr key={item.id} bg="#00185f">
                  <Table.Td>
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} w={36} h={36} fit="cover" />
                    ) : (
                      <Text size="xs" c="dimmed">-</Text>
                    )}
                  </Table.Td>
                  <Table.Td c="lime">{index + 1}</Table.Td>
                  <Table.Td c="lime">{item.code}</Table.Td>
                  <Table.Td c="lime">{item.name}</Table.Td>
                  <Table.Td c="lime">{price.toFixed(2)}</Table.Td>
                  <Table.Td c="lime">
                    <Select
                      size="xs"
                      data={(() => {
                        const current = uomMap.get(item.uomId);
                        if (!current?.categoryId) return Array.from(uomMap.values()).map((u) => ({ value: u.id, label: u.name }));
                        return Array.from(uomMap.values())
                          .filter((u) => u.categoryId === current.categoryId)
                          .map((u) => ({ value: u.id, label: u.name }));
                      })()}
                      value={item.uomId}
                      disabled
                      w={90}
                      styles={{
                        input: { color: 'lime', background: '#00185f', borderColor: '#2f8a53' },
                      }}
                    />
                  </Table.Td>
                  <Table.Td c="lime">
                    <NumberInput
                      size="xs"
                      min={1}
                      value={item.quantity}
                      onChange={(v) => onUpdateQty(item.id, Number(v) || 1)}
                      w={70}
                      styles={{
                        input: { color: 'lime', background: '#00185f', borderColor: '#2f8a53' },
                      }}
                    />
                  </Table.Td>
                  <Table.Td c="lime">
                    {(price * item.quantity * item.uomFactor).toFixed(2)}
                  </Table.Td>
                  {session.status !== 'completed' &&(<Table.Td>
                    <ActionIcon color="red" size="sm" onClick={() => onRemoveItem(item.id)}>
                      <Trash2 size={14} />
                    </ActionIcon>
                  </Table.Td>)}
                </Table.Tr>
              );
            })}
            {session.cart.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={9} ta="center" c="lime">
                  Cart is empty
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
}
