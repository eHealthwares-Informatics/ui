import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistItem {
  productId: string;
  addedAt: number;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  isSaved: (productId: string) => boolean;
  clearAll: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (productId) => {
        const exists = get().items.some((i) => i.productId === productId);
        if (exists) {
          return;
        }
        set((state) => ({
          items: [...state.items, { productId, addedAt: Date.now() }],
        }));
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      isSaved: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },

      clearAll: () => set({ items: [] }),
    }),
    { name: 'damorex-wishlist' }
  )
);
