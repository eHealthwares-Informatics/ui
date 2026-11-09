import { render, screen, fireEvent } from '@test-utils';
import { vi } from 'vitest';
import { ActionCell } from './action-cell';

/**
 * rxsoft-qa#802 — "row delete opens no visible confirm dialog".
 *
 * Mantine keeps the Modal ROOT (data-testid="confirm-dialog") mounted even while
 * closed, so an e2e locator on the root tells you nothing about open state. The
 * dialog CONTENT (confirm button) only mounts when `opened` is true — that is
 * what these tests assert on.
 */
describe('ActionCell — row delete confirmation (rxsoft-qa#802)', () => {
  const row = { id: 'r1', name: 'row one' };

  it('mounts the confirm dialog content only after the row trash is clicked', () => {
    render(<ActionCell row={row} onDelete={vi.fn()} />);

    // Closed: the confirm button is not in the DOM.
    expect(screen.queryByTestId('confirm-dialog-confirm')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('row-delete'));

    // Open: content is mounted and the confirm button is rendered.
    expect(screen.getByTestId('confirm-dialog-confirm')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-dialog-cancel')).toBeInTheDocument();
  });

  it('closes again on cancel', () => {
    render(<ActionCell row={row} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByTestId('row-delete'));
    expect(screen.getByTestId('confirm-dialog-confirm')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-dialog-cancel'));
    expect(screen.queryByTestId('confirm-dialog-confirm')).not.toBeInTheDocument();
  });

  it('runs the delete mutation and the onDelete callback on confirm', async () => {
    const onDelete = vi.fn();
    const mutate = vi.fn((_row, opts) => opts?.onSuccess?.());
    render(
      <ActionCell row={row} onDelete={onDelete} deleteMutation={{ mutate, isPending: false }} />
    );

    fireEvent.click(screen.getByTestId('row-delete'));
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(row, 0);
  });

  // rxsoft-qa#802 symptom 2 — "no row-edit on /rxsoft/users". DataPageShell
  // always passes `onEdit` for a config with `buildUpdatePayload` (users has
  // one), and `editPathBuilder` is the path variant; either must emit the
  // testid the e2e rowAction() looks for.
  it('emits the row-edit testid for the callback form (the /rxsoft/users shape)', () => {
    render(<ActionCell row={row} onEdit={vi.fn()} />);
    expect(screen.getByTestId('row-edit')).toBeInTheDocument();
  });

  it('renders the row-delete testid only when a delete action exists', () => {
    const { unmount } = render(<ActionCell row={row} />);
    expect(screen.queryByTestId('row-delete')).not.toBeInTheDocument();
    unmount();

    render(<ActionCell row={row} onDelete={vi.fn()} />);
    expect(screen.getByTestId('row-delete')).toBeInTheDocument();
  });
});
