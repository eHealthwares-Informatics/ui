import { createContext, useContext, useReducer, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { lisApi } from '@/lib/lis-api';

export interface OrderItem {
  testDefinitionId: string;
  notes?: string;
}

export interface OrderSample {
  barcode: string;
  sampleType?: string;
  collector?: string;
  collectionDate?: string | null;
  collectionMethod?: string | null;
  collectionConditions?: string | null;
  quantity?: number | null;
  notes?: string | null;
}

export interface OrderState {
  orderId: string | null;
  orderNumber: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  error: string | null;
  currentStep: number;
  stepProgress: { enter: boolean; collect: boolean; label: boolean; qa: boolean; order: boolean };

  patientSelected: boolean;

  patientId: string;
  patientName: string;
  patientAge: number | null;
  patientGender: string | null;
  patientDateOfBirth: string | null;
  internalReference: string | null;
  externalReference: string | null;
  priorityId: string | null;
  requestedDate: string | null;
  requesterName: string | null;
  requesterPhone: string | null;
  diagnosis: string | null;
  clinicalNotes: string | null;
  notes: string | null;

  items: OrderItem[];

  samples: OrderSample[];

  assignments: Array<{ testDefinitionId: string; testName: string; sampleIndex: number }>;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_ORDER'; payload: Partial<OrderState> }
  | { type: 'SET_ORDER_ID'; payload: { id: string; number: string } }
  | { type: 'UPDATE_FIELD'; payload: { name: string; value: unknown } }
  | { type: 'SET_ITEMS'; payload: OrderItem[] }
  | { type: 'SET_SAMPLES'; payload: OrderSample[] }
  | { type: 'SET_ASSIGNMENTS'; payload: Array<{ testDefinitionId: string; testName: string; sampleIndex: number }> }
  | { type: 'MARK_DIRTY' }
  | { type: 'MARK_CLEAN' }
  | { type: 'MARK_STEP'; payload: 'enter' | 'collect' | 'label' | 'qa' | 'order' }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'RESET' }
  | { type: 'SET_ERROR'; payload: string | null };

const today = new Date();
const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const initialState: OrderState = {
  orderId: null,
  orderNumber: null,
  isLoading: false,
  isSubmitting: false,
  isDirty: false,
  saveStatus: 'saved',
  error: null,
  currentStep: 0,
  stepProgress: { enter: false, collect: false, label: false, qa: false, order: false },

  patientSelected: false,

  patientId: '',
  patientName: '',
  patientAge: null,
  patientGender: null,
  patientDateOfBirth: null,
  internalReference: null,
  externalReference: null,
  priorityId: null,
  requestedDate: todayString,
  requesterName: null,
  requesterPhone: null,
  diagnosis: null,
  clinicalNotes: null,
  notes: null,

  items: [],
  samples: [],
  assignments: [],
};

function reducer(state: OrderState, action: Action): OrderState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'SET_ORDER':
      return { ...state, ...action.payload, isLoading: false };
    case 'SET_ORDER_ID':
      return { ...state, orderId: action.payload.id, orderNumber: action.payload.number };
    case 'UPDATE_FIELD':
      return { ...state, [action.payload.name]: action.payload.value, isDirty: true, saveStatus: 'unsaved' };
    case 'SET_ITEMS':
      return { ...state, items: action.payload, isDirty: true, saveStatus: 'unsaved' };
    case 'SET_SAMPLES':
      return { ...state, samples: action.payload, isDirty: true, saveStatus: 'unsaved' };
    case 'SET_ASSIGNMENTS':
      return { ...state, assignments: action.payload, isDirty: true, saveStatus: 'unsaved' };
    case 'MARK_DIRTY':
      return { ...state, isDirty: true, saveStatus: 'unsaved' };
    case 'MARK_CLEAN':
      return { ...state, isDirty: false, saveStatus: 'saved' };
    case 'MARK_STEP':
      return { ...state, stepProgress: { ...state.stepProgress, [action.payload]: true } };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

interface OrderContextValue {
  state: OrderState;
  dispatch: React.Dispatch<Action>;
  saveOrder: (silent?: boolean) => Promise<void>;
  saveOrderEntry: () => Promise<any>;
  loadOrder: (orderId: string) => Promise<any>;
  resetOrder: () => void;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildPayload = useCallback(() => {
    const s = stateRef.current;
    return {
      patientId: s.patientId,
      patientName: s.patientName,
      patientAge: s.patientAge,
      patientGender: s.patientGender,
      patientDateOfBirth: s.patientDateOfBirth,
      internalReference: s.internalReference,
      externalReference: s.externalReference,
      priorityId: s.priorityId,
      requestedDate: s.requestedDate,
      requesterName: s.requesterName,
      requesterPhone: s.requesterPhone,
      diagnosis: s.diagnosis,
      clinicalNotes: s.clinicalNotes,
      notes: s.notes,
      stepProgress: s.stepProgress,
      items: s.items,
      samples: s.samples.map((samp) => ({
        barcode: samp.barcode,
        sampleType: samp.sampleType,
        collector: samp.collector,
        collectionDate: samp.collectionDate,
        collectionMethod: samp.collectionMethod,
        collectionConditions: samp.collectionConditions,
        quantity: samp.quantity,
        notes: samp.notes,
      })),
    };
  }, []);

  const saveOrder = useCallback(async (silent = false) => {
    const s = stateRef.current;
    if (!s.orderId) return;
    if (!silent) dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      await lisApi.patch(`/lis/orders/${s.orderId}`, buildPayload());
      dispatch({ type: 'MARK_CLEAN' });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Save failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
    } finally {
      if (!silent) dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, [buildPayload]);

  const saveOrderEntry = useCallback(async () => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const s = stateRef.current;
      const res = await lisApi.post('/lis/orders', buildPayload());
      const data = res.data?.data ?? res.data;
      dispatch({ type: 'SET_ORDER_ID', payload: { id: data.id, number: data.orderNumber } });
      dispatch({ type: 'MARK_CLEAN' });
      return data;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Create failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, [buildPayload]);

  const loadOrder = useCallback(async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const res = await lisApi.get(`/lis/orders/${id}`);
      const data = res.data?.data ?? res.data;
      dispatch({
        type: 'SET_ORDER',
        payload: {
          orderId: data.id,
          orderNumber: data.orderNumber,
          patientSelected: !!data.patientName,
          patientId: data.patientId ?? '',
          patientAge: data.patientAge ?? null,
          patientGender: data.patientGender ?? null,
          patientDateOfBirth: data.patientDateOfBirth ?? null,
          internalReference: data.internalReference ?? null,
          externalReference: data.externalReference ?? null,
          priorityId: data.priorityId ?? null,
          requestedDate: data.requestedDate ?? null,
          requesterName: data.requesterName ?? null,
          requesterPhone: data.requesterPhone ?? null,
          diagnosis: data.diagnosis ?? null,
          clinicalNotes: data.clinicalNotes ?? null,
          notes: data.notes ?? null,
          stepProgress: data.stepProgress ?? { enter: false, collect: false, label: false, qa: false, order: false },
          items: data.items?.map((i: any) => ({ testDefinitionId: i.testDefinitionId, notes: i.notes })) ?? [],
        },
      });
      return data;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Load failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, []);

  const resetOrder = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  useEffect(() => {
    if (state.orderId && state.isDirty && state.saveStatus === 'unsaved') {
      if (!autoSaveTimer.current) {
        autoSaveTimer.current = setInterval(() => {
          const s = stateRef.current;
          if (s.isDirty && s.orderId) {
            saveOrder(true);
          }
        }, 30000);
      }
    } else {
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    }
    return () => {
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, [state.orderId, state.isDirty, state.saveStatus, saveOrder]);

  return (
    <OrderContext.Provider value={{ state, dispatch, saveOrder, saveOrderEntry, loadOrder, resetOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderContext() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrderContext must be used within OrderProvider');
  return ctx;
}
