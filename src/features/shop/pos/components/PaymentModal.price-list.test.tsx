import { fireEvent, render, screen, waitFor } from '@test-utils';
import { vi } from 'vitest';
import { PaymentModal } from './PaymentModal';

const mutateMock = vi.fn();

vi.mock('../../api/posApi', () => ({
  usePaymentMethods: () => ({
    data: [{ id: 'pm-cash', name: 'Cash', code: 'CASH', methodType: 'cash' }],
  }),
  usePosTerminals: () => ({ data: [] }),
  useCreateCustomer: () => ({ mutateAsync: vi.fn() }),
  useCreateSale: () => ({ mutate: mutateMock, isPending: false }),
  useInitiatePosPayment: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryPosPayment: () => ({ mutate: vi.fn(), isPending: false }),
  useDebitWallet: () => ({ mutateAsync: vi.fn(), isPending: false }),
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

function session(priceListId?: string) {
  return {
    id: 'sess-1',
    saleCode: 'SALE-QA-1',
    pricingMode: 'retail',
    priceListId,
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

async function completeSaleWithPriceList(priceListId?: string) {
  render(
    <PaymentModal
      opened
      onClose={vi.fn()}
      onComplete={vi.fn()}
      totals={{ total: 100 }}
      session={session(priceListId)}
    />,
  );

  const methodInput = screen.getByTestId('pos-payment-method');
  fireEvent.click(methodInput);
  fireEvent.click(await screen.findByText('Cash'));

  const completeBtn = screen.getByTestId('pos-complete-sale-btn');
  await waitFor(() => expect(completeBtn).not.toBeDisabled());
  fireEvent.click(completeBtn);
}

describe('PaymentModal — sale line price list provenance (#58)', () => {
  beforeEach(() => {
    mutateMock.mockClear();
  });

  it('includes the session priceListId on every completed sale line', async () => {
    await completeSaleWithPriceList('pl-1');

    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1));
    const payload = mutateMock.mock.calls[0][0];
    expect(payload.lines).toHaveLength(1);
    expect(payload.lines[0]).toMatchObject({
      itemId: 'it-1',
      uomId: 'u1',
      quantity: 2,
      unitPrice: 50,
      priceListId: 'pl-1',
    });
  });

  it('sends undefined when the session has no price list (legacy behaviour)', async () => {
    await completeSaleWithPriceList(undefined);

    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1));
    const payload = mutateMock.mock.calls[0][0];
    expect(payload.lines[0].priceListId).toBeUndefined();
  });
});