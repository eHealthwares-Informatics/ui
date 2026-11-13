import {
  Button,
  Card,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { conversationApi } from '@/lib/conversation-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useAuthStore } from '@/stores/auth-store';

type BillingConfig = {
  defaultMarkupBps?: number;
  exemptWords?: string[];
  includeDefaultExemptWords?: boolean;
  defaultBillTo?: string | null;
  missingRulePolicy?: 'FREE' | 'REJECT' | 'ERROR';
  maxOverdraftCoins?: number | null;
  shadowMode?: boolean;
  enforcementEnabled?: boolean;
};

const DEFAULTS: BillingConfig = {
  defaultMarkupBps: 0,
  exemptWords: [],
  includeDefaultExemptWords: true,
  defaultBillTo: null,
  missingRulePolicy: 'FREE',
  maxOverdraftCoins: null,
  shadowMode: false,
  enforcementEnabled: false,
};

export function RxBillingConfigPage() {
  const queryClient = useQueryClient();
  const selectedOrganisationId = useAuthStore((state) => state.selectedOrganisationId);
  const organizationId = selectedOrganisationId ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ['billing-config', organizationId],
    enabled: Boolean(organizationId),
    queryFn: async () => {
      const { data } = await conversationApi.get('/billing/config', {
        params: { organizationId },
      });
      return (data ?? null) as BillingConfig | null;
    },
  });

  const [form, setForm] = useState<BillingConfig>(DEFAULTS);
  const [exemptText, setExemptText] = useState('');

  useEffect(() => {
    const next = { ...DEFAULTS, ...(data ?? {}) };
    setForm(next);
    setExemptText((next.exemptWords ?? []).join(', '));
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await conversationApi.put(
        '/billing/config',
        {
          ...form,
          exemptWords: exemptText
            .split(',')
            .map((word) => word.trim())
            .filter(Boolean),
        },
        { params: { organizationId } }
      );
    },
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Billing config saved' });
      queryClient.invalidateQueries({ queryKey: ['billing-config'] });
    },
    onError: (error) => notifications.show({ color: 'red', message: getApiErrorMessage(error) }),
  });

  if (!organizationId) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Select a specific organisation in the header to edit its billing configuration.
      </Text>
    );
  }

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <Stack gap="lg" maw={760}>
      <Title order={2}>Billing Config</Title>
      <Text size="sm" c="dimmed">
        Enforcement, shadow mode, default markup and missing-rule behaviour for the selected
        organisation.
      </Text>

      <Card withBorder radius="md" p="lg">
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="sm" fw={600}>
              Enforcement enabled
            </Text>
            <Switch
              data-testid="billing-config-enforcement"
              checked={form.enforcementEnabled === true}
              onChange={(event) => {
                const checked = event.currentTarget.checked;
                setForm((prev) => ({ ...prev, enforcementEnabled: checked }));
              }}
            />
          </Group>

          <Group justify="space-between">
            <Text size="sm" fw={600}>
              Shadow mode (evaluate, never block)
            </Text>
            <Switch
              data-testid="billing-config-shadow"
              checked={form.shadowMode === true}
              onChange={(event) => {
                const checked = event.currentTarget.checked;
                setForm((prev) => ({ ...prev, shadowMode: checked }));
              }}
            />
          </Group>

          <NumberInput
            data-testid="billing-config-markup"
            label="Default markup (bps)"
            value={form.defaultMarkupBps ?? 0}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                defaultMarkupBps: Number(value ?? 0),
              }))
            }
            min={0}
          />

          <Select
            data-testid="billing-config-missing-rule"
            label="Missing rule policy"
            data={[
              { value: 'FREE', label: 'Free (allow, no charge)' },
              { value: 'REJECT', label: 'Reject' },
              { value: 'ERROR', label: 'Error' },
            ]}
            value={form.missingRulePolicy ?? 'FREE'}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                missingRulePolicy: (value ?? 'FREE') as BillingConfig['missingRulePolicy'],
              }))
            }
          />

          <Select
            data-testid="billing-config-default-bill-to"
            label="Default bill to"
            placeholder="Use rule / config default"
            clearable
            data={[
              { value: 'ORGANISATION', label: 'Organisation' },
              { value: 'CHANNEL', label: 'Channel' },
              { value: 'PARTICIPANT', label: 'Participant' },
            ]}
            value={form.defaultBillTo ?? null}
            onChange={(value) => setForm((prev) => ({ ...prev, defaultBillTo: value ?? null }))}
          />

          <NumberInput
            data-testid="billing-config-overdraft"
            label="Max overdraft (coins)"
            value={form.maxOverdraftCoins ?? ''}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                maxOverdraftCoins: value === '' || value === undefined ? null : Number(value),
              }))
            }
            min={0}
          />

          <Group justify="space-between">
            <Text size="sm" fw={600}>
              Include default exempt words
            </Text>
            <Switch
              data-testid="billing-config-include-exempt"
              checked={form.includeDefaultExemptWords !== false}
              onChange={(event) => {
                const checked = event.currentTarget.checked;
                setForm((prev) => ({
                  ...prev,
                  includeDefaultExemptWords: checked,
                }));
              }}
            />
          </Group>

          <Textarea
            data-testid="billing-config-exempt-words"
            label="Extra exempt words (comma separated)"
            value={exemptText}
            onChange={(event) => setExemptText(event.currentTarget.value)}
            autosize
            minRows={2}
          />

          <Group justify="flex-end">
            <Button
              data-testid="billing-config-save"
              loading={save.isPending}
              onClick={() => save.mutate()}
            >
              Save configuration
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
