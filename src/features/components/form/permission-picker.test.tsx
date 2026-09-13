import { fireEvent, render, screen, waitFor } from '@test-utils';
import { PermissionPicker, type RawModule } from './permission-picker';

const catalog: RawModule[] = [
  {
    module: 'rxsoft.catalog',
    moduleDisplayName: 'Catalog',
    permissions: [
      {
        code: 'rxsoft.catalog.item.create',
        name: 'Create Item',
        description: 'Create new items',
        resource: 'item',
        action: 'create',
      },
      {
        code: 'rxsoft.catalog.item.read',
        name: 'Read Item',
        description: 'View items',
        resource: 'item',
        action: 'read',
      },
      {
        code: 'rxsoft.catalog.price.read',
        name: 'Read Prices',
        description: 'View prices',
        resource: 'price',
        action: 'read',
      },
    ],
  },
  {
    module: 'rxsoft.sales',
    moduleDisplayName: 'Sales',
    permissions: [
      {
        code: 'rxsoft.sales.sale.create',
        name: 'Create Sale',
        description: 'Create sales',
        resource: 'sale',
        action: 'create',
      },
      {
        code: 'rxsoft.sales.sale.refund',
        name: 'Create Refund',
        description: 'Refund sales',
        resource: 'sale',
        action: 'refund',
      },
    ],
  },
];

const ALL_CODES = catalog.flatMap((m) => m.permissions.map((p) => p.code));

function setup(value: string[] = [], onChange = vi.fn(), props: Record<string, unknown> = {}) {
  const onChangeFn = onChange;
  const utils = render(
    <PermissionPicker value={value} onChange={onChangeFn} modules={catalog} {...props} />
  );
  return { ...utils, onChangeFn };
}

/** Click a checkbox by its accessible name (label/aria-label) */
function check(name: string | RegExp) {
  fireEvent.click(screen.getByRole('checkbox', { name }));
}

/** Click a module name (tree or side-panel header) — first occurrence wins */
function clickNode(name: string) {
  fireEvent.click(screen.getAllByText(name)[0]);
}

describe('PermissionPicker', () => {
  /** Click the focused module's first entity in the side panel to open its actions */
  function openEntity(name: string) {
    fireEvent.click(screen.getAllByText(name)[0]);
  }

  describe('rendering', () => {
    it('renders modules in the tree and entities in the focused side panel', () => {
      setup();
      expect(screen.getAllByText('Catalog').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Sales').length).toBeGreaterThanOrEqual(1);
      // entities are hidden until a module is expanded — but the first module auto-focuses,
      // so its entities appear in the right pane
      expect(screen.getByText('Item')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
    });

    it('shows the total permission count badge', () => {
      setup();
      expect(screen.getByText('0 / 5 permissions')).toBeInTheDocument();
    });

    it('shows the selected count when initialized with values', () => {
      setup(['rxsoft.catalog.item.read']);
      expect(screen.getByText('1 / 5 permissions')).toBeInTheDocument();
    });

    it('expands a module and lists its entities when the expand arrow is clicked', () => {
      setup();
      fireEvent.click(screen.getByLabelText('Expand Sales'));
      // Sales entities now render in the tree (right pane already lists focused module entities)
      const treeSales = screen.getAllByText('Sale');
      expect(treeSales.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('select all', () => {
    it('master Select All checks every permission', () => {
      const { onChangeFn } = setup();
      check('Select all permissions');
      expect(onChangeFn).toHaveBeenCalledWith(ALL_CODES);
    });

    it('master Select All clears everything when fully checked', () => {
      const { onChangeFn } = setup(ALL_CODES);
      check('Select all permissions');
      expect(onChangeFn).toHaveBeenCalledWith([]);
    });

    it('module checkbox selects every permission in that module', () => {
      const { onChangeFn } = setup();
      check('Select all Catalog');
      expect(onChangeFn).toHaveBeenCalledWith([
        'rxsoft.catalog.item.create',
        'rxsoft.catalog.item.read',
        'rxsoft.catalog.price.read',
      ]);
    });

    it('module checkbox is indeterminate when some permissions are selected', () => {
      setup(['rxsoft.catalog.item.read']);
      const cb = screen.getByLabelText('Select all Catalog') as HTMLInputElement;
      expect(cb.indeterminate).toBe(true);
      expect(cb.checked).toBe(false);
    });

    it('module checkbox is checked when all its permissions are selected', () => {
      setup([
        'rxsoft.catalog.item.create',
        'rxsoft.catalog.item.read',
        'rxsoft.catalog.price.read',
      ]);
      const cb = screen.getByLabelText('Select all Catalog') as HTMLInputElement;
      expect(cb.checked).toBe(true);
      expect(cb.indeterminate).toBe(false);
    });

    it('entity select-all in the side panel selects all its actions', () => {
      const { onChangeFn } = setup();
      openEntity('Item');
      check('Select all Item actions');
      expect(onChangeFn).toHaveBeenCalledWith([
        'rxsoft.catalog.item.create',
        'rxsoft.catalog.item.read',
      ]);
    });
  });

  describe('individual actions', () => {
    it('toggles an individual action from the side panel', () => {
      const { onChangeFn } = setup();
      openEntity('Item');
      check(/^Create Item/);
      expect(onChangeFn).toHaveBeenCalledWith(['rxsoft.catalog.item.create']);
    });

    it('unchecks an individual action', () => {
      const { onChangeFn } = setup(['rxsoft.catalog.item.create']);
      openEntity('Item');
      check(/^Create Item/);
      expect(onChangeFn).toHaveBeenCalledWith([]);
    });

    it('renders action descriptions', () => {
      setup();
      openEntity('Item');
      expect(screen.getByText('Create new items')).toBeInTheDocument();
    });
  });

  describe('focus / side panel', () => {
    it('switches the side panel when clicking an entity in the tree', async () => {
      setup(['rxsoft.catalog.price.read']);
      // Expand the module in the tree, then click the Price entity
      fireEvent.click(screen.getByLabelText('Expand Catalog'));
      fireEvent.click(screen.getAllByText('Price')[0]);
      await waitFor(() => {
        expect(screen.getByText('Read Prices')).toBeInTheDocument();
      });
      // side panel select-all for Price reflects the selected code
      const cb = screen.getByLabelText('Select all Price actions') as HTMLInputElement;
      expect(cb.checked).toBe(true);
    });

    it('side panel shows entity cards when a module (not entity) is focused', () => {
      setup();
      // First module auto-focuses; entity cards show action counts
      expect(screen.getAllByText('2 actions ›').length).toBe(1);
      expect(screen.getAllByText('1 actions ›').length).toBe(1);
    });

    it('navigates back from an entity to its module overview', () => {
      setup();
      openEntity('Item');
      expect(screen.getByText('Create Item')).toBeInTheDocument();
      // Click the module name in the side panel header to go back to the overview
      clickNode('Catalog');
      expect(screen.getByText('all entities')).toBeInTheDocument();
    });
  });

  describe('search', () => {
    it('filters modules by search query', () => {
      setup();
      fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'sales' } });
      expect(screen.getAllByText('Sales').length).toBeGreaterThanOrEqual(1);
      // The side panel follows the filtered tree — the hidden module is gone entirely
      expect(screen.queryByText('Catalog')).not.toBeInTheDocument();
    });

    it('filters entities within modules and auto-expands matching modules', () => {
      setup();
      fireEvent.click(screen.getByLabelText('Expand Catalog'));
      fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'price' } });
      expect(screen.getAllByText('Catalog').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Price').length).toBeGreaterThanOrEqual(1);
      // side panel follows the filtered tree — filtered-out entity disappears there too
      expect(screen.queryByText('Item')).not.toBeInTheDocument();
    });

    it('shows a no-matches message when nothing fits', () => {
      setup();
      fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'zzz' } });
      expect(screen.getByText('No matches')).toBeInTheDocument();
    });
  });

  describe('API loading', () => {
    it('fetches the catalog from /permissions/modules when no static modules are given', async () => {
      const api = { get: vi.fn().mockResolvedValue({ data: catalog }) };
      render(<PermissionPicker value={[]} onChange={vi.fn()} apiProvider={api as any} />);
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/permissions/modules');
      });
      expect(await screen.findAllByText('Catalog')).not.toHaveLength(0);
    });

    it('shows an error message when the fetch fails', async () => {
      const api = { get: vi.fn().mockRejectedValue(new Error('boom')) };
      render(<PermissionPicker value={[]} onChange={vi.fn()} apiProvider={api as any} />);
      expect(await screen.findByText('Failed to load the permission catalog.')).toBeInTheDocument();
    });
  });

  describe('disabled', () => {
    it('disables all checkboxes', () => {
      setup(ALL_CODES, vi.fn(), { disabled: true });
      const boxes = screen.getAllByRole('checkbox');
      boxes.forEach((b) => expect(b).toBeDisabled());
    });

    it('still renders selected state while disabled', () => {
      setup(['rxsoft.catalog.item.read'], vi.fn(), { disabled: true });
      expect(screen.getByText('1 / 5 permissions')).toBeInTheDocument();
    });
  });
});
