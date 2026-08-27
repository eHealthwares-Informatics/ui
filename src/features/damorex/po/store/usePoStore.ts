import { create } from 'zustand';
import { PoLineItem, PurchaseOrderStatus } from '../types';

interface PoTab {
  id: string;
  label: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  expectedDate: string;
  note: string;
  receiptNumber: string;
  receivedDate: string;
  lines: PoLineItem[];
  pendingPoId: string | null;
  pendingPoLabel: string;
  pendingPoStatus: PurchaseOrderStatus | null;
}

interface PoStoreState {
  tabs: PoTab[];
  activeTabId: string;
  defaultWarehouseId: string;
  defaultWarehouseName: string;
  autoPrint: boolean;
  autoReceiptNumber: boolean;
  settingsOpened: boolean;

  addTab: () => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<PoTab>) => void;

  setSupplier: (id: string, name: string) => void;
  setWarehouse: (id: string, name: string) => void;
  setExpectedDate: (date: string) => void;
  setNote: (note: string) => void;
  setReceiptNumber: (num: string) => void;
  setReceivedDate: (date: string) => void;
  setPendingPo: (id: string | null, label?: string, status?: PurchaseOrderStatus | null) => void;

  addLine: (line?: Partial<PoLineItem>) => void;
  updateLine: (lineId: string, updates: Partial<PoLineItem>) => void;
  removeLine: (lineId: string) => void;

  resetActiveTab: () => void;
  resetAll: () => void;

  setDefaultWarehouse: (id: string, name: string) => void;
  setAutoPrint: (v: boolean) => void;
  setAutoReceiptNumber: (v: boolean) => void;
  setSettingsOpened: (v: boolean) => void;
}

export const computeSubtotal = (
  qty: number,
  unitCost: number,
  discountPercent: number,
): number => {
  const raw = qty * unitCost;
  const discount = raw * (discountPercent / 100);
  return Number((raw - discount).toFixed(2));
};

export const computeTotal = (
  qty: number,
  unitCost: number,
  discountPercent: number,
  taxPercent: number,
): number => {
  const subtotal = computeSubtotal(qty, unitCost, discountPercent);
  const tax = subtotal * (taxPercent / 100);
  return Number((subtotal + tax).toFixed(2));
};

const emptyLine = (): PoLineItem => ({
  id: crypto.randomUUID(),
  itemId: '',
  orderedQty: 1,
  receivedQty: 0,
  uomId: '',
  unitCost: 0,
  discountPercent: 0,
  taxPercent: 0,
  lineSubtotal: 0,
  lineTotal: 0,
  receivedSubtotal: 0,
  receivedLineTotal: 0,
  isDraft: true,
  isPosted: false,
});

const defaultTabState = (): PoTab => ({
  id: crypto.randomUUID(),
  label: `PO ${new Date().toLocaleDateString()}`,
  supplierId: '',
  supplierName: '',
  warehouseId: '',
  warehouseName: '',
  expectedDate: '',
  note: '',
  receiptNumber: '',
  receivedDate: new Date().toISOString().slice(0, 10),
  lines: [emptyLine()],
  pendingPoId: null,
  pendingPoLabel: '',
  pendingPoStatus: null,
});

export const usePoStore = create<PoStoreState>((set, get) => ({
  tabs: [defaultTabState()],
  activeTabId: '',
  defaultWarehouseId: '',
  defaultWarehouseName: '',
  autoPrint: false,
  autoReceiptNumber: true,
  settingsOpened: false,

  addTab: () => {
    const tab = defaultTabState();
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
  },

  closeTab: (id) =>
    set((s) => {
      const filtered = s.tabs.filter((t) => t.id !== id);
      if (filtered.length === 0) {
        const tab = defaultTabState();
        return { tabs: [tab], activeTabId: tab.id };
      }
      const newActive = s.activeTabId === id ? filtered[filtered.length - 1].id : s.activeTabId;
      return { tabs: filtered, activeTabId: newActive };
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, updates) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  setSupplier: (id, name) => {
    const active = get().activeTabId;
    get().updateTab(active, { supplierId: id, supplierName: name });
  },

  setWarehouse: (id, name) => {
    const active = get().activeTabId;
    get().updateTab(active, { warehouseId: id, warehouseName: name });
  },

  setExpectedDate: (date) => {
    const active = get().activeTabId;
    get().updateTab(active, { expectedDate: date });
  },

  setNote: (note) => {
    const active = get().activeTabId;
    get().updateTab(active, { note });
  },

  setReceiptNumber: (num) => {
    const active = get().activeTabId;
    get().updateTab(active, { receiptNumber: num });
  },

  setReceivedDate: (date) => {
    const active = get().activeTabId;
    get().updateTab(active, { receivedDate: date });
  },

  setPendingPo: (id, label, status) => {
    const active = get().activeTabId;
    get().updateTab(active, { pendingPoId: id, pendingPoLabel: label ?? '', pendingPoStatus: status ?? null });
  },

  addLine: (line) => {
    const active = get().activeTabId;
    const tab = get().tabs.find((t) => t.id === active);
    if (!tab) {return;}
    get().updateTab(active, {
      lines: [
        ...tab.lines,
        { ...emptyLine(), ...line },
      ],
    });
  },

  updateLine: (lineId, updates) => {
    const active = get().activeTabId;
    const tab = get().tabs.find((t) => t.id === active);
    if (!tab) {return;}
    get().updateTab(active, {
      lines: tab.lines.map((line) => {
        if (line.id !== lineId) {return line;}
        const updated = { ...line, ...updates };
        updated.lineSubtotal = computeSubtotal(updated.orderedQty, updated.unitCost, updated.discountPercent);
        updated.lineTotal = computeTotal(updated.orderedQty, updated.unitCost, updated.discountPercent, updated.taxPercent);
        updated.receivedSubtotal = computeSubtotal(updated.receivedQty, updated.unitCost, updated.discountPercent);
        updated.receivedLineTotal = computeTotal(updated.receivedQty, updated.unitCost, updated.discountPercent, updated.taxPercent);
        return updated;
      }),
    });
  },

  removeLine: (lineId) => {
    const active = get().activeTabId;
    const tab = get().tabs.find((t) => t.id === active);
    if (!tab) {return;}
    get().updateTab(active, { lines: tab.lines.filter((l) => l.id !== lineId) });
  },

  resetActiveTab: () => {
    const active = get().activeTabId;
    get().updateTab(active, { ...defaultTabState(), id: active });
  },

  resetAll: () => {
    const tab = defaultTabState();
    set({ tabs: [tab], activeTabId: tab.id });
  },

  setDefaultWarehouse: (id, name) => set({ defaultWarehouseId: id, defaultWarehouseName: name }),
  setAutoPrint: (v) => set({ autoPrint: v }),
  setAutoReceiptNumber: (v) => set({ autoReceiptNumber: v }),
  setSettingsOpened: (v) => set({ settingsOpened: v }),
}));
