import {
  ActionIcon,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Image,
  Loader,
  NumberInput,
  PasswordInput,
  Radio,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { rxsoftApi } from '@/lib/rxsoft-api';

type ChannelType = 'email' | 'sms' | 'whatsapp';
type NotificationChannel = { id: string; label: string; type: ChannelType; code?: string | null };

type OrganisationConfig = {
  id: string;
  organizationId: string;
  posHeader: string | null;
  websiteName: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWhatsApp: string | null;
  contactAddress: string | null;
  defaultPriceListId: string | null;
  defaultLoginTimeoutMinutes: number;
  defaultAllowPos: boolean;
  defaultAllowA4Print: boolean;
  notificationChannels: NotificationChannel[];
  /** Per-org SMTP overrides; null fields fall back to the system config. */
  emailSmtpHost: string | null;
  emailSmtpPort: number | null;
  emailSmtpSecure: boolean | null;
  emailSmtpUser: string | null;
  emailSmtpPasswordSet: boolean;
  emailFrom: string | null;
};

type OrgOption = { id: string; name: string; code?: string };
type PriceListOption = { id: string; name: string; code?: string; isDefault?: boolean };

type Draft = {
  posHeader: string;
  websiteName: string;
  logoUrl: string;
  contactPhone: string;
  contactEmail: string;
  contactWhatsApp: string;
  contactAddress: string;
  defaultPriceListId: string | null;
  defaultLoginTimeoutMinutes: number | string;
  defaultAllowPos: boolean;
  defaultAllowA4Print: boolean;
  /** Channel codes staff pick from when sending a payment link to a customer. */
  notificationChannels: Array<{ id: string; label: string; type: ChannelType; code: string }>;
  /** Per-org SMTP overrides. Empty strings mean "use the system config". */
  emailSmtpHost: string;
  emailSmtpPort: number | string;
  emailSmtpSecure: boolean;
  emailSmtpUser: string;
  /** Only sent when the user types a new value; blank keeps the stored password. */
  emailSmtpPassword: string;
  emailFrom: string;
};

const emptyDraft: Draft = {
  posHeader: '',
  websiteName: '',
  logoUrl: '',
  contactPhone: '',
  contactEmail: '',
  contactWhatsApp: '',
  contactAddress: '',
  defaultPriceListId: null,
  defaultLoginTimeoutMinutes: 480,
  defaultAllowPos: true,
  defaultAllowA4Print: false,
  notificationChannels: [],
  emailSmtpHost: '',
  emailSmtpPort: 587,
  emailSmtpSecure: false,
  emailSmtpUser: '',
  emailSmtpPassword: '',
  emailFrom: '',
};

export function RxOrganisationConfigPage() {
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const { data: organizations = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ['config', 'organizations'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/organizations', { params: { limit: 200 } });
      return (data?.data ?? data ?? []) as OrgOption[];
    },
    staleTime: 300_000,
  });

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['organisation-config', organizationId],
    enabled: !!organizationId,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data } = await rxsoftApi.get(
        `/organisation-config/by-organization/${organizationId}`
      );
      return data as OrganisationConfig;
    },
  });

  // Price lists of the selected organisation — candidates for the storefront
  // default price list.
  const { data: priceLists = [], isLoading: loadingPriceLists } = useQuery({
    queryKey: ['config', 'price-lists', organizationId],
    enabled: !!organizationId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/price-lists', {
        params: { limit: 200, organizationId },
      });
      return (data?.data ?? data ?? []) as PriceListOption[];
    },
  });

  useEffect(() => {
    if (!config) {
      setDraft(emptyDraft);
      return;
    }
    setDraft({
      posHeader: config.posHeader ?? '',
      websiteName: config.websiteName ?? '',
      logoUrl: config.logoUrl ?? '',
      contactPhone: config.contactPhone ?? '',
      contactEmail: config.contactEmail ?? '',
      contactWhatsApp: config.contactWhatsApp ?? '',
      contactAddress: config.contactAddress ?? '',
      defaultPriceListId: config.defaultPriceListId ?? null,
      defaultLoginTimeoutMinutes: config.defaultLoginTimeoutMinutes,
      defaultAllowPos: config.defaultAllowPos,
      defaultAllowA4Print: config.defaultAllowA4Print,
      notificationChannels: (config.notificationChannels ?? []).map((c) => ({
        id: c.id,
        label: c.label,
        type: c.type,
        code: c.code ?? '',
      })),
      emailSmtpHost: config.emailSmtpHost ?? '',
      emailSmtpPort: config.emailSmtpPort ?? 587,
      emailSmtpSecure: config.emailSmtpSecure ?? config.emailSmtpPort === 465,
      emailSmtpUser: config.emailSmtpUser ?? '',
      emailSmtpPassword: '',
      emailFrom: config.emailFrom ?? '',
    });
  }, [config]);

  const save = useMutation({
    mutationFn: async () => {
      const { data } = await rxsoftApi.patch(
        `/organisation-config/by-organization/${organizationId}`,
        {
          posHeader: draft.posHeader || null,
          websiteName: draft.websiteName || null,
          logoUrl: draft.logoUrl || null,
          contactPhone: draft.contactPhone || null,
          contactEmail: draft.contactEmail || null,
          contactWhatsApp: draft.contactWhatsApp || null,
          contactAddress: draft.contactAddress || null,
          defaultPriceListId: draft.defaultPriceListId || null,
          defaultLoginTimeoutMinutes:
            draft.defaultLoginTimeoutMinutes === ''
              ? undefined
              : Number(draft.defaultLoginTimeoutMinutes),
          defaultAllowPos: draft.defaultAllowPos,
          defaultAllowA4Print: draft.defaultAllowA4Print,
          notificationChannels: draft.notificationChannels.map((c) => ({
            id: c.id,
            label: c.label,
            type: c.type,
            code: c.code || null,
          })),
          emailSmtpHost: draft.emailSmtpHost || null,
          emailSmtpPort: draft.emailSmtpPort === '' ? null : Number(draft.emailSmtpPort),
          emailSmtpSecure: draft.emailSmtpSecure,
          emailSmtpUser: draft.emailSmtpUser || null,
          // Omit when blank so the stored password is kept.
          emailSmtpPassword: draft.emailSmtpPassword || undefined,
          emailFrom: draft.emailFrom || null,
        }
      );
      return data as OrganisationConfig;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['organisation-config', organizationId], data);
      queryClient.invalidateQueries({ queryKey: ['website'] });
      notifications.show({ color: 'green', message: 'Organisation configuration saved' });
    },
    onError: (err: any) => {
      notifications.show({
        color: 'red',
        message: getApiErrorMessage(err),
      });
    },
  });

  // Bulk job: compute the average price of all products in the selected price
  // list and apply it to every product in that list.
  const applyAveragePrice = useMutation({
    mutationFn: async () => {
      if (!draft.defaultPriceListId) {
        throw new Error('Select a price list first');
      }
      const { data } = await rxsoftApi.post(
        `/price-lists/${draft.defaultPriceListId}/average-price`
      );
      return data as { averagePrice: number | null; updatedCount: number };
    },
    onSuccess: ({ averagePrice, updatedCount }) => {
      notifications.show({
        color: 'green',
        title: 'Average price applied',
        message:
          averagePrice == null
            ? 'The selected price list has no products.'
            : `Applied ₦${averagePrice.toLocaleString()} to ${updatedCount} product(s).`,
      });
      queryClient.invalidateQueries({ queryKey: ['price-list-items'] });
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
    },
    onError: (err: any) => {
      notifications.show({
        color: 'red',
        title: 'Could not apply average price',
        message: getApiErrorMessage(err),
      });
    },
  });

  const orgData = organizations.map((o) => ({
    value: o.id,
    label: o.code ? `${o.code} - ${o.name}` : o.name,
  }));

  const priceListData = priceLists.map((p) => ({
    value: p.id,
    label: `${p.code ? `${p.code} — ` : ''}${p.name}${p.isDefault ? ' (current default)' : ''}`,
  }));

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2}>Organisation Configuration</Title>
          <Text c="dimmed" size="sm">
            Select an organisation to view and update its configuration.
          </Text>
        </div>

        <Card withBorder radius="md" padding="lg">
          <Select
            label="Organisation"
            placeholder={loadingOrgs ? 'Loading organisations…' : 'Select an organisation'}
            data={orgData}
            value={organizationId}
            onChange={(value) => setOrganizationId(value ?? null)}
            searchable
            clearable
            disabled={loadingOrgs}
            nothingFoundMessage="No organisations found"
          />
        </Card>

        {!organizationId && (
          <Text c="dimmed" ta="center" py="xl">
            Select an organisation above to configure it.
          </Text>
        )}

        {organizationId && loadingConfig && (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        )}

        {organizationId && !loadingConfig && (
          <Card withBorder radius="md" padding="lg">
            <Stack>
              <TextInput
                label="Website Name"
                description="Caption shown in the storefront header (defaults to Damorex)."
                placeholder="e.g. Damorex"
                value={draft.websiteName}
                onChange={(e) => {
                  const websiteName = e.currentTarget.value;
                  setDraft((d) => ({ ...d, websiteName }));
                }}
              />
              <TextInput
                label="Logo Image URL"
                description="Logo used as the storefront favicon and header logo (defaults to /sample_images/rx.ico)."
                placeholder="e.g. /sample_images/rx.ico"
                value={draft.logoUrl}
                onChange={(e) => {
                  const logoUrl = e.currentTarget.value;
                  setDraft((d) => ({ ...d, logoUrl }));
                }}
              />
              {draft.logoUrl && (
                <Group gap="sm" align="center">
                  <Box
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '1px solid #DDE7E2',
                      background: '#fff',
                    }}
                  >
                    <Image src={draft.logoUrl} alt="Logo preview" fit="contain" h="100%" />
                  </Box>
                  <Text size="sm" c="dimmed">
                    Logo preview
                  </Text>
                </Group>
              )}
              <Group align="flex-end" gap="xs">
                <Select
                  label="Default Price List"
                  description="Price list used for storefront prices and sorting. Falls back to the price list marked default when unset."
                  placeholder={loadingPriceLists ? 'Loading price lists…' : 'Select a price list'}
                  data={priceListData}
                  value={draft.defaultPriceListId}
                  onChange={(value) => {
                    const defaultPriceListId = value ?? null;
                    setDraft((d) => ({ ...d, defaultPriceListId }));
                  }}
                  searchable
                  clearable
                  disabled={loadingPriceLists}
                  nothingFoundMessage="No price lists found"
                  style={{ flex: 1 }}
                />
                <Button
                  variant="light"
                  color="green"
                  leftSection={<Calculator size={16} />}
                  loading={applyAveragePrice.isPending}
                  disabled={!draft.defaultPriceListId || loadingPriceLists}
                  onClick={() => applyAveragePrice.mutate()}
                  title="Compute the average price of all products in the selected price list and apply it to every product"
                >
                  Make average price
                </Button>
              </Group>
              <TextInput
                label="Contact Phone"
                description="Phone number shown on the storefront contact page."
                placeholder="e.g. +2348022224166"
                value={draft.contactPhone}
                onChange={(e) => {
                  const contactPhone = e.currentTarget.value;
                  setDraft((d) => ({ ...d, contactPhone }));
                }}
              />
              <TextInput
                label="Contact Email"
                description="Email address shown on the storefront contact page."
                placeholder="e.g. info@damorex.com"
                value={draft.contactEmail}
                onChange={(e) => {
                  const contactEmail = e.currentTarget.value;
                  setDraft((d) => ({ ...d, contactEmail }));
                }}
              />
              <TextInput
                label="Contact WhatsApp"
                description="WhatsApp number used for storefront enquiries."
                placeholder="e.g. +2348022224166"
                value={draft.contactWhatsApp}
                onChange={(e) => {
                  const contactWhatsApp = e.currentTarget.value;
                  setDraft((d) => ({ ...d, contactWhatsApp }));
                }}
              />
              <TextInput
                label="Contact Address"
                description="Address shown on the storefront contact page."
                placeholder="e.g. Lagos, Nigeria"
                value={draft.contactAddress}
                onChange={(e) => {
                  const contactAddress = e.currentTarget.value;
                  setDraft((d) => ({ ...d, contactAddress }));
                }}
              />
              <TextInput
                label="POS Header"
                description="Header text printed on POS receipts."
                placeholder="e.g. RxSoft Pharmacy Ltd."
                value={draft.posHeader}
                onChange={(e) => {
                  const posHeader = e.currentTarget.value;
                  setDraft((d) => ({ ...d, posHeader }));
                }}
              />
              <NumberInput
                label="Default Login Timeout (minutes)"
                value={draft.defaultLoginTimeoutMinutes}
                onChange={(value) => setDraft((d) => ({ ...d, defaultLoginTimeoutMinutes: value }))}
                min={1}
                allowDecimal={false}
              />
              <Switch
                label="Default Allow POS"
                description="Default POS access for newly created users."
                checked={draft.defaultAllowPos}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, defaultAllowPos: e.currentTarget.checked }))
                }
              />
              <Switch
                label="Default Allow A4 Print"
                description="Default A4/wholesale printing for newly created users."
                checked={draft.defaultAllowA4Print}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, defaultAllowA4Print: e.currentTarget.checked }))
                }
              />
              <Divider my="sm" label="Email (SMTP)" labelPosition="left" />
              <Text size="sm" c="dimmed">
                Used for order and payment-link emails. Leave a field blank to fall back to the
                system SMTP configuration.
              </Text>
              <TextInput
                label="SMTP Host"
                description="Leave blank to use the system SMTP host."
                placeholder="e.g. smtp.gmail.com"
                value={draft.emailSmtpHost}
                onChange={(e) => {
                  const emailSmtpHost = e.currentTarget.value;
                  setDraft((d) => ({ ...d, emailSmtpHost }));
                }}
                data-testid="org-email-smtp-host"
              />
              <NumberInput
                label="SMTP Port"
                description="Usually 587 (STARTTLS) or 465 (implicit TLS)."
                value={draft.emailSmtpPort}
                onChange={(value) => setDraft((d) => ({ ...d, emailSmtpPort: value }))}
                min={1}
                allowDecimal={false}
                data-testid="org-email-smtp-port"
              />
              <Switch
                label="Implicit TLS"
                description="Enable for port 465. Leave off for STARTTLS (587)."
                checked={draft.emailSmtpSecure}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, emailSmtpSecure: e.currentTarget.checked }))
                }
                data-testid="org-email-smtp-secure"
              />
              <TextInput
                label="SMTP Username"
                description="Leave blank to use the system SMTP username."
                placeholder="e.g. orders@example.com"
                value={draft.emailSmtpUser}
                onChange={(e) => {
                  const emailSmtpUser = e.currentTarget.value;
                  setDraft((d) => ({ ...d, emailSmtpUser }));
                }}
                data-testid="org-email-smtp-user"
              />
              <PasswordInput
                label="SMTP Password"
                description={
                  config?.emailSmtpPasswordSet
                    ? 'A password is stored. Leave blank to keep it; type to replace it.'
                    : 'Leave blank to use the system SMTP password.'
                }
                placeholder={
                  config?.emailSmtpPasswordSet ? 'Stored — leave blank to keep' : undefined
                }
                value={draft.emailSmtpPassword}
                onChange={(e) => {
                  const emailSmtpPassword = e.currentTarget.value;
                  setDraft((d) => ({ ...d, emailSmtpPassword }));
                }}
                data-testid="org-email-smtp-password"
              />
              <TextInput
                label="From Address"
                description="From header for org email. Leave blank to use the system default."
                placeholder='e.g. "Healthstack" <orders@healthstack.africa>'
                value={draft.emailFrom}
                onChange={(e) => {
                  const emailFrom = e.currentTarget.value;
                  setDraft((d) => ({ ...d, emailFrom }));
                }}
                data-testid="org-email-from"
              />
              <Divider my="sm" label="Notification channels" labelPosition="left" />
              <Text size="sm" c="dimmed">
                Channel codes staff pick from when sending an order/payment link to a customer. For
                SMS/WhatsApp enter the conversation channel code; for Email enter the email channel
                code.
              </Text>
              <Stack gap="xs">
                {draft.notificationChannels.map((channel, index) => (
                  <Group key={channel.id} gap="xs" align="flex-end" wrap="nowrap">
                    <TextInput
                      label={index === 0 ? 'Label' : undefined}
                      placeholder="e.g. Transactional SMS"
                      value={channel.label}
                      style={{ flex: 2 }}
                      onChange={(e) => {
                        const label = e.currentTarget.value;
                        setDraft((d) => ({
                          ...d,
                          notificationChannels: d.notificationChannels.map((c) =>
                            c.id === channel.id ? { ...c, label } : c
                          ),
                        }));
                      }}
                      data-testid={`org-channel-label-${index}`}
                    />
                    <Select
                      label={index === 0 ? 'Type' : undefined}
                      data={[
                        { value: 'sms_proxy', label: 'SMS_PROXY' },
                        { value: 'sms', label: 'SMS' },
                        { value: 'whatsapp', label: 'WhatsApp' },
                        { value: 'email', label: 'Email' },
                      ]}
                      value={channel.type}
                      style={{ flex: 1 }}
                      onChange={(value) => {
                        const type = (value ?? 'sms') as ChannelType;
                        setDraft((d) => ({
                          ...d,
                          notificationChannels: d.notificationChannels.map((c) =>
                            c.id === channel.id ? { ...c, type } : c
                          ),
                        }));
                      }}
                      data-testid={`org-channel-type-${index}`}
                    />
                    <TextInput
                      label={index === 0 ? 'Channel code' : undefined}
                      placeholder={channel.type === 'email' ? 'e.g. ORDER_EMAIL' : 'e.g. ORDER_SMS'}
                      value={channel.code}
                      style={{ flex: 2 }}
                      onChange={(e) => {
                        const code = e.currentTarget.value;
                        setDraft((d) => ({
                          ...d,
                          notificationChannels: d.notificationChannels.map((c) =>
                            c.id === channel.id ? { ...c, code } : c
                          ),
                        }));
                      }}
                      data-testid={`org-channel-code-${index}`}
                    />
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      mb={4}
                      aria-label="Remove channel"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          notificationChannels: d.notificationChannels.filter(
                            (c) => c.id !== channel.id
                          ),
                        }))
                      }
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Group>
                ))}
                <Group>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<Plus size={14} />}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        notificationChannels: [
                          ...d.notificationChannels,
                          {
                            id:
                              globalThis.crypto?.randomUUID?.() ?? `ch-${Date.now().toString(36)}`,
                            label: '',
                            type: 'sms' as ChannelType,
                            code: '',
                          },
                        ],
                      }))
                    }
                    data-testid="org-channel-add"
                  >
                    Add channel
                  </Button>
                </Group>
              </Stack>

              <Group justify="flex-end" mt="sm">
                <Button onClick={() => save.mutate()} loading={save.isPending}>
                  Save Configuration
                </Button>
              </Group>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
