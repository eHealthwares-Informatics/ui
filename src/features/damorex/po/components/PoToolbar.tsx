import { ActionIcon, Badge, Button, Group, Select, Text, TextInput } from '@mantine/core';
import { FileText, Plus, Printer, RefreshCcw, Settings } from 'lucide-react';
import { useState } from 'react';
import { useSuppliers, useWarehouses, usePurchaseOrders } from '../api/poApi';
import { usePoStore, computeSubtotal, computeTotal } from '../store/usePoStore';
import { QuickAddSupplierModal } from './QuickAddSupplierModal';

interface Props {
  onNew: () => void;
  onReset: () => void;
  onPrint: () => void;
  onSettings: () => void;
}

export function PoToolbar({ onNew, onReset, onPrint, onSettings }: Props) {
  const { tabs, activeTabId, setSupplier, setWarehouse, setReceiptNumber, setPendingPo } = usePoStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const supplierId = activeTab?.supplierId ?? '';
  const warehouseId = activeTab?.warehouseId ?? '';
  const receiptNumber = activeTab?.receiptNumber ?? '';
  const pendingPoId = activeTab?.pendingPoId ?? null;

  const [supplierSearch, setSupplierSearch] = useState('');
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [poSearch, setPoSearch] = useState('');
  const [supplierModal, setSupplierModal] = useState(false);

  const { data: suppliers = [] } = useSuppliers(supplierSearch);
  const { data: warehouses = [] } = useWarehouses(warehouseSearch);
  const { data: orders = [] } = usePurchaseOrders(poSearch);

  const supplierOpts = (Array.isArray(suppliers) ? suppliers : []).map((s: any) => ({
    value: s.id,
    label: s.name,
  }));

  const warehouseOpts = (Array.isArray(warehouses) ? warehouses : []).map((w: any) => ({
    value: w.id,
    label: w.name,
  }));

  const pendingPOpts = (Array.isArray(orders) ? orders : []).filter(
    (o: any) => o.status === 'approved' || o.status === 'draft',
  ).map((o: any) => ({
    value: o.id,
    label: `${o.invoiceNumber || o.purchaseOrderNumber}:${o.supplier?.name || ''}:${o.receiptNumber || o.status}`,
  }));

  return (
    <>
      <Group px="md" py="xs" bg="#bfe0ea" gap="sm">
        <Select
          size="xs"
          placeholder="Pending PO"
          data={pendingPOpts}
          value={pendingPoId || null}
          onChange={(v) => {
            if (!v) {
              setPendingPo(null);
              return;
            }
            const po = (Array.isArray(orders) ? orders : []).find((o: any) => o.id === v);
            if (po) {
              setPendingPo(po.id, po.invoiceNumber || po.purchaseOrderNumber, po.status);
              setSupplier(po.supplier?.id || '', po.supplier?.name || '');
              setWarehouse(po.warehouse?.id || '', po.warehouse?.name || '');
              usePoStore.getState().setExpectedDate(po.expectedDate || '');
              usePoStore.getState().setNote(po.note || '');

              usePoStore.getState().updateTab(activeTabId, {
                lines: (po.lines || []).map((l: any) => ({
                  id: crypto.randomUUID(),
                  itemId: l.itemId,
                  itemCode: l.itemCode || '',
                  itemName: l.itemName || '',
                  orderedQty: l.orderedQty,
                  receivedQty: l.receivedQty || 0,
                  uomId: l.uomId,
                  unitCost: l.unitCost,
                  discountPercent: l.discountPercent || 0,
                  taxPercent: l.taxPercent || 0,
                  lineSubtotal: l.lineSubtotal || 0,
                  lineTotal: l.lineTotal || 0,
                  receivedSubtotal: computeSubtotal(l.receivedQty || 0, l.unitCost, l.discountPercent || 0),
                  receivedLineTotal: computeTotal(l.receivedQty || 0, l.unitCost, l.discountPercent || 0, l.taxPercent || 0),
                  isDraft: false,
                  isPosted: Number(l.receivedQty || 0) > 0,
                  serverLineId: l.id,
                })),
              });
            }
          }}
          onSearchChange={setPoSearch}
          searchable
          clearable
          w={320}
        />

        {activeTab?.pendingPoStatus && (
          <Badge
            color={
              activeTab.pendingPoStatus === 'draft' ? 'yellow' :
              activeTab.pendingPoStatus === 'approved' ? 'blue' :
              activeTab.pendingPoStatus === 'partially_received' ? 'orange' :
              activeTab.pendingPoStatus === 'received' ? 'green' :
              'gray'
            }
            size="lg"
          >
            {activeTab.pendingPoStatus.replace('_', ' ')}
          </Badge>
        )}

        <Select
          size="xs"
          placeholder="Supplier"
          data={supplierOpts}
          value={supplierId || null}
          onChange={(v, opt) => {
            if (v) {setSupplier(v, opt.label);}
          }}
          onSearchChange={setSupplierSearch}
          searchable
          clearable
          w={200}
        />

        <Button size="xs" leftSection={<Plus size={14} />} onClick={() => setSupplierModal(true)}>
          + Supplier
        </Button>

        <Select
          size="xs"
          placeholder="Warehouse"
          data={warehouseOpts}
          value={warehouseId || null}
          onChange={(v, opt) => {
            if (v) {setWarehouse(v, opt.label);}
          }}
          onSearchChange={setWarehouseSearch}
          searchable
          clearable
          w={200}
        />

        <TextInput
          size="xs"
          placeholder="Receipt #"
          value={receiptNumber}
          onChange={(e) => setReceiptNumber(e.currentTarget.value)}
          w={140}
        />

        <Button size="xs" leftSection={<FileText size={14} />} onClick={onNew}>
          New
        </Button>

        <Button size="xs" color="red" leftSection={<RefreshCcw size={14} />} onClick={onReset}>
          Reset
        </Button>

        <ActionIcon size="lg" variant="light" onClick={onPrint}>
          <Printer size={18} />
        </ActionIcon>

        <ActionIcon size="lg" variant="light" onClick={onSettings}>
          <Settings size={18} />
        </ActionIcon>

        <Text size="xs" c="dimmed" ml="auto">
          {activeTab?.supplierName || 'No supplier'}
        </Text>
      </Group>

      <QuickAddSupplierModal
        opened={supplierModal}
        onClose={() => setSupplierModal(false)}
        onSupplierCreated={(s) => {
          setSupplier(s.id, s.name);
          setSupplierModal(false);
        }}
      />
    </>
  );
}
