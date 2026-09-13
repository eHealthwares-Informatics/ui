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
import { useWhitelistedItems, UomOption } from '../../api/posApi';
import { SaleSession, CartItem } from '../types';
import { getUomEffectiveFactor } from '@/lib/uom-utils';
import { PosSetPriceModal } from './PosSetPriceModal';
import { StockAdjustModal } from './StockAdjustModal';

interface ProductOption {
  value: string;
  label: string;
  name: string;
  code: string;
  saleUomId: string | null;
  baseUomId: string | null;
  uomCategoryId: string | null;
  retailPrice: number | null;
  wholesalePrice: number | null;
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

  const [setPriceOpen, setSetPriceOpen] = useState(false);

  const { data: priceListEntries = [] } = useQuery({
    queryKey: ['price-list-items', session.priceListId],
    queryFn: async () => {
      if (!session.priceListId) {return [];}
      const { data } = await rxsoftApi.get(`/price-lists/${session.priceListId}/items`, {
        params: { limit: 100000 },
      });
      return data?.data ?? data ?? [];
    },
    enabled: !!session.priceListId,
    staleTime: 60_000,
  });

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

  // Price for the session's selected price list, keyed by itemId. When an item
  // has NO entry in that list, retailPrice/wholesalePrice are null (unset).
  const priceByItemId = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const pli of Array.isArray(priceListEntries) ? priceListEntries : []) {
      const itemId = pli.item?.id;
      if (itemId) {
        map.set(itemId, Number(pli.unitPrice) || 0);
      }
    }
    return map;
  }, [priceListEntries]);

  const productOptions = useMemo<ProductOption[]>(() => {
    const list = Array.isArray(whitelistedItems) ? whitelistedItems : [];
    return list.map((w: any) => {
      const displayName = w.displayName || w.name || '';
      const code = w.code || '';
      const price = priceByItemId.get(w.itemId);
      return {
        value: w.itemId,
        label: `${code} - ${displayName}`,
        name: displayName,
        code,
        saleUomId: w.saleUomId ?? null,
        baseUomId: w.baseUom?.id ?? null,
        uomCategoryId: w.uomCategoryId ?? null,
        retailPrice: price === undefined ? null : price,
        wholesalePrice: price === undefined ? null : price,
        imageUrl: w.smallImageUrl || w.imageUrl || '',
      };
    });
  }, [whitelistedItems, priceByItemId]);

  const selectedProduct = productOptions.find((p) => p.value === selectedProductId);

  const itemCode = selectedProduct?.code || selectedProductId?.slice(0, 8) || '';
  const retailPrice = selectedProduct?.retailPrice ?? null;
  const wholesalePrice = selectedProduct?.wholesalePrice ?? null;
  const effectivePrice =
    session.pricingMode === 'wholesale' ? wholesalePrice : retailPrice;

  const currentUom = uomId ? (uomMap.get(uomId) ?? null) : null;
  const uomFactor = getUomEffectiveFactor(currentUom);
  const total = effectivePrice !== null ? quantity * effectivePrice * uomFactor : 0;

  const unitPrice = effectivePrice !== null ? effectivePrice * uomFactor : null;

  // UOMs available for the item are those in the SAME category as the item's
  // base UOM (uomCategoryId returned with the product). Fall back to the full
  // UOM list only when the category cannot be determined.
  const filteredUomOptions = useMemo(() => {
    if (!selectedProductId || !selectedProduct) {
      return [];
    }
    if (!selectedProduct.uomCategoryId) {
      return Array.from(uomMap.values());
    }
    return Array.from(uomMap.values()).filter(
      (u) => u.categoryId === selectedProduct.uomCategoryId,
    );
  }, [selectedProductId, selectedProduct, uomMap]);

  const { data: stockQty = null, refetch: refetchStock } = useQuery({
    queryKey: ['pos-stock-qty', selectedProductId, stockLocationId],
    queryFn: async () => {
      if (!selectedProductId || !stockLocationId) {
        return null;
      }
      // Uncached summary endpoint: sums on-hand across all lots so a just-made
      // stock adjustment is reflected immediately (the list endpoint is cached).
      const { data } = await rxsoftApi.get('/inventory/stock-balances/summary', {
        params: { itemId: selectedProductId, locationId: stockLocationId },
      });
      return data?.quantityOnHand ?? null;
    },
    enabled: !!selectedProductId && !!stockLocationId,
    staleTime: 0,
  });

  const adjustedStockQty = uomFactor > 0 && stockQty !== null ? stockQty / uomFactor : null;

  function handleProductSelect(value: string | null) {
    setSelectedProductId(value);
    setUomId(null);
    const prod = value ? productOptions.find((p) => p.value === value) : null;
    if (!prod) {
      return;
    }
    const categoryUoms = Array.from(uomMap.values()).filter(
      (u) => prod.uomCategoryId && u.categoryId === prod.uomCategoryId,
    );
    const saleUom = prod.saleUomId ? categoryUoms.find((u) => u.id === prod.saleUomId) : null;
    const baseUom = prod.baseUomId ? uomMap.get(prod.baseUomId) : null;
    const defaultUom =
      saleUom ??
      (baseUom && prod.uomCategoryId === baseUom.categoryId ? baseUom : categoryUoms[0]);
    if (defaultUom) {
      setUomId(defaultUom.id);
    } else {
      setUomId(null);
      notifications.show({
        color: 'red',
        message: `No sale UOM configured for ${prod.name || prod.code || 'this product'}`,
      });
    }
  }

  function handleAdd() {
    if (!selectedProductId || !quantity) {
      notifications.show({ color: 'red', message: 'Select a product and quantity first' });
      return;
    }
    const uom = uomId ? uomMap.get(uomId) : undefined;
    if (!uom) {
      notifications.show({ color: 'red', message: 'Please select a UOM for this product' });
      return;
    }
    if (selectedProduct?.uomCategoryId && uom.categoryId !== selectedProduct.uomCategoryId) {
      notifications.show({
        color: 'red',
        message: `UOM (${uom.name}) is not in the same category as the base UOM`,
      });
      return;
    }
    if (effectivePrice === null) {
      notifications.show({
        color: 'red',
        message: `${selectedProduct?.name || 'This product'} has no price set`,
      });
      return;
    }
    const item: CartItem = {
      id: selectedProductId,
      code: itemCode,
      name: selectedProduct?.name || '',
      retailPrice: retailPrice ?? 0,
      wholesalePrice: wholesalePrice ?? 0,
      quantity,
      pricingMode: session.pricingMode,
      uomId: uom.id,
      uomName: uom.name || 'Unit',
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
    setAdjustCurrentQty(adjustedStockQty ?? 0);
    setAdjustModalOpen(true);
  }

  return (
    <Paper radius={0} withBorder data-testid="pos-product-entry">
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
                data-testid="pos-product-select"
                data={productOptions.map((p) => ({ value: p.value, label: p.label }))}
                value={selectedProductId}
                onChange={handleProductSelect}
                searchable
                clearable
                w={350}
              />
            </Table.Td>
            <Table.Td>
              {stockLocationId && selectedProductId ? (
                adjustedStockQty === null ? (
                  <Button size="xs" variant="light" color="orange" onClick={openAdjustModal}>
                    Set Stock
                  </Button>
                ) : (
                  <UnstyledButton
                    onClick={openAdjustModal}
                    style={{ textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {adjustedStockQty.toFixed(2)}
                  </UnstyledButton>
                )
              ) : (
                <Text size="xs" c="dimmed">
                  -
                </Text>
              )}
            </Table.Td>
            <Table.Td>
              {!selectedProductId || !selectedProduct ? (
                <Text size="xs" c="dimmed">
                  -
                </Text>
              ) : unitPrice === null ? (
                <Button
                  size="xs"
                  variant="light"
                  color="cyan"
                  onClick={() => setSetPriceOpen(true)}
                  data-testid="pos-set-price-btn"
                >
                  SetPrice
                </Button>
              ) : (
                unitPrice.toFixed(2)
              )}
            </Table.Td>
            <Table.Td>
              <Select
                size="xs"
                w={200}
                data-testid="pos-entry-uom"
                data={filteredUomOptions.map((u) => ({
                  value: u.id,
                  label: u.name,
                }))}
                value={uomId}
                onChange={(v) => setUomId(v)}
                placeholder="Pick UOM"
                disabled={filteredUomOptions.length === 0}
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
              <Button size="xs" leftSection={<Plus size={14} />} onClick={handleAdd} data-testid="pos-add-to-cart-btn">
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
        baseQty={stockQty ?? 0}
        onAdjusted={() => refetchStock()}
        uomId={adjustUomId}
        uomName={adjustUomName}
      />

      <PosSetPriceModal
        opened={setPriceOpen}
        onClose={() => setSetPriceOpen(false)}
        onSaved={() => {
          // Invalidate the price-list-items query so the line reflects the saved price.
          // (priceListEntries is derived from a query keyed on session.priceListId.)
          // This component refetches priceListEntries via its own queryKey.
        }}
        itemId={selectedProductId ?? ''}
        itemName={selectedProduct?.name ?? itemCode}
        priceListId={session.priceListId}
      />
    </Paper>
  );
}