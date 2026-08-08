import axios, { type InternalAxiosRequestConfig } from 'axios';
import type {
  HomepageData,
  WebsiteProduct,
  CategoryView,
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
} from './types';
import { getAccessToken, getRefreshToken, persistTokens, clearTokens } from '@/lib/auth-tokens';
import { IDENTITY_API_BASE_URL } from '@/lib/identity-api';

const api = axios.create({
  baseURL: import.meta.env.VITE_RXSOFT_API_URL || 'https://rxsoft-backend.onrender.com/api',
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queued: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (
      status === 401 &&
      !originalRequest._retry &&
      !String(originalRequest.url).includes('/auth/')
    ) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queued.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post<{
          accessToken: string;
          refreshToken: string;
        }>(`${IDENTITY_API_BASE_URL}/auth/refresh-token`, { refreshToken });

        persistTokens(refreshResponse.data.accessToken, refreshResponse.data.refreshToken);
        queued.forEach((entry) => entry.resolve(refreshResponse.data.accessToken));
        queued = [];

        originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        queued.forEach((entry) => entry.reject(refreshError));
        queued = [];
        clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const websiteApi = {
  // Homepage
  getHomepage: () => api.get<HomepageData>('/website/homepage').then((r) => r.data),

  // Products
  listProducts: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<WebsiteProduct>>('/website/products', { params }).then((r) => r.data),

  getProduct: (id: string) =>
    api
      .get<{ product: WebsiteProduct; reviews: ProductReviewView[]; related: WebsiteProduct[] }>(
        `/website/products/${id}`
      )
      .then((r) => r.data),

  // Categories
  listCategories: () => api.get<CategoryView[]>('/website/categories').then((r) => r.data),

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

  // Orders
  createOrder: (data: {
    paymentMethod: string;
    prescriptionIds?: string[];
    notes?: string;
    items: Array<{ itemId?: string; freetextName?: string; quantity: number; unitPrice?: number }>;
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
