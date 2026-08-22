import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';
import type { CreateSaleDto } from '../types';

export const salesKeys = {
  list: ['sales'] as any,
  detail: (id: string) => ['sales', id] as const,
};

export const customerKeys = {
  list: (search?: string) => ['customers', search] as any,
};

export const priceListKeys = {
  list: (search?: string) => ['price-lists', search] as any,
  items: (id?: string) => ['price-list-items', id] as any,
};

export const paymentMethodKeys = {
  list: ['payment-methods'] as any,
};

export const userPosConfigKeys = {
  me: ['user-pos-config', 'me'] as any,
};

export const whitelistedItemsKeys = {
  list: ['whitelisted-items'] as any,
};

export const itemUomsKeys = {
  list: (itemId?: string) => ['item-uoms', itemId] as any,
};

export async function createSale(payload: CreateSaleDto) {
  const { data } = await rxsoftApi.post('/sales', payload);
  return data;
}

export async function fetchSales() {
  const { data } = await rxsoftApi.get('/sales');
  return data;
}

export function useCreateSale(options?: { onSuccess?: (data: any) => void }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSaleDto) => createSale(payload),
    onSuccess: (data) => {
      qc.invalidateQueries(salesKeys.list);
      options?.onSuccess?.(data);
    },
  });
}

export function useSales() {
  return useQuery({
    queryKey: salesKeys.list,
    queryFn: fetchSales,
    staleTime: 1000 * 30,
  });
}

export function useSale(id?: string) {
  return useQuery({
    queryKey: id ? salesKeys.detail(id) : (['sales', 'undefined'] as const),
    queryFn: async () => {
      if (!id) {
        return null;
      }
      const { data } = await rxsoftApi.get(`/sales/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useSearchSales(search?: string) {
  const debounced = useDebouncedValue(search ?? '', 300);
  return useQuery({
    queryKey: ['sales', 'search', debounced] as const,
    queryFn: async () => {
      if (!debounced) {
        return [];
      }
      const { data } = await rxsoftApi.get('/sales', {
        params: { search: debounced, limit: 10 },
      });
      return data?.data ?? data ?? [];
    },
    enabled: !!debounced && debounced.length >= 2,
    staleTime: 30_000,
  });
}

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: customerKeys.list(search),
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/customers', {
        params: { search, limit: 20 },
      });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });
}

export function usePriceLists(search?: string) {
  return useQuery({
    queryKey: priceListKeys.list(search),
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/price-lists/search', {
        params: { search, limit: 20 },
      });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });
}

export function usePriceListItems(priceListId?: string) {
  return useQuery({
    queryKey: priceListKeys.items(priceListId),
    queryFn: async () => {
      if (!priceListId) {
        return [];
      }
      const { data } = await rxsoftApi.get(`/price-lists/${priceListId}/items`, {
        params: { limit: 100000 },
      });
      return data?.data ?? data ?? [];
    },
    enabled: !!priceListId,
    staleTime: 60_000,
  });
}

export function useWhitelistedItems() {
  return useQuery({
    queryKey: whitelistedItemsKeys.list,
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/items/me', { params: { limit: 100000 } });
      return Array.isArray(data) ? data : (data?.data ?? data ?? []);
    },
    staleTime: 30_000,
  });
}

export function useItemUoms(itemId?: string) {
  return useQuery({
    queryKey: itemUomsKeys.list(itemId),
    queryFn: async () => {
      if (!itemId) {
        return [];
      }
      const { data } = await rxsoftApi.get(`/items/${itemId}/uoms`);
      return (data?.data ?? data ?? []) as UomOption[];
    },
    enabled: !!itemId,
    staleTime: 300_000,
  });
}

export interface UomOption {
  id: string;
  name: string;
  code: string | null;
  factor: number;
  uomType: string;
  categoryId?: string | null;
  rounding?: number | null;
  isActive?: boolean;
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: paymentMethodKeys.list,
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/payment-methods', {
        params: { limit: 50 },
      });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; phone?: string }) => {
      const { data } = await rxsoftApi.post('/customers', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries(customerKeys.list());
    },
  });
}

export function useUserPosConfig() {
  return useQuery({
    queryKey: userPosConfigKeys.me,
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/user-pos-config/me');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useUpdateUserPosConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      stockLocationId?: string | null;
      storeId?: string | null;
      allowA4Print?: boolean;
      allowPos?: boolean;
      loginTimeoutMinutes?: number | null;
      defaultCustomerId?: string | null;
      defaultPriceListId?: string | null;
      autoSelectLocation?: boolean;
      autoSelectCustomer?: boolean;
      autoSelectPriceList?: boolean;
    }) => {
      const { data } = await rxsoftApi.patch('/user-pos-config/me', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries(userPosConfigKeys.me);
    },
    onError: (err: any) => {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.message ?? err?.message ?? 'Failed to update settings',
      });
    },
  });
}

export function useStockLocations() {
  return useQuery({
    queryKey: ['stock-locations', 'pos'] as const,
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/stock-locations', {
        params: { limit: 200 },
      });
      return (data?.data ?? data ?? []) as Array<{ id: string; name: string; code: string | null }>;
    },
    staleTime: 300_000,
  });
}

export function useOrganisationConfig() {
  return useQuery({
    queryKey: ['organisation-config'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/organisation-config');
      return data;
    },
    staleTime: 60_000,
  });
}
