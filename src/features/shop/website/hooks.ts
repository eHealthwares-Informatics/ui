import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect, useMemo } from 'react';
import { websiteApi } from './api';
import { resolveBranding, resolveContact } from './branding';
import { useCartStore } from './cart-store';

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

// ── Drug Classifications (4 labeled sources) ──────────────────────

export function useClassifications(type?: string) {
  return useQuery({
    queryKey: ['website', 'classifications', type ?? 'all'],
    queryFn: () => websiteApi.listClassifications(type),
    staleTime: 30 * 60 * 1000,
  });
}

export function useClassificationDetail(code: string) {
  return useQuery({
    queryKey: ['website', 'classifications', 'detail', code],
    queryFn: () => websiteApi.getClassificationDetail(code),
    enabled: !!code,
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

// ── Cart product hydration ───────────────────────────────────────

export function useCartProductIds(): string[] {
  // Select the stable items reference, then derive ids — a selector that
  // builds a new array per call re-renders on every store update.
  const items = useCartStore((s) => s.items);
  return useMemo(
    () =>
      items
        .map((i) => i.productId)
        .filter((id): id is string => !!id)
        .sort(),
    [items],
  );
}

// Resolves real product names/prices for cart lines by fetching
// /website/cart?ids= once per unique id-set, then writing name + unitPrice
// back onto the cart items. This both labels the checkout/cart pages and
// repairs legacy persisted carts that stored bare { productId, quantity }.
export function useCartProductHydration() {
  const ids = useCartProductIds();
  const key = ids.join(',');

  // Write-through: patch name/unitPrice (and the embedded product snapshot)
  // onto each cart item. needsPatch guards against re-render loops.
  useEffect(() => {
    if (ids.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const products = await websiteApi.getCartProducts(ids);
        if (cancelled) return;
        const byId = new Map(products.map((p) => [p.id, p]));
        const store = useCartStore.getState();
        for (const item of store.items) {
          if (!item.productId) continue;
          const p = byId.get(item.productId);
          if (!p) continue;
          const price = p.unitPrice != null ? Number(p.unitPrice) : undefined;
          const needsPatch =
            item.name !== p.name ||
            item.unitPrice !== price ||
            (item.product as any)?.unitPrice !== price ||
            item.product?.isPrescriptionRequired !== p.isPrescriptionRequired;
          if (needsPatch) {
            store.updateItemDetails(item.productId, {
              name: p.name,
              unitPrice: price,
              product: p,
            });
          }
        }
      } catch {
        // Public endpoint failing (offline, network) leaves mock fallbacks in
        // place; the UI still renders.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);
}

// ── Storefront branding (website name + logo) ────────────────────

export function useWebsiteSettings() {
  return useQuery({
    queryKey: ['website', 'settings'],
    queryFn: websiteApi.getSettings,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Resolves the storefront name/logo (with defaults) and applies them to the
 * document: the website name becomes the tab title and the logo becomes the
 * favicon. Shared by the website layout, header and footer.
 */
export function useWebsiteBranding() {
  const { data } = useWebsiteSettings();
  const { websiteName, logoUrl } = resolveBranding(data);

  useEffect(() => {
    document.title = websiteName;
  }, [websiteName]);

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link && logoUrl) {
      link.href = logoUrl;
    }
  }, [logoUrl]);

  return { websiteName, logoUrl };
}

/** Resolved storefront contact details (with defaults) for the website pages. */
export function useWebsiteContact() {
  const { data } = useWebsiteSettings();
  return resolveContact(data);
}
