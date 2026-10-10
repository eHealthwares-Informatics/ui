import type { Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

/**
 * Notification dispatch history — the sender-app copy of every notification the
 * LIS emitted through the conversations module (issues #109–#111). Each row is
 * a LIS dispatch ledger entry with the linked conversation exchange id.
 */
const columns: Column[] = [
  { key: 'eventKey', label: 'Event' },
  {
    key: 'audience',
    label: 'Audience',
    render: (row: any) => row.audience ?? '-',
  },
  {
    key: 'channelType',
    label: 'Channel',
    render: (row: any) => channelLabel(row.channelCode ?? row.channelType),
  },
  { key: 'recipientAddress', label: 'Recipient' },
  {
    key: 'status',
    label: 'Status',
    render: (row: any) => row.status ?? 'PENDING',
  },
  { key: 'sentAt', label: 'Sent At', dataType: 'DATETIME' as any },
  {
    key: 'relatedEntity',
    label: 'Related Entity',
    render: (row: any) =>
      row.relatedEntityId
        ? `${row.relatedEntityType ?? 'Entity'}: ${row.relatedEntityId.slice(0, 8)}…`
        : '-',
  },
  {
    key: 'retry',
    label: 'Attempts',
    render: (row: any) => String(row.attempts ?? 0),
  },
];

function channelLabel(code: string | null | undefined): string {
  if (!code) return '-';
  return code
    .replace('LIS_', '')
    .replace('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const notificationsConfig: ModelConfig = {
  id: 'notifications',
  title: 'Notification History',
  description:
    'Every notification the LIS dispatched through the conversations module (SMS, WhatsApp, Email), with delivery status.',
  endpoint: '/lis/notifications/dispatches',
  columns,
  // Ledger is system-written: no create/edit/delete in the UI.
  canCreate: false,
  canDelete: false,
  canExport: false,
  defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
  buildCreatePayload: (v) => v,
  buildUpdatePayload: (v) => v,
};
