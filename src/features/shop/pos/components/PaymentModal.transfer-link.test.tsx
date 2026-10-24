import { fireEvent, render, screen, userEvent, waitFor } from '@test-utils';
import { vi } from 'vitest';
import { PaymentModal } from './PaymentModal';

const rxGet = vi.fn();
const rxPost = vi.fn();
const mutateMock = vi.fn();

vi.mock('../../api/posApi', () => ({
  usePaymentMethods: () => ({
    data: [
      { id: 'pm-cash', name: 'Cash', code: 'CASH', methodType: 'cash' },
      { id: 'pm-transfer', name: 'Bank Transfer', code: 'TRANSFER', methodType: 'transfer' },
      // Seed method (payment_methods.json): code WEB but method_type transfer —
      // the real "Web Payment" option a cashier picks for Monnify links.
      { id: 'pm-web', name: 'Web Payment', code: 'WEB', methodType: 'transfer' },
    ],
  }),
  usePosTerminals: () => ({ data: [] }),
  useCreateCustomer: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCustomers: () => ({ data: [] }),
  useCreateSale: () => ({ mutate: mutateMock, isPending: false }),
  useInitiatePosPayment: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryPosPayment: () => ({ mutate: vi.fn(), isPending: false }),
  useDebitWallet: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../store/usePosStore', () => ({
  usePosStore: (selector?: (state: any) => any) => {
    const state = { enqueueOfflineSale: vi.fn() };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/lib/rxsoft-api', () => ({
  rxsoftApi: {
    get: (...args: any[]) => rxGet(...args),
    post: (...args: any[]) => rxPost(...args),
    patch: vi.fn(async () => ({ data: {} })),
  },
}));

vi.mock('@mantine/notifications', () => ({ notifications: { show: vi.fn() } }));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQuery: () => ({ data: undefined }) };
});

function session() {
  return {
    id: 'sess-1',
    saleCode: 'SALE-QA-TRANSFER',
    pricingMode: 'retail',
    customerId: null,
    cart: [
      {
        id: 'it-1',
        orderItemId: 'oi-1',
        uomId: 'u1',
        quantity: 1,
        retailPrice: 100,
        wholesalePrice: 90,
      },
    ],
  };
}

async function pickMethod(label: string) {
  const user = userEvent.setup();
  await user.click(screen.getByTestId('pos-payment-method'));
  await user.click(await screen.findByRole('option', { name: label }));
  return user;
}

async function openTransferFlow() {
  const user = userEvent.setup();
  render(
    <PaymentModal
      opened
      onClose={vi.fn()}
      onComplete={vi.fn()}
      totals={{ total: 100 }}
      session={session()}
    />
  );

  const methodInput = screen.getByTestId('pos-payment-method') as HTMLInputElement;
  await waitFor(() => expect(methodInput.value).toBe('Cash'));

  await user.click(screen.getByTestId('pos-payment-method'));
  await user.click(await screen.findByRole('option', { name: 'Bank Transfer' }));

  const generateBtn = screen.getByRole('button', { name: 'Generate Payment Link' });
  fireEvent.click(generateBtn);
  await waitFor(() => expect(rxPost).toHaveBeenCalled());
  return { user };
}

describe('PaymentModal — transfer link completion', () => {
  beforeEach(() => {
    mutateMock.mockReset();
    rxGet.mockReset();
    rxPost.mockReset();
    rxPost.mockResolvedValue({ data: { token: 'tok-1', url: 'https://pay.example/tok-1' } });
  });

  it('enables Complete Sale after a manual status check reports success', async () => {
    rxGet.mockResolvedValue({ data: { payment: { status: 'success' }, link: { status: 'used' } } });

    await openTransferFlow();

    fireEvent.click(screen.getByTestId('pos-check-link-status'));
    await waitFor(() => expect(screen.getByTestId('pos-complete-sale-btn')).not.toBeDisabled());
  });

  it('auto-enables Complete Sale once the link payment reports success (no manual check)', async () => {
    rxGet.mockResolvedValue({ data: { payment: { status: 'success' }, link: { status: 'used' } } });

    await openTransferFlow();

    await waitFor(() => expect(screen.getByTestId('pos-complete-sale-btn')).not.toBeDisabled());
  });

  it('treats a link marked used as paid (payment row missing)', async () => {
    rxGet.mockResolvedValue({ data: { payment: null, link: { status: 'used' } } });

    await openTransferFlow();

    await waitFor(() => expect(screen.getByTestId('pos-complete-sale-btn')).not.toBeDisabled());
  });

  it("treats the seeded 'Web Payment' method (code WEB, type transfer) as a link flow", async () => {
    rxGet.mockResolvedValue({ data: { payment: { status: 'success' }, link: { status: 'used' } } });

    const user = userEvent.setup();
    render(
      <PaymentModal
        opened
        onClose={vi.fn()}
        onComplete={vi.fn()}
        totals={{ total: 100 }}
        session={session()}
      />
    );
    await waitFor(() =>
      expect((screen.getByTestId('pos-payment-method') as HTMLInputElement).value).toBe('Cash')
    );
    await pickMethod('Web Payment');

    // Not a physical terminal — the terminal section must not render.
    expect(screen.queryByRole('button', { name: 'Charge Card on Terminal' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Generate Payment Link' }));
    await waitFor(() => expect(rxPost).toHaveBeenCalled());
    fireEvent.click(screen.getByTestId('pos-check-link-status'));

    await waitFor(() => expect(screen.getByTestId('pos-complete-sale-btn')).not.toBeDisabled());

    // Submitting must not be blocked by the terminal guard either: the payload
    // carries the link token as the payment reference.
    fireEvent.click(screen.getByTestId('pos-complete-sale-btn'));
    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1));
    expect(mutateMock.mock.calls[0][0].payments[0].paymentReference).toBe('tok-1');
    expect(mutateMock.mock.calls[0][0].payments[0].paymentMethodId).toBe('pm-web');
  });
});
