import { create } from 'zustand';

interface AccountDrawerState {
  opened: boolean;
  tab: 'signin' | 'register';
  open: (tab?: 'signin' | 'register') => void;
  close: () => void;
}

export const useAccountDrawerStore = create<AccountDrawerState>((set) => ({
  opened: false,
  tab: 'signin',
  open: (tab = 'signin') => set({ opened: true, tab }),
  close: () => set({ opened: false }),
}));