import { ActionIcon, Box, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PoLinesTable } from './components/PoLinesTable';
import { PoSettingsDrawer } from './components/PoSettingsDrawer';
import { PoSummary } from './components/PoSummary';
import { PoToolbar } from './components/PoToolbar';
import { SetPriceModal } from './components/SetPriceModal';
import { usePoStore, computeSubtotal, computeTotal } from './store/usePoStore';
import { useAddPoLine, useCreatePurchaseOrder, useReceiveGoods, useUnpostGoods, useUpdatePurchaseOrder } from './api/poApi';
import { printPo } from './utils/print';
import { UnpostPasswordModal } from './components/UnpostPasswordModal';

export default function PurchasesPage() {
  const { tabs, activeTabId, setActiveTab, addTab, closeTab, resetActiveTab, resetAll, autoPrint, defaultWarehouseId, settingsOpened, setSettingsOpened } = usePoStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const supplierId = activeTab?.supplierId ?? '';
  const warehouseId = activeTab?.warehouseId ?? '';
  const expectedDate = activeTab?.expectedDate ?? '';
  const note = activeTab?.note ?? '';
  const receiptNumber = activeTab?.receiptNumber ?? '';
  const receivedDate = activeTab?.receivedDate ?? '';
  const lines = activeTab?.lines ?? [];
  const pendingPoId = activeTab?.pendingPoId ?? null;
  const status = activeTab?.pendingPoStatus ?? null;

  const [unpostModal, setUnpostModal] = useState(false);
  const [unpostTargetLine, setUnpostTargetLine] = useState<string | null>(null);
  const [savingLines, setSavingLines] = useState<Set<string>>(new Set());
  const [setPriceLine, setSetPriceLine] = useState<any>(null);

  useEffect(() => {
    if (!usePoStore.getState().activeTabId && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, []);

  useEffect(() => {
    if (defaultWarehouseId && warehouseId !== defaultWarehouseId && !warehouseId) {
      usePoStore.getState().setWarehouse(defaultWarehouseId, '');
    }
  }, [defaultWarehouseId]);

  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const addLineMutation = useAddPoLine();
  const receiveMutation = useReceiveGoods();
  const unpostMutation = useUnpostGoods();

  async function handleSaveDraft() {
    if (!supplierId) {
      notifications.show({ title: 'Validation', message: 'Please select a supplier', color: 'red' });
      return;
    }
    if (!warehouseId) {
      notifications.show({ title: 'Validation', message: 'Please select a warehouse', color: 'red' });
      return;
    }
    const payload = {
      supplierId,
      warehouseId,
      expectedDate: expectedDate || undefined,
      note: note || undefined,
      status: 'draft' as const,
      lines: lines.map((l) => ({
        itemId: l.itemId,
        orderedQty: l.orderedQty,
        uomId: l.uomId || undefined,
        unitCost: l.unitCost,
        discountPercent: l.discountPercent,
        taxPercent: l.taxPercent,
      })),
    };
    const result = pendingPoId
      ? await updateMutation.mutateAsync({ id: pendingPoId, payload })
      : await createMutation.mutateAsync(payload);
    const poId = result.id;
    usePoStore.getState().setPendingPo(poId, result.invoiceNumber || result.purchaseOrderNumber, 'draft');
    usePoStore.getState().updateTab(activeTabId, {
      lines: (result.lines || []).map((l: any) => ({
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
        isPosted: false,
        serverLineId: l.id,
      })),
    });
  }

  async function handleSubmitApprove() {
    if (!supplierId) {
      notifications.show({ title: 'Validation', message: 'Please select a supplier', color: 'red' });
      return;
    }
    if (!warehouseId) {
      notifications.show({ title: 'Validation', message: 'Please select a warehouse', color: 'red' });
      return;
    }
    const payload = {
      supplierId,
      warehouseId,
      expectedDate: expectedDate || undefined,
      note: note || undefined,
      status: 'approved' as const,
      lines: lines.map((l) => ({
        itemId: l.itemId,
        orderedQty: l.orderedQty,
        uomId: l.uomId || undefined,
        unitCost: l.unitCost,
        discountPercent: l.discountPercent,
        taxPercent: l.taxPercent,
      })),
    };
    const result = pendingPoId
      ? await updateMutation.mutateAsync({ id: pendingPoId, payload })
      : await createMutation.mutateAsync(payload);
    usePoStore.getState().setPendingPo(result.id, result.invoiceNumber || result.purchaseOrderNumber, 'approved');
    usePoStore.getState().updateTab(activeTabId, {
      lines: (result.lines || []).map((l: any) => ({
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
        isPosted: false,
        serverLineId: l.id,
      })),
    });
  }

  async function handleSaveLine(line: any) {
    if (!pendingPoId) {return;}
    setSavingLines((prev) => new Set(prev).add(line.id));
    try {
      const result = await addLineMutation.mutateAsync({
        poId: pendingPoId,
        payload: {
          itemId: line.itemId,
          orderedQty: line.orderedQty,
          uomId: line.uomId,
          unitCost: line.unitCost,
          discountPercent: line.discountPercent,
          taxPercent: line.taxPercent,
        },
      });
      const savedLine = result.lines?.find((l: any) => l.itemId === line.itemId);
      usePoStore.getState().updateLine(line.id, {
        isDraft: false,
        serverLineId: savedLine?.id || '',
        itemCode: savedLine?.itemCode || line.itemCode,
        itemName: savedLine?.itemName || line.itemName,
      });
    } finally {
      setSavingLines((prev) => {
        const next = new Set(prev);
        next.delete(line.id);
        return next;
      });
    }
  }

  async function handleReceiveLine(line: any) {
    if (!pendingPoId) {return;}
    const payload = {
      purchaseOrderId: pendingPoId,
      receivedDate: new Date(receivedDate || new Date()).toISOString(),
      receiptNumber: receiptNumber || undefined,
      lines: [
        {
          itemId: line.itemId,
          receivedQty: line.receivedQty,
          uomId: line.uomId,
          unitCost: line.unitCost,
        },
      ],
    };
    const result = await receiveMutation.mutateAsync({ poId: pendingPoId, payload });
    usePoStore.getState().updateLine(line.id, { isPosted: true });
    if (result?.poStatus) {
      usePoStore.getState().setPendingPo(pendingPoId, undefined, result.poStatus);
    }
    if (autoPrint) {
      printPo({
        purchaseOrderNumber: receiptNumber,
        supplierName: usePoStore.getState().tabs.find((t) => t.id === activeTabId)?.supplierName,
        warehouseName: usePoStore.getState().tabs.find((t) => t.id === activeTabId)?.warehouseName,
        orderDate: new Date().toISOString(),
        lines: [line],
        totalCost: line.lineTotal,
      });
    }
  }

  function handleReceiveAll() {
    const receivable = lines.filter((l) => l.serverLineId && !l.isPosted && l.receivedQty > 0);
    for (const line of receivable) {
      handleReceiveLine(line);
    }
  }

  function handleUnpostLine(line: any) {
    setUnpostTargetLine(line.serverLineId || line.id);
    setUnpostModal(true);
  }

  function handleSetPriceLine(line: any) {
    setSetPriceLine(line);
  }

  function handleSetPriceConfirm(unitCost: number) {
    if (!setPriceLine) return;
    usePoStore.getState().updateLine(setPriceLine.id, { unitCost });
    setSetPriceLine(null);
  }

  async function handleConfirmUnpost(password: string) {
    if (!pendingPoId || !unpostTargetLine) {return;}
    const receiptLineId = unpostTargetLine;
    await unpostMutation.mutateAsync({
      poId: pendingPoId,
      payload: { receiptLineId, password },
    });
    const line = lines.find((l) => (l.serverLineId || l.id) === unpostTargetLine);
    if (line) {
      usePoStore.getState().updateLine(line.id, { isPosted: false });
    }
    setUnpostModal(false);
    setUnpostTargetLine(null);
  }

  function handlePrint() {
    printPo({
      purchaseOrderNumber: receiptNumber,
      supplierName: usePoStore.getState().tabs.find((t) => t.id === activeTabId)?.supplierName || '',
      warehouseName: usePoStore.getState().tabs.find((t) => t.id === activeTabId)?.warehouseName || '',
      orderDate: new Date().toISOString(),
      lines: lines.map((l) => ({
        itemCode: l.itemCode,
        itemName: l.itemName,
        orderedQty: l.orderedQty,
        unitCost: l.unitCost,
        lineTotal: l.lineTotal,
      })),
      totalCost: lines.reduce((s, l) => s + l.lineTotal, 0),
    });
  }

  return (
    <Box bg="#b7dce9" h="100vh">
      <Stack gap={0} h="100%">
        <Group px="md" py={4} bg="#d9edf5" gap={4}>
          {tabs.map((tab) => (
            <Group
              key={tab.id}
              gap={4}
              p="xs"
              style={{
                cursor: 'pointer',
                borderRadius: 4,
                background: tab.id === activeTabId ? '#a6d5e5' : 'transparent',
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <Text size="sm" fw={600}>{tab.label}</Text>
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X size={12} />
              </ActionIcon>
            </Group>
          ))}
          <ActionIcon size="sm" ml={4} onClick={addTab}>
            <Plus size={14} />
          </ActionIcon>
        </Group>

        <PoToolbar
          onNew={addTab}
          onReset={resetActiveTab}
          onPrint={handlePrint}
          onSettings={() => setSettingsOpened(true)}
        />

        <Box flex={1} style={{ overflow: 'auto' }} p="md">
          {activeTab && (
            <Stack>
              <Paper withBorder>
                <PoLinesTable
                  lines={activeTab.lines}
                  status={status}
                  pendingPoId={pendingPoId}
                  receiptNumber={receiptNumber}
                  onUpdateLine={(id, updates) => usePoStore.getState().updateLine(id, updates)}
                  onRemoveLine={(id) => usePoStore.getState().removeLine(id)}
                  onAddLine={() => usePoStore.getState().addLine()}
                  onSaveLine={handleSaveLine}
                  onReceiveLine={handleReceiveLine}
                  onUnpostLine={handleUnpostLine}
                  onSetPrice={handleSetPriceLine}
                  savingLines={savingLines}
                />
                {(!status || status === 'draft') && (
                  <Group p="xs">
                    <Button
                      size="xs"
                      leftSection={<Plus size={14} />}
                      onClick={() => usePoStore.getState().addLine()}
                    >
                      Add Line
                    </Button>
                  </Group>
                )}
              </Paper>

              <PoSummary
                lines={activeTab.lines}
                status={status}
                receivedDate={activeTab.receivedDate}
                receiptNumber={receiptNumber}
                onReceivedDateChange={(d) => usePoStore.getState().setReceivedDate(d)}
                onReceiveAll={handleReceiveAll}
                onSaveDraft={handleSaveDraft}
                onSubmitApprove={handleSubmitApprove}
                saving={createMutation.isPending}
                submitting={createMutation.isPending}
              />
            </Stack>
          )}
        </Box>
      </Stack>

      <PoSettingsDrawer />

      <UnpostPasswordModal
        opened={unpostModal}
        onClose={() => { setUnpostModal(false); setUnpostTargetLine(null); }}
        onConfirm={handleConfirmUnpost}
        loading={unpostMutation.isPending}
      />

      <SetPriceModal
        opened={!!setPriceLine}
        onClose={() => setSetPriceLine(null)}
        onConfirm={handleSetPriceConfirm}
        itemId={setPriceLine?.itemId || ''}
        currentUnitCost={setPriceLine?.unitCost || 0}
      />
    </Box>
  );
}
