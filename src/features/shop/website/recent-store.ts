import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_ITEMS = 20;

interface RecentItem {
  productId: string;
  name: string;
  visitedAt: number;
}

interface RecentStore {
  items: RecentItem[];
  addItem: (productId: string, name: string) => void;
  clearAll: () => void;
}

export const useRecentStore = create<RecentStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (productId, name) => {
        const filtered = get().items.filter((i) => i.productId !== productId);
        const newItem: RecentItem = { productId, name, visitedAt: Date.now() };
        set({ items: [newItem, ...filtered].slice(0, MAX_ITEMS) });
      },

      clearAll: () => set({ items: [] }),
    }),
    { name: 'damorex-recently-viewed' }
  )
);
