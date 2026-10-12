import React from 'react';
import { Column, ColumnTypeFilters, FieldGroup, FilterType } from '../../types';
import { InlinePriceCell } from './inline-price-cell';

export const columns: Column[] = [
  { key: 'item.name', label: 'Product', filters: ColumnTypeFilters.STRING },
  { key: 'priceList.name', label: 'PriceList', filters: ColumnTypeFilters.STRING },
  { key: 'currencyCode', label: 'Currency' },
  {
    key: 'unitPrice',
    label: 'Price',
    render: (row) => <InlinePriceCell row={row} />,
  },
];

export const fieldGroups: FieldGroup[] = [
  {
    title: 'Price List Entry',
    formStateField: 'priceListItems',
    endpoint: {
      url: '/price-lists/items',
      method: 'get',
      query: [{ formKey: 'id', paramKey: 'productId' }],
    },
    mutationMode: 'field',
    columns: [
      { key: 'priceList.label', label: 'PriceList' },
      { key: 'currencyCode', label: 'Currency' },
      { key: 'unitPrice', label: 'Price' },
    ],
    fields: [
      {
        name: 'item',
        label: 'Product',
        type: 'async-select',
        searchParam: {
          endpoint: '/items',
          minChars: 2,
          queryParam: 'search',
          filter: {
            type: FilterType.CONTAINS,
            field: 'name',
          },
          valueKey: 'id',
          labelKey: 'name',
        },
        col: 6,
        required: true,
        placeholder: 'Select Product',
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
        defaultValue: 'NGN',
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
      },
    ],
  },
];

export const buildFormState = (row: Record<string, any>) => {
  const formState = { ...row };
  for (const key in row) {
    if (key.endsWith('Id')) {
      const fieldName = key.replace('Id', '');
      const relation = row[fieldName];
      if (relation?.id && relation?.name) {
        formState[fieldName] = {
          label: relation.name,
          value: relation.id,
        };
      }
    }
  }
  return formState;
};

import type { ModelConfig } from '@/features/shared/model-schema';

export const buildPayload = (entry: any) => ({
  priceListId: entry.priceList.value,
  itemId: entry.item.value,
  locationId: entry.locationId || undefined,
  currencyCode: entry.currencyCode || 'NGN',
  unitPrice: Number(entry.unitPrice),
});

export const priceListItemsConfig: ModelConfig = {
  id: 'price-list-items',
  title: 'Products Prices',
  description: 'Manage product price list prices.',
  endpoint: '/price-lists/items',
  columns,
  createFieldGroups: fieldGroups,
  buildCreatePayload: buildPayload,
  buildFormState,
  modalTitle: 'Product Price',
};
