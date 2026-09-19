import { Box, Grid, Paper, Stack } from '@mantine/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CartTable } from './components/CartTable';
import { HeldSalesDrawer } from './components/HeldSalesDrawer';
import { InvoicePreviewModal } from './components/InvoicePreviewModal';
import { PaymentModal } from './components/PaymentModal';
import { PosSettingsDrawer } from './components/PosSettingsDrawer';
import { PosToolbar } from './components/PosToolbar';
import { ProductEntryTable } from './components/ProductEntryTable';
import { SalesSummary } from './components/SalesSummary';
import { SaleTabs } from './components/SaleTabs';
import { usePosStore } from './store/usePosStore';
import type { Customer, DispenseRow } from './types';
import { calculateTotals } from './utils/calculation';
import { printPosReceipt, printA4Receipt, printInvoice } from './utils/print';
import { useKeyboardShortcuts } from './utils/useKeyboardShortcuts';
import { useCompleteDispense, useOrganisationConfig, useOrderDetail, useUserPosConfig, useStockLocations } from '../api/posApi';

export default function PosSalesPage() {
  const {
    sessions,
    activeSessionId,
    createSession,
    closeSession,
    setActiveSession,
    addItem,
    addItems,
    updateItem,
    removeItem,
    clearCart,
    clearCustomer,
    setCustomer,
    setPriceList,
    setPricingMode,
    holdSale,
    completeSale,
  } = usePosStore();

  const [paymentOpened, setPaymentOpened] = useState(false);
  const [heldSalesOpened, setHeldSalesOpened] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [invoicePreviewOpened, setInvoicePreviewOpened] = useState(false);
  const [dispenseOrderId, setDispenseOrderId] = useState<string | null>(null);
  const saleResultRef = useRef<any>(null);
  const defaultsAppliedForSessions = useRef(new Set<string>());
  const { data: orgConfig } = useOrganisationConfig();
  const { data: userPosConfig } = useUserPosConfig();
  const { data: stockLocations = [] } = useStockLocations();
  const stockLocationId = userPosConfig?.stockLocationId as string | undefined;

  const { data: dispenseOrder } = useOrderDetail(dispenseOrderId ?? undefined);
  const completeDispense = useCompleteDispense();

  const dispenseRows = useMemo<DispenseRow[]>(() => {
    const items = dispenseOrder?.items ?? [];
    return (Array.isArray(items) ? items : []).map((oi: any) => ({
      orderItemId: oi.id,
      orderedLabel:
        oi.item?.name || oi.genericDrugCode || oi.genericItemCode || oi.freetextName || '',
      orderedCode: oi.item?.code || oi.genericDrugCode || oi.genericItemCode || '',
      quantity: oi.quantity ?? 1,
      initialItemId: oi.itemId ?? null,
      initialItem: oi.item
        ? {
            id: oi.item.id,
            code: oi.item.code,
            name: oi.item.name,
            saleUomId: oi.item.saleUomId ?? null,
            imageUrl: oi.item.smallImageUrl || oi.item.imageUrl || '',
          }
        : null,
    }));
  }, [dispenseOrder]);

  const stockLocationName = useMemo(() => {
    if (!stockLocationId) {return undefined;}
    const loc = (Array.isArray(stockLocations) ? stockLocations : []).find((l: any) => l.id === stockLocationId);
    return loc?.name;
  }, [stockLocationId, stockLocations]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0],
    [sessions, activeSessionId]
  );

  const totals = useMemo(() => {
    if (!activeSession) {return { subtotal: 0, discount: 0, vat: 0, total: 0 };}
    return calculateTotals(activeSession);
  }, [activeSession]);

  const heldSalesCount = useMemo(
    () => sessions.filter((s) => s.held).length,
    [sessions]
  );

  useKeyboardShortcuts({
    createSale: createSession,
    holdSale: () => {
      if (activeSession) {holdSale(activeSession.id);}
    },
    payment: () => setPaymentOpened(true),
  });

  useEffect(() => {
    if (!userPosConfig || !activeSession) {return;}
    if (defaultsAppliedForSessions.current.has(activeSession.id)) {return;}
    defaultsAppliedForSessions.current.add(activeSession.id);

    if (userPosConfig.autoSelectPriceList && userPosConfig.defaultPriceListId && !activeSession.priceListId) {
      setPriceList(activeSession.id, userPosConfig.defaultPriceListId, '');
    }

    if (userPosConfig.autoSelectCustomer && userPosConfig.defaultCustomerId && !activeSession.customerId) {
      setCustomer(activeSession.id, { id: userPosConfig.defaultCustomerId, name: '' });
    }
  }, [userPosConfig, activeSession.id]);

  if (!activeSession) {return null;}

  function handleCustomerChange(customerId: string, customerName: string) {
    setCustomer(activeSession.id, { id: customerId, name: customerName } as Customer);
  }

  function handlePriceListChange(priceListId: string, priceListName: string) {
    setPriceList(activeSession.id, priceListId, priceListName);
  }

  function handlePrintInvoice() {
    setInvoicePreviewOpened(true);
  }

  function resetSession() {
          createSession();
    setDispenseOrderId(null);
  }
  function nextCustomer() {
    createSession();
    closeSession(activeSession.id);
    setDispenseOrderId(null);
  }

  function handleLoadOrder(orderId: string) {
    setDispenseOrderId(orderId);
  }

  function handleLoadSale(saleId: string) {
    const sale = sessions.find((s) => s.id === saleId);
    if (sale) {
      setActiveSession(saleId);
    }
    setDispenseOrderId(null);
  }

  function handleHold() {
    holdSale(activeSession.id);
    createSession();
    setDispenseOrderId(null);
  }

  function handlePaymentComplete() {
    completeSale(activeSession.id, totals.total, 0);
  }

  function handleSellPrint() {
    setPaymentOpened(true);
    saleResultRef.current = 'print';
  }

  function handlePrintWholesale() {
    setPaymentOpened(true);
    saleResultRef.current = 'print_wholesale';
  }

  function handlePaymentModalComplete(saleResult?: any) {
    const printMode = saleResultRef.current;
    saleResultRef.current = null;

    // If this POS sale was dispensed from an order, link + dispatch the order.
    if (dispenseOrderId && saleResult?.id) {
      completeDispense.mutate({
        orderId: dispenseOrderId,
        saleId: saleResult.id,
        saleNumber: saleResult.saleNumber,
      });
    }
    setDispenseOrderId(null);

    handlePaymentComplete();

    if (printMode === 'print') {
      const items = activeSession.cart.map((item) => {
        const price = activeSession.pricingMode === 'wholesale' ? item.wholesalePrice : item.retailPrice;
        return {
          code: item.code,
          name: item.name,
          qty: item.quantity,
          price,
          total: price * item.quantity * item.uomFactor,
        };
      });
      printPosReceipt({
        saleNumber: activeSession.saleCode,
        customerName: activeSession.customerName,
        items,
        subtotal: totals.subtotal,
        discount: totals.discount,
        vat: totals.vat,
        total: totals.total,
        paidAmount: totals.total,
        changeAmount: 0,
        header: orgConfig?.posHeader ?? undefined,
      });
    } else if (printMode === 'print_wholesale') {
      const items = activeSession.cart.map((item) => {
        const price = activeSession.pricingMode === 'wholesale' ? item.wholesalePrice : item.retailPrice;
        return {
          code: item.code,
          name: item.name,
          qty: item.quantity,
          price,
          total: price * item.quantity * item.uomFactor,
        };
      });
      printA4Receipt({
        saleNumber: activeSession.saleCode,
        customerName: activeSession.customerName,
        items,
        subtotal: totals.subtotal,
        discount: totals.discount,
        vat: totals.vat,
        total: totals.total,
        paidAmount: totals.total,
        changeAmount: 0,
        header: orgConfig?.posHeader ?? undefined,
      });
    }
  }

  function handlePrintHeldInvoice(sessionId: string) {
    const sale = sessions.find((s) => s.id === sessionId);
    if (!sale || sale.cart.length === 0) {return;}

    const subtotal = sale.cart.reduce((sum, item) => {
      const price = sale.pricingMode === 'wholesale' ? item.wholesalePrice : item.retailPrice;
      return sum + price * item.quantity * item.uomFactor;
    }, 0);

    const items = sale.cart.map((item) => {
      const price = sale.pricingMode === 'wholesale' ? item.wholesalePrice : item.retailPrice;
      return {
        code: item.code,
        name: item.name,
        qty: item.quantity,
        price,
        total: price * item.quantity * item.uomFactor,
      };
    });

    printInvoice({
      saleNumber: sale.saleCode,
      customerName: sale.customerName,
      items,
      subtotal,
      discount: 0,
      vat: 0,
      total: subtotal,
    });
  }

  return (
    <>
      <Box bg="#b7dce9" h="100vh">
        <Stack gap={0} h="100%">
          {/* SALE TABS */}
          <Paper radius={0} withBorder>
            <SaleTabs
              sessions={sessions}
              activeSessionId={activeSession.id}
              onChange={setActiveSession}
              onAdd={createSession}
              onClose={closeSession}
              stockLocationName={stockLocationName}
            />
          </Paper>

          {/* TOOLBAR */}
          <PosToolbar
            session={activeSession}
            onCustomerChange={handleCustomerChange}
            onPriceListChange={handlePriceListChange}
            onPricingModeChange={(mode) => setPricingMode(activeSession.id, mode)}
            onReset={resetSession}
            onSettings={() => setSettingsOpened(true)}
            onLoadSale={handleLoadSale}
            onLoadOrder={handleLoadOrder}
            onHeldSalesOpen={() => setHeldSalesOpened(true)}
            heldSalesCount={heldSalesCount}
          />

          {/* PRODUCT ENTRY (dispense mode shows order lines as editable rows) */}
          {activeSession.status !== 'completed' && (
            <ProductEntryTable
            session={activeSession}
            onAddToCart={(item) => addItem(activeSession.id, item)}
            stockLocationId={stockLocationId}
            dispenseRows={dispenseOrderId ? dispenseRows : undefined}
            dispenseKey={dispenseOrderId}
            onDispenseAdd={
              dispenseOrderId
                ? (item) => addItems(activeSession.id, [item])
                : undefined
            }
          />)}

          {/* MAIN AREA */}
          <Grid flex={1} gap={0}>
            {/* CART */}
            <Grid.Col span={{ base: 12, md: 9 }}>
              <CartTable
                session={activeSession}
                onUpdateQty={(itemId, qty) =>
                  updateItem(activeSession.id, itemId, { quantity: qty })
                }
                onRemoveItem={(itemId) => removeItem(activeSession.id, itemId)}
              />
            </Grid.Col>

            {/* SUMMARY */}
            <Grid.Col span={{ base: 12, md: 3 }}>
              <SalesSummary
                itemCount={activeSession.cart.length}
                totals={totals}
                onCalculate={handlePrintInvoice}
                onCheckout={() => {
                  saleResultRef.current = null;
                  setPaymentOpened(true);
                }}
                onHold={handleHold}
                onNextCustomer={nextCustomer}
                onSellPrint={handleSellPrint}
                onPrintWholesale={handlePrintWholesale}
                paidAmount={activeSession.paidAmount}
                cartEmpty={activeSession.cart.length === 0 || activeSession.status === 'completed'}
                sessionCompleted={activeSession.status === 'completed'}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Box>

      {/* INVOICE PREVIEW */}
      <InvoicePreviewModal
        opened={invoicePreviewOpened}
        onClose={() => setInvoicePreviewOpened(false)}
        session={activeSession}
        onProceedToPayment={() => {
          setInvoicePreviewOpened(false);
          saleResultRef.current = null;
          setPaymentOpened(true);
        }}
      />

      {/* PAYMENT */}
      <PaymentModal
        opened={paymentOpened}
        onClose={() => setPaymentOpened(false)}
        session={activeSession}
        totals={totals}
        onComplete={handlePaymentModalComplete}
      />

      {/* HELD SALES */}
      <HeldSalesDrawer
        opened={heldSalesOpened}
        onClose={() => setHeldSalesOpened(false)}
        onResume={(id) => setActiveSession(id)}
        onPrintInvoice={handlePrintHeldInvoice}
      />

      {/* SETTINGS */}
      <PosSettingsDrawer opened={settingsOpened} onClose={() => setSettingsOpened(false)} />
    </>
  );
}
