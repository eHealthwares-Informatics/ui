import { fireEvent, render, screen, waitFor } from '@test-utils';
import { AxiosError } from 'axios';
import { vi } from 'vitest';
import { PaymentModal } from './PaymentModal';

const createCustomerMock = vi.fn();
const mutateMock = vi.fn();
const enqueueOfflineSaleMock = vi.fn();

vi.mock('../../api/posApi', () => ({
  usePaymentMethods: () => ({
    data: [{ id: 'pm-cash', name: 'Cash', code: 'CASH', methodType: 'cash' }],
  }),
  usePosTerminals: () => ({ data: [] }),
  useCreateCustomer: () => ({ mutateAsync: createCustomerMock, isPending: false }),
  useCreateSale: (config: any) => ({
    mutate: (payload: any) => {
      mutateMock(payload);
      config?.onError?.(saleNetworkError);
    },
    isPending: false,
  }),
  useInitiatePosPayment: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryPosPayment: () => ({ mutate: vi.fn(), isPending: false }),
  useDebitWallet: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../store/usePosStore', () => ({
  usePosStore: (selector?: (state: any) => any) => {
    const state = { enqueueOfflineSale: enqueueOfflineSaleMock };
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

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQuery: () => ({ data: undefined }) };
});

// Axios transport failure: no `response`, so `isNetworkError` is true.
const saleNetworkError = new AxiosError('Network Error', 'ERR_NETWORK');
const customerNetworkError = new AxiosError('Network Error', 'ERR_NETWORK');

function session() {
  return {
    id: 'sess-1',
    saleCode: 'SALE-QA-59',
    pricingMode: 'retail',
    customerId: null,
    cart: [
      {
        id: 'it-1',
        orderItemId: 'oi-1',
        uomId: 'u1',
        quantity: 2,
        retailPrice: 50,
        wholesalePrice: 40,
      },
    ],
  };
}

async function openModalAndTypeCustomer() {
  render(
    <PaymentModal
      opened
      onClose={vi.fn()}
      onComplete={vi.fn()}
      totals={{ total: 100 }}
      session={session()}
    />
  );

  const methodInput = screen.getByTestId('pos-payment-method');
  fireEvent.click(methodInput);
  fireEvent.click(await screen.findByText('Cash'));

  fireEvent.change(screen.getByTestId('pos-customer-name'), {
    target: { value: 'Jane Doe' },
  });

  const completeBtn = screen.getByTestId('pos-complete-sale-btn');
  await waitFor(() => expect(completeBtn).not.toBeDisabled());
  return completeBtn;
}

describe('PaymentModal — offline new-customer completion (#59)', () => {
  beforeEach(() => {
    createCustomerMock.mockReset();
    mutateMock.mockClear();
    enqueueOfflineSaleMock.mockClear();
  });

  it('continues as a walk-in and offers offline completion when customer creation fails offline', async () => {
    createCustomerMock.mockRejectedValue(customerNetworkError);
    const completeBtn = await openModalAndTypeCustomer();

    fireEvent.click(completeBtn);

    await waitFor(() => expect(createCustomerMock).toHaveBeenCalledTimes(1));
    expect(createCustomerMock).toHaveBeenCalledWith({ name: 'Jane Doe', phone: undefined });

    // Sale mutation still runs (customerId null) and its network error surfaces
    // the offline prompt.
    const prompt = await screen.findByTestId('pos-offline-prompt');
    expect(prompt).toBeInTheDocument();
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0].customerId).toBeNull();

    fireEvent.click(screen.getByTestId('pos-complete-offline-btn'));

    await waitFor(() => expect(enqueueOfflineSaleMock).toHaveBeenCalledTimes(1));
    const queued = enqueueOfflineSaleMock.mock.calls[0][0];
    expect(queued.saleCode).toBe('SALE-QA-59');
    expect(queued.payload.customerId).toBeNull();
  });

  it('still blocks completion on a customer business error (no offline prompt)', async () => {
    const badRequest = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 400,
      data: { message: 'Invalid phone' },
      statusText: 'Bad Request',
      headers: {},
      config: {},
    } as any);
    createCustomerMock.mockRejectedValue(badRequest);
    const completeBtn = await openModalAndTypeCustomer();

    fireEvent.click(completeBtn);

    await waitFor(() => expect(createCustomerMock).toHaveBeenCalledTimes(1));
    expect(mutateMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('pos-offline-prompt')).not.toBeInTheDocument();
  });
});
