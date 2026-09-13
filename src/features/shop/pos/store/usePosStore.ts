import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SaleSession, CartItem, Customer } from '../types';

function generateSaleCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'WEBPOS-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface PosStore {
  sessions: SaleSession[];
  activeSessionId: string | null;

  createSession: (sessionId?: string) => void;
  closeSession: (id: string) => void;
  setActiveSession: (id: string) => void;

  addItem: (sessionId: string, item: CartItem) => void;
  updateItem: (sessionId: string, itemId: string, updates: Partial<CartItem>) => void;
  removeItem: (sessionId: string, itemId: string) => void;
  clearCart: (sessionId: string) => void;

  setCustomer: (sessionId: string, customer: Customer) => void;
  clearCustomer: (sessionId: string) => void;
  setPriceList: (sessionId: string, priceListId: string, priceListName: string) => void;
  setPricingMode: (sessionId: string, mode: 'retail' | 'wholesale') => void;
  holdSale: (id: string) => void;
  completeSale: (id: string, paidAmount: number, changeAmount: number) => void;
}

const createEmptySession = (): SaleSession => ({
  id: crypto.randomUUID(),
  saleCode: generateSaleCode(),
  createdAt: new Date().toISOString(),
  discount: 0,
  vatPercent: 0,
  pricingMode: 'retail',
  held: false,
  status: 'active',
  paidAmount: 0,
  changeAmount: 0,
  cart: [],
});

export const usePosStore = create<PosStore>()(
  persist(
    (set) => ({
      sessions: [createEmptySession()],
      activeSessionId: null,

      createSession: (oldSessionId?: string) =>
        set((state) => {
          const session = createEmptySession();

          const sessions = oldSessionId
            ? state.sessions.filter((s) => s.id !== oldSessionId)
            : state.sessions;

          return {
            sessions: [...sessions, session],
            activeSessionId: session.id,
          };
        }),

      setActiveSession: (id) => set({ activeSessionId: id }),

      closeSession: (id) =>
        set((state) => {
          if (state.sessions.length <= 1) return state;
          const filtered = state.sessions.filter((s) => s.id !== id);
          return {
            sessions: filtered,
            activeSessionId:
              state.activeSessionId === id ? (filtered[0]?.id ?? null) : state.activeSessionId,
          };
        }),

      addItem: (sessionId, item) =>
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id !== sessionId) {return session;}
            const existing = session.cart.find((i) => i.code === item.code);
            if (existing) {
              existing.quantity += item.quantity;
              existing.lineTotal = getLineTotal(existing);
              return { ...session };
            }
            return {
              ...session,
              cart: [...session.cart, item],
            };
          }),
        })),

      updateItem: (sessionId, itemId, updates) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  cart: session.cart.map((item) =>
                    item.id === itemId
                      ? { ...item, ...updates, lineTotal: getLineTotal({ ...item, ...updates }) }
                      : item
                  ),
                }
              : session
          ),
        })),

      removeItem: (sessionId, itemId) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  cart: session.cart.filter((item) => item.id !== itemId),
                }
              : session
          ),
        })),

      clearCart: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId ? { ...session, cart: [] } : session
          ),
        })),

      setCustomer: (sessionId, customer) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, customer, customerId: customer.id, customerName: customer.name }
              : session
          ),
        })),

      clearCustomer: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, customer: undefined, customerId: undefined, customerName: undefined }
              : session
          ),
        })),

      setPriceList: (sessionId, priceListId, priceListName) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId ? { ...session, priceListId, priceListName } : session
          ),
        })),

      setPricingMode: (sessionId, mode) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId ? { ...session, pricingMode: mode } : session
          ),
        })),

      holdSale: (id) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, held: true, status: 'held' as const } : session
          ),
        })),

      completeSale: (id, paidAmount, changeAmount) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id
              ? { ...session, status: 'completed' as const, paidAmount, changeAmount }
              : session
          ),
        })),
    }),
    { name: 'pos-store' }
  )
);

function getLineTotal(item: {
  quantity: number;
  uomFactor: number;
  retailPrice: number;
  wholesalePrice: number;
  pricingMode?: string;
}): number {
  const price = item.pricingMode === 'wholesale' ? item.wholesalePrice : item.retailPrice;
  return item.quantity * price * item.uomFactor;
}
