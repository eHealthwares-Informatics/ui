import { render, screen } from '@test-utils';
import { ConfirmDialog } from './confirm-dialog';

/**
 * rxsoft-qa#802 — the e2e could never see the confirm dialog.
 *
 * Mantine keeps the modal ROOT (`div.mantine-Modal-root`) mounted even while
 * closed, and that root has NO layout box: its only children (the overlay and
 * `Modal-inner`) are `position: fixed`, so the root measures 1280×0 in both
 * states and Playwright's `isVisible()` is false for it always — including
 * while the dialog is open. A `data-testid` on the root is therefore useless to
 * a visibility-based locator.
 *
 * These tests pin the testid to the dialog BODY: absent while closed, exactly
 * one visible node while open.
 */
describe('ConfirmDialog — data-testid placement (rxsoft-qa#802)', () => {
  const noop = () => {};

  it('has no confirm-dialog node while closed', () => {
    const { container } = render(
      <ConfirmDialog open={false} onOpenChange={noop} title="Delete Item" onConfirm={noop} />
    );

    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    // …even though Mantine still mounts the (layout-less) modal root.
    expect(container.ownerDocument.querySelector('.mantine-Modal-root')).toBeTruthy();
    expect(screen.queryByTestId('confirm-dialog-confirm')).not.toBeInTheDocument();
  });

  it('exposes exactly one confirm-dialog node while open, on the body not the root', () => {
    render(<ConfirmDialog open onOpenChange={noop} title="Delete Item" onConfirm={noop} />);

    const dialogs = screen.getAllByTestId('confirm-dialog');
    expect(dialogs).toHaveLength(1);

    const dialog = dialogs[0];
    expect(dialog.className).not.toContain('mantine-Modal-root');
    // The action buttons live inside the node the e2e anchors on.
    expect(dialog).toContainElement(screen.getByTestId('confirm-dialog-confirm'));
    expect(dialog).toContainElement(screen.getByTestId('confirm-dialog-cancel'));
  });

  it('does not leak the `open` prop onto the DOM', () => {
    const { container } = render(
      <ConfirmDialog open onOpenChange={noop} title="Delete Item" onConfirm={noop} />
    );

    const root = container.ownerDocument.querySelector('.mantine-Modal-root');
    expect(root?.hasAttribute('open')).toBe(false);
  });

  it('calls the confirm handler and the cancel handler', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog open onOpenChange={onOpenChange} title="Delete Item" onConfirm={onConfirm} />
    );

    screen.getByTestId('confirm-dialog-confirm').click();
    expect(onConfirm).toHaveBeenCalledTimes(1);

    screen.getByTestId('confirm-dialog-cancel').click();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
