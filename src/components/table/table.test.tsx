import { render, screen, fireEvent } from '@test-utils';
import { vi } from 'vitest';
import { DataTable } from './table';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
];

const rows = [
  { id: 'r1', name: 'Alice', email: 'alice@example.com' },
  { id: 'r2', name: 'Bob', email: 'bob@example.com' },
];

function renderTable(props: Partial<Parameters<typeof DataTable>[0]> = {}) {
  return render(
    <DataTable columns={columns} rows={rows} isLoading={false} errorLoading={false} {...props} />
  );
}

describe('DataTable — row click / double-click', () => {
  it('calls onRowClick on single click (debounced)', () => {
    vi.useFakeTimers();
    const onRowClick = vi.fn();
    renderTable({ onRowClick });

    fireEvent.click(screen.getByTestId('data-table-row-r1'));
    expect(onRowClick).not.toHaveBeenCalled(); // not yet, debounced

    vi.advanceTimersByTime(300);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);

    vi.useRealTimers();
  });

  it('calls onRowDoubleClick on double click and not onRowClick', () => {
    vi.useFakeTimers();
    const onRowClick = vi.fn();
    const onRowDoubleClick = vi.fn();
    renderTable({ onRowClick, onRowDoubleClick });

    fireEvent.doubleClick(screen.getByTestId('data-table-row-r2'));
    expect(onRowDoubleClick).toHaveBeenCalledTimes(1);
    expect(onRowDoubleClick).toHaveBeenCalledWith(rows[1]);

    vi.advanceTimersByTime(300);
    // Single-click handler is debounced; double-click cancels it.
    expect(onRowClick).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('does not open modal when clicking an interactive element inside a row', () => {
    vi.useFakeTimers();
    const onRowClick = vi.fn();
    renderTable({
      onRowClick,
      copyRowIdOnSn: true,
    });

    // The SN cell is a button when copyRowIdOnSn is true.
    const copyButton = screen.getByTestId('data-table-row-r1').querySelector('button');
    fireEvent.click(copyButton!);
    vi.advanceTimersByTime(300);
    expect(onRowClick).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('renders rows with cursor pointer and per-row id testid', () => {
    renderTable();

    const row = screen.getByTestId('data-table-row-r1');
    expect(row).toHaveStyle({ cursor: 'pointer' });
    expect(screen.getByTestId('data-table-row-r2')).toBeInTheDocument();
  });
});
