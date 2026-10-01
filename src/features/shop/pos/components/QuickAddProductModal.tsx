import {
  Button,
  Combobox,
  Group,
  InputBase,
  Loader,
  Modal,
  Stack,
  TextInput,
  useCombobox,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCategoriesSearch, useQuickCreateItem, useUomsSearch } from '../../api/posApi';

interface Props {
  opened: boolean;
  onClose: () => void;
  onProductCreated: (product: { id: string; name: string; code: string }) => void;
}

/** Quick-add a product from the POS page with just name, category and UOM. */
export function QuickAddProductModal({ opened, onClose, onProductCreated }: Props) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [debouncedCategorySearch] = useDebouncedValue(categorySearch, 250);
  const [baseUomId, setBaseUomId] = useState<string | null>(null);
  const [uomSearch, setUomSearch] = useState('');
  const [debouncedUomSearch] = useDebouncedValue(uomSearch, 250);

  const categoryCombobox = useCombobox();
  const uomCombobox = useCombobox();

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategoriesSearch(debouncedCategorySearch);
  const { data: uoms = [], isLoading: uomsLoading } = useUomsSearch(debouncedUomSearch);

  const createItem = useQuickCreateItem();

  const categoryOptions = useMemo(
    () =>
      (Array.isArray(categories) ? categories : []).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [categories]
  );

  const uomOptions = useMemo(
    () =>
      (Array.isArray(uoms) ? uoms : []).map((u) => ({
        value: u.id,
        label: u.name,
      })),
    [uoms]
  );

  const selectedCategoryName = categoryOptions.find((o) => o.value === categoryId)?.label ?? '';

  const selectedUomName = uomOptions.find((o) => o.value === baseUomId)?.label ?? '';

  function reset() {
    setName('');
    setCategoryId(null);
    setCategorySearch('');
    setBaseUomId(null);
    setUomSearch('');
  }

  async function handleSubmit() {
    if (!name.trim() || !categoryId || !baseUomId) {
      return;
    }
    const result = await createItem.mutateAsync({
      name: name.trim(),
      categoryId,
      baseUomId,
      saleUomId: baseUomId,
      isActive: true,
    });
    onProductCreated({
      id: result.id,
      name: result.name,
      code: result.itemCode ?? result.code ?? '',
    });
    reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Quick Add Product" centered>
      <Stack gap="md">
        <TextInput
          label="Name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Product name"
          required
          data-testid="quick-add-product-name"
        />

        <Combobox
          store={categoryCombobox}
          onOptionSubmit={(val) => {
            setCategoryId(val);
            categoryCombobox.closeDropdown();
          }}
        >
          <Combobox.Target>
            <InputBase
              label="Category"
              placeholder="Search category..."
              required
              value={categorySearch || selectedCategoryName}
              onChange={(e) => {
                setCategorySearch(e.currentTarget.value);
                setCategoryId(null);
                categoryCombobox.openDropdown();
              }}
              onClick={() => categoryCombobox.openDropdown()}
              onFocus={() => categoryCombobox.openDropdown()}
              rightSection={categoriesLoading ? <Loader size={14} /> : <ChevronDown size={14} />}
              data-testid="quick-add-product-category"
            />
          </Combobox.Target>
          <Combobox.Dropdown style={{ backgroundColor: 'white', zIndex: 30 }}>
            <Combobox.Options style={{ maxHeight: 220, overflowY: 'auto' }}>
              {categoryOptions.length === 0 ? (
                <Combobox.Empty>
                  {categoriesLoading ? 'Loading…' : 'No categories found'}
                </Combobox.Empty>
              ) : (
                categoryOptions.map((o) => (
                  <Combobox.Option key={o.value} value={o.value}>
                    {o.label}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>

        <Combobox
          store={uomCombobox}
          onOptionSubmit={(val) => {
            setBaseUomId(val);
            uomCombobox.closeDropdown();
          }}
        >
          <Combobox.Target>
            <InputBase
              label="UOM"
              placeholder="Search UOM..."
              required
              value={uomSearch || selectedUomName}
              onChange={(e) => {
                setUomSearch(e.currentTarget.value);
                setBaseUomId(null);
                uomCombobox.openDropdown();
              }}
              onClick={() => uomCombobox.openDropdown()}
              onFocus={() => uomCombobox.openDropdown()}
              rightSection={uomsLoading ? <Loader size={14} /> : <ChevronDown size={14} />}
              data-testid="quick-add-product-uom"
            />
          </Combobox.Target>
          <Combobox.Dropdown style={{ backgroundColor: 'white', zIndex: 30 }}>
            <Combobox.Options style={{ maxHeight: 220, overflowY: 'auto' }}>
              {uomOptions.length === 0 ? (
                <Combobox.Empty>{uomsLoading ? 'Loading…' : 'No UOMs found'}</Combobox.Empty>
              ) : (
                uomOptions.map((o) => (
                  <Combobox.Option key={o.value} value={o.value}>
                    {o.label}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>

        <Group grow>
          <Button
            loading={createItem.isPending}
            onClick={handleSubmit}
            disabled={!name.trim() || !categoryId || !baseUomId}
            data-testid="quick-add-product-submit"
          >
            Create & Add
          </Button>
          <Button variant="light" onClick={handleClose}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
