import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { EQUALS_WITH_OPTIONS, FILTERS, type Column, type Field } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { notificationDetailHref, shortId } from '../notification-detail/link';

export type TemplateRow = {
  id: string;
  organizationId: string | null;
  code: string;
  name: string;
  description: string | null;
  enabled: boolean;
  /** Send this template as the WhatsApp 24h-window consent fallback. */
  sendConsentTemplate?: boolean;
  bodies: Record<string, any>;
  updatedAt?: string;
};

type ParamSpec = {
  source: 'attribute' | 'array';
  key: string;
  /** Meta named-template placeholder, e.g. customer_name (named format only). */
  parameterName?: string;
  itemKey?: string;
  mode?: 'expand' | 'join';
  joinWith?: string;
  mediaType?: string;
  format?: string;
  sampleOrFallback?: string;
};

type ComponentSpec = {
  type: 'header' | 'body' | 'button';
  headerType?: 'text' | 'image' | 'video' | 'document';
  subType?: 'url' | 'quick_reply' | 'copy_code';
  index?: string;
  parameters: ParamSpec[];
};

export type TemplateForm = {
  code: string;
  name: string;
  description: string;
  enabled: boolean;
  whatsappBody: string;
  whatsappTemplateName: string;
  whatsappTemplateLanguage: string;
  whatsappTemplateBody: string;
  parameterFormat: 'positional' | 'named';
  sendConsentTemplate: boolean;
  components: ComponentSpec[];
  smsBody: string;
  emailSubject: string;
  emailBody: string;
  emailHtml: string;
  a4PrintBody: string;
  posPrintBody: string;
};

const EMPTY_FORM: TemplateForm = {
  code: '',
  name: '',
  description: '',
  enabled: true,
  whatsappBody: '',
  whatsappTemplateName: '',
  whatsappTemplateLanguage: 'en',
  whatsappTemplateBody: '',
  parameterFormat: 'positional',
  sendConsentTemplate: false,
  components: [],
  smsBody: '',
  emailSubject: '',
  emailBody: '',
  emailHtml: '',
  a4PrintBody: '',
  posPrintBody: '',
};

const BODY_KEYS: Array<keyof TemplateForm> = [
  'whatsappBody',
  'whatsappTemplateName',
  'whatsappTemplateLanguage',
  'whatsappTemplateBody',
  'parameterFormat',
  'components',
  'smsBody',
  'emailSubject',
  'emailBody',
  'emailHtml',
  'a4PrintBody',
  'posPrintBody',
];

function fromRow(row: TemplateRow | Record<string, unknown>): TemplateForm {
  const source = row as TemplateRow;
  const bodies = source.bodies ?? {};
  const template = bodies.whatsapp_template ?? {};
  return {
    code: source.code ?? '',
    name: source.name ?? '',
    description: source.description ?? '',
    enabled: source.enabled !== false,
    whatsappBody: String(bodies.whatsapp?.body ?? ''),
    whatsappTemplateName: String(template.name ?? ''),
    whatsappTemplateLanguage: String(template.language ?? 'en'),
    whatsappTemplateBody: String(template.body ?? ''),
    parameterFormat: template.parameterFormat === 'named' ? 'named' : 'positional',
    sendConsentTemplate: source.sendConsentTemplate === true,
    components: Array.isArray(template.components)
      ? template.components.map((component: any) => ({
          ...component,
          parameters: (Array.isArray(component?.parameters) ? component.parameters : []).map(
            (parameter: any) => {
              // Normalise legacy/Meta field names into the editor's canonical shape.
              const { sampleValue, sample_or_fallback, parameter_name, ...rest } = parameter ?? {};
              const parameterName = parameter?.parameterName ?? parameter_name;
              return {
                ...rest,
                // Named templates send the field key as parameter_name; surface a
                // legacy per-parameter name there so older rows remain editable.
                itemKey: rest.itemKey ?? parameterName,
                parameterName,
                sampleOrFallback: parameter?.sampleOrFallback ?? sample_or_fallback ?? sampleValue,
              };
            }
          ),
        }))
      : [],
    smsBody: String(bodies.sms?.body ?? ''),
    emailSubject: String(bodies.email?.subject ?? ''),
    emailBody: String(bodies.email?.body ?? ''),
    emailHtml: String(bodies.email?.html ?? ''),
    a4PrintBody: String(bodies.a4_print?.body ?? ''),
    posPrintBody: String(bodies.pos_print?.body ?? ''),
  };
}

function toBodies(form: TemplateForm) {
  return {
    whatsapp: { body: form.whatsappBody },
    whatsapp_template: {
      name: form.whatsappTemplateName || 'notification_generic',
      language: form.whatsappTemplateLanguage || 'en',
      body: form.whatsappTemplateBody || form.whatsappBody,
      parameterFormat: form.parameterFormat,
      components: form.components,
    },
    sms: { body: form.smsBody },
    sms_proxy: { body: form.smsBody },
    email: {
      subject: form.emailSubject || null,
      body: form.emailBody,
      ...(form.emailHtml ? { html: form.emailHtml } : {}),
    },
    a4_print: { body: form.a4PrintBody },
    pos_print: { body: form.posPrintBody },
  };
}

const enabledFilter = EQUALS_WITH_OPTIONS([
  { value: 'true', label: 'Enabled' },
  { value: 'false', label: 'Disabled' },
]);

function TemplateEnabledSwitch({
  row,
  canManageGlobal,
}: {
  row: Record<string, unknown>;
  canManageGlobal: boolean;
}) {
  const queryClient = useQueryClient();
  const template = row as TemplateRow;
  const enabled = template.enabled !== false;
  const organizationId = template.organizationId ?? null;
  const disabled = !canManageGlobal && !organizationId;

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      await conversationApi.patch(
        `/notification-templates/${template.id}`,
        { enabled: next, organizationId },
        organizationId ? { params: { organizationId } } : undefined
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: (error) => notifications.show({ color: 'red', message: getApiErrorMessage(error) }),
  });

  return (
    <Group gap="xs" wrap="nowrap">
      <Switch
        size="sm"
        aria-label={`Toggle ${template.name}`}
        checked={enabled}
        disabled={disabled || mutation.isPending}
        onChange={(event) => mutation.mutate(event.currentTarget.checked)}
      />
      <Text size="xs" c="dimmed">
        {enabled ? 'Enabled' : 'Disabled'}
      </Text>
    </Group>
  );
}

function buildColumns(canManageGlobal: boolean): Column[] {
  return [
    {
      key: 'id',
      label: 'ID',
      render: (row) => (
        <Anchor
          href={notificationDetailHref('notification-templates', row)}
          target="_blank"
          rel="noreferrer"
          size="xs"
          ff="monospace"
          title={String(row.id ?? '')}
        >
          {shortId(row.id)}
        </Anchor>
      ),
    },
    { key: 'code', label: 'Code', sortable: true, filters: [FILTERS.CONTAINS, FILTERS.EQUALS] },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filters: [FILTERS.CONTAINS, FILTERS.EQUALS],
      render: (row) => (
        <Group gap="xs" wrap="nowrap">
          <Text size="sm">{String(row.name ?? '')}</Text>
          {row.organizationId ? null : (
            <Badge size="xs" color="gray" variant="light">
              global
            </Badge>
          )}
        </Group>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      filters: [FILTERS.CONTAINS],
      render: (row) => (
        <Text size="xs" c="dimmed" lineClamp={2} maw={420}>
          {String(row.description ?? '—')}
        </Text>
      ),
    },
    {
      key: 'enabled',
      label: 'Enabled',
      sortable: true,
      filters: enabledFilter,
      render: (row) => <TemplateEnabledSwitch row={row} canManageGlobal={canManageGlobal} />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (row) => (row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'),
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      render: (row) => (row.updatedAt ? new Date(String(row.updatedAt)).toLocaleString() : '—'),
    },
  ];
}

const createFields: Field[] = [
  {
    name: 'organizationId',
    label: 'Organisation',
    type: 'hidden',
  },
  {
    name: 'code',
    label: 'Code',
    required: true,
    col: 6,
    placeholder: 'order_confirmation',
  },
  { name: 'name', label: 'Name', required: true, col: 6 },
  { name: 'description', label: 'Description', type: 'textarea', col: 12 },
  { name: 'enabled', label: 'Enabled', type: 'switch', col: 6, defaultValue: true },
];

function TemplateBodiesEditor({
  formState,
  updateField,
}: {
  formState: Record<string, unknown>;
  updateField: (name: string, value: unknown) => void;
}) {
  const form = { ...EMPTY_FORM, ...(formState as unknown as TemplateForm) };

  const setForm = (patch: Partial<TemplateForm>) => {
    for (const [key, value] of Object.entries(patch)) {
      updateField(key, value);
    }
  };

  const updateComponent = (index: number, patch: Partial<ComponentSpec>) => {
    setForm({
      components: form.components.map((component, i) =>
        i === index ? { ...component, ...patch } : component
      ),
    });
  };

  const updateParameter = (ci: number, pi: number, patch: Partial<ParamSpec>) => {
    setForm({
      components: form.components.map((component, i) =>
        i === ci
          ? {
              ...component,
              parameters: component.parameters.map((parameter, j) =>
                j === pi ? { ...parameter, ...patch } : parameter
              ),
            }
          : component
      ),
    });
  };

  const addComponent = (type: ComponentSpec['type']) => {
    setForm({
      components: [
        ...form.components,
        {
          type,
          headerType: type === 'header' ? 'text' : undefined,
          subType: type === 'button' ? 'url' : undefined,
          index: type === 'button' ? '0' : undefined,
          parameters: [{ source: 'attribute', key: '' }],
        },
      ],
    });
  };

  const addParameter = (ci: number) => {
    setForm({
      components: form.components.map((component, i) =>
        i === ci
          ? {
              ...component,
              parameters: [...component.parameters, { source: 'attribute', key: '' }],
            }
          : component
      ),
    });
  };

  return (
    <Tabs defaultValue="whatsapp" variant="outline">
      <Tabs.List>
        <Tabs.Tab value="whatsapp">WhatsApp</Tabs.Tab>
        <Tabs.Tab value="whatsapp_template">WhatsApp Template</Tabs.Tab>
        <Tabs.Tab value="sms">SMS</Tabs.Tab>
        <Tabs.Tab value="email">Email</Tabs.Tab>
        <Tabs.Tab value="a4_print">A4 Print</Tabs.Tab>
        <Tabs.Tab value="pos_print">POS Print</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="whatsapp" pt="md">
        <Textarea
          label="WhatsApp message"
          description="Free-form WhatsApp body. Placeholders: {{customer.name}}, {{order.number}}."
          minRows={6}
          value={form.whatsappBody}
          onChange={(event) => setForm({ whatsappBody: event.currentTarget.value })}
        />
      </Tabs.Panel>

      <Tabs.Panel value="whatsapp_template" pt="md">
        <Stack>
          <Group grow>
            <TextInput
              label="Template name"
              value={form.whatsappTemplateName}
              onChange={(event) => setForm({ whatsappTemplateName: event.currentTarget.value })}
            />
            <TextInput
              label="Language"
              value={form.whatsappTemplateLanguage}
              onChange={(event) => setForm({ whatsappTemplateLanguage: event.currentTarget.value })}
            />
            <Select
              label="Parameter format"
              description="Named sends each parameter's field key as its Meta parameter_name."
              data={[
                { value: 'positional', label: 'Positional ({{1}})' },
                { value: 'named', label: 'Named ({{name}})' },
              ]}
              value={form.parameterFormat}
              onChange={(value) =>
                setForm({
                  parameterFormat: (value as TemplateForm['parameterFormat']) ?? 'positional',
                })
              }
            />
          </Group>
          <Textarea
            label="Fallback text"
            minRows={3}
            value={form.whatsappTemplateBody}
            onChange={(event) => setForm({ whatsappTemplateBody: event.currentTarget.value })}
          />

          <Switch
            label="Use as WhatsApp consent template"
            description="Outside the 24-hour window, send this template (its name + parameters) to open the window. When off, the channel's CONSENT_TEMPLATE is used as the final fallback."
            checked={form.sendConsentTemplate}
            onChange={(event) => setForm({ sendConsentTemplate: event.currentTarget.checked })}
          />

          <Group justify="space-between">
            <Text size="sm" fw={600}>
              Components
            </Text>
            <Group gap="xs">
              <Button size="compact-xs" variant="light" onClick={() => addComponent('header')}>
                + Header
              </Button>
              <Button size="compact-xs" variant="light" onClick={() => addComponent('body')}>
                + Body
              </Button>
              <Button size="compact-xs" variant="light" onClick={() => addComponent('button')}>
                + Button
              </Button>
            </Group>
          </Group>

          {form.components.map((component, ci) => (
            <Paper key={`${component.type}-${ci}`} withBorder p="sm" radius="sm">
              <Group justify="space-between" mb="xs">
                <Group grow>
                  <Select
                    label="Component"
                    data={[
                      { value: 'header', label: 'Header' },
                      { value: 'body', label: 'Body' },
                      { value: 'button', label: 'Button' },
                    ]}
                    value={component.type}
                    onChange={(value) =>
                      updateComponent(ci, { type: (value as ComponentSpec['type']) ?? 'body' })
                    }
                  />
                  {component.type === 'header' && (
                    <Select
                      label="Header type"
                      data={['text', 'image', 'video', 'document'].map((value) => ({
                        value,
                        label: value,
                      }))}
                      value={component.headerType ?? 'text'}
                      onChange={(value) =>
                        updateComponent(ci, {
                          headerType: (value as ComponentSpec['headerType']) ?? 'text',
                        })
                      }
                    />
                  )}
                  {component.type === 'button' && (
                    <>
                      <Select
                        label="Button type"
                        data={[
                          { value: 'url', label: 'URL' },
                          { value: 'quick_reply', label: 'Quick reply' },
                          { value: 'copy_code', label: 'Copy code' },
                        ]}
                        value={component.subType ?? 'url'}
                        onChange={(value) =>
                          updateComponent(ci, {
                            subType: (value as ComponentSpec['subType']) ?? 'url',
                          })
                        }
                      />
                      <TextInput
                        label="Index"
                        value={component.index ?? '0'}
                        onChange={(event) =>
                          updateComponent(ci, { index: event.currentTarget.value })
                        }
                      />
                    </>
                  )}
                </Group>
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() =>
                    setForm({
                      components: form.components.filter((_, index) => index !== ci),
                    })
                  }
                >
                  <Trash2 size={14} />
                </ActionIcon>
              </Group>

              <Stack gap="xs">
                {component.parameters.map((parameter, pi) => (
                  <Group key={pi} align="flex-end" gap="xs" wrap="nowrap">
                    <Select
                      label="Source"
                      data={[
                        { value: 'attribute', label: 'Attribute' },
                        { value: 'array', label: 'Array' },
                      ]}
                      value={parameter.source}
                      onChange={(value) =>
                        updateParameter(ci, pi, {
                          source: (value as ParamSpec['source']) ?? 'attribute',
                        })
                      }
                    />
                    <TextInput
                      label="Context key"
                      placeholder="customer.name"
                      value={parameter.key}
                      onChange={(event) =>
                        updateParameter(ci, pi, { key: event.currentTarget.value })
                      }
                    />
                    <TextInput
                      label={
                        form.parameterFormat === 'named'
                          ? 'Parameter name'
                          : parameter.source === 'array'
                            ? 'Item key'
                            : 'Field key'
                      }
                      placeholder={
                        form.parameterFormat === 'named'
                          ? 'customer_name'
                          : parameter.source === 'array'
                            ? 'name'
                            : '(optional)'
                      }
                      description={
                        form.parameterFormat === 'named'
                          ? 'Sent as Meta parameter_name (and plucks this field from object values).'
                          : undefined
                      }
                      required={form.parameterFormat === 'named'}
                      value={parameter.itemKey ?? ''}
                      onChange={(event) =>
                        updateParameter(ci, pi, { itemKey: event.currentTarget.value })
                      }
                    />
                    {parameter.source === 'array' && (
                      <>
                        <Select
                          label="Mode"
                          data={[
                            { value: 'expand', label: 'Expand' },
                            { value: 'join', label: 'Join' },
                          ]}
                          value={parameter.mode ?? 'expand'}
                          onChange={(value) =>
                            updateParameter(ci, pi, {
                              mode: (value as ParamSpec['mode']) ?? 'expand',
                            })
                          }
                        />
                        <TextInput
                          label="Join with"
                          value={parameter.joinWith ?? ', '}
                          onChange={(event) =>
                            updateParameter(ci, pi, { joinWith: event.currentTarget.value })
                          }
                        />
                      </>
                    )}
                    <TextInput
                      label="Sample"
                      value={parameter.sampleOrFallback ?? ''}
                      onChange={(event) =>
                        updateParameter(ci, pi, {
                          sampleOrFallback: event.currentTarget.value,
                        })
                      }
                    />
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() =>
                        updateComponent(ci, {
                          parameters: component.parameters.filter((_, index) => index !== pi),
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </ActionIcon>
                  </Group>
                ))}
                <Button size="compact-xs" variant="subtle" onClick={() => addParameter(ci)}>
                  + Parameter
                </Button>
              </Stack>
            </Paper>
          ))}

          <Text size="xs" c="dimmed">
            Attribute sends one value; Array with Expand sends consecutive parameters, Join sends
            one joined parameter. Field key optionally plucks a property from an object (works for
            both Attribute and Array items). For Named templates, the field key is sent as the Meta
            parameter_name — one value per parameter, so use Attribute or Array + Join (Array +
            Expand is positional-only). Header media needs an image/video/document URL in the
            context key.
          </Text>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="sms" pt="md">
        <Textarea
          label="SMS message"
          description="SMS Proxy reuses this body."
          minRows={5}
          value={form.smsBody}
          onChange={(event) => setForm({ smsBody: event.currentTarget.value })}
        />
      </Tabs.Panel>

      <Tabs.Panel value="email" pt="md">
        <Stack>
          <TextInput
            label="Subject"
            value={form.emailSubject}
            onChange={(event) => setForm({ emailSubject: event.currentTarget.value })}
          />
          <Textarea
            label="Email body"
            minRows={6}
            value={form.emailBody}
            onChange={(event) => setForm({ emailBody: event.currentTarget.value })}
          />
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="a4_print" pt="md">
        <Stack>
          <Text size="sm" c="dimmed">
            HTML layout rendered to an A4 PDF when this template is dispatched. Use the same{' '}
            <code>{'{{tokens}}'}</code> as the message bodies.
          </Text>
          <Textarea
            label="A4 print HTML"
            minRows={12}
            autosize
            value={form.a4PrintBody}
            onChange={(event) => setForm({ a4PrintBody: event.currentTarget.value })}
            placeholder="<html><body><h1>Invoice {{invoiceNo}}</h1></body></html>"
          />
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="pos_print" pt="md">
        <Stack>
          <Text size="sm" c="dimmed">
            HTML layout rendered to a POS/thermal PDF when this template is dispatched. Define{' '}
            <code>@page {'{ size: 80mm auto; margin: 0; }'}</code> in the document styles for a
            continuous receipt.
          </Text>
          <Textarea
            label="POS print HTML"
            minRows={12}
            autosize
            value={form.posPrintBody}
            onChange={(event) => setForm({ posPrintBody: event.currentTarget.value })}
            placeholder="<html><head><style>@page { size: 80mm auto; margin: 0; }</style></head><body>…</body></html>"
          />
        </Stack>
      </Tabs.Panel>
    </Tabs>
  );
}

export function buildNotificationTemplatesConfig(args: {
  organizationId: string | null;
  scopeKey?: string;
  scopeParams?: Record<string, string>;
  canManageGlobal?: boolean;
}): ModelConfig {
  const {
    organizationId,
    scopeKey = organizationId ?? 'global',
    scopeParams = {},
    canManageGlobal = false,
  } = args;

  const buildCreatePayload = (values: Record<string, unknown>) => {
    const form = { ...EMPTY_FORM, ...(values as unknown as TemplateForm) };
    return {
      organizationId: values.organizationId ?? organizationId ?? null,
      code: String(form.code ?? '').trim(),
      name: String(form.name ?? '').trim(),
      description: String(form.description ?? '').trim() || null,
      enabled: form.enabled !== false,
      sendConsentTemplate: form.sendConsentTemplate === true,
      bodies: toBodies(form),
    };
  };

  const buildUpdatePayload = (values: Record<string, unknown>, row?: Record<string, unknown>) => {
    const base = fromRow(row ?? {});
    const merged = { ...base };
    for (const key of BODY_KEYS) {
      if (values[key] !== undefined) {
        (merged as Record<string, unknown>)[key] = values[key];
      }
    }

    // `row.organizationId` is null for a global default — that null must be
    // preserved instead of falling back to the selected organisation, or the
    // PATCH scopes to the org and the global row 404s.
    const scopeOrganizationId =
      row && 'organizationId' in row
        ? ((row.organizationId as string | null | undefined) ?? null)
        : (organizationId ?? null);
    const payload: Record<string, unknown> = {
      organizationId: scopeOrganizationId,
    };
    if (values.code !== undefined) payload.code = String(values.code).trim();
    if (values.name !== undefined) payload.name = String(values.name).trim();
    if (values.description !== undefined) {
      payload.description = String(values.description).trim() || null;
    }
    if (values.enabled !== undefined) payload.enabled = values.enabled !== false;
    if (values.sendConsentTemplate !== undefined) {
      payload.sendConsentTemplate = values.sendConsentTemplate === true;
    }
    if (BODY_KEYS.some((key) => values[key] !== undefined)) {
      payload.bodies = toBodies(merged);
    }
    return payload;
  };

  const buildFormState = (row: Record<string, unknown>) => ({
    organizationId:
      'organizationId' in row ? (row.organizationId ?? null) : (organizationId ?? null),
    ...fromRow(row),
  });

  return {
    id: 'notification-templates',
    title: 'Notification Templates',
    description: 'One template per event-sourced message, with copy for every channel type.',
    endpoint: '/notification-templates',
    apiProvider: conversationApi,
    listParamStyle: 'plain',
    queryKeyBase: ['notification-templates', scopeKey],
    listParams: {
      ...scopeParams,
    },
    columns: buildColumns(canManageGlobal),
    createFields,
    modalTitle: 'Notification template',
    buildCreatePayload,
    buildUpdatePayload,
    buildFormState,
    defaultState: {
      organizationId,
      ...EMPTY_FORM,
    },
    renderCreateExtras: ({ formState, updateField }) => (
      <Stack gap="md">
        <TemplateBodiesEditor formState={formState} updateField={updateField} />
      </Stack>
    ),
    defaultSort: { sortBy: 'updatedAt', sortOrder: 'desc' },
    canDelete: true,
    copyRowIdOnSn: true,
    canDeleteRow: (row) => canManageGlobal || row.organizationId != null,
    deletePathBuilder: (row) =>
      `/notification-templates/${row.id}${
        row.organizationId
          ? `?organizationId=${encodeURIComponent(String(row.organizationId))}`
          : ''
      }`,
  };
}

export type { ParamSpec, ComponentSpec };
export { EMPTY_FORM, TemplateBodiesEditor, fromRow, toBodies };
