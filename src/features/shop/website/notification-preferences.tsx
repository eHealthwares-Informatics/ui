import { Button, Group, Paper, Stack, Switch, Text, ThemeIcon, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useNotificationPreferences, useUpdateNotificationPreferences } from './hooks';
import { green, ink, line, muted } from './layout';

const CHANNELS = [
  {
    key: 'email',
    label: 'Email',
    description: 'Order confirmations, invoices and receipts.',
  },
  {
    key: 'sms',
    label: 'SMS',
    description: 'Delivery updates and refill reminders as a text message.',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    description: 'Order updates, prescription reviews and occasional offers.',
  },
] as const;

type ChannelKey = (typeof CHANNELS)[number]['key'];

/**
 * Customer notification preferences (SRS 7.9).
 *
 * One opt-out here covers every notification the storefront sends — order
 * status, payment, prescription review, refill reminders and campaigns — because
 * the backend keys all of them on the signed-in shopper. Absent preferences mean
 * opted in, so the card is opt-OUT.
 */
export function NotificationPreferencesCard() {
  const { data, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const [values, setValues] = useState<Record<ChannelKey, boolean>>({
    email: true,
    sms: true,
    whatsapp: true,
  });

  useEffect(() => {
    if (!data) return;
    setValues({ email: data.email, sms: data.sms, whatsapp: data.whatsapp });
  }, [data]);

  const save = () => {
    updatePreferences.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: 'Notification preferences saved.', color: 'green' });
      },
      onError: (error) => {
        notifications.show({ message: getApiErrorMessage(error), color: 'red' });
      },
    });
  };

  return (
    <Paper
      radius={24}
      p="lg"
      withBorder
      style={{ borderColor: line }}
      data-testid="notification-preferences"
    >
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon radius="xl" size={40} color="green" variant="light">
            <Bell size={20} />
          </ThemeIcon>
          <div>
            <Title order={4} style={{ color: ink }}>
              Notifications
            </Title>
            <Text size="sm" c={muted}>
              Choose how we keep you updated about orders, prescriptions and refills.
            </Text>
          </div>
        </Group>

        {CHANNELS.map((channel) => (
          <Switch
            key={channel.key}
            data-testid={`notification-preference-${channel.key}`}
            label={channel.label}
            description={channel.description}
            color="green"
            checked={values[channel.key]}
            disabled={isLoading}
            onChange={(event) => {
              // Read during dispatch: React nulls `currentTarget` once the event
              // finishes, and the updater below runs later (rxsoft-qa#794).
              const { checked } = event.currentTarget;
              setValues((previous) => ({ ...previous, [channel.key]: checked }));
            }}
          />
        ))}

        <Group justify="flex-end">
          <Button
            data-testid="notification-preferences-save"
            color={green}
            loading={updatePreferences.isPending}
            disabled={isLoading}
            onClick={save}
          >
            Save preferences
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
