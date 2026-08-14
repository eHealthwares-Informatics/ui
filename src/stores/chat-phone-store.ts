import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ChatPhoneState = {
  chatPhone: string | null;
  setChatPhone: (phone: string) => void;
};

export const useChatPhoneStore = create<ChatPhoneState>()(
  persist(
    (set) => ({
      chatPhone: null,
      setChatPhone: (phone) => set({ chatPhone: phone }),
    }),
    { name: 'rxsoft-admin-chat-phone' },
  ),
);
