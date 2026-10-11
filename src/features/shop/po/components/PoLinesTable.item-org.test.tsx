import { fireEvent, render, screen, waitFor } from '@test-utils';
import { vi } from 'vitest';
import type { PoLineItem } from '../types';
import { PoLinesTable } from './PoLinesTable';

/**
 * Purchases only accept items the organisation explicitly added
 * (assertItemsOrgAdded — "Item(s) not added to this organisation: …").
 * The /items list the picker reads also surfaces 'default'-visibility items
 * (no organisation_items row), so picking one must prompt the user to add
 * the item to the organisation before it lands on the PO line.
 *
 * NOTE: assertions use the dialog's CONTENT (title / confirm button), not the
 * modal root — Mantine keeps the Modal root (data-testid="confirm-dialog")
 * mounted even while closed.
 */

const addItemMock = vi.fn();

vi.mock('../api/poApi', () => ({
  useItems: () => ({
    data: [
      { id: 'it-added', code: 'ADR', name: 'Added Item', visibility: 'whitelisted' },
      { id: 'it-missing', code: 'MIS', name: 'Missing Item', visibility: 'default' },
    ],
  }),
  useItemUoms: () => ({ data: [] }),
  useAddItemToOrganisation: () => ({ mutateAsync: addItemMock, isPending: false }),
}));

vi.mock('@/lib/rxsoft-api', () => ({
  rxsoftApi: {
    get: vi.fn(async () => ({ data: {} })),
    put: vi.fn(async () => ({ data: {} })),
  },
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQuery: () => ({ data: [] }) };
});

const emptyLine = (): PoLineItem => ({
  id: 'line-1',
  itemId: '',
  orderedQty: 0,
  receivedQty: 0,
  uomId: '',
  unitCost: 0,
  discountPercent: 0,
  taxPercent: 0,
  lineSubtotal: 0,
  lineTotal: 0,
});

const onUpdateLine = vi.fn();

const DIALOG_TITLE = 'Add item to your organisation?';
const dialogVisible = () => screen.queryByText(DIALOG_TITLE) !== null;

function setup() {
  render(
    <PoLinesTable
      lines={[emptyLine()]}
      status={null}
      pendingPoId={null}
      receiptNumber=""
      onUpdateLine={onUpdateLine}
      onRemoveLine={vi.fn()}
      onAddLine={vi.fn()}
      onSaveLine={vi.fn()}
      onReceiveLine={vi.fn()}
      onUnpostLine={vi.fn()}
      onSetPrice={vi.fn()}
      savingLines={new Set()}
    />
  );
}

/** Open the line's item picker and choose the option with the given label. */
async function pickItem(label: string) {
  fireEvent.click(screen.getByTestId('po-line-item-select'));
  const option = await screen.findByText(label);
  fireEvent.click(option);
}

describe('PoLinesTable — items not added to the organisation', () => {
  beforeEach(() => {
    onUpdateLine.mockClear();
    addItemMock.mockReset();
  });

  it('selects a whitelisted item directly without prompting', async () => {
    setup();

    await pickItem('ADR Added Item');

    await waitFor(() =>
      expect(onUpdateLine).toHaveBeenCalledWith(
        'line-1',
        expect.objectContaining({ itemId: 'it-added' })
      )
    );
    expect(dialogVisible()).toBe(false);
  });

  it('prompts when a default-visibility item is picked and adds it on confirm', async () => {
    setup();

    await pickItem('MIS Missing Item');

    await waitFor(() => expect(dialogVisible()).toBe(true));
    expect(screen.getByTestId('confirm-dialog-confirm')).toBeInTheDocument();
    // The line must not change until the addition is confirmed.
    expect(onUpdateLine).not.toHaveBeenCalled();

    addItemMock.mockResolvedValueOnce({});
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

    await waitFor(() => expect(addItemMock).toHaveBeenCalledWith('it-missing'));
    await waitFor(() =>
      expect(onUpdateLine).toHaveBeenCalledWith(
        'line-1',
        expect.objectContaining({ itemId: 'it-missing' })
      )
    );
    await waitFor(() => expect(dialogVisible()).toBe(false));
  });

  it('leaves the line untouched when the prompt is cancelled', async () => {
    setup();

    await pickItem('MIS Missing Item');
    await screen.findByText(DIALOG_TITLE);
    fireEvent.click(screen.getByTestId('confirm-dialog-cancel'));

    await waitFor(() => expect(dialogVisible()).toBe(false));
    expect(onUpdateLine).not.toHaveBeenCalled();
    expect(addItemMock).not.toHaveBeenCalled();
  });

  it('keeps the dialog open when adding the item fails', async () => {
    setup();

    await pickItem('MIS Missing Item');
    addItemMock.mockRejectedValueOnce(new Error('boom'));
    fireEvent.click(await screen.findByTestId('confirm-dialog-confirm'));

    await waitFor(() => expect(addItemMock).toHaveBeenCalledWith('it-missing'));
    // Failed addition: dialog stays open for retry, line unchanged.
    expect(dialogVisible()).toBe(true);
    expect(onUpdateLine).not.toHaveBeenCalled();
  });
});
