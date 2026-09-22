import {
  Box,
  Button,
  Card,
  Container,
  Group,
  Image,
  Loader,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';

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
  defaultLoginTimeoutMinutes: number;
  defaultAllowPos: boolean;
  defaultAllowA4Print: boolean;
};

type OrgOption = { id: string; name: string; code?: string };

type Draft = {
  posHeader: string;
  websiteName: string;
  logoUrl: string;
  contactPhone: string;
  contactEmail: string;
  contactWhatsApp: string;
  contactAddress: string;
  defaultLoginTimeoutMinutes: number | string;
  defaultAllowPos: boolean;
  defaultAllowA4Print: boolean;
};

const emptyDraft: Draft = {
  posHeader: '',
  websiteName: '',
  logoUrl: '',
  contactPhone: '',
  contactEmail: '',
  contactWhatsApp: '',
  contactAddress: '',
  defaultLoginTimeoutMinutes: 480,
  defaultAllowPos: true,
  defaultAllowA4Print: false,
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
        `/organisation-config/by-organization/${organizationId}`,
      );
      return data as OrganisationConfig;
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
      defaultLoginTimeoutMinutes: config.defaultLoginTimeoutMinutes,
      defaultAllowPos: config.defaultAllowPos,
      defaultAllowA4Print: config.defaultAllowA4Print,
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
          defaultLoginTimeoutMinutes:
            draft.defaultLoginTimeoutMinutes === ''
              ? undefined
              : Number(draft.defaultLoginTimeoutMinutes),
          defaultAllowPos: draft.defaultAllowPos,
          defaultAllowA4Print: draft.defaultAllowA4Print,
        },
      );
      return data as OrganisationConfig;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['organisation-config', organizationId], data);
      notifications.show({ color: 'green', message: 'Organisation configuration saved' });
    },
    onError: (err: any) => {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.message ?? err?.message ?? 'Failed to save configuration',
      });
    },
  });

  const orgData = organizations.map((o) => ({
    value: o.id,
    label: o.code ? `${o.code} - ${o.name}` : o.name,
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
            onChange={setOrganizationId}
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
                onChange={(e) => setDraft((d) => ({ ...d, websiteName: e.currentTarget.value }))}
              />
              <TextInput
                label="Logo Image URL"
                description="Logo used as the storefront favicon and header logo (defaults to /sample_images/rx.ico)."
                placeholder="e.g. /sample_images/rx.ico"
                value={draft.logoUrl}
                onChange={(e) => setDraft((d) => ({ ...d, logoUrl: e.currentTarget.value }))}
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
              <TextInput
                label="Contact Phone"
                description="Phone number shown on the storefront contact page."
                placeholder="e.g. +2348022224166"
                value={draft.contactPhone}
                onChange={(e) => setDraft((d) => ({ ...d, contactPhone: e.currentTarget.value }))}
              />
              <TextInput
                label="Contact Email"
                description="Email address shown on the storefront contact page."
                placeholder="e.g. info@damorex.com"
                value={draft.contactEmail}
                onChange={(e) => setDraft((d) => ({ ...d, contactEmail: e.currentTarget.value }))}
              />
              <TextInput
                label="Contact WhatsApp"
                description="WhatsApp number used for storefront enquiries."
                placeholder="e.g. +2348022224166"
                value={draft.contactWhatsApp}
                onChange={(e) => setDraft((d) => ({ ...d, contactWhatsApp: e.currentTarget.value }))}
              />
              <TextInput
                label="Contact Address"
                description="Address shown on the storefront contact page."
                placeholder="e.g. Lagos, Nigeria"
                value={draft.contactAddress}
                onChange={(e) => setDraft((d) => ({ ...d, contactAddress: e.currentTarget.value }))}
              />
              <TextInput
                label="POS Header"
                description="Header text printed on POS receipts."
                placeholder="e.g. RxSoft Pharmacy Ltd."
                value={draft.posHeader}
                onChange={(e) => setDraft((d) => ({ ...d, posHeader: e.currentTarget.value }))}
              />
              <NumberInput
                label="Default Login Timeout (minutes)"
                value={draft.defaultLoginTimeoutMinutes}
                onChange={(value) =>
                  setDraft((d) => ({ ...d, defaultLoginTimeoutMinutes: value }))
                }
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
