import { fireEvent, render, screen } from '@test-utils';
import { vi } from 'vitest';
import PayPage from './page';

/**
 * The provider list must not reappear once a provider payment has been
 * generated — keyed on the SERVER payment (status response), not the local
 * session (which is device/browser scoped).
 */

const LINK = {
  type: 'order_payment' as const,
  token: 'tok',
  organizationId: 'org',
  amount: 5000,
  currency: 'NGN',
  providers: [
    {
      id: 'paystack',
      code: 'PAYSTACK',
      name: 'Paystack',
      providerType: 'gateway',
      production: false,
    },
    {
      id: 'flutterwave',
      code: 'FLW',
      name: 'Flutterwave',
      providerType: 'gateway',
      production: false,
    },
  ],
  order: { id: 'o1', orderNumber: 'ORD-1', totalAmount: 5000, subtotalAmount: 5000, items: [] },
};

vi.mock('@tanstack/react-router', () => ({ useParams: () => ({ token: 'tok' }) }));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useQuery: (opts: any) =>
      opts?.queryKey?.[0] === 'pay-attempts'
        ? {
            data: [
              {
                reference: 'PMT-ABC',
                providerType: 'monnify',
                status: 'initiated',
                amount: 5000,
                amountPaid: 0,
                currency: 'NGN',
                createdAt: '2026-10-18T14:31:03.079Z',
                paidAt: null,
              },
            ],
            isLoading: false,
          }
        : { data: LINK, isLoading: false },
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

vi.mock('../website/layout', () => ({
  WebsiteLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  green: '#0a0',
  ink: '#111',
  darkGreen: '#060',
  muted: '#666',
  line: '#eee',
  soft: '#f6f6f6',
}));

const SESSION = {
  reference: 'LOCAL-REF',
  status: 'pending',
  provider: 'PAYSTACK',
  checkoutUrl: null,
};

vi.mock('./payApi', () => ({
  loadPaySession: vi.fn(),
  savePaySession: vi.fn(),
  clearPaySession: vi.fn(),
  payApi: {
    getLink: vi.fn(async () => LINK),
    payments: vi.fn(async () => []),
    status: vi.fn(),
    initialize: vi.fn(),
  },
}));

import { loadPaySession, payApi } from './payApi';

function mockStatus(payment: unknown) {
  (payApi.status as any).mockResolvedValue({ payment, link: { status: 'active' } });
}

describe('PayPage — post-generation view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the provider list when NO payment has been generated', async () => {
    (loadPaySession as any).mockReturnValue(null);
    mockStatus(null);

    render(<PayPage />);

    expect(await screen.findByText('Choose payment method')).toBeInTheDocument();
    expect(screen.getByText(/Paystack/)).toBeInTheDocument();
  });

  it('lists existing provider payments and their status before another is generated', async () => {
    (loadPaySession as any).mockReturnValue(null);
    mockStatus(null);

    render(<PayPage />);

    expect(await screen.findByTestId('pay-attempts')).toBeInTheDocument();
    expect(screen.getByText('PMT-ABC')).toBeInTheDocument();
    expect(screen.getByText('initiated')).toBeInTheDocument();
    expect(screen.getByText(/Provider payments already generated/i)).toBeInTheDocument();
  });

  it('hides the provider list when a server payment exists, even with no local session', async () => {
    (loadPaySession as any).mockReturnValue(null);
    mockStatus({ status: 'pending', reference: 'SRV-REF', providerType: 'paystack' });

    render(<PayPage />);

    expect(await screen.findByText('Payment in progress')).toBeInTheDocument();
    expect(screen.queryByText('Choose payment method')).not.toBeInTheDocument();
    expect(screen.queryByText(/Flutterwave/)).not.toBeInTheDocument();
    // Falls back to the SERVER payment when there is no local session.
    expect(screen.getByText('SRV-REF')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check payment status/i })).toBeInTheDocument();
  });

  it('hides the provider list when only a local session exists', async () => {
    (loadPaySession as any).mockReturnValue(SESSION);
    mockStatus(null);

    render(<PayPage />);

    expect(await screen.findByText('Payment in progress')).toBeInTheDocument();
    expect(screen.queryByText('Choose payment method')).not.toBeInTheDocument();
    expect(screen.getByText('LOCAL-REF')).toBeInTheDocument();
  });

  it('asks for confirmation, then shows the provider list again on retry', async () => {
    (loadPaySession as any).mockReturnValue(null);
    mockStatus({ status: 'pending', reference: 'SRV-REF', providerType: 'paystack' });

    render(<PayPage />);
    await screen.findByText('Payment in progress');

    fireEvent.click(screen.getByTestId('pay-retry'));

    // Confirmation prompt before re-choosing a provider.
    expect(
      await screen.findByText(/Are you sure you want to retry your payment/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('Choose payment method')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pay-retry-confirm'));

    expect(await screen.findByText('Choose payment method')).toBeInTheDocument();
    expect(screen.getByText(/Paystack/)).toBeInTheDocument();
  });
});
