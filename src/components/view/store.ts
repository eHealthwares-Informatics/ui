// stores/createEntityStore.ts

import { create } from 'zustand';

export type EntityStore<T> = {
  selectedRow?: Partial<T>;

  setSelectedRow: (row?: Partial<T>) => void;

  clearSelectedRow: () => void;
};

export function createEntityStore<T extends Record<string, unknown>>() {
  return create<EntityStore<T>>((set) => ({
    selectedRow: undefined,

    setSelectedRow: (row) =>
      set({
        selectedRow: row,
      }),

    clearSelectedRow: () =>
      set({
        selectedRow: undefined,
      }),
  }));
}
