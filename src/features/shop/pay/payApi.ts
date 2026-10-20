import axios from 'axios';

// Same-origin by default so dev/prod both go through the same /api path
// (Vite proxy in dev, nginx in prod). An absolute localhost fallback here would
// break any tunnelled/remote page.
const baseURL = import.meta.env.VITE_RXSOFT_API_URL || '/api';

const http = axios.create({ baseURL, timeout: 20000 });

export type PayLinkView = {
  type: 'order_payment' | 'wallet_deposit' | 'receivable';
  token: string;
  organizationId: string;
  amount: number;
  currency: string;
  note?: string | null;
  userId?: string | null;
  providers: Array<{
    id: string;
    code: string;
    name: string;
    providerType: string;
    production: boolean;
  }>;
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    subtotalAmount: number;
    items: Array<{
      id: string;
      itemId: string | null;
      freetextName: string | null;
      quantity: number;
      unitPrice: number;
    }>;
  };
  receivable?: {
    id: string;
    receivableNumber: string;
    originalAmount: number;
    outstandingAmount: number;
    status: string;
    customerName: string | null;
  };
};

export type PayAttempt = {
  reference: string;
  providerType: string;
  status: string;
  amount: number;
  amountPaid: number;
  currency: string;
  createdAt: string;
  paidAt?: string | null;
};

export const payApi = {
  getLink: (token: string) =>
    http.get<PayLinkView>(`/payment-links/public/${token}`).then((r) => r.data),

  payments: (token: string) =>
    http.get<PayAttempt[]>(`/payment-links/public/${token}/payments`).then((r) => r.data),

  initialize: (
    token: string,
    body: {
      providerId?: string;
      paymentMethodId?: string;
      returnUrl?: string;
      callbackUrl?: string;
    }
  ) =>
    http
      .post<{
        reference: string;
        checkoutUrl: string | null;
        provider: { code: string; name: string };
        status: string;
      }>(`/payment-links/${token}/initialize`, body)
      .then((r) => r.data),

  status: (token: string) =>
    http
      .get<{
        link: { status: string };
        payment: {
          status: string;
          reference: string;
          providerType?: string;
          checkoutUrl?: string | null;
          amount?: number;
        } | null;
      }>(`/payment-links/${token}/status`)
      .then((r) => r.data),

  complete: (token: string) =>
    http
      .post<{ status: string; reference?: string; paid: boolean }>(
        `/payment-links/${token}/complete`
      )
      .then((r) => r.data),
};

export interface ProviderOption {
  id: string;
  code: string;
  name: string;
  providerType: string;
  production: boolean;
}

export interface PaySession {
  reference: string;
  status: string;
  provider: string;
  checkoutUrl: string | null;
}

const SESSION_KEY = (token: string) => `pay-session:${token}`;

export function savePaySession(token: string, session: PaySession) {
  sessionStorage.setItem(SESSION_KEY(token), JSON.stringify(session));
}

export function loadPaySession(token: string): PaySession | null {
  const raw = sessionStorage.getItem(SESSION_KEY(token));
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPaySession(token: string) {
  sessionStorage.removeItem(SESSION_KEY(token));
}
