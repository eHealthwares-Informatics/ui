import {
  ActionIcon,
  Button,
  Combobox,
  Image,
  InputBase,
  Loader,
  NumberInput,
  Paper,
  Select,
  Table,
  Text,
  UnstyledButton,
  useCombobox,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getUomEffectiveFactor } from '@/lib/uom-utils';
import { rxsoftApi } from '@/lib/rxsoft-api';
import {
  UomOption,
  usePosItemPrice,
  usePosItemUoms,
  usePosItems,
} from '../../api/posApi';
import { SaleSession, CartItem, DispenseRow } from '../types';
import { PosSetPriceModal } from './PosSetPriceModal';
import { StockAdjustModal } from './StockAdjustModal';

type PosItemOption = {
  id: string;
  code?: string;
  itemCode?: string;
  barcode?: string;
  name: string;
  displayName?: string;
  saleUomId?: string | null;
  smallImageUrl?: string;
  imageUrl?: string;
};

type SelectedProduct = {
  id: string;
  code: string;
  name: string;
  saleUomId: string | null;
  imageUrl: string;
};

interface Props {
  session: SaleSession;
  onAddToCart: (item: CartItem) => void;
  stockLocationId?: string | null;
  /** When provided, the table renders the dispense (multi-row) mode. */
  dispenseRows?: DispenseRow[];
  /** Order id key — resets dispense rows when a different order is loaded. */
  dispenseKey?: string | null;
  onDispenseAdd?: (item: CartItem) => void;
}

// Fully-controlled server-side searchable picker — mirrors the PO line item
// picker. Avoids the Mantine `Select` client-side filtering over the entire
// catalog (the cause of the POS hang) by querying `/items?search=` per keystroke.
function PosProductPicker({
  selectedLabel,
  onSelect,
}: {
  selectedLabel?: string;
  onSelect: (item: PosItemOption | null) => void;
}) {
  const combobox = useCombobox();
  const [search, setSearch] = useState('');
  const [debounced] = useDebouncedValue(search, 250);
  const { data: items = [], isLoading } = usePosItems(debounced);

  const options = useMemo(
    () =>
      (Array.isArray(items) ? items : []).map((i) => ({
        value: i.id,
        label:
          `${i.code || ''}${i.code ? ' - ' : ''}${i.displayName || i.name || ''}`.trim() ||
          i.id,
        item: i,
      })),
    [items],
  );

  const submit = (val: string) => {
    const opt = options.find((o) => o.value === val);
    onSelect(opt?.item ?? null);
    setSearch('');
    combobox.closeDropdown();
  };

  return (
    <Combobox store={combobox} onOptionSubmit={submit}>
      <Combobox.Target>
        <InputBase
          size="xs"
          placeholder="Search product..."
          w={350}
          data-testid="pos-product-select"
          value={search || selectedLabel || ''}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            combobox.openDropdown();
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => setSearch('')}
          rightSection={
            isLoading ? <Loader size={14} /> : <ChevronDown size={14} />
          }
        />
      </Combobox.Target>
      <Combobox.Dropdown style={{ backgroundColor: 'white', zIndex: 20 }}>
        <Combobox.Options style={{ maxHeight: 280, overflowY: 'auto' }}>
          {options.length === 0 ? (
            <Combobox.Empty>{isLoading ? 'Loading…' : 'No products found'}</Combobox.Empty>
          ) : (
            options.slice(0, 20).map((o) => (
              <Combobox.Option key={o.value} value={o.value}>
                {o.label}
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

function DispenseRowEditor({
  row,
  priceListId,
  pricingMode,
  stockLocationId,
  onAdd,
  onRemove,
}: {
  row: DispenseRow;
  priceListId?: string;
  pricingMode: 'retail' | 'wholesale';
  stockLocationId?: string | null;
  onAdd: (item: CartItem) => void;
  onRemove: () => void;
}) {
  const initialSelected: SelectedProduct | null = row.initialItem
    ? {
        id: row.initialItem.id,
        code: row.initialItem.code ?? '',
        name: row.initialItem.name,
        saleUomId: row.initialItem.saleUomId ?? null,
        imageUrl: row.initialItem.imageUrl ?? '',
      }
    : null;
  const [selected, setSelected] = useState<SelectedProduct | null>(initialSelected);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    row.initialItem ? row.initialItem.id : (row.initialItemId ?? null)
  );
  const [quantity, setQuantity] = useState(row.quantity || 1);
  const [uomId, setUomId] = useState<string | null>(null);
  const [setPriceOpen, setSetPriceOpen] = useState(false);

  const { data: itemUoms = [] } = usePosItemUoms(selectedProductId);
  const { data: unitPrice = null } = usePosItemPrice(priceListId, selectedProductId);

  const itemUomMap = useMemo(() => new Map(itemUoms.map((u) => [u.id, u as UomOption])), [itemUoms]);

  const uomItemId = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedProductId) {
      uomItemId.current = null;
      setUomId(null);
      return;
    }
    if (itemUoms.length === 0) {
      setUomId(null);
      return;
    }
    if (uomItemId.current === selectedProductId) { return; }
    uomItemId.current = selectedProductId;
    if (selected?.saleUomId && itemUoms.some((u) => u.id === selected.saleUomId)) {
      setUomId(selected.saleUomId);
      return;
    }
    setUomId(itemUoms[0].id);
  }, [selectedProductId, itemUoms, selected]);

  const effectivePrice = unitPrice;
  const currentUom = uomId ? (itemUomMap.get(uomId) ?? null) : null;
  const uomFactor = getUomEffectiveFactor(currentUom);
  const unitPriceDisplay = effectivePrice !== null ? effectivePrice * uomFactor : null;
  const total = effectivePrice !== null ? quantity * effectivePrice * uomFactor : 0;

  const { data: stockQty = null } = useQuery({
    queryKey: ['pos-stock-qty', selectedProductId, stockLocationId],
    queryFn: async () => {
      if (!selectedProductId || !stockLocationId) { return null; }
      const { data } = await rxsoftApi.get('/inventory/stock-balances/summary', {
        params: { itemId: selectedProductId, locationId: stockLocationId },
      });
      return data?.quantityOnHand ?? null;
    },
    enabled: !!selectedProductId && !!stockLocationId,
    staleTime: 0,
  });
  const adjustedStockQty = uomFactor > 0 && stockQty !== null ? stockQty / uomFactor : null;

  const itemCode = selected?.code || selectedProductId?.slice(0, 8) || '';
  const selectedLabel = selected
    ? `${selected.code}${selected.code ? ' - ' : ''}${selected.name}`.trim()
    : '';

  function handleProductSelect(item: PosItemOption | null) {
    if (!item) {
      setSelected(null);
      setSelectedProductId(null);
      setUomId(null);
      return;
    }
    setSelected({
      id: item.id,
      code: item.itemCode ?? item.code ?? item.barcode ?? '',
      name: item.displayName || item.name || '',
      saleUomId: item.saleUomId ?? null,
      imageUrl: item.smallImageUrl || item.imageUrl || '',
    });
    setSelectedProductId(item.id);
    setUomId(null);
  }

  function handleAdd() {
    if (!selectedProductId || !quantity) {
      notifications.show({ color: 'red', message: 'Select a product and quantity first' });
      return;
    }
    const uom = uomId ? itemUomMap.get(uomId) : undefined;
    if (!uom) {
      notifications.show({ color: 'red', message: 'Please select a UOM for this product' });
      return;
    }
    if (effectivePrice === null) {
      notifications.show({
        color: 'red',
        message: `${selected?.name || row.orderedLabel || 'This product'} has no price set`,
      });
      return;
    }
    onAdd({
      id: selectedProductId,
      code: itemCode,
      name: selected?.name || row.orderedLabel || '',
      retailPrice: effectivePrice ?? 0,
      wholesalePrice: effectivePrice ?? 0,
      quantity,
      pricingMode,
      uomId: uom.id,
      uomName: uom.name || 'Unit',
      uomFactor,
      lineTotal: total,
      imageUrl: selected?.imageUrl || '',
      orderItemId: row.orderItemId,
    });
  }

  return (
    <Table.Tr>
      <Table.Td>
        {selected?.imageUrl ? (
          <Image src={selected.imageUrl} w={40} h={40} fit="cover" />
        ) : (
          <Text size="xs" c="dimmed">-</Text>
        )}
      </Table.Td>
      <Table.Td fw={600}>{row.orderedLabel || '-'}</Table.Td>
      <Table.Td>
        <PosProductPicker selectedLabel={selectedLabel} onSelect={handleProductSelect} />
      </Table.Td>
      <Table.Td>
        {stockLocationId && selectedProductId ? (
          adjustedStockQty === null ? (
            <Text size="xs" c="dimmed">-</Text>
          ) : (
            <Text size="xs">{adjustedStockQty.toFixed(2)}</Text>
          )
        ) : (
          <Text size="xs" c="dimmed">-</Text>
        )}
      </Table.Td>
      <Table.Td>
        {!selectedProductId ? (
          <Text size="xs" c="dimmed">-</Text>
        ) : unitPriceDisplay === null ? (
          <Button size="xs" variant="light" color="cyan" onClick={() => setSetPriceOpen(true)}>
            SetPrice
          </Button>
        ) : (
          unitPriceDisplay.toFixed(2)
        )}
      </Table.Td>
      <Table.Td>
        <Select
          size="xs"
          w={180}
          data={itemUoms.map((u) => ({ value: u.id, label: u.name }))}
          value={uomId}
          onChange={(v) => setUomId(v)}
          placeholder="Pick UOM"
          disabled={itemUoms.length === 0}
          maxDropdownHeight={300}
        />
      </Table.Td>
      <Table.Td>
        <NumberInput size="xs" min={1} value={quantity} onChange={(v) => setQuantity(Number(v) || 1)} w={80} />
      </Table.Td>
      <Table.Td fw={700}>{total.toFixed(2)}</Table.Td>
      <Table.Td>
        <ActionIcon.Group>
          <Button size="xs" leftSection={<Plus size={14} />} onClick={handleAdd} data-testid="pos-dispense-add-btn">
            Add
          </Button>
          <ActionIcon size="sm" color="red" variant="subtle" onClick={onRemove} aria-label="Remove dispense row">
            <Trash2 size={14} />
          </ActionIcon>
        </ActionIcon.Group>
      </Table.Td>

      <PosSetPriceModal
        opened={setPriceOpen}
        onClose={() => setSetPriceOpen(false)}
        onSaved={() => {}}
        itemId={selectedProductId ?? ''}
        itemName={selected?.name ?? row.orderedLabel}
        priceListId={priceListId}
      />
    </Table.Tr>
  );
}

export function ProductEntryTable({ session, onAddToCart, stockLocationId, dispenseRows, dispenseKey, onDispenseAdd }: Props) {
  const [selected, setSelected] = useState<SelectedProduct | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [uomId, setUomId] = useState<string | null>(null);

  const isDispense = Boolean(dispenseRows && onDispenseAdd && dispenseKey);
  const [dispenseRowState, setDispenseRowState] = useState<DispenseRow[]>(dispenseRows ?? []);

  // When a different order is loaded, reset the editable dispense rows.
  useEffect(() => {
    setDispenseRowState(dispenseRows ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispenseKey]);

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustItemId, setAdjustItemId] = useState('');
  const [adjustItemName, setAdjustItemName] = useState('');
  const [adjustUomId, setAdjustUomId] = useState('');
  const [adjustUomName, setAdjustUomName] = useState('');
  const [adjustCurrentQty, setAdjustCurrentQty] = useState(0);

  const [setPriceOpen, setSetPriceOpen] = useState(false);

  const { data: itemUoms = [] } = usePosItemUoms(selectedProductId);
  const { data: unitPrice = null } = usePosItemPrice(session.priceListId, selectedProductId);

  const itemUomMap = useMemo(() => {
    const map = new Map<string, UomOption>();
    for (const u of itemUoms) {
      map.set(u.id, u as UomOption);
    }
    return map;
  }, [itemUoms]);

  // Select a sensible default UOM only once per item (when the item or its UOM
  // list changes), so later refetches don't clobber the cashier's choice.
  const uomItemId = useRef<string | null>(null);
  useEffect(() => {
    if (!selected) {
      uomItemId.current = null;
      setUomId(null);
      return;
    }
    if (itemUoms.length === 0) {
      setUomId(null);
      return;
    }
    if (uomItemId.current === selected.id) {
      return;
    }
    uomItemId.current = selected.id;
    if (selected.saleUomId && itemUoms.some((u) => u.id === selected.saleUomId)) {
      setUomId(selected.saleUomId);
      return;
    }
    setUomId(itemUoms[0].id);
  }, [selected, itemUoms]);

  const retailPrice = unitPrice;
  const wholesalePrice = unitPrice;
  const effectivePrice = session.pricingMode === 'wholesale' ? wholesalePrice : retailPrice;

  const itemCode = selected?.code || selectedProductId?.slice(0, 8) || '';

  const currentUom = uomId ? (itemUomMap.get(uomId) ?? null) : null;
  const uomFactor = getUomEffectiveFactor(currentUom);
  const total = effectivePrice !== null ? quantity * effectivePrice * uomFactor : 0;

  const unitPriceDisplay = effectivePrice !== null ? effectivePrice * uomFactor : null;

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

  function handleProductSelect(item: PosItemOption | null) {
    if (!item) {
      setSelected(null);
      setSelectedProductId(null);
      setUomId(null);
      return;
    }
    const prod: SelectedProduct = {
      id: item.id,
      code: item.itemCode ?? item.code ?? item.barcode ?? '',
      name: item.displayName || item.name || '',
      saleUomId: item.saleUomId ?? null,
      imageUrl: item.smallImageUrl || item.imageUrl || '',
    };
    setSelected(prod);
    setSelectedProductId(item.id);
    setUomId(null);
  }

  function handleAdd() {
    if (!selectedProductId || !quantity) {
      notifications.show({ color: 'red', message: 'Select a product and quantity first' });
      return;
    }
    const uom = uomId ? itemUomMap.get(uomId) : undefined;
    if (!uom) {
      notifications.show({ color: 'red', message: 'Please select a UOM for this product' });
      return;
    }
    if (effectivePrice === null) {
      notifications.show({
        color: 'red',
        message: `${selected?.name || 'This product'} has no price set`,
      });
      return;
    }
    const item: CartItem = {
      id: selectedProductId,
      code: itemCode,
      name: selected?.name || '',
      retailPrice: retailPrice ?? 0,
      wholesalePrice: wholesalePrice ?? 0,
      quantity,
      pricingMode: session.pricingMode,
      uomId: uom.id,
      uomName: uom.name || 'Unit',
      uomFactor,
      lineTotal: total,
      imageUrl: selected?.imageUrl || '',
    };
    onAddToCart(item);
    setSelected(null);
    setSelectedProductId(null);
    setQuantity(1);
    setUomId(null);
  }

  function openAdjustModal() {
    if (!selectedProductId || !stockLocationId) {
      return;
    }
    setAdjustItemId(selectedProductId);
    setAdjustItemName(selected?.name || itemCode);
    setAdjustUomId(uomId || selected?.saleUomId || '');
    setAdjustUomName(currentUom?.name || 'Unit');
    setAdjustCurrentQty(adjustedStockQty ?? 0);
    setAdjustModalOpen(true);
  }

  const selectedLabel = selected
    ? `${selected.code}${selected.code ? ' - ' : ''}${selected.name}`.trim()
    : '';

  return (
    <Paper radius={0} withBorder data-testid="pos-product-entry">
      <Table striped withTableBorder withColumnBorders horizontalSpacing="xs" verticalSpacing={4}>
        <Table.Thead bg="#a6d5e5">
          <Table.Tr>
            <Table.Th w={50}>Image</Table.Th>
            {isDispense && <Table.Th>ORDERED</Table.Th>}
            <Table.Th>{isDispense ? 'ITEM (SOLD)' : 'ITEM CODE'}</Table.Th>
            <Table.Th>StockQty</Table.Th>
            <Table.Th>RtPrice</Table.Th>
            <Table.Th>UOM</Table.Th>
            <Table.Th>QUANTITY</Table.Th>
            <Table.Th>TOTAL</Table.Th>
            <Table.Th w={isDispense ? 110 : 60} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isDispense ? (
            dispenseRowState.map((row) => (
              <DispenseRowEditor
                key={row.orderItemId}
                row={row}
                priceListId={session.priceListId}
                pricingMode={session.pricingMode}
                stockLocationId={stockLocationId}
                onAdd={(item) => onDispenseAdd?.(item)}
                onRemove={() =>
                  setDispenseRowState((prev) =>
                    prev.filter((r) => r.orderItemId !== row.orderItemId)
                  )
                }
              />
            ))
          ) : (
          <Table.Tr>
            <Table.Td>
              {selected?.imageUrl ? (
                <Image src={selected.imageUrl} w={40} h={40} fit="cover" />
              ) : (
                <Text size="xs" c="dimmed">
                  -
                </Text>
              )}
            </Table.Td>
            <Table.Td>{itemCode || '-'}</Table.Td>
            <Table.Td>
              <PosProductPicker selectedLabel={selectedLabel} onSelect={handleProductSelect} />
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
              {!selectedProductId || !selected ? (
                <Text size="xs" c="dimmed">
                  -
                </Text>
              ) : unitPriceDisplay === null ? (
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
                unitPriceDisplay.toFixed(2)
              )}
            </Table.Td>
            <Table.Td>
              <Select
                size="xs"
                w={200}
                data-testid="pos-entry-uom"
                data={itemUoms.map((u) => ({
                  value: u.id,
                  label: u.name,
                }))}
                value={uomId}
                onChange={(v) => setUomId(v)}
                placeholder="Pick UOM"
                disabled={itemUoms.length === 0}
                maxDropdownHeight={300}
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
          )}
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
        onSaved={() => {}}
        itemId={selectedProductId ?? ''}
        itemName={selected?.name ?? itemCode}
        priceListId={session.priceListId}
      />
    </Paper>
  );
}