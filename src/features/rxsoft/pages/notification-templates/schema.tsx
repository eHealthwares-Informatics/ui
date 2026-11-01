import { Badge } from '@mantine/core';
import { Eye } from 'lucide-react';
import { type Column, type FieldGroup, type Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { rxsoftApi } from '@/lib/rxsoft-api';
import type { TemplatePreview } from '../templates/preview-modal';

/**
 * Customer notification scenarios — mirrors the backend catalog
 * (`rxsoft/src/modules/orders/notification-scenarios.ts`). Kept static here
 * because the scenario set only changes with a backend release.
 */
export const NOTIFICATION_SCENARIO_OPTIONS: Option[] = [
  { value: 'status_changed', label: 'Order status changed' },
  { value: 'payment_receivable', label: 'Payment balance due' },
  { value: 'order_confirmation', label: 'Order confirmation' },
  { value: 'payment_confirmation', label: 'Payment confirmation' },
  { value: 'dispatch', label: 'Dispatch / in transit' },
  { value: 'delivery', label: 'Delivered' },
  { value: 'prescription_review', label: 'Prescription reviewed' },
  { value: 'refill_due', label: 'Refill due' },
  { value: 'promotion', label: 'Promotional campaign' },
];

export const NOTIFICATION_CHANNEL_OPTIONS: Option[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

/** Sample copy showing every supported placeholder in context. */
const STARTER_BODY = `Hi {{customer.name}},

Your order {{order.number}} ({{order.total}}) is confirmed and will be ready at {{pickup.location}}.

Thank you,
{{organization.name}}`;

function labelFor(options: Option[], value: unknown): string {
  const key = String(value ?? '');
  return options.find((option) => option.value === key)?.label ?? (key || '—');
}

const columns: Column[] = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'kind',
    label: 'Scenario',
    render: (row) => labelFor(NOTIFICATION_SCENARIO_OPTIONS, row.kind),
  },
  {
    key: 'channel',
    label: 'Channel',
    sortable: true,
    render: (row) => labelFor(NOTIFICATION_CHANNEL_OPTIONS, row.channel),
  },
  { key: 'subject', label: 'Subject', render: (row) => (row.subject ? String(row.subject) : '—') },
  {
    key: 'isActive',
    label: 'Active',
    render: (row) =>
      row.isActive === false ? (
        <Badge color="gray" variant="light" size="sm">
          No
        </Badge>
      ) : (
        <Badge color="blue" variant="light" size="sm">
          Yes
        </Badge>
      ),
  },
  {
    key: 'updatedAt',
    label: 'Updated',
    sortable: true,
    render: (row) => (row.updatedAt ? new Date(String(row.updatedAt)).toLocaleString() : '—'),
  },
];

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  const channel = String(values.channel ?? 'sms');
  return {
    code: String(values.code ?? '').trim(),
    name: String(values.name ?? '').trim(),
    description: values.description ? String(values.description) : null,
    type: 'notification',
    kind: String(values.kind ?? 'order_confirmation'),
    channel,
    // Only email carries a subject; the backend clears it for other channels.
    subject: channel === 'email' && values.subject ? String(values.subject) : null,
    body: String(values.body ?? ''),
    isActive: values.isActive !== false,
  };
}

/** Only send keys present in the dirty form values so PATCH stays partial-safe. */
function buildUpdatePayload(values: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (values.code !== undefined) payload.code = String(values.code).trim();
  if (values.name !== undefined) payload.name = String(values.name).trim();
  if (values.description !== undefined) {
    payload.description = values.description ? String(values.description) : null;
  }
  if (values.kind !== undefined) payload.kind = String(values.kind);
  if (values.channel !== undefined) payload.channel = String(values.channel);
  if (values.subject !== undefined) payload.subject = values.subject ? String(values.subject) : null;
  if (values.body !== undefined) payload.body = String(values.body);
  if (values.isActive !== undefined) payload.isActive = Boolean(values.isActive);
  return payload;
}

function buildFormState(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    code: String(row.code ?? ''),
    name: String(row.name ?? ''),
    description: row.description ? String(row.description) : '',
    kind: String(row.kind ?? 'order_confirmation'),
    channel: String(row.channel ?? 'sms'),
    subject: row.subject ? String(row.subject) : '',
    body: String(row.body ?? ''),
    isActive: row.isActive !== false,
  };
}

const fieldGroups: FieldGroup[] = [
  {
    title: 'Message',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true, col: 4 },
      { name: 'name', label: 'Name', type: 'text', required: true, col: 8 },
      {
        name: 'kind',
        label: 'Scenario',
        type: 'select',
        options: NOTIFICATION_SCENARIO_OPTIONS,
        col: 6,
      },
      {
        name: 'channel',
        label: 'Channel',
        type: 'select',
        options: NOTIFICATION_CHANNEL_OPTIONS,
        col: 6,
      },
      {
        name: 'subject',
        label: 'Subject (email only)',
        type: 'text',
        col: 8,
        placeholder: 'Your order is confirmed',
      },
      { name: 'isActive', label: 'Active', type: 'switch', col: 4 },
      { name: 'description', label: 'Description', type: 'text', col: 12 },
    ],
  },
  {
    title: 'Content',
    description:
      'Placeholders: {{customer.name}}, {{order.number}}, {{order.total}}, {{pickup.location}}, {{organization.name}}.',
    fields: [
      {
        name: 'body',
        label: 'Message',
        type: 'textarea',
        required: true,
        col: 12,
        placeholder: STARTER_BODY,
      },
    ],
  },
];

export function buildNotificationTemplatesConfig(
  onPreview: (preview: TemplatePreview) => void
): ModelConfig {
  return {
    id: 'notification-templates',
    title: 'Notification Templates',
    description:
      'Customer-facing copy per notification scenario and channel (email, SMS, WhatsApp).',
    endpoint: '/templates',
    apiProvider: rxsoftApi,
    queryKeyBase: ['rxsoft', 'templates', 'notification'],
    listParams: { type: 'notification' },
    columns,
    createFieldGroups: fieldGroups,
    modalTitle: 'Notification Template',
    defaultState: {
      code: '',
      name: '',
      description: '',
      kind: 'order_confirmation',
      channel: 'sms',
      subject: '',
      body: STARTER_BODY,
      isActive: true,
    },
    buildFormState,
    buildCreatePayload: buildPayload,
    buildUpdatePayload,
    defaultSort: { sortBy: 'updatedAt', sortOrder: 'desc' },
    canDelete: true,
    permissions: {
      create: 'rxsoft.admin.template.update',
      update: 'rxsoft.admin.template.update',
      delete: 'rxsoft.admin.template.update',
    },
    rowActions: [
      {
        id: 'preview',
        label: 'Preview',
        icon: Eye,
        onClick: (row) =>
          onPreview({
            name: String(row.name ?? 'Template'),
            type: 'notification',
            kind: String(row.kind ?? ''),
            body: String(row.body ?? ''),
            subject: row.subject ? String(row.subject) : null,
            channel: String(row.channel ?? ''),
          }),
      },
    ],
  };
}
