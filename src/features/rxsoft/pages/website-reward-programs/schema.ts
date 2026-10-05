import type { ModelConfig } from '../../../shared/model-schema';
import type { Column, Field } from '../../types';

const columns: Column[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'type', label: 'Type' },
  { key: 'pointsRule', label: 'Points Rule' },
  { key: 'isActive', label: 'Active', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
];

const createFields: Field[] = [
  { name: 'name', label: 'Name', required: true, col: 6 },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    col: 6,
    defaultValue: 'earn',
    options: [
      { value: 'earn', label: 'Earn' },
      { value: 'redeem', label: 'Redeem' },
    ],
  },
  { name: 'pointsRule', label: 'Points Rule', col: 12, placeholder: 'e.g. 1 point per ₦100 spent' },
  { name: 'description', label: 'Description', type: 'textarea', col: 12 },
  { name: 'isActive', label: 'Active', type: 'switch', col: 12, defaultValue: true },
];

function buildPayload(values: Record<string, unknown>) {
  return {
    name: values.name,
    type: values.type || 'earn',
    pointsRule: values.pointsRule || undefined,
    description: values.description || undefined,
    isActive: values.isActive ?? true,
  };
}

export const rewardProgramsConfig: ModelConfig = {
  id: 'website-reward-programs',
  title: 'Reward Programs',
  description: 'Loyalty programs that define how points are earned and redeemed.',
  endpoint: '/website/admin/reward-programs',
  columns,
  createFields,
  buildCreatePayload: buildPayload,
  buildUpdatePayload: buildPayload,
  canDelete: true,
};
