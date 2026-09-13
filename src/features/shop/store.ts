import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { LineItem } from './types';
import { calculateOrderTotals } from './utils';

export interface POSSession {
  id: string;
  createdAt: number;
  updatedAt?: number;
  held?: boolean;
  lines: LineItem[];
}

export interface POSStore {
  sessions: Record<string, POSSession>;
  activeSessionId?: string;
  createSession: (id?: string) => string;
  addLine: (sessionId: string, line: LineItem) => void;
  updateQuantity: (sessionId: string, lineId: string, quantity: number) => void;
  removeLine: (sessionId: string, lineId: string) => void;
  holdSession: (sessionId: string) => void;
  resumeSession: (sessionId: string) => void;
  duplicateSession: (sessionId: string) => string;
  clearSession: (sessionId: string) => void;
  getTotals: (
    sessionId: string,
    orderDiscountPercent?: number,
    orderDiscountAmount?: number
  ) => ReturnType<typeof calculateOrderTotals> | null;
}

function mergeLine(lines: LineItem[], incoming: LineItem): LineItem[] {
  const idx = lines.findIndex(
    (l) =>
      l.productId === incoming.productId &&
      l.uom === incoming.uom &&
      (l.batch || '') === (incoming.batch || '')
  );
  if (idx >= 0) {
    const copy = [...lines];
    const existing = copy[idx];
    copy[idx] = {
      ...existing,
      quantity: existing.quantity + incoming.quantity,
      unitPrice: incoming.unitPrice ?? existing.unitPrice,
    };
    return copy;
  }
  return [...lines, incoming];
}

export const usePOSStore = create<POSStore>()(
  devtools((set) => ({
    sessions: {},
    activeSessionId: undefined,
    createSession: (id?: string) => {
      const sid = id || `s_${Date.now()}`;
      set((state) => ({
        sessions: {
          ...state.sessions,
          [sid]: { id: sid, createdAt: Date.now(), lines: [] },
        },
        activeSessionId: sid,
      }));
      return sid;
    },
    addLine: (sessionId, line) => {
      set((state) => {
        const session = state.sessions[sessionId];
        if (!session) {return state;}
        const lines = mergeLine(session.lines, line);
        return {
          sessions: {
            ...state.sessions,
            [sessionId]: { ...session, lines, updatedAt: Date.now() },
          },
        };
      });
    },
    updateQuantity: (sessionId, lineId, quantity) => {
      set((state) => {
        const session = state.sessions[sessionId];
        if (!session) {return state;}
        const lines = session.lines.map((l) => (l.id === lineId ? { ...l, quantity } : l));
        return {
          sessions: {
            ...state.sessions,
            [sessionId]: { ...session, lines, updatedAt: Date.now() },
          },
        };
      });
    },
    removeLine: (sessionId, lineId) => {
      set((state) => {
        const session = state.sessions[sessionId];
        if (!session) {return state;}
        const lines = session.lines.filter((l) => l.id !== lineId);
        return {
          sessions: {
            ...state.sessions,
            [sessionId]: { ...session, lines, updatedAt: Date.now() },
          },
        };
      });
    },
    holdSession: (sessionId) => {
      set((state) => {
        const s = state.sessions[sessionId];
        if (!s) {return state;}
        return {
          sessions: { ...state.sessions, [sessionId]: { ...s, held: true, updatedAt: Date.now() } },
        };
      });
    },
    resumeSession: (sessionId) => {
      set((state) => {
        const s = state.sessions[sessionId];
        if (!s) {return state;}
        return {
          sessions: {
            ...state.sessions,
            [sessionId]: { ...s, held: false, updatedAt: Date.now() },
          },
          activeSessionId: sessionId,
        };
      });
    },
    duplicateSession: (sessionId) => {
      const newId = `s_${Date.now()}`;
      set((state) => {
        const s = state.sessions[sessionId];
        if (!s) {return state;}
        const copy = { ...s, id: newId, createdAt: Date.now(), updatedAt: Date.now() };
        return { sessions: { ...state.sessions, [newId]: copy }, activeSessionId: newId };
      });
      return newId;
    },
    clearSession: (sessionId) => {
      set((state) => {
        const s = state.sessions[sessionId];
        if (!s) {return state;}
        return {
          sessions: { ...state.sessions, [sessionId]: { ...s, lines: [], updatedAt: Date.now() } },
        };
      });
    },
    getTotals: (sessionId, orderDiscountPercent = 0, orderDiscountAmount = 0) => {
      const state = (usePOSStore as any).getState() as POSStore;
      const s = state.sessions[sessionId];
      if (!s) {return null;}
      return calculateOrderTotals(s.lines, orderDiscountPercent, orderDiscountAmount);
    },
  }))
);
