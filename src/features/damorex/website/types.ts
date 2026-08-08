export interface WebsiteProduct {
  id: string;
  name: string;
  code: string;
  barcode: string | null;
  category: { id: string; name: string; code: string } | null;
  genericProduct: {
    id: string;
    name: string;
    dosageForm: string | null;
    strength: string | null;
    isPrescriptionRequired: boolean;
    generalUse: string;
    pharmaceutics: {
      commonBrandName: string | null;
      commonGenericName: string | null;
      dosage: string | null;
      indications: string | null;
      contraindications: string | null;
    } | null;
  } | null;
  baseUomId: string;
  isActive: boolean;
  createdAt: string;
  imageUrl?: string;
  smallImageUrl?: string;
  mediumImageUrl?: string;
  largeImageUrl?: string;
  unitPrice?: number | null;
}

export interface CategoryView {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  parent: { id: string; name: string; code: string } | null;
}

export interface HealthConcernView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

export interface PrescriptionView {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Fulfilled';
  pharmacistNotes: string | null;
  files: PrescriptionFileView[];
  createdAt: string;
}

export interface PrescriptionFileView {
  id: string;
  fileUrl: string;
  mime: string;
  originalName: string;
  size: number | null;
}

export interface ConsultationView {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  symptoms: string | null;
  questions: string | null;
  channel: 'WhatsApp' | 'Phone' | 'Video Call';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface TestimonialView {
  id: string;
  name: string;
  text: string;
  focus: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface BlogArticleView {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  authorName: string | null;
  imageUrl: string | null;
  readingTime: number | null;
  isPublished: boolean;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
}

export interface DeliveryAreaView {
  id: string;
  state: string;
  city: string;
  deliveryFee: number;
  minOrderAmount: number;
  freeDeliveryAbove: number | null;
  estimatedDeliveryHours: number | null;
}

export interface BranchView {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  openingHours: string | null;
  imageUrl: string | null;
}

export interface ProductReviewView {
  id: string;
  productId: string;
  name: string | null;
  rating: number;
  comment: string | null;
  imageUrls: string[] | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface RewardView {
  totalPoints: number;
  transactions: RewardTransactionView[];
}

export interface RewardTransactionView {
  id: string;
  points: number;
  type: 'earned' | 'redeemed' | 'expired' | 'referral_bonus';
  description: string | null;
  createdAt: string;
}

export interface HomepageData {
  featuredProducts: WebsiteProduct[];
  categories: CategoryView[];
  healthConcerns: HealthConcernView[];
  testimonials: TestimonialView[];
  articles: BlogArticleView[];
}

export interface SearchResults {
  medicines?: WebsiteProduct[];
  categories?: CategoryView[];
  articles?: BlogArticleView[];
  healthConcerns?: HealthConcernView[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderView {
  id: string;
  orderNumber: string;
  customerId: string | null;
  paymentMethod: string;
  notes: string | null;
  orderStatus: string;
  saleId: string | null;
  createdBy: string | null;
  subtotalAmount: number;
  totalAmount: number;
  createdAt: string;
  items: OrderItemView[];
  delivery: DeliveryView | null;
}

export interface OrderItemView {
  id: string;
  itemId?: string;
  freetextName?: string;
  quantity: number;
  unitPrice: number;
}

export interface DeliveryView {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  status: string;
  notes: string | null;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product?: WebsiteProduct;
}
