import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from './types';

interface SavedItem {
  productId: string;
  name?: string;
  genericProductCode?: string;
  genericDrugCode?: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  savedForLater: SavedItem[];
  addItem: (productId: string, quantity?: number) => void;
  addGenericItem: (entry: {
    name?: string;
    genericProductCode: string;
    unitPrice?: number;
    quantity?: number;
  }) => void;
  addGenericDrug: (entry: {
    name?: string;
    genericDrugCode: string;
    unitPrice?: number;
    quantity?: number;
  }) => void;
  updateQuantity: (productId: string | undefined, quantity: number) => void;
  removeItem: (productId: string | undefined) => void;
  clearCart: () => void;
  itemCount: () => number;
  totalItems: number;
  subtotal: number;
  saveForLater: (productId: string | undefined) => void;
  moveToCart: (productId: string) => void;
  removeSaved: (productId: string) => void;
}

// A cart line is identified by exactly one of: productId (brand item),
// genericProductCode (EMDEx generic), or genericDrugCode (NDF generic).
function lineKey(i: CartItem): string | undefined {
  return i.productId || i.genericProductCode || i.genericDrugCode || undefined;
}

function computeSubtotal(items: CartItem[]): number {
  return items.reduce(
    (sum, i) => sum + ((i.product as any)?.price ?? i.unitPrice ?? 0) * i.quantity,
    0,
  );
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      savedForLater: [],
      totalItems: 0,
      subtotal: 0,

      addItem: (productId, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === productId);
          let items: CartItem[];
          if (existing) {
            items = state.items.map((i) =>
              i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
            );
          } else {
            items = [...state.items, { productId, quantity }];
          }
          return {
            items,
            totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: computeSubtotal(items),
          };
        });
      },

      addGenericItem: (entry) => {
        const { name, genericProductCode, unitPrice, quantity = 1 } = entry;
        set((state) => {
          const key = genericProductCode;
          const existing = state.items.find((i) => i.genericProductCode === key);
          let items: CartItem[];
          if (existing) {
            items = state.items.map((i) =>
              i.genericProductCode === key ? { ...i, quantity: i.quantity + quantity } : i
            );
          } else {
            items = [...state.items, { name, genericProductCode, unitPrice, quantity }];
          }
          return {
            items,
            totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: computeSubtotal(items),
          };
        });
      },

      addGenericDrug: (entry) => {
        const { name, genericDrugCode, unitPrice, quantity = 1 } = entry;
        set((state) => {
          const key = genericDrugCode;
          const existing = state.items.find((i) => i.genericDrugCode === key);
          let items: CartItem[];
          if (existing) {
            items = state.items.map((i) =>
              i.genericDrugCode === key ? { ...i, quantity: i.quantity + quantity } : i
            );
          } else {
            items = [...state.items, { name, genericDrugCode, unitPrice, quantity }];
          }
          return {
            items,
            totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: computeSubtotal(items),
          };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          const keyed = (i: CartItem) => lineKey(i) === productId;
          if (quantity <= 0) {
            const items = state.items.filter((i) => !keyed(i));
            return {
              items,
              totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
              subtotal: computeSubtotal(items),
            };
          }
          const items = state.items.map((i) =>
            keyed(i) ? { ...i, quantity } : i
          );
          return {
            items,
            totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: computeSubtotal(items),
          };
        });
      },

      removeItem: (productId) => {
        set((state) => {
          const keyed = (i: CartItem) => lineKey(i) === productId;
          const items = state.items.filter((i) => !keyed(i));
          return {
            items,
            totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: computeSubtotal(items),
          };
        });
      },

      clearCart: () => set({ items: [], totalItems: 0, subtotal: 0 }),

      itemCount: () => get().items.length,

      saveForLater: (productId) => {
        const item = get().items.find((i) => lineKey(i) === productId);
        if (!item) {
          return;
        }
        const saved: SavedItem = {
          productId: item.productId ?? productId ?? '',
          name: item.name,
          genericProductCode: item.genericProductCode,
          genericDrugCode: item.genericDrugCode,
          quantity: item.quantity,
        };
        set((state) => {
          const items = state.items.filter((i) => lineKey(i) !== productId);
          return {
            items,
            savedForLater: [...state.savedForLater, saved],
            totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: computeSubtotal(items),
          };
        });
      },

      moveToCart: (productId) => {
        const saved = get().savedForLater.find((i) => i.productId === productId);
        if (!saved) {
          return;
        }
        const savedKey = saved.genericDrugCode ?? saved.genericProductCode;
        set((state) => {
          const existing = savedKey
            ? state.items.find((i) => lineKey(i) === savedKey)
            : state.items.find((i) => i.productId === productId);
          let items: CartItem[];
          if (existing) {
            items = state.items.map((i) =>
              lineKey(i) === savedKey
                ? { ...i, quantity: i.quantity + saved.quantity }
                : i
            );
          } else if (savedKey) {
            items = [
              ...state.items,
              {
                name: saved.name,
                genericProductCode: saved.genericProductCode,
                genericDrugCode: saved.genericDrugCode,
                quantity: saved.quantity,
              },
            ];
          } else {
            items = [...state.items, { productId: saved.productId, quantity: saved.quantity }];
          }
          return {
            items,
            savedForLater: state.savedForLater.filter((i) => i.productId !== productId),
            totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: computeSubtotal(items),
          };
        });
      },

      removeSaved: (productId) => {
        set((state) => ({
          savedForLater: state.savedForLater.filter((i) => i.productId !== productId),
        }));
      },
    }),
    {
      name: 'damorex-cart',
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        savedForLater: (persisted as any)?.savedForLater ?? [],
      }),
    }
  )
);
