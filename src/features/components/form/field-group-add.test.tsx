import { fireEvent, render, screen, waitFor } from '@test-utils';
import { describe, expect, it, vi } from 'vitest';
import { FieldGroup } from '@/features/rxsoft/types';
import { FieldGroupAdd } from './field-group-add';

const matrixRows = [
  {
    id: 'row-1',
    priceListName: 'Retail',
    currencyCode: 'NGN',
    unitPrice: -5,
    dirty: true,
  },
  {
    id: 'row-2',
    priceListName: 'Wholesale',
    currencyCode: 'NGN',
    unitPrice: 100,
    dirty: true,
  },
];

function buildFieldGroup(matrix: Record<string, unknown>): FieldGroup {
  return {
    title: 'Pricing',
    renderer: 'matrix',
    parentId: 'itemId',
    rowsField: 'pricingMatrixRows',
    columns: [
      { key: 'priceListName', label: 'PriceList' },
      {
        key: 'unitPrice',
        label: 'Price',
        editable: true,
        field: { name: 'unitPrice', label: 'Price', type: 'number', required: true },
      },
    ],
    fields: [],
    matrix: matrix as FieldGroup['matrix'],
  };
}

function setup(matrix: Record<string, unknown>) {
  const updateField = vi.fn();
  const view = render(
    <FieldGroupAdd
      title="Pricing"
      fieldGroup={buildFieldGroup(matrix)}
      formState={{ id: 'item-1' }}
      updateField={updateField}
      index={0}
    />
  );

  return { updateField, view };
}

describe('FieldGroupAdd matrix rows', () => {
  it('renders the row validation error and blocks the save', async () => {
    const save = vi.fn();
    const matrix = {
      load: vi.fn().mockResolvedValue(matrixRows),
      save,
      validate: (row: Record<string, unknown>) =>
        Number(row.unitPrice) > 0
          ? { valid: true }
          : { valid: false, error: 'Unit price must be a positive number' },
    };

    setup(matrix);

    const rowSaveButtons = await waitFor(() => {
      const buttons = screen.getAllByTestId('row-save');
      expect(buttons).toHaveLength(2);
      return buttons;
    });

    fireEvent.click(rowSaveButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('field-error')).toBeVisible();
    });
    expect(screen.getByTestId('field-error')).toHaveTextContent(
      'Unit price must be a positive number'
    );
    expect(save).not.toHaveBeenCalled();
  });

  it('clears the row error once the value is edited', async () => {
    const matrix = {
      load: vi.fn().mockResolvedValue(matrixRows),
      save: vi.fn(),
      validate: (row: Record<string, unknown>) =>
        Number(row.unitPrice) > 0
          ? { valid: true }
          : { valid: false, error: 'Unit price must be a positive number' },
    };

    const { updateField } = setup(matrix);

    const rowSaveButtons = await waitFor(() => {
      const buttons = screen.getAllByTestId('row-save');
      expect(buttons).toHaveLength(2);
      return buttons;
    });

    fireEvent.click(rowSaveButtons[0]);
    await waitFor(() => {
      expect(screen.getByTestId('field-error')).toBeVisible();
    });

    const input = (await screen.findAllByTestId('field-unitPrice'))[0];
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByTestId('field-error')).not.toBeInTheDocument();
    });
    expect(updateField).toHaveBeenCalled();
  });
});
