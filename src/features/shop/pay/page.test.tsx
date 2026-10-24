import { fireEvent, render, screen, waitFor } from '@test-utils';
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

const mockState = vi.hoisted(() => ({ linkMissing: false }));

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
        : mockState.linkMissing
          ? { data: undefined, isLoading: false, isError: true }
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

function mockStatus(payment: unknown, link: Record<string, unknown> = { status: 'active' }) {
  (payApi.status as any).mockResolvedValue({ payment, link });
}

describe('PayPage — post-generation view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    mockState.linkMissing = false;
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

  it('auto-navigates to an existing provider checkout URL', async () => {
    (loadPaySession as any).mockReturnValue(null);
    mockStatus({
      status: 'initiated',
      reference: 'SRV-REF',
      providerType: 'monnify',
      checkoutUrl: 'https://checkout.monnify.com/pay/abc',
    });
    const navigate = vi.fn();

    render(<PayPage navigate={navigate} />);

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('https://checkout.monnify.com/pay/abc')
    );
    // The URL is remembered so a bounce-back from the provider does not loop.
    expect(window.sessionStorage.getItem('pay-autonav:tok')).toBe(
      'https://checkout.monnify.com/pay/abc'
    );
  });

  it('does not auto-navigate back to the same checkout URL after a bounce-back', async () => {
    (loadPaySession as any).mockReturnValue(null);
    mockStatus({
      status: 'initiated',
      reference: 'SRV-REF',
      providerType: 'monnify',
      checkoutUrl: 'https://checkout.monnify.com/pay/abc',
    });
    // Simulate the provider having just redirected the customer back here.
    window.sessionStorage.setItem('pay-autonav:tok', 'https://checkout.monnify.com/pay/abc');
    const navigate = vi.fn();

    render(<PayPage navigate={navigate} />);

    expect(await screen.findByText('Payment in progress')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not auto-navigate once the payment is confirmed', async () => {
    (loadPaySession as any).mockReturnValue(null);
    mockStatus({
      status: 'success',
      reference: 'SRV-REF',
      providerType: 'monnify',
      checkoutUrl: 'https://checkout.monnify.com/pay/abc',
    });
    const navigate = vi.fn();

    render(<PayPage navigate={navigate} />);

    expect(await screen.findByText('Payment successful')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the payment and a status link when the link is expired but a payment exists', async () => {
    mockState.linkMissing = true;
    (loadPaySession as any).mockReturnValue(null);
    mockStatus(
      { status: 'success', reference: 'PMT-EXPIRED-1', providerType: 'monnify', amount: 130 },
      { status: 'expired', type: 'order_payment', targetId: 'o1', amount: 130 }
    );

    render(<PayPage />);

    expect(await screen.findByTestId('pay-inactive-payment')).toBeInTheDocument();
    expect(screen.getByText('Payment successful')).toBeInTheDocument();
    expect(screen.getByText('PMT-EXPIRED-1')).toBeInTheDocument();
    expect(screen.getByTestId('pay-view-status')).toHaveAttribute('href', '/shop/orders/o1');
    expect(screen.queryByText('Payment link not found or expired')).not.toBeInTheDocument();
  });

  it('still shows the expired notice when no payment exists', async () => {
    mockState.linkMissing = true;
    (loadPaySession as any).mockReturnValue(null);
    mockStatus(null);

    render(<PayPage />);

    expect(await screen.findByText('Payment link not found or expired')).toBeInTheDocument();
    expect(screen.queryByTestId('pay-inactive-payment')).not.toBeInTheDocument();
  });
});
