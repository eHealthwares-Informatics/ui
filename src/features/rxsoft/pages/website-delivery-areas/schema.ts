import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field } from '../../types';

const columns: Column[] = [
  { key: 'state', label: 'State', sortable: true },
  { key: 'city', label: 'City', sortable: true },
  { key: 'deliveryFee', label: 'Delivery Fee' },
  { key: 'minOrderAmount', label: 'Min Order' },
  { key: 'estimatedDeliveryHours', label: 'ETA (hrs)' },
  { key: 'isActive', label: 'Active', sortable: true },
];

const createFields: Field[] = [
  { name: 'state', label: 'State', required: true, col: 6 },
  { name: 'city', label: 'City', required: true, col: 6 },
  { name: 'deliveryFee', label: 'Delivery Fee (₦)', type: 'number', col: 3 },
  { name: 'minOrderAmount', label: 'Min Order (₦)', type: 'number', col: 3 },
  { name: 'freeDeliveryAbove', label: 'Free Delivery Above (₦)', type: 'number', col: 3 },
  { name: 'estimatedDeliveryHours', label: 'ETA (hours)', type: 'number', col: 3 },
  { name: 'isActive', label: 'Active', type: 'switch', col: 12, defaultValue: true },
];

function toNumber(value: unknown): number | undefined {
  return value === '' || value === null || value === undefined ? undefined : Number(value);
}

function buildPayload(values: Record<string, unknown>) {
  return {
    state: values.state,
    city: values.city,
    deliveryFee: toNumber(values.deliveryFee),
    minOrderAmount: toNumber(values.minOrderAmount),
    freeDeliveryAbove: toNumber(values.freeDeliveryAbove),
    estimatedDeliveryHours: toNumber(values.estimatedDeliveryHours),
    isActive: values.isActive ?? true,
  };
}

export const deliveryAreasConfig: ModelConfig = {
  id: 'website-delivery-areas',
  title: 'Delivery Areas',
  description: 'Delivery zones, fees and estimated delivery times.',
  endpoint: '/website/admin/delivery-areas',
  columns,
  createFields,
  buildCreatePayload: buildPayload,
  buildUpdatePayload: buildPayload,
  canDelete: true,
};
