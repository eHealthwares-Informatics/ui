import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { PurchaseOrder } from '../types';

export const poKeys = {
  list: (search?: string) => ['purchase-orders', search || ''] as any,
  detail: (id?: string) => ['purchase-orders', id || ''] as any,
};

export const receiptKeys = {
  byPo: (poId: string) => ['goods-receipts', poId] as any,
};

export function usePurchaseOrders(search?: string) {
  return useQuery({
    queryKey: poKeys.list(search),
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/purchases', {
        params: { search: search || '', limit: 50 },
      });
      return (data?.data ?? data ?? []) as PurchaseOrder[];
    },
    staleTime: 30_000,
  });
}

export function usePurchaseOrder(id?: string) {
  return useQuery({
    queryKey: poKeys.detail(id),
    queryFn: async () => {
      if (!id) {return null;}
      const { data } = await rxsoftApi.get(`/purchases/${id}`);
      return data as PurchaseOrder;
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await rxsoftApi.post('/purchases', payload);
      return data as PurchaseOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries(poKeys.list());
    },
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data } = await rxsoftApi.put(`/purchases/${id}`, payload);
      return data as PurchaseOrder;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries(poKeys.list());
      qc.invalidateQueries(poKeys.detail(vars.id));
    },
  });
}

export function useSuppliers(search?: string) {
  return useQuery({
    queryKey: ['suppliers', search],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/suppliers', {
        params: { search, limit: 20 },
      });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; phone?: string; email?: string; address?: string }) => {
      const { data } = await rxsoftApi.post('/suppliers', payload);
      return data as { id: string; name: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useWarehouses(search?: string) {
  return useQuery({
    queryKey: ['warehouses', search],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/warehouses', {
        params: { search, limit: 20 },
      });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useReceiveGoods() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ poId, payload }: { poId: string; payload: any }) => {
      const { data } = await rxsoftApi.post(`/purchases/${poId}/receive`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries(poKeys.list());
      qc.invalidateQueries(receiptKeys.byPo(''));
    },
  });
}

export function useUnpostGoods() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ poId, payload }: { poId: string; payload: { receiptLineId: string; password: string } }) => {
      const { data } = await rxsoftApi.post(`/purchases/${poId}/unpost`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries(poKeys.list());
      qc.invalidateQueries(receiptKeys.byPo(''));
    },
  });
}

export function useReceipts(poId?: string) {
  return useQuery({
    queryKey: receiptKeys.byPo(poId || ''),
    queryFn: async () => {
      if (!poId) {return [];}
      const { data } = await rxsoftApi.get(`/purchases/${poId}/receipts`);
      return data?.data ?? data ?? [];
    },
    enabled: !!poId,
  });
}

export function useItems(search?: string) {
  return useQuery({
    queryKey: ['catalog-items', search],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/items', {
        params: { search, limit: 20 },
      });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useItemUoms(itemId: string | null) {
  return useQuery({
    queryKey: ['item-uoms', itemId],
    queryFn: async () => {
      if (!itemId) {return [];}
      const { data } = await rxsoftApi.get(`/items/${itemId}/uoms`);
      return (data?.data ?? data ?? []) as Array<{ id: string; code: string; name: string; factor: number }>;
    },
    enabled: !!itemId,
    staleTime: 120_000,
  });
}

export function useAddPoLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ poId, payload }: { poId: string; payload: any }) => {
      const { data } = await rxsoftApi.post(`/purchases/${poId}/lines`, payload);
      return data as PurchaseOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries(poKeys.list());
    },
  });
}

export function useUpdatePoLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ poId, lineId, payload }: { poId: string; lineId: string; payload: any }) => {
      const { data } = await rxsoftApi.put(`/purchases/${poId}/lines/${lineId}`, payload);
      return data as PurchaseOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries(poKeys.list());
    },
  });
}

export function useDeletePoLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ poId, lineId }: { poId: string; lineId: string }) => {
      const { data } = await rxsoftApi.delete(`/purchases/${poId}/lines/${lineId}`);
      return data as PurchaseOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries(poKeys.list());
    },
  });
}
