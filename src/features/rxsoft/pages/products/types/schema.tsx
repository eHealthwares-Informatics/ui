import { Badge, Switch, Text } from '@mantine/core';
import { AxiosInstance } from 'axios';
import { useEffect } from 'react';
import type {} from '@/features/components/page/rx-page';
import {
  EQUALS_WITH_OPTIONS,
  FieldGroup,
  FilterType,
  RELATION_FILTER,
  TabGroup,
  View,
} from '@/features/rxsoft/types';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { buildPayload as buildPriceListPayload } from '../../price-list-items/schema';
import { ProductImagesTab } from '../components/product-images-tab';
import type {
  PendingPriceListEntry,
  PendingStockEntry,
} from '../components/product-setup-components';
import {
  buildCreatePricePayload,
  buildUpdatePricePayload,
  getRowsFromResponse,
  mergePricingLists,
  mergeRowToSaved,
  PricingMatrixRow,
  validatePricingRow,
} from '../utils/pricing-matrix-helper';
import {
  loadStockMatrix,
  saveStockRow,
  mergeStockRowToSaved,
  validateStockRow,
  type StockMatrixRow,
} from '../utils/stock-matrix-helper';

function CategoryUomWatcher({
  formState,
  updateField,
}: {
  formState: Record<string, unknown>;
  updateField: (name: string, value: unknown) => void;
}) {
  const category = formState.category as { value?: string; uomCategoryId?: string } | undefined;
  useEffect(() => {
    if (category?.value && category?.uomCategoryId) {
      updateField('categoryUomCategoryId', category.uomCategoryId);
    } else if (category?.value) {
      rxsoftApi
        .get(`/categories/${category.value}`)
        .then((res) => {
          const data = res.data?.data ?? res.data;
          if (data?.uomCategoryId) {
            updateField('categoryUomCategoryId', data.uomCategoryId);
          }
        })
        .catch(() => {});
    }
  }, [category?.value]);
  return null;
}

const endpoint = '/items';
const itemCreateFieldGroups: FieldGroup[] = [
  {
    title: 'Classification',
    fields: [
      {
        name: 'category',
        label: 'Category',
        type: 'async-select',
        searchParam: {
          endpoint: '/categories',
          minChars: 2,
          valueKey: 'id',
          labelKey: 'name',
          queryParam: 'search',
        },
        col: 6,
        required: true,
        placeholder: 'Select Category',
      },
      {
        name: 'genericProductCode',
        label: 'Generic Product',
        type: 'async-select',
        searchParam: {
          endpoint: '/generic-products',
          minChars: 2,
          queryParam: 'search',
          labelKey: 'name',
          valueKey: 'code',
        },
        col: 6,
        // Optional — matches the backend CreateItemDto (genericProductCode is
        // validated only when supplied), so items can be created without it.
        placeholder: 'Select Generic Product',
      },
    ],
  },
  {
    title: 'Basic Information',
    fields: [
      { name: 'name', label: 'Item Name (Brand/Variety)', required: true, col: 6 },
      { name: 'imageUrl', label: 'Image URL', col: 12, type: 'image', imageSize: 'large' },
    ],
  },
  {
    title: 'Organisation Settings (optional)',
    description:
      'Set an org code, barcode or alias to explicitly whitelist this product for the current organisation.',
    fields: [
      { name: 'code', label: 'Org Code', col: 4 },
      { name: 'barcode', label: 'Org Barcode', col: 4 },
      { name: 'alias', label: 'Org Alias (display name)', col: 4 },
    ],
  },
  {
    title: 'Units of Measure',
    fields: [
      {
        name: 'baseUom',
        label: 'Base UOM',
        type: 'async-select',
        searchParam: {
          endpoint: '/uoms',
          minChars: 2,
          queryParam: 'search',
          filter: {
            type: 'FUZZY_MATCH',
            field: 'name',
          },
          labelKey: 'name',
          valueKey: 'id',
          // staticFilters: [
          //   {
          //     filter: {
          //       type: FilterType.EQUALS,
          //       name: 'uomType',
          //     },
          //     value: 'reference',
          //   },
          // ],
        },
        extraParams: (fs) => {
          const uomCatId = fs.categoryUomCategoryId as string | undefined;
          return uomCatId ? { uomCategoryId: uomCatId } : {};
        },
        required: true,
        col: 4,
      },
      {
        name: 'purchaseUom',
        label: 'Purchase UOM',
        type: 'async-select',
        searchParam: {
          endpoint: '/uoms',
          minChars: 2,
          queryParam: 'search',
          labelKey: 'name',
          valueKey: 'id',
          filter: {
            type: 'FUZZY_MATCH',
            field: 'name',
          },
          staticFilters: [
            {
              filter: {
                type: FilterType.NOT_EQUALS,
                name: 'uomType',
              },
              value: 'reference',
            },
          ],
        },
        extraParams: (fs) => {
          const uomCatId = fs.categoryUomCategoryId as string | undefined;
          return uomCatId ? { uomCategoryId: uomCatId } : {};
        },
        col: 4,
      },
      {
        name: 'saleUom',
        label: 'Sale UOM',
        type: 'async-select',
        searchParam: {
          endpoint: '/uoms',
          minChars: 2,
          queryParam: 'search',
          labelKey: 'name',
          valueKey: 'id',
          staticFilters: [
            {
              filter: {
                type: FilterType.EQUALS,
                name: 'uomType',
              },
              value: 'reference',
            },
          ],
        },
        extraParams: (fs) => {
          const uomCatId = fs.categoryUomCategoryId as string | undefined;
          return uomCatId ? { uomCategoryId: uomCatId } : {};
        },
        col: 4,
      },
    ],
  },
  {
    title: 'Status',
    fields: [
      {
        name: 'isActive',
        label: 'Active',
        type: 'switch',
        defaultValue: true,
        col: 6,
      },
      {
        name: 'trackExpiry',
        label: 'Track Expiry',
        type: 'switch',
        defaultValue: true,
        col: 6,
      },
    ],
  },
];

const itemPriceListFieldGroups: FieldGroup[] = [
  {
    title: 'Pricing ',
    mutationMode: 'cell',
    renderer: 'matrix',
    formStateField: 'priceListItems',
    rowsField: 'pricingMatrixRows',
    parentId: 'itemId',
    mergeRowToSaved,
    buildPayload: (localFormState: any) => {
      return {
        priceListId: localFormState.priceList.value,
        itemId: localFormState.itemId,
        currencyCode: localFormState.currencyCode || 'NGN',
        unitPrice: Number(localFormState.unitPrice),
      };
    },
    defaultState: {
      currencyCode: 'NGN',
      unitPrice: '',
    },
    endpoint: {
      url: '/price-lists/items',
      method: 'get',
      query: [{ formKey: 'id', paramKey: 'priceListItemId' }],
    },
    columns: [
      { key: 'priceListName', label: 'PriceList' },
      { key: 'currencyCode', label: 'Currency' },
      {
        key: 'unitPrice',
        label: 'Price',
        editable: true,
        field: {
          name: 'unitPrice',
          label: 'Price',
          type: 'number',
          col: 3,
          required: true,
          updateField: (row, name, value) => {}, //updateMatrixRow(row, name, value)
        },
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => (
          <Text size="sm" c={row.dirty ? 'orange' : row.exists ? 'green' : 'dimmed'}>
            {row.dirty ? 'Unsaved' : row.exists ? 'Saved' : 'New'}
          </Text>
        ),
      },
    ],
    rowActions: [
      { label: 'Save', action: 'save-price' },
      { label: 'Reset', action: 'reset-price' },
    ],
    fields: [
      {
        name: 'itemId',
        label: 'Item Override',
        type: 'hidden',
        disabled: true,
        value: { formKey: 'id', paramKey: 'itemId' },
      },
      {
        name: 'priceList',
        label: 'Price List',
        type: 'async-select',
        col: 6,
        searchParam: {
          endpoint: '/price-lists',
          minChars: 2,
          queryParam: 'search',
          valueKey: 'id',
          labelKey: 'name',
        },
        required: true,
        placeholder: 'Select Price List',
      },
      {
        name: 'currencyCode',
        label: 'Currency Code',
        defaultValue: 'NGN',
        placeholder: 'Select Currency',
        type: 'text',
        col: 3,
        disabled: true,
        required: true,
      },
      {
        name: 'unitPrice',
        label: 'Unit Price',
        type: 'number',
        col: 3,
        required: true,
        // updateField: (row, name, value) => updateMatrixRow(row.id, name, value)
      },
    ],
    matrix: {
      load: async ({ itemId }: { itemId: string }) => {
        const [lists, items] = await Promise.all([
          rxsoftApi.get('/price-lists', { params: { page: 1, limit: 10 } }),
          rxsoftApi.get('/price-lists/items', { params: { itemId, page: 1, limit: 10 } }),
        ]);

        return mergePricingLists(getRowsFromResponse(lists.data), getRowsFromResponse(items.data));
      },

      save: async (row: PricingMatrixRow & { itemId: string }) => {
        if (row.exists) {
          return rxsoftApi.patch(
            `/price-lists/${row.priceListId}/items/${row.id}`,
            buildUpdatePricePayload(row)
          );
        }

        return rxsoftApi.post('/price-lists/items', buildCreatePricePayload(row, row.itemId));
      },

      validate: validatePricingRow,

      manualEntry: {
        initialValues: {
          currencyCode: 'NGN',
        },

        create: async ({
          values,
          itemId,
        }: {
          api: AxiosInstance;
          values: PricingMatrixRow;
          itemId: string;
        }) => {
          return rxsoftApi.post('/price-lists/items', {
            ...values,
            itemId,
          });
        },
      },
    },
  },
];

export const stockFields: FieldGroup[] = [
  {
    title: 'Stock Setup',
    renderer: 'matrix',
    formStateField: 'stockEntries',
    parentId: 'itemId',
    mergeRowToSaved: mergeStockRowToSaved,
    defaultState: {
      quantity: 0,
    },
    columns: [
      { key: 'locationName', label: 'Location' },
      {
        key: 'quantityOnHand',
        label: 'Quantity',
        editable: true,
        field: {
          name: 'quantityOnHand',
          label: 'Quantity',
          type: 'number',
          col: 3,
          required: true,
        },
      },
      {
        key: 'status',
        label: 'Status',
        render: (row: any) => (
          <Text size="sm" c={row.dirty ? 'orange' : row.exists ? 'green' : 'dimmed'}>
            {row.dirty ? 'Unsaved' : row.exists ? 'Saved' : 'New'}
          </Text>
        ),
      },
    ],
    matrix: {
      load: async ({ itemId }: { itemId: string }) => {
        return loadStockMatrix(itemId);
      },
      save: async (row: StockMatrixRow & { itemId: string }) => {
        return saveStockRow(row, row.itemId);
      },
      validate: validateStockRow,
    },
    fields: [
      {
        name: 'itemId',
        type: 'hidden',
        label: 'Item',
        disabled: true,
      },
      {
        name: 'locationId',
        label: 'Location',
        type: 'async-select',
        searchParam: {
          endpoint: '/stock-locations',
          minChars: 2,
          queryParam: 'search',
          valueKey: 'id',
          labelKey: 'name',
        },
        col: 6,
      },
      {
        name: 'quantityOnHand',
        label: 'Quantity',
        type: 'number',
        col: 3,
        required: true,
      },
    ],
  },
];

export const tabGroups: TabGroup[] = [
  {
    title: 'Item Details',
    value: 'item-details',
    fieldGroups: itemCreateFieldGroups,
  },
  {
    title: 'Price List',
    value: 'price-list',
    waitFor: 'id',
    disabledToolTip: 'Create item before price setup',
    fieldGroups: itemPriceListFieldGroups,
  },
  {
    title: 'Stock Entries',
    value: 'stock-entries',
    waitFor: 'id',
    disabledToolTip: 'Create item before stock setup',
    fieldGroups: stockFields,
  },
  {
    title: 'Images',
    value: 'images',
    waitFor: 'id',
    disabledToolTip: 'Create item before adding images',
    render: ({ formState, updateField }) => (
      <ProductImagesTab
        values={formState as Record<string, string>}
        onChange={(field, url) => updateField(field, url)}
      />
    ),
  },
];

function hasNumericValue(value: unknown) {
  return value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value));
}

export const buildFormState = (row: Record<string, any>) => {
  const formState = { ...row };
  for (const key in row) {
    // check for fields like categoryId, baseUomId, etc.
    if (key.endsWith('Id')) {
      const fieldName = key.replace('Id', '');
      const relation = row[fieldName];
      // if related object exists
      if (relation?.id && relation?.name) {
        formState[fieldName] = {
          label: relation.name,
          value: relation.id,
        };
      }
    }
  }

  // handle genericProductCode (stored as code string, not FK id)
  if (row.genericProductCode && row.genericProduct) {
    formState.genericProductCode = {
      label: row.genericProduct.name,
      value: row.genericProduct.code,
    };
  }

  // populate image URLs for edit form
  const imageFields = ['imageUrl', 'smallImageUrl', 'mediumImageUrl', 'largeImageUrl'];
  for (const field of imageFields) {
    if (row[field]) {
      formState[field] = row[field];
    }
  }

  // populate categoryUomCategoryId for UOM filtering
  if (row.category?.uomCategoryId) {
    formState.categoryUomCategoryId = row.category.uomCategoryId;
  }

  return formState;
};

import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnTypeFilters, type Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

function ToggleActive({ row }: { row: Record<string, unknown> }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (checked: boolean) =>
      rxsoftApi.put(`/items/me/${String(row.id)}`, { isActive: checked }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rxsoft-data-page', endpoint] });
    },
    onError: (err: any) => {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.message ?? 'Failed to update visibility',
      });
    },
  });

  // Checked = visible to the current organisation (default or whitelisted);
  // unchecked = blacklisted.
  const checked = row.visibility !== 'blacklisted';
  return (
    <Switch
      checked={checked}
      onChange={(e) => mutation.mutate(e.currentTarget.checked)}
      disabled={mutation.isPending}
      size="sm"
    />
  );
}

const VISIBILITY_META: Record<string, { label: string; color: string }> = {
  default: { label: 'Default', color: 'gray' },
  whitelisted: { label: 'Whitelisted', color: 'green' },
  blacklisted: { label: 'Blacklisted', color: 'red' },
};

function VisibilityBadge({ visibility }: { visibility?: unknown }) {
  const meta = VISIBILITY_META[String(visibility ?? 'default')] ?? VISIBILITY_META.default;
  return (
    <Badge color={meta.color} variant="light" size="sm">
      {meta.label}
    </Badge>
  );
}

export const itemColumns: Column[] = [
  {
    key: 'category.name',
    label: 'Category',
    filters: RELATION_FILTER({
      endpoint: '/categories',
      valueKey: 'name',
      labelKey: 'name',
      queryParam: 'search',
      minChars: 3,
    }),
  },
  { key: 'name', label: 'Item Name', filters: ColumnTypeFilters.STRING },
  { key: 'displayName', label: 'Display Name' },
  {
    key: 'genericProduct.name',
    label: 'Generic Product',
    filters: RELATION_FILTER({
      endpoint: '/generic-products',
      valueKey: 'name',
      labelKey: 'name',
      queryParam: 'search',
      minChars: 3,
    }),
  },
  { key: 'code', label: 'Org Code' },
  { key: 'barcode', label: 'Org Barcode' },
  {
    key: 'visibility',
    label: 'Visibility',
    render: (row) => <VisibilityBadge visibility={row.visibility} />,
  },
  {
    key: 'isActive',
    label: 'Active',
    render: (row) => <ToggleActive row={row} />,
    filters: EQUALS_WITH_OPTIONS([
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' },
    ]),
  },
];

export const itemsView: View<any> = {
  endpoint: '/items/:id',
  title: 'Item Details',
  fieldGroups: [
    {
      title: 'Basic Information',
      fields: [
        { key: 'name', label: 'Item Name', col: 6 },
        { key: 'code', label: 'Code', col: 3 },
        { key: 'barcode', label: 'Barcode', col: 3 },
        {
          key: 'category',
          label: 'Category',
          col: 4,
          render: (_, data) => data.category?.name ?? '-',
        },
        {
          key: 'genericProduct',
          label: 'Generic Product',
          col: 4,
          render: (_, data) => data.genericProduct?.name ?? data.genericProductCode ?? '-',
        },
      ],
    },
    {
      title: 'Units of Measure',
      fields: [
        {
          key: 'baseUom',
          label: 'Base UOM',
          col: 4,
          render: (_, data) => data.baseUom?.name ?? '-',
        },
        {
          key: 'purchaseUom',
          label: 'Purchase UOM',
          col: 4,
          render: (_, data) => data.purchaseUom?.name ?? '-',
        },
        {
          key: 'saleUom',
          label: 'Sale UOM',
          col: 4,
          render: (_, data) => data.saleUom?.name ?? '-',
        },
      ],
    },
    {
      title: 'Status',
      fields: [
        {
          key: 'isActive',
          label: 'Active',
          col: 3,
          render: (value) => (value ? 'Yes' : 'No'),
        },
        {
          key: 'trackExpiry',
          label: 'Track Expiry',
          col: 3,
          render: (value) => (value ? 'Yes' : 'No'),
        },
      ],
    },
    {
      title: 'Images',
      fields: [
        {
          key: 'imageUrl',
          label: 'Default Image',
          col: 3,
          render: (value) =>
            value ? (
              <img
                src={value as string}
                alt="product"
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
              />
            ) : (
              '-'
            ),
        },
        {
          key: 'smallImageUrl',
          label: 'Small Image',
          col: 3,
          render: (value) =>
            value ? (
              <img
                src={value as string}
                alt="product"
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
              />
            ) : (
              '-'
            ),
        },
        {
          key: 'mediumImageUrl',
          label: 'Medium Image',
          col: 3,
          render: (value) =>
            value ? (
              <img
                src={value as string}
                alt="product"
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
              />
            ) : (
              '-'
            ),
        },
        {
          key: 'largeImageUrl',
          label: 'Large Image',
          col: 3,
          render: (value) =>
            value ? (
              <img
                src={value as string}
                alt="product"
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
              />
            ) : (
              '-'
            ),
        },
      ],
    },
  ],
  lists: [
    {
      key: 'priceListItems',
      title: 'Price List Entries',
      columns: [
        { key: 'priceListName', label: 'Price List' },
        { key: 'currencyCode', label: 'Currency' },
        { key: 'unitPrice', label: 'Unit Price' },
      ],
    },
    {
      key: 'stockItems',
      title: 'Stock Entries',
      columns: [
        {
          key: 'location',
          label: 'Location',
          render: (_, row) => row.location?.name ?? '-',
        },
        {
          key: 'uom',
          label: 'UOM',
          render: (_, row) => row.uom?.name ?? '-',
        },
        { key: 'quantity', label: 'Quantity' },
      ],
    },
  ],
};

export const itemsConfig: ModelConfig = {
  id: 'items',
  title: 'Items',
  description: 'Manage item catalog records.',
  endpoint,
  columns: itemColumns,
  tabGroups,
  modalTitle: 'Add Item',
  metricsEndpoint: '/items/metrics',
  canExport: true,
  csvEndpoint: '/items/export',
  // Show the FULL catalog (LEFT JOIN organisation_items) including items that
  // are blacklisted for the current org, so they stay toggleable/editable.
  listParams: { includeAll: true },
  metricsConfig: {
    endpoint: '/items/metrics',
    items: (data: any) => [
      { label: 'Total Items', value: data.total, icon: 'Package', color: 'blue' },
      { label: 'Active', value: data.active, icon: 'CheckCircle', color: 'green' },
      { label: 'Inactive', value: data.inactive, icon: 'XCircle', color: 'red' },
      { label: 'No Category', value: data.noCategory, icon: 'AlertTriangle', color: 'orange' },
      {
        label: 'No Generic Product',
        value: data.noGenericProductCode,
        icon: 'AlertTriangle',
        color: 'yellow',
      },
    ],
  },
  buildCreatePayload: buildItemPayload,
  buildUpdatePayload: buildItemUpdatePayload,
  buildFormState,
  createPathBuilder: () => '/rxsoft/items/create',
  detailPathBuilder: (row) => `/rxsoft/items/${String(row.id)}`,
  view: itemsView,
  renderCreateExtras: ({ formState, updateField }) => (
    <CategoryUomWatcher formState={formState} updateField={updateField} />
  ),
};

export function buildItemPayload(values: Record<string, any>) {
  const priceListEntries = ((values.priceListItems as PendingPriceListEntry[] | undefined) ?? [])
    .filter((entry) => entry.priceList && hasNumericValue(entry.unitPrice))
    .map(buildPriceListPayload);

  const stockItems = ((values.stockEntries as PendingStockEntry[] | undefined) ?? [])
    .filter((entry) => entry.locationId && hasNumericValue(entry.quantity))
    .map((entry) => ({
      locationId: entry.locationId,
      deltaQuantity: Number(entry.quantity),
      reason: 'Initial stock setup from item creation',
    }));

  return {
    code: values.code || undefined,
    name: values.name,
    categoryId: (values.category as any).value,
    genericProductCode: (values?.genericProductCode as any)?.value,
    baseUomId: (values.baseUom as any).value,
    purchaseUomId: (values as any).purchaseUom.value,
    saleUomId: (values as any).saleUom.value || undefined,
    barcode: values.barcode || undefined,
    alias: values.alias || undefined,
    isActive: values.isActive,
    imageUrl: values.imageUrl || undefined,
    smallImageUrl: values.smallImageUrl || undefined,
    mediumImageUrl: values.mediumImageUrl || undefined,
    largeImageUrl: values.largeImageUrl || undefined,
    trackLot: values.isTrackable,
    trackExpiry: values.isTrackable,
    priceListItems: priceListEntries,
    stockItems,
  };
}

function flattenOptionValue(value: any): any {
  if (value && typeof value === 'object' && 'value' in value) {
    return value.value;
  }
  return value;
}

export function buildItemUpdatePayload(values: Record<string, any>) {
  const payload: Record<string, any> = {};

  if (values.name !== undefined) payload.name = values.name;
  if (values.category !== undefined) payload.categoryId = flattenOptionValue(values.category);
  if (values.genericProductCode !== undefined) {
    payload.genericProductCode = flattenOptionValue(values.genericProductCode);
  }
  if (values.baseUom !== undefined) payload.baseUomId = flattenOptionValue(values.baseUom);
  if (values.purchaseUom !== undefined) payload.purchaseUomId = flattenOptionValue(values.purchaseUom);
  if (values.saleUom !== undefined) payload.saleUomId = flattenOptionValue(values.saleUom);
  if (values.code !== undefined) payload.code = values.code || undefined;
  if (values.barcode !== undefined) payload.barcode = values.barcode || undefined;
  if (values.alias !== undefined) payload.alias = values.alias || undefined;
  if (values.isTrackable !== undefined) {
    payload.trackLot = values.isTrackable;
    payload.trackExpiry = values.isTrackable;
  }
  if (values.isActive !== undefined) payload.isActive = values.isActive;
  if (values.shelfLifeDays !== undefined) payload.shelfLifeDays = values.shelfLifeDays;
  for (const field of ['imageUrl', 'smallImageUrl', 'mediumImageUrl', 'largeImageUrl'] as const) {
    if (values[field] !== undefined) payload[field] = values[field] || undefined;
  }

  if (values.priceListItems !== undefined) {
    const priceListEntries = ((values.priceListItems as PendingPriceListEntry[] | undefined) ?? [])
      .filter((entry) => entry.priceList && hasNumericValue(entry.unitPrice))
      .map(buildPriceListPayload);
    if (priceListEntries.length) payload.priceListItems = priceListEntries;
  }

  if (values.stockEntries !== undefined) {
    const stockItems = ((values.stockEntries as PendingStockEntry[] | undefined) ?? [])
      .filter((entry) => entry.locationId && hasNumericValue(entry.quantity))
      .map((entry) => ({
        locationId: entry.locationId,
        deltaQuantity: Number(entry.quantity),
        reason: 'Initial stock setup from item creation',
      }));
    if (stockItems.length) payload.stockItems = stockItems;
  }

  return payload;
}
