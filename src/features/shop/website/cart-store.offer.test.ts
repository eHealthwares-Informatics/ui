import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from './cart-store';

describe('cart store — pharmacy offer prices', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('stores the selected offer price, price list and pharmacy name', () => {
    useCartStore.getState().addItem('p1', 1, {
      name: 'Paracetamol 500mg',
      unitPrice: 2250,
      priceListId: 'pl-1',
      pharmacyOrganizationId: 'org-1',
      pharmacyName: 'HealthPlus',
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].unitPrice).toBe(2250);
    expect(state.items[0].priceListId).toBe('pl-1');
    expect(state.items[0].pharmacyName).toBe('HealthPlus');
    expect(state.totalItems).toBe(1);
    expect(state.subtotal).toBe(2250);
  });

  it('keeps the offer price when a product snapshot with a null price is written', () => {
    useCartStore.getState().addItem('p1', 1, {
      name: 'Paracetamol 500mg',
      unitPrice: 2250,
      priceListId: 'pl-1',
      pharmacyName: 'HealthPlus',
    });

    // Mirrors cart hydration writing the storefront product snapshot, whose
    // price is null because the current organisation does not list the item.
    useCartStore.getState().updateItemDetails('p1', {
      product: { id: 'p1', name: 'Paracetamol 500mg', unitPrice: null } as any,
    });

    const state = useCartStore.getState();
    expect(state.items[0].unitPrice).toBe(2250);
    expect(state.subtotal).toBe(2250);
  });

  it('switches price and pharmacy when re-adding from a different offer', () => {
    useCartStore.getState().addItem('p1', 1, {
      name: 'Paracetamol 500mg',
      unitPrice: 19500,
      priceListId: 'pl-1',
      pharmacyName: 'HealthPlus',
    });
    useCartStore.getState().addItem('p1', 1, {
      name: 'Paracetamol 500mg',
      unitPrice: 20200,
      priceListId: 'pl-2',
      pharmacyName: 'MedPlus',
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
    expect(state.items[0].unitPrice).toBe(20200);
    expect(state.items[0].pharmacyName).toBe('MedPlus');
    expect(state.subtotal).toBe(40400);
  });
});
