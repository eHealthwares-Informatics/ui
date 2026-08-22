import {
  Button,
  Image,
  NumberInput,
  Paper,
  Select,
  Table,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { useItemUoms, usePriceListItems, useWhitelistedItems, UomOption } from '../../api/posApi';
import { SaleSession, CartItem } from '../types';
import { getUomEffectiveFactor } from '../utils/calculation';
import { StockAdjustModal } from './StockAdjustModal';

interface ProductOption {
  value: string;
  label: string;
  name: string;
  code: string;
  saleUomId: string | null;
  retailPrice: number;
  wholesalePrice: number;
  imageUrl: string;
}

interface Props {
  session: SaleSession;
  onAddToCart: (item: CartItem) => void;
  stockLocationId?: string | null;
}

export function ProductEntryTable({ session, onAddToCart, stockLocationId }: Props) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [uomId, setUomId] = useState<string | null>(null);

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustItemId, setAdjustItemId] = useState('');
  const [adjustItemName, setAdjustItemName] = useState('');
  const [adjustUomId, setAdjustUomId] = useState('');
  const [adjustUomName, setAdjustUomName] = useState('');
  const [adjustCurrentQty, setAdjustCurrentQty] = useState(0);

  const { data: priceListItems = [] } = usePriceListItems(session.priceListId);
  const { data: whitelistedItems = [] } = useWhitelistedItems();

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
    for (const u of allUoms) {
      map.set(u.id, u as UomOption);
    }
    return map;
  }, [allUoms]);

  const priceByItemId = useMemo(() => {
    const map = new Map<string, number>();
    for (const pli of Array.isArray(priceListItems) ? priceListItems : []) {
      const itemId = pli.item?.id;
      if (itemId) {
        map.set(itemId, Number(pli.unitPrice) || 0);
      }
    }
    return map;
  }, [priceListItems]);

  const productOptions = useMemo<ProductOption[]>(() => {
    const list = Array.isArray(whitelistedItems) ? whitelistedItems : [];
    return list.map((w: any) => {
      const displayName = w.displayName || w.name || '';
      const code = w.code || '';
      return {
        value: w.itemId,
        label: `${code} - ${displayName}`,
        name: displayName,
        code,
        saleUomId: w.saleUomId ?? null,
        retailPrice: priceByItemId.get(w.itemId) ?? 0,
        wholesalePrice: priceByItemId.get(w.itemId) ?? 0,
        imageUrl: w.smallImageUrl || w.imageUrl || '',
      };
    });
  }, [whitelistedItems, priceByItemId]);

  const selectedProduct = productOptions.find((p) => p.value === selectedProductId);

  const itemCode = selectedProduct?.code || selectedProductId?.slice(0, 8) || '';
  const retailPrice = selectedProduct?.retailPrice || 0;
  const wholesalePrice = selectedProduct?.wholesalePrice || 0;
  const effectivePrice = session.pricingMode === 'wholesale' ? wholesalePrice : retailPrice;

  const currentUom = uomId ? (uomMap.get(uomId) ?? null) : null;
  const uomFactor = getUomEffectiveFactor(currentUom);
  const total = quantity * effectivePrice * uomFactor;

  const unitPrice = effectivePrice * uomFactor;

  const { data: itemUoms = [] } = useItemUoms(selectedProductId ?? undefined);

  const filteredUomOptions = useMemo(() => {
    const perItem = Array.isArray(itemUoms) ? itemUoms : [];
    if (selectedProductId && perItem.length > 0) {
      return perItem as UomOption[];
    }
    if (!uomId) {
      return [];
    }
    const selectedUom = uomMap.get(uomId);
    if (!selectedUom?.categoryId) {
      return Array.from(uomMap.values());
    }
    return Array.from(uomMap.values()).filter((u) => u.categoryId === selectedUom.categoryId);
  }, [selectedProductId, itemUoms, uomId, uomMap]);

  const { data: stockQty = 0, refetch: refetchStock } = useQuery({
    queryKey: ['pos-stock-qty', selectedProductId, stockLocationId],
    queryFn: async () => {
      if (!selectedProductId || !stockLocationId) {
        return 0;
      }
      const { data: balances } = await rxsoftApi.get('/inventory/stock-balances', {
        params: { itemId: selectedProductId, locationId: stockLocationId, limit: 1 },
      });
      const list = (balances?.data ?? balances ?? []) as Record<string, any>[];
      return Number(list[0]?.quantityOnHand ?? 0);
    },
    enabled: !!selectedProductId && !!stockLocationId,
    staleTime: 0,
  });

  const adjustedStockQty = uomFactor > 0 ? stockQty / uomFactor : 0;

  function handleProductSelect(value: string | null) {
    setSelectedProductId(value);
    const prod = value ? productOptions.find((p) => p.value === value) : null;
    if (prod) {
      if (prod.saleUomId) {
        setUomId(prod.saleUomId);
      } else {
        setUomId(null);
        notifications.show({
          color: 'red',
          message: `Sale UOM not configured for ${prod.name || prod.code || 'this product'}`,
        });
      }
    } else {
      setUomId(null);
    }
  }

  function handleAdd() {
    if (!selectedProductId || !quantity) {
      return;
    }
    const uomUsed = uomId || selectedProduct?.saleUomId || '';
    const item: CartItem = {
      id: selectedProductId,
      code: itemCode,
      name: selectedProduct?.name || '',
      retailPrice,
      wholesalePrice,
      quantity,
      pricingMode: session.pricingMode,
      uomId: uomUsed,
      uomName: currentUom?.name || 'Unit',
      uomFactor,
      lineTotal: total,
      imageUrl: selectedProduct?.imageUrl || '',
    };
    onAddToCart(item);
    setSelectedProductId(null);
    setQuantity(1);
    setUomId(null);
  }

  function openAdjustModal() {
    if (!selectedProductId || !stockLocationId) {
      return;
    }
    setAdjustItemId(selectedProductId);
    setAdjustItemName(selectedProduct?.name || itemCode);
    setAdjustUomId(uomId || selectedProduct?.saleUomId || '');
    setAdjustUomName(currentUom?.name || 'Unit');
    setAdjustCurrentQty(adjustedStockQty);
    setAdjustModalOpen(true);
  }

  return (
    <Paper radius={0} withBorder>
      <Table striped withTableBorder withColumnBorders horizontalSpacing="xs" verticalSpacing={4}>
        <Table.Thead bg="#a6d5e5">
          <Table.Tr>
            <Table.Th w={50}>Image</Table.Th>
            <Table.Th>ITEM CODE</Table.Th>
            <Table.Th>ITEM NAME</Table.Th>
            <Table.Th>StockQty</Table.Th>
            <Table.Th>RtPrice</Table.Th>
            <Table.Th>UOM</Table.Th>
            <Table.Th>QUANTITY</Table.Th>
            <Table.Th>TOTAL</Table.Th>
            <Table.Th w={60} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>
              {selectedProduct?.imageUrl ? (
                <Image src={selectedProduct.imageUrl} w={40} h={40} fit="cover" />
              ) : (
                <Text size="xs" c="dimmed">
                  -
                </Text>
              )}
            </Table.Td>
            <Table.Td>{itemCode || '-'}</Table.Td>
            <Table.Td>
              <Select
                size="xs"
                placeholder="Select product..."
                data={productOptions.map((p) => ({ value: p.value, label: p.label }))}
                value={selectedProductId}
                onChange={handleProductSelect}
                searchable
                clearable
                w={280}
              />
            </Table.Td>
            <Table.Td>
              {stockLocationId && selectedProductId ? (
                adjustedStockQty > 0 ? (
                  <UnstyledButton
                    onClick={openAdjustModal}
                    style={{ textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {adjustedStockQty.toFixed(2)}
                  </UnstyledButton>
                ) : (
                  <Button size="xs" variant="light" color="orange" onClick={openAdjustModal}>
                    Set Stock
                  </Button>
                )
              ) : (
                <Text size="xs" c="dimmed">
                  -
                </Text>
              )}
            </Table.Td>
            <Table.Td>{unitPrice.toFixed(2)}</Table.Td>
            <Table.Td>
              <Select
                size="xs"
                w={200}
                data={filteredUomOptions.map((u) => ({
                  value: u.id,
                  label: u.name,
                }))}
                value={uomId}
                onChange={(v) => setUomId(v)}
                placeholder="Pick UOM"
              />
            </Table.Td>
            <Table.Td>
              <NumberInput
                size="xs"
                min={1}
                value={quantity}
                onChange={(v) => setQuantity(Number(v) || 1)}
                w={80}
              />
            </Table.Td>
            <Table.Td fw={700}>{total.toFixed(2)}</Table.Td>
            <Table.Td>
              <Button size="xs" leftSection={<Plus size={14} />} onClick={handleAdd}>
                Add
              </Button>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>

      <StockAdjustModal
        opened={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        itemId={adjustItemId}
        itemName={adjustItemName}
        stockLocationId={stockLocationId ?? ''}
        currentQty={adjustCurrentQty}
        onAdjusted={() => refetchStock()}
        uomId={adjustUomId}
        uomName={adjustUomName}
      />
    </Paper>
  );
}
