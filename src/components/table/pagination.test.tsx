import { render, screen } from '@test-utils';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('displays the active page size even when it is not a preset (default 25)', () => {
    render(
      <Pagination
        pageIndex={1}
        pageSize={25}
        totalItems={100}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    // Regression: 25 was missing from the preset list, so the Select had no
    // matching option and rendered empty on every data page.
    expect(screen.getByTestId('pagination-page-size')).toHaveValue('25 / page');
    expect(screen.getByText('Page 1 of 4')).toBeInTheDocument();
  });

  it('keeps the preset options selectable', () => {
    render(
      <Pagination
        pageIndex={1}
        pageSize={10}
        totalItems={30}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('pagination-page-size')).toHaveValue('10 / page');
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });
});
