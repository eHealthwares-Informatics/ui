import { create } from 'zustand';

interface ChatbotStore {
  open: boolean;
  initialMessage: string;
  questionnaireCode: string;
  setOpen: (open: boolean) => void;
  openWith: (message: string, code: string) => void;
  close: () => void;
}

export const useChatbotStore = create<ChatbotStore>((set) => ({
  open: false,
  initialMessage: '',
  questionnaireCode: '',
  setOpen: (open) => set({ open }),
  openWith: (message, code) =>
    set({ open: true, initialMessage: message, questionnaireCode: code }),
  close: () => set({ open: false, initialMessage: '', questionnaireCode: '' }),
}));
