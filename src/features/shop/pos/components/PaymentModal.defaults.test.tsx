import { fireEvent, render, screen, waitFor } from '@test-utils';
import { vi } from 'vitest';
import { PaymentModal } from './PaymentModal';

/**
 * POS payment defaults:
 *  - Cash is selected by default.
 *  - The customer + phone are prefilled from the toolbar selection.
 *  - With no toolbar selection the sale defaults to Walk-In and an empty phone.
 */
const createCustomerMock = vi.fn();
const mutateMock = vi.fn();

vi.mock('../../api/posApi', () => ({
  usePaymentMethods: () => ({
    data: [
      { id: 'pm-cash', name: 'Cash', code: 'CASH', methodType: 'cash' },
      { id: 'pm-card', name: 'Card', code: 'POS', methodType: 'terminal' },
    ],
  }),
  usePosTerminals: () => ({ data: [] }),
  useCustomers: () => ({ data: [] }),
  useCreateCustomer: () => ({ mutateAsync: createCustomerMock, isPending: false }),
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
    get: vi.fn(async () => ({ data: {} })),
    post: vi.fn(async () => ({ data: {} })),
    patch: vi.fn(async () => ({ data: {} })),
  },
}));

vi.mock('@mantine/notifications', () => ({ notifications: { show: vi.fn() } }));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQuery: () => ({ data: undefined }) };
});

const JANE = { id: 'c1', name: 'Jane Doe', phone: '08031234567' };

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sess-1',
    saleCode: 'SALE-QA-DEFAULTS',
    pricingMode: 'retail',
    customerId: null,
    customerName: null,
    customer: null,
    cart: [{ id: 'it-1', uomId: 'u1', quantity: 1, retailPrice: 50, wholesalePrice: 40 }],
    ...overrides,
  };
}

async function renderModal(overrides: Record<string, unknown> = {}) {
  render(
    <PaymentModal
      opened
      onClose={vi.fn()}
      onComplete={vi.fn()}
      totals={{ total: 50 }}
      session={session(overrides) as never}
    />
  );
  const methodInput = screen.getByTestId('pos-payment-method') as HTMLInputElement;
  await waitFor(() => expect(methodInput.value).toBe('Cash'));
  return { methodInput };
}

describe('PaymentModal — POS defaults', () => {
  beforeEach(() => {
    createCustomerMock.mockReset();
    mutateMock.mockClear();
  });

  it('defaults the payment method to Cash', async () => {
    await renderModal();
    expect((screen.getByTestId('pos-payment-method') as HTMLInputElement).value).toBe('Cash');
  });

  it('prefills the customer and phone from the toolbar selection', async () => {
    await renderModal({
      customerId: JANE.id,
      customerName: JANE.name,
      customer: JANE,
    });

    const select = screen.getByTestId('pos-customer-select') as HTMLInputElement;
    await waitFor(() => expect(select.value).toContain('Jane Doe'));
    expect((screen.getByTestId('pos-customer-phone') as HTMLInputElement).value).toBe(JANE.phone);
  });

  it('defaults to Walk-In with an empty phone when no customer is selected', async () => {
    await renderModal();

    const select = screen.getByTestId('pos-customer-select') as HTMLInputElement;
    await waitFor(() => expect(select.value).toBe('Walk-In'));
    expect((screen.getByTestId('pos-customer-phone') as HTMLInputElement).value).toBe('');
  });

  it('completes a walk-in sale with no customer and without creating one', async () => {
    await renderModal();

    fireEvent.click(screen.getByTestId('pos-complete-sale-btn'));

    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1));
    expect(createCustomerMock).not.toHaveBeenCalled();
    expect(mutateMock.mock.calls[0][0].customerId).toBeNull();
  });
});
