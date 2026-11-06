import { Badge } from '@mantine/core';
import { Eye } from 'lucide-react';
import { type Column, type FieldGroup, type Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import type { TemplatePreview } from '../templates/preview-modal';

export const PRINT_TEMPLATE_KIND_OPTIONS: Option[] = [
  { value: 'pos_receipt', label: 'POS receipt' },
  { value: 'a4_receipt', label: 'A4 wholesale receipt' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'labresult', label: 'Lab result' },
  { value: 'appointment_notification', label: 'Appointment notification' },
  { value: 'appointment_reschedule', label: 'Appointment Reschedule' },
  { value: 'test_result_accepted', label: 'Test Result accepted' },
  { value: 'test_result_completed', label: 'Test result completed' },
  { value: 'appointment_checkin', label: 'Appointment Check-in' },
  { value: 'appointment_checkout', label: 'Appointment Check-out' },
];

export const PRINT_PAGE_SIZE_OPTIONS: Option[] = [
  { value: 'thermal58', label: 'Thermal 58mm' },
  { value: 'thermal80', label: 'Thermal 80mm' },
  { value: 'a4', label: 'A4' },
];

export const PRINT_CHANNEL_OPTIONS: Option[] = [
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
];

/**
 * Working starter document so a new template prints something sensible before
 * it is customised. Tokens mirror `lib/print-template.ts`.
 */
const STARTER_BODY = `<html>
  <head>
    <style>
      body { font-family: 'Courier New', monospace; font-size: 11px; width: 58mm; margin: 0 auto; }
      h2, .meta { text-align: center; margin: 2px 0; }
      table { width: 100%; border-collapse: collapse; }
      td, th { padding: 2px 4px; }
      .right { text-align: right; }
      hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
    </style>
  </head>
  <body>
    <h2>{{sale.header}}</h2>
    <div class="meta">Receipt #{{sale.number}}</div>
    <div class="meta">{{sale.date}} {{sale.time}}</div>
    <div class="meta">Customer: {{sale.customerName}}</div>
    <hr />
    <table>
      <thead>
        <tr><th>Qty</th><th>Item</th><th class="right">Amount</th></tr>
      </thead>
      <tbody>{{items_rows}}</tbody>
    </table>
    <hr />
    <table>
      {{totals_rows}}
    </table>
    <hr />
    <div class="meta">Thank you for your patronage!</div>
  </body>
</html>`;

function labelFor(options: Option[], value: unknown): string {
  const key = String(value ?? '');
  return options.find((option) => option.value === key)?.label ?? (key || '—');
}

function boolColumn(key: string, label: string, color: string): Column {
  return {
    key,
    label,
    render: (row) =>
      row[key] ? (
        <Badge color={color} variant="light" size="sm">
          Yes
        </Badge>
      ) : (
        <Badge color="gray" variant="light" size="sm">
          No
        </Badge>
      ),
  };
}

const columns: Column[] = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'kind',
    label: 'Document',
    render: (row) => labelFor(PRINT_TEMPLATE_KIND_OPTIONS, row.kind),
  },
  {
    key: 'channel',
    label: 'Channel',
    render: (row) => labelFor(PRINT_CHANNEL_OPTIONS, row.channel),
  },
  {
    key: 'pageSize',
    label: 'Page size',
    render: (row) => labelFor(PRINT_PAGE_SIZE_OPTIONS, row.pageSize),
  },
  boolColumn('isDefault', 'Default', 'green'),
  boolColumn('isActive', 'Active', 'blue'),
  {
    key: 'updatedAt',
    label: 'Updated',
    sortable: true,
    render: (row) => (row.updatedAt ? new Date(String(row.updatedAt)).toLocaleString() : '—'),
  },
];

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  return {
    code: String(values.code ?? '').trim(),
    name: String(values.name ?? '').trim(),
    description: values.description ? String(values.description) : null,
    type: 'print',
    kind: String(values.kind ?? 'pos_receipt'),
    channel: String(values.channel ?? 'sms'),
    pageSize: String(values.pageSize ?? 'thermal58'),
    body: String(values.body ?? ''),
    isDefault: Boolean(values.isDefault),
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
  if (values.pageSize !== undefined) payload.pageSize = String(values.pageSize);
  if (values.body !== undefined) payload.body = String(values.body);
  if (values.isDefault !== undefined) payload.isDefault = Boolean(values.isDefault);
  if (values.isActive !== undefined) payload.isActive = Boolean(values.isActive);
  return payload;
}

function buildFormState(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    code: String(row.code ?? ''),
    name: String(row.name ?? ''),
    description: row.description ? String(row.description) : '',
    kind: String(row.kind ?? 'pos_receipt'),
    pageSize: String(row.pageSize ?? 'thermal58'),
    body: String(row.body ?? ''),
    isDefault: Boolean(row.isDefault),
    isActive: row.isActive !== false,
  };
}

const fieldGroups: FieldGroup[] = [
  {
    title: 'Document',
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true, col: 4 },
      { name: 'name', label: 'Name', type: 'text', required: true, col: 8 },
      {
        name: 'kind',
        label: 'Document',
        type: 'select',
        options: PRINT_TEMPLATE_KIND_OPTIONS,
        col: 6,
      },
      {
        name: 'pageSize',
        label: 'Page size',
        type: 'select',
        options: PRINT_PAGE_SIZE_OPTIONS,
        col: 6,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'text',
        col: 8,
        placeholder: 'Where this layout is used',
      },
      { name: 'isDefault', label: 'Default for this document', type: 'switch', col: 2 },
      { name: 'isActive', label: 'Active', type: 'switch', col: 2 },
    ],
  },
  {
    title: 'Layout',
    description:
      'Full HTML document. Placeholders: {{sale.number}}, {{sale.header}}, {{sale.customerName}}, {{sale.date}}, {{sale.time}}, {{sale.subtotal}}, {{sale.discount}}, {{sale.vat}}, {{sale.total}}, {{sale.paid}}, {{sale.change}}, plus the row blocks {{items_rows}} and {{totals_rows}}.',
    fields: [
      {
        name: 'body',
        label: 'HTML',
        type: 'textarea',
        required: true,
        col: 12,
        placeholder: STARTER_BODY,
      },
    ],
  },
];

export function buildPrintTemplatesConfig(
  onPreview: (preview: TemplatePreview) => void
): ModelConfig {
  return {
    id: 'print-templates',
    title: 'Print Templates',
    description:
      'Receipt, invoice and wholesale layouts. The active default for a document is what the POS prints.',
    endpoint: '/templates',
    apiProvider: conversationApi,
    queryKeyBase: ['rxsoft', 'templates', 'print'],
    listParams: { type: 'print' },
    columns,
    createFieldGroups: fieldGroups,
    modalTitle: 'Print Template',
    defaultState: {
      code: '',
      name: '',
      description: '',
      kind: 'pos_receipt',
      pageSize: 'thermal58',
      body: STARTER_BODY,
      isDefault: false,
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
            type: 'print',
            kind: String(row.kind ?? 'pos_receipt'),
            body: String(row.body ?? ''),
          }),
      },
    ],
  };
}
