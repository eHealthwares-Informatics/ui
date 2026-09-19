import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';
import { websiteApi } from './api';

// ── Homepage ─────────────────────────────────────────────────────

export function useHomepage() {
  return useQuery({
    queryKey: ['website', 'homepage'],
    queryFn: websiteApi.getHomepage,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Products ─────────────────────────────────────────────────────

export function useProducts(params?: Record<string, string | number>) {
  const search = typeof params?.search === 'string' ? params.search : '';
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const effective = params ? { ...params, search: debouncedSearch } : undefined;
  return useQuery({
    queryKey: ['website', 'products', effective],
    queryFn: () => websiteApi.listProducts(effective),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['website', 'product', id],
    queryFn: () => websiteApi.getProduct(id),
    enabled: !!id,
  });
}

// ── Generic Medicines ─────────────────────────────────────────────

export function useGenericProducts(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['website', 'generic-products', params],
    queryFn: () => websiteApi.listGenericProducts(params),
  });
}

export function useGenericProductItems(id: string) {
  return useQuery({
    queryKey: ['website', 'generic-products', id, 'items'],
    queryFn: () => websiteApi.getGenericProductItems(id),
    enabled: !!id,
  });
}

// ── Generic Drugs (NDF/crosswalk) ────────────────────────────────

export function useGenericDrugs(params?: Record<string, string | number>) {
  const search = typeof params?.search === 'string' ? params.search : '';
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const effective = params ? { ...params, search: debouncedSearch } : undefined;
  return useQuery({
    queryKey: ['website', 'generic-drugs', effective],
    queryFn: () => websiteApi.listGenericDrugs(effective),
  });
}

export function useGenericDrug(code: string) {
  return useQuery({
    queryKey: ['website', 'generic-drugs', code],
    queryFn: () => websiteApi.getGenericDrug(code),
    enabled: !!code,
  });
}

export function useTherapeuticClasses() {
  return useQuery({
    queryKey: ['website', 'generic-drugs', 'classes'],
    queryFn: () => websiteApi.listGenericDrugClasses(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useTherapeuticCategories() {
  return useQuery({
    queryKey: ['website', 'therapeutic-categories'],
    queryFn: () => websiteApi.listTherapeuticCategories(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useGenericProductSearch(q: string) {
  const [debounced] = useDebouncedValue(q, 250);
  return useQuery({
    queryKey: ['website', 'generic-products', 'search', debounced],
    queryFn: () => websiteApi.searchGenericProducts(debounced),
    enabled: debounced.length >= 2,
  });
}

// ── Categories ───────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ['website', 'categories'],
    queryFn: websiteApi.listCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ['website', 'categories', slug],
    queryFn: () => websiteApi.getCategoryBySlug(slug),
    enabled: !!slug,
  });
}

// ── Health Concerns ──────────────────────────────────────────────

export function useHealthConcerns() {
  return useQuery({
    queryKey: ['website', 'health-concerns'],
    queryFn: websiteApi.listHealthConcerns,
    staleTime: 10 * 60 * 1000,
  });
}

export function useHealthConcernBySlug(slug: string) {
  return useQuery({
    queryKey: ['website', 'health-concerns', slug],
    queryFn: () => websiteApi.getHealthConcernBySlug(slug),
    enabled: !!slug,
  });
}

// ── Prescriptions ────────────────────────────────────────────────

export function useCreatePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => websiteApi.createPrescription(formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website', 'prescriptions'] }),
  });
}

export function usePrescriptions() {
  return useQuery({
    queryKey: ['website', 'prescriptions'],
    queryFn: websiteApi.listPrescriptions,
  });
}

// ── Consultations ────────────────────────────────────────────────

export function useCreateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof websiteApi.createConsultation>[0]) =>
      websiteApi.createConsultation(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website', 'consultations'] }),
  });
}

export function useConsultations() {
  return useQuery({
    queryKey: ['website', 'consultations'],
    queryFn: websiteApi.listConsultations,
  });
}

// ── Orders ───────────────────────────────────────────────────────

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof websiteApi.createOrder>[0]) =>
      websiteApi.createOrder(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website', 'orders'] }),
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ['website', 'orders'],
    queryFn: websiteApi.listOrders,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['website', 'order', id],
    queryFn: () => websiteApi.getOrder(id),
    enabled: !!id,
  });
}

export function useTrackOrder(code: string) {
  return useQuery({
    queryKey: ['website', 'track', code],
    queryFn: () => websiteApi.trackOrder(code),
    enabled: !!code,
  });
}

// ── Blog ─────────────────────────────────────────────────────────

export function useArticles(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['website', 'articles', params],
    queryFn: () => websiteApi.listArticles(params),
  });
}

export function useArticleBySlug(slug: string) {
  return useQuery({
    queryKey: ['website', 'articles', slug],
    queryFn: () => websiteApi.getArticleBySlug(slug),
    enabled: !!slug,
  });
}

// ── Delivery Areas ───────────────────────────────────────────────

export function useDeliveryAreas() {
  return useQuery({
    queryKey: ['website', 'delivery-areas'],
    queryFn: websiteApi.listDeliveryAreas,
    staleTime: 30 * 60 * 1000,
  });
}

// ── Branches ─────────────────────────────────────────────────────

export function useBranches() {
  return useQuery({
    queryKey: ['website', 'branches'],
    queryFn: websiteApi.listBranches,
    staleTime: 10 * 60 * 1000,
  });
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: ['website', 'branches', id],
    queryFn: () => websiteApi.getBranch(id),
    enabled: !!id,
  });
}

// ── Contact ──────────────────────────────────────────────────────

export function useSubmitContact() {
  return useMutation({
    mutationFn: (data: Parameters<typeof websiteApi.submitContact>[0]) =>
      websiteApi.submitContact(data),
  });
}

// ── Newsletter ───────────────────────────────────────────────────

export function useSubscribe() {
  return useMutation({
    mutationFn: (data: Parameters<typeof websiteApi.subscribe>[0]) => websiteApi.subscribe(data),
  });
}

// ── Reviews ──────────────────────────────────────────────────────

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof websiteApi.createReview>[0]) =>
      websiteApi.createReview(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website', 'reviews'] }),
  });
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['website', 'reviews', productId],
    queryFn: () => websiteApi.getProductReviews(productId),
    enabled: !!productId,
  });
}

// ── Rewards ──────────────────────────────────────────────────────

export function useRewards() {
  return useQuery({
    queryKey: ['website', 'rewards'],
    queryFn: websiteApi.getRewards,
  });
}

// ── Search ───────────────────────────────────────────────────────

export function useSearch(q: string, type?: string) {
  const [debounced] = useDebouncedValue(q, 300);
  return useQuery({
    queryKey: ['website', 'search', debounced, type],
    queryFn: () => websiteApi.search(debounced, type),
    enabled: debounced.length >= 2,
  });
}
