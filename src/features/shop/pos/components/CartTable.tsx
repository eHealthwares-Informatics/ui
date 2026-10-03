import {
  ActionIcon,
  Image,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  Table,
  Text,
  Tooltip,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { PackagePlus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { usePosItemUoms } from '../../api/posApi';
import { CartItem, SaleSession } from '../types';

export interface CartStockAdjustContext {
  itemId: string;
  itemName: string;
  /** Current stock expressed in the cart line's selected UOM. */
  currentQty: number;
  /** Current stock in base units (informational). */
  baseQty: number;
  uomId: string;
  uomName: string;
}

interface Props {
  session: SaleSession;
  stockLocationId?: string | null;
  onUpdateQty: (itemId: string, qty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUomChange: (itemId: string, uom: { id: string; name: string; factor: number }) => void;
  onAdjustStock: (ctx: CartStockAdjustContext) => void;
}

interface CartRowProps {
  item: CartItem;
  index: number;
  pricingMode: 'retail' | 'wholesale';
  status: SaleSession['status'];
  stockLocationId?: string | null;
  onUpdateQty: (itemId: string, qty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUomChange: (itemId: string, uom: { id: string; name: string; factor: number }) => void;
  onAdjustStock: (ctx: CartStockAdjustContext) => void;
}

function CartRow({
  item,
  index,
  pricingMode,
  status,
  stockLocationId,
  onUpdateQty,
  onRemoveItem,
  onUomChange,
  onAdjustStock,
}: CartRowProps) {
  const price = pricingMode === 'wholesale' ? item.wholesalePrice : item.retailPrice;

  const {
    data: itemUoms = [],
    isLoading: uomsLoading,
    isError: uomsError,
  } = usePosItemUoms(item.id);

  // Same query key as the entry row so stock adjustments invalidate both views.
  const { data: stockQty = null } = useQuery({
    queryKey: ['pos-stock-qty', item.id, stockLocationId],
    queryFn: async () => {
      if (!item.id || !stockLocationId) {
        return null;
      }
      const { data } = await rxsoftApi.get('/inventory/stock-balances/summary', {
        params: { itemId: item.id, locationId: stockLocationId },
      });
      return (data?.quantityOnHand ?? null) as number | null;
    },
    enabled: !!item.id && !!stockLocationId,
    staleTime: 0,
  });

  const requiredBase = item.quantity * item.uomFactor;
  const insufficient = stockQty !== null && stockQty < requiredBase;
  const available = stockQty ?? 0;

  const uomOptions = useMemo(
    () => itemUoms.map((u) => ({ value: u.id, label: u.name || 'Unit' })),
    [itemUoms]
  );
  const hasUomList = !uomsLoading && !uomsError && itemUoms.length > 0;

  const rowBg = insufficient ? 'rgba(220, 38, 38, 0.35)' : '#00185f';
  const selectStyles = {
    input: {
      color: 'lime',
      background: '#00185f',
      borderColor: insufficient ? '#fa5252' : '#2f8a53',
    },
  };

  const handleUomChange = (value: string | null) => {
    if (!value) {
      return;
    }
    const uom = itemUoms.find((u) => u.id === value);
    if (uom) {
      onUomChange(item.id, { id: uom.id, name: uom.name || 'Unit', factor: uom.factor });
    }
  };

  return (
    <Table.Tr style={{ background: rowBg }}>
      <Table.Td>
        {item.imageUrl ? (
          <Image src={item.imageUrl} w={36} h={36} fit="cover" />
        ) : (
          <Text size="xs" c="dimmed">
            -
          </Text>
        )}
      </Table.Td>
      <Table.Td c="lime">{index + 1}</Table.Td>
      <Table.Td c="lime">{item.code}</Table.Td>
      <Table.Td c="lime">{item.name}</Table.Td>
      <Table.Td c="lime">{price.toFixed(2)}</Table.Td>
      <Table.Td c="lime">
        {hasUomList ? (
          <Tooltip
            label={`Insufficient stock — ${available} on hand`}
            disabled={!insufficient}
            withArrow
          >
            <Select
              size="xs"
              w={90}
              data={uomOptions}
              value={item.uomId}
              onChange={handleUomChange}
              error={insufficient}
              styles={selectStyles}
              data-testid="pos-cart-uom"
            />
          </Tooltip>
        ) : (
          <Text size="xs" c={insufficient ? 'red.3' : 'lime'}>
            {item.uomName || 'Unit'}
          </Text>
        )}
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
      <Table.Td c="lime">{(price * item.quantity * item.uomFactor).toFixed(2)}</Table.Td>
      {status !== 'completed' && (
        <Table.Td>
          <ActionIcon.Group>
            <ActionIcon
              color="yellow"
              size="sm"
              variant="subtle"
              data-testid="pos-cart-adjust-stock"
              aria-label="Adjust stock"
              onClick={() =>
                onAdjustStock({
                  itemId: item.id,
                  itemName: item.name,
                  currentQty:
                    item.uomFactor > 0 && stockQty !== null ? stockQty / item.uomFactor : 0,
                  baseQty: stockQty ?? 0,
                  uomId: item.uomId,
                  uomName: item.uomName || 'Unit',
                })
              }
            >
              <PackagePlus size={14} />
            </ActionIcon>
            <ActionIcon
              color="red"
              size="sm"
              aria-label="Remove item"
              onClick={() => onRemoveItem(item.id)}
            >
              <Trash2 size={14} />
            </ActionIcon>
          </ActionIcon.Group>
        </Table.Td>
      )}
    </Table.Tr>
  );
}

export function CartTable({
  session,
  stockLocationId,
  onUpdateQty,
  onRemoveItem,
  onUomChange,
  onAdjustStock,
}: Props) {
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
              {session.status !== 'completed' && <Table.Th />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {session.cart.map((item, index) => (
              <CartRow
                key={item.id}
                item={item}
                index={index}
                pricingMode={session.pricingMode}
                status={session.status}
                stockLocationId={stockLocationId}
                onUpdateQty={onUpdateQty}
                onRemoveItem={onRemoveItem}
                onUomChange={onUomChange}
                onAdjustStock={onAdjustStock}
              />
            ))}
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
