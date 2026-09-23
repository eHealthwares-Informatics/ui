import type {
  HomepageData,
  WebsiteProduct,
  CategoryView,
  ShopClassificationView,
  ShopProductDetailResponse,
  HealthConcernView,
  PrescriptionView,
  ConsultationView,
  OrderView,
  BlogArticleView,
  DeliveryAreaView,
  BranchView,
  ProductReviewView,
  RewardView,
  SearchResults,
  PaginatedResponse,
  GenericMedicineView,
  GenericMedicineVariant,
  GenericDrugView,
  GenericDrugDetail,
  GenericProductSearchResult,
  WebsiteSettings,
} from './types';
import { createAuthApiClient } from '@/lib/create-api-client';

export interface WebPaymentProvider {
  id: string;
  code: string;
  name: string;
  providerType: string;
  production: boolean;
}

const api = createAuthApiClient({
  baseURL: import.meta.env.VITE_RXSOFT_API_URL || 'https://rxsoft-backend.onrender.com/api',
  onSessionExpired: 'ignore',
  onForbidden: 'ignore',
});

// /generic-drugs returns { data, meta: { page, limit, total } } while the shop
// pages read a flat PaginatedResponse — normalize so both ListPagination
// blocks on /shop/medicines see total/limit/page.
function toPaginated<T>(payload: {
  data?: T[];
  page?: number;
  limit?: number;
  total?: number;
  meta?: { page?: number; limit?: number; total?: number };
}): PaginatedResponse<T> {
  return {
    data: payload.data ?? [],
    page: payload.page ?? payload.meta?.page ?? 1,
    limit: payload.limit ?? payload.meta?.limit ?? 0,
    total: payload.total ?? payload.meta?.total ?? 0,
  };
}

export const websiteApi = {
  // Public storefront branding (website name + logo image)
  getSettings: () => api.get<WebsiteSettings>('/website/settings').then((r) => r.data),

  // Homepage
  getHomepage: () => api.get<HomepageData>('/website/homepage').then((r) => r.data),

  // Cart product details for a batch of item ids (public endpoint).
  getCartProducts: (ids: string[]) =>
    api
      .get<WebsiteProduct[]>('/website/cart', { params: { ids: ids.join(',') } })
      .then((r) => r.data),

  // Products
  listProducts: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<WebsiteProduct>>('/website/products', { params }).then((r) => r.data),

  getProduct: (id: string) =>
    api.get<ShopProductDetailResponse>(`/website/products/${id}`).then((r) => r.data),

  listClassifications: (type?: string) =>
    api
      .get<{ data: ShopClassificationView[]; source?: string }>('/website/classifications', {
        params: type ? { type } : undefined,
      })
      .then((r) => r.data),

  getClassificationDetail: (
    code: string,
    params?: Record<string, string | number>
  ) =>
    api
      .get<{
        classification: ShopClassificationView & { drugCount: number; productCount: number };
        products: WebsiteProduct[];
      }>(`/website/classifications/${code}`, { params })
      .then((r) => r.data),

  // Generic Medicines
  listGenericProducts: (params?: Record<string, string | number>) =>
    api
      .get<PaginatedResponse<GenericMedicineView>>('/generic-products', { params })
      .then((r) => r.data),

  getGenericProductItems: (id: string) =>
    api.get<GenericMedicineVariant[]>(`/generic-products/${id}/items`).then((r) => r.data),

  // Generic Drugs (NDF/crosswalk)
  listGenericDrugs: (params?: Record<string, string | number>) =>
    api
      .get<{
        data?: GenericDrugView[];
        meta?: { page?: number; limit?: number; total?: number };
      }>('/generic-drugs', { params })
      .then((r) => toPaginated<GenericDrugView>(r.data)),

  getGenericDrug: (code: string) =>
    api.get<GenericDrugDetail>(`/generic-drugs/${encodeURIComponent(code)}`).then((r) => r.data),

  listGenericDrugClasses: () =>
    api
      .get<{ data: Array<{ genericClass: string; pharmaceuticalClass: string }> }>(
        '/generic-drugs/classes',
      )
      .then((r) => r.data),

  searchGenericProducts: (q: string) =>
    api
      .get<PaginatedResponse<GenericProductSearchResult>>('/generic-products/search', {
        params: { search: q, page: 1, limit: 10 },
      })
      .then((r) => r.data),

  // Categories
  listCategories: () => api.get<CategoryView[]>('/website/categories').then((r) => r.data),

  listTherapeuticCategories: () =>
    api
      .get<{ data: Array<{ code: string; name: string }> }>('/website/therapeutic-categories')
      .then((r) => r.data),

  getCategoryBySlug: (slug: string) =>
    api
      .get<{ category: CategoryView; products: WebsiteProduct[] }>(`/website/categories/${slug}`)
      .then((r) => r.data),

  // Health Concerns
  listHealthConcerns: () =>
    api.get<HealthConcernView[]>('/website/health-concerns').then((r) => r.data),

  getHealthConcernBySlug: (slug: string) =>
    api
      .get<{ concern: HealthConcernView; products: WebsiteProduct[]; articles: BlogArticleView[] }>(
        `/website/health-concerns/${slug}`
      )
      .then((r) => r.data),

  // Prescriptions
  createPrescription: (formData: FormData) =>
    api.post<PrescriptionView>('/website/prescriptions', formData).then((r) => r.data),

  listPrescriptions: () =>
    api.get<PrescriptionView[]>('/website/prescriptions').then((r) => r.data),

  // Consultations
  createConsultation: (data: {
    name: string;
    phone: string;
    email?: string;
    symptoms?: string;
    questions?: string;
    channel?: string;
  }) => api.post<ConsultationView>('/website/consultations', data).then((r) => r.data),

  listConsultations: () =>
    api.get<ConsultationView[]>('/website/consultations').then((r) => r.data),

  // Cart
  getCart: (ids: string[]) =>
    api
      .get<WebsiteProduct[]>('/website/cart', { params: { ids: ids.join(',') } })
      .then((r) => r.data),

  // Coupons
  validateCoupon: (code: string, subtotal: number) =>
    api
      .post<{
        valid: boolean;
        reason?: string;
        code: string;
        type?: 'percent' | 'fixed';
        discountAmount: number;
        subtotal: number;
      }>('/coupons/validate', { code, subtotal })
      .then((r) => r.data),

  // Orders
  createOrder: (data: {
    paymentMethod: string;
    prescriptionIds?: string[];
    notes?: string;
    couponCode?: string;
    items: Array<{
      itemId?: string;
      freetextName?: string;
      genericItemCode?: string;
      genericDrugCode?: string;
      quantity: number;
      unitPrice?: number;
    }>;
    delivery?: {
      address: string;
      city?: string;
      state?: string;
      phone?: string;
      shippingMethod?: string;
    };
  }) => api.post<OrderView>('/website/orders', data).then((r) => r.data),

  listOrders: () => api.get<OrderView[]>('/website/orders').then((r) => r.data),

  getOrder: (id: string) => api.get<OrderView>(`/website/orders/${id}`).then((r) => r.data),

  trackOrder: (code: string) =>
    api.get<OrderView>(`/website/orders/track/${code}`).then((r) => r.data),

  // Blog
  listArticles: (params?: Record<string, string | number>) =>
    api
      .get<PaginatedResponse<BlogArticleView>>('/website/articles', { params })
      .then((r) => r.data),

  getArticleBySlug: (slug: string) =>
    api
      .get<{ article: BlogArticleView; related: BlogArticleView[] }>(`/website/articles/${slug}`)
      .then((r) => r.data),

  // Delivery Areas
  listPaymentProviders: () =>
    api
      .get<WebPaymentProvider[]>('/website/payment-providers')
      .then((r) => (Array.isArray(r.data) ? r.data : [])),

  requestOtp: (data: { phone: string; channel?: 'sms' | 'whatsapp' }) =>
    api
      .post<{ sent: boolean; channel: string; code?: string }>('/website/auth/otp/request', data)
      .then((r) => r.data),

  verifyOtp: (data: { phone: string; code: string }) =>
    api
      .post<{ accessToken: string; refreshToken: string }>('/website/auth/otp/verify', data)
      .then((r) => r.data),

  googleSignIn: (accessToken: string) =>
    api
      .post<{ accessToken: string; refreshToken: string }>('/website/auth/oauth/google', { accessToken })
      .then((r) => r.data),

  facebookSignIn: (accessToken: string) =>
    api
      .post<{ accessToken: string; refreshToken: string }>('/website/auth/oauth/facebook', { accessToken })
      .then((r) => r.data),

  listDeliveryAreas: () =>
    api.get<DeliveryAreaView[]>('/website/delivery-areas').then((r) => r.data),

  // Branches
  listBranches: () => api.get<BranchView[]>('/website/branches').then((r) => r.data),

  getBranch: (id: string) => api.get<BranchView>(`/website/branches/${id}`).then((r) => r.data),

  // Contact
  submitContact: (data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => api.post('/website/contact', data).then((r) => r.data),

  // Newsletter
  subscribe: (data: { email: string; phone?: string }) =>
    api.post('/website/newsletter/subscribe', data).then((r) => r.data),

  // Reviews
  createReview: (data: {
    productId: string;
    rating: number;
    comment?: string;
    imageUrls?: string[];
  }) => api.post<ProductReviewView>('/website/reviews', data).then((r) => r.data),

  getProductReviews: (productId: string) =>
    api.get<ProductReviewView[]>(`/website/reviews/${productId}`).then((r) => r.data),

  // Rewards
  getRewards: () => api.get<RewardView>('/website/rewards').then((r) => r.data),

  // Auth
  register: (data: { username: string; email?: string; phone?: string; password: string }) =>
    api.post<{ accessToken: string; refreshToken: string }>('/website/auth/register', data).then((r) => r.data),

  login: (data: { username: string; password: string }) =>
    api.post<{ accessToken: string; refreshToken: string }>('/website/auth/login', data).then((r) => r.data),

  // Search
  search: (q: string, type?: string) =>
    api.get<SearchResults>('/website/search', { params: { q, type } }).then((r) => r.data),
};
