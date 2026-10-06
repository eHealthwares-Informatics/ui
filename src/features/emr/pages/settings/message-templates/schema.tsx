import { Badge } from '@mantine/core';
import { type Column, type FieldGroup, type Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { dateTimeCol } from '../../../lib/emr-columns';
import {
  CONTENT_TYPE_OPTIONS,
  DEFAULT_MESSAGE_TEMPLATE,
  DESTINATION_OPTIONS,
  HEARTBEAT_DEFAULTS,
  TEMPLATE_STATUS_OPTIONS,
  normalizeMessageTemplate,
} from '../../../notifications/types';

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  draft: 'gray',
  inactive: 'red',
};

function labelFor(options: Option[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/** multi-pick form values are Option[]; API wants string[] */
function toCodeArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === 'string' ? item : ((item as Option | null)?.value ?? '')))
    .filter(Boolean);
}

function toOptionArray(values: unknown, options: Option[] = []): Option[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .map((item) => {
      if (typeof item === 'string') {
        return { value: item, label: labelFor(options, item) };
      }
      const option = item as Option | null;
      if (!option?.value) {
        return null;
      }
      return {
        value: String(option.value),
        label: option.label || labelFor(options, String(option.value)),
      };
    })
    .filter((item): item is Option => item !== null);
}

function numberOr(value: unknown, fallback: number): number {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  const isLimitedText = String(values.content_type ?? 'free_text') === 'limited_text';
  const maxRaw = values.max_characters;
  return {
    code: String(values.code ?? '').trim(),
    name: String(values.name ?? '').trim(),
    description: values.description == null ? '' : String(values.description),
    content_type: String(values.content_type ?? 'free_text'),
    content: String(values.content ?? ''),
    max_characters:
      isLimitedText && maxRaw !== null && maxRaw !== undefined && maxRaw !== ''
        ? Number(maxRaw)
        : null,
    destinations: toCodeArray(values.destinations),
    channel_codes: toCodeArray(values.channel_codes),
    heartbeat_retries: numberOr(values.heartbeat_retries, HEARTBEAT_DEFAULTS.retries),
    heartbeat_interval_seconds: numberOr(
      values.heartbeat_interval_seconds,
      HEARTBEAT_DEFAULTS.intervalSeconds
    ),
    heartbeat_expiry_seconds: numberOr(
      values.heartbeat_expiry_seconds,
      HEARTBEAT_DEFAULTS.expirySeconds
    ),
    status: String(values.status ?? 'draft'),
  };
}

/** Only send keys present in the (dirty) form values so PATCH stays partial-safe. */
function buildUpdatePayload(values: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (values.code !== undefined) payload.code = String(values.code).trim();
  if (values.name !== undefined) payload.name = String(values.name).trim();
  if (values.description !== undefined) {
    payload.description = values.description == null ? '' : String(values.description);
  }
  if (values.content_type !== undefined) {
    payload.content_type = String(values.content_type);
  }
  if (values.content !== undefined) payload.content = String(values.content);
  if (values.max_characters !== undefined) {
    const isLimitedText =
      values.content_type !== undefined ? String(values.content_type) === 'limited_text' : true;
    payload.max_characters =
      isLimitedText && values.max_characters != null && values.max_characters !== ''
        ? Number(values.max_characters)
        : null;
  }
  if (values.destinations !== undefined) payload.destinations = toCodeArray(values.destinations);
  if (values.channel_codes !== undefined) {
    payload.channel_codes = toCodeArray(values.channel_codes);
  }
  if (values.heartbeat_retries !== undefined) {
    payload.heartbeat_retries = numberOr(values.heartbeat_retries, HEARTBEAT_DEFAULTS.retries);
  }
  if (values.heartbeat_interval_seconds !== undefined) {
    payload.heartbeat_interval_seconds = numberOr(
      values.heartbeat_interval_seconds,
      HEARTBEAT_DEFAULTS.intervalSeconds
    );
  }
  if (values.heartbeat_expiry_seconds !== undefined) {
    payload.heartbeat_expiry_seconds = numberOr(
      values.heartbeat_expiry_seconds,
      HEARTBEAT_DEFAULTS.expirySeconds
    );
  }
  if (values.status !== undefined) payload.status = String(values.status);
  return payload;
}

function buildFormState(row: Record<string, unknown>, channelOptions: Option[] = []) {
  const template = normalizeMessageTemplate(row);
  return {
    id: template.id,
    code: template.code,
    name: template.name,
    description: template.description ?? '',
    content_type: template.content_type,
    content: template.content,
    max_characters: template.max_characters,
    destinations: toOptionArray(template.destinations, DESTINATION_OPTIONS),
    channel_codes: toOptionArray(template.channel_codes, channelOptions),
    heartbeat_retries: template.heartbeat_retries,
    heartbeat_interval_seconds: template.heartbeat_interval_seconds,
    heartbeat_expiry_seconds: template.heartbeat_expiry_seconds,
    status: template.status,
  };
}

function buildDefaultState(): Record<string, unknown> {
  return buildFormState(
    {
      ...DEFAULT_MESSAGE_TEMPLATE,
      destinations: DEFAULT_MESSAGE_TEMPLATE.destinations,
    },
    []
  );
}

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'content_type',
    label: 'Content type',
    render: (row) => labelFor(CONTENT_TYPE_OPTIONS, String(row.content_type ?? 'free_text')),
  },
  {
    key: 'destinations',
    label: 'Destinations',
    render: (row) => {
      const destinations = toCodeArray(normalizeMessageTemplate(row).destinations);
      return destinations.length
        ? destinations.map((code) => labelFor(DESTINATION_OPTIONS, code)).join(', ')
        : '—';
    },
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => {
      const status = String(row.status ?? 'draft');
      return (
        <Badge color={STATUS_COLORS[status] ?? 'gray'} variant="light">
          {status}
        </Badge>
      );
    },
  },
  dateTimeCol('createdAt', 'Created'),
];

/**
 * Schema-forms config for EMR message templates.
 *
 * Uses DataPageShell + ModalDataForm (same pattern as tags/departments).
 * Channel codes are multi-pick with options loaded from the communication
 * module — pass them in via buildMessageTemplatesConfig(channelOptions).
 *
 * Pragmatic deviations from the hand-rolled Phase 1 form:
 * - max_characters is always visible (optional); cleared for non-limited_text
 *   in the payload rather than conditionally rendered
 * - live character counter not available on the shared textarea field
 * - content length vs max_characters is enforced server-side / follow-up
 */
export function buildMessageTemplatesConfig(channelOptions: Option[] = []): ModelConfig {
  const fieldGroups: FieldGroup[] = [
    {
      title: 'Template',
      fields: [
        { name: 'code', label: 'Code', type: 'text', required: true, col: 6 },
        { name: 'name', label: 'Name', type: 'text', required: true, col: 6 },
        {
          name: 'content_type',
          label: 'Content type',
          type: 'select',
          options: CONTENT_TYPE_OPTIONS,
          col: 6,
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: TEMPLATE_STATUS_OPTIONS,
          col: 6,
        },
        {
          name: 'content',
          label: 'Content',
          type: 'textarea',
          required: true,
          col: 12,
          placeholder: 'Message body…',
        },
        {
          name: 'max_characters',
          label: 'Max characters (limited_text)',
          type: 'number',
          min: 1,
          col: 6,
        },
        {
          name: 'destinations',
          label: 'Destinations',
          type: 'multi-pick',
          options: DESTINATION_OPTIONS,
          col: 6,
          placeholder: 'Add destination',
        },
        {
          name: 'channel_codes',
          label: 'Channel codes',
          type: 'multi-pick',
          options: channelOptions,
          col: 12,
          placeholder: channelOptions.length ? 'Add channel' : 'No channels found',
        },
        {
          name: 'heartbeat_retries',
          label: 'Heartbeat retries',
          type: 'number',
          min: 0,
          col: 4,
        },
        {
          name: 'heartbeat_interval_seconds',
          label: 'Interval (seconds)',
          type: 'number',
          min: 1,
          col: 4,
        },
        {
          name: 'heartbeat_expiry_seconds',
          label: 'Expiry (seconds)',
          type: 'number',
          min: 1,
          col: 4,
        },
      ],
    },
  ];

  return {
    id: 'message-templates',
    title: 'Message Templates',
    description: 'Configure notification message templates and delivery settings.',
    endpoint: '/message-templates',
    apiProvider: emrApi,
    queryKeyBase: ['emr', 'message-templates'],
    columns,
    createFieldGroups: fieldGroups,
    modalTitle: 'Message Template',
    defaultState: buildDefaultState(),
    buildFormState: (row) => buildFormState(row, channelOptions),
    buildCreatePayload: buildPayload,
    buildUpdatePayload,
    defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
    canDelete: true,
  };
}

/** Static config without remote channel options (list-only / tests). */
export const messageTemplatesConfig: ModelConfig = buildMessageTemplatesConfig();
