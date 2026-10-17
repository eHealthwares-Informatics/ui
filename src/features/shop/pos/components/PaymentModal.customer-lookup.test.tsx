import { fireEvent, render, screen, waitFor } from '@test-utils';
import { vi } from 'vitest';
import { PaymentModal } from './PaymentModal';

/**
 * rxsoft-qa#806 — customer handling in the payment dialog.
 *
 * The customer field is a select; typing a NUMBER looks the customer up and
 * selects them, and a number that matches nobody still resolves to a customer
 * (created with that number).
 */
const createCustomerMock = vi.fn();
const mutateMock = vi.fn();

const JANE = { id: 'c1', name: 'Jane Doe', phone: '08031234567' };

vi.mock('../../api/posApi', () => ({
  usePaymentMethods: () => ({
    data: [{ id: 'pm-cash', name: 'Cash', code: 'CASH', methodType: 'cash' }],
  }),
  usePosTerminals: () => ({ data: [] }),
  useCreateCustomer: () => ({ mutateAsync: createCustomerMock, isPending: false }),
  // Server-side search: the dialog asks the backend by name/phone.
  useCustomers: (search?: string) => ({
    data: search && search.includes('08031234567') ? [JANE] : [],
  }),
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
  rxsoftApi: { get: vi.fn(async () => ({ data: {} })), post: vi.fn(async () => ({ data: {} })) },
}));

vi.mock('@mantine/notifications', () => ({ notifications: { show: vi.fn() } }));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQuery: () => ({ data: undefined }) };
});

function session() {
  return {
    id: 'sess-1',
    saleCode: 'SALE-QA-806',
    pricingMode: 'retail',
    customerId: null,
    customerName: null,
    customer: null,
    cart: [{ id: 'it-1', uomId: 'u1', quantity: 1, retailPrice: 50, wholesalePrice: 40 }],
  };
}

async function openWithCash() {
  render(
    <PaymentModal
      opened
      onClose={vi.fn()}
      onComplete={vi.fn()}
      totals={{ total: 50 }}
      session={session() as never}
    />
  );
  // Cash is the default payment method — no manual selection required.
  await waitFor(() =>
    expect((screen.getByTestId('pos-payment-method') as HTMLInputElement).value).toBe('Cash')
  );
}

function typePhone(value: string) {
  fireEvent.change(screen.getByTestId('pos-customer-phone'), { target: { value } });
}

describe('PaymentModal — customer select + phone lookup (rxsoft-qa#806)', () => {
  beforeEach(() => {
    createCustomerMock.mockReset();
    mutateMock.mockClear();
  });

  // The phone lookup is debounced (400 ms) and then re-renders; under a loaded
  // full-suite run that comfortably exceeds vitest's 5 s default.
  it('selects the matching customer when the number is typed', { timeout: 15_000 }, async () => {
    await openWithCash();

    typePhone('08031234567');

    // The lookup resolves the customer into the select (the label carries the
    // phone too, so match on the name).
    await waitFor(() =>
      expect((screen.getByTestId('pos-customer-select') as HTMLInputElement).value).toContain(
        'Jane Doe'
      )
    );
  });

  it('attaches the looked-up customer to the sale instead of creating one', async () => {
    await openWithCash();
    typePhone('08031234567');
    await waitFor(() =>
      expect((screen.getByTestId('pos-customer-select') as HTMLInputElement).value).toContain(
        'Jane Doe'
      )
    );

    fireEvent.click(screen.getByTestId('pos-complete-sale-btn'));

    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1));
    expect(createCustomerMock).not.toHaveBeenCalled();
    expect(mutateMock.mock.calls[0][0].customerId).toBe('c1');
  });

  it('creates the customer from the number when nobody matches', async () => {
    createCustomerMock.mockResolvedValue({ id: 'c-new', name: '08039999999' });
    await openWithCash();

    typePhone('08039999999');

    fireEvent.click(screen.getByTestId('pos-complete-sale-btn'));

    await waitFor(() => expect(createCustomerMock).toHaveBeenCalledTimes(1));
    expect(createCustomerMock).toHaveBeenCalledWith({
      name: '08039999999',
      phone: '08039999999',
    });
  });
});
