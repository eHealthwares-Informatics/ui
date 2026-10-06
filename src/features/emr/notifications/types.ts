export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  type: NotificationType | string;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
  sourceEntityRef: string | null;
  read: boolean;
  createdAt: string;
};

export type NotificationSubscriptionPayload = {
  organizationId: string | null;
  locationId: string | null;
};

export type MessageTemplateStatus = 'draft' | 'active' | 'inactive';

export type MessageTemplate = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  content_type: string;
  content: string;
  max_characters?: number | null;
  destinations: string[];
  channel_codes: string[];
  heartbeat_retries: number;
  heartbeat_interval_seconds: number;
  heartbeat_expiry_seconds: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MessageTemplateInput = Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>;

export const CONTENT_TYPE_OPTIONS = [
  { value: 'free_text', label: 'Free text' },
  { value: 'html', label: 'HTML' },
  { value: 'prompt', label: 'Prompt' },
  { value: 'limited_text', label: 'Limited text' },
  { value: 'webpage', label: 'Webpage' },
];

export const DESTINATION_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
  { value: 'inapp', label: 'In-app' },
  { value: 'email', label: 'Email' },
  { value: 'webpage', label: 'Webpage' },
  { value: 'mobile_app', label: 'Mobile app' },
];

export const TEMPLATE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  info: 'blue',
  warning: 'yellow',
  error: 'red',
  success: 'green',
};

export const HEARTBEAT_DEFAULTS = {
  retries: 3,
  intervalSeconds: 30,
  expirySeconds: 86_400,
};

export const DEFAULT_MESSAGE_TEMPLATE: MessageTemplateInput = {
  code: '',
  name: '',
  description: '',
  content_type: 'free_text',
  content: '',
  max_characters: null,
  destinations: ['inapp'],
  channel_codes: [],
  heartbeat_retries: HEARTBEAT_DEFAULTS.retries,
  heartbeat_interval_seconds: HEARTBEAT_DEFAULTS.intervalSeconds,
  heartbeat_expiry_seconds: HEARTBEAT_DEFAULTS.expirySeconds,
  status: 'draft',
};

export function normalizeMessageTemplate(row: Record<string, unknown>): MessageTemplate {
  return {
    id: String(row.id ?? ''),
    code: String(row.code ?? ''),
    name: String(row.name ?? ''),
    description: row.description == null ? '' : String(row.description),
    content_type: String(row.content_type ?? row.contentType ?? 'free_text'),
    content: String(row.content ?? ''),
    max_characters:
      row.max_characters == null && row.maxCharacters == null
        ? null
        : Number(row.max_characters ?? row.maxCharacters),
    destinations: toStringArray(row.destinations),
    channel_codes: toStringArray(row.channel_codes ?? row.channelCodes),
    heartbeat_retries: Number(row.heartbeat_retries ?? row.heartbeatRetries ?? 0),
    heartbeat_interval_seconds: Number(
      row.heartbeat_interval_seconds ?? row.heartbeatIntervalSeconds ?? 0
    ),
    heartbeat_expiry_seconds: Number(
      row.heartbeat_expiry_seconds ?? row.heartbeatExpirySeconds ?? 0
    ),
    status: String(row.status ?? 'draft'),
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
    updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
  };
}

export function toMessageTemplateInput(template: MessageTemplate): MessageTemplateInput {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = template;
  return input;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}
