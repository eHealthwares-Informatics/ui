import { render, screen } from '@test-utils';
import { vi } from 'vitest';
import { ProductCard } from './components';
import type { WebsiteProduct } from './types';

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));

// The card only reads the cart store for add-to-cart; keep it inert here.
vi.mock('./cart-store', () => {
  const useCartStore: any = (selector?: any) =>
    selector ? selector({ addItem: vi.fn(), totalItems: 0 }) : { addItem: vi.fn() };
  useCartStore.getState = () => ({ totalItems: 0 });
  return { useCartStore };
});

const base = {
  id: 'p1',
  name: 'Paracetamol 500mg',
  code: 'P1',
  barcode: null,
  category: null,
  genericProduct: null,
  baseUomId: 'u1',
  isActive: true,
  createdAt: '2026-10-21T00:00:00.000Z',
  unitPrice: 500,
} as unknown as WebsiteProduct;

describe('ProductCard rating', () => {
  it('shows the average rating and review count', () => {
    render(<ProductCard product={{ ...base, averageRating: 4.5, reviewCount: 12 }} />);

    expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
    expect(screen.getByTestId('product-rating-p1')).toBeInTheDocument();
    expect(screen.getByText('4.5 (12)')).toBeInTheDocument();
  });

  it('shows "No reviews yet" when the product has no reviews', () => {
    render(<ProductCard product={{ ...base, averageRating: 0, reviewCount: 0 }} />);

    expect(screen.getByTestId('product-rating-p1')).toBeInTheDocument();
    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
  });
});
