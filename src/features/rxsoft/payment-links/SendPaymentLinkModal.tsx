import { Alert, Button, Group, Modal, Radio, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { rxsoftApi } from '@/lib/rxsoft-api';

export type NotificationChannel = {
  id: string;
  label: string;
  type: 'email' | 'sms' | 'whatsapp';
  code?: string | null;
};

/**
 * The organisation's configured notification channels (channel codes). Staff
 * pick one of these before a send — configured in Organisation Config.
 */
export function useNotificationChannels() {
  return useQuery({
    queryKey: ['organisation-config', 'notification-channels'],
    queryFn: async (): Promise<NotificationChannel[]> => {
      const { data } = await rxsoftApi.get('/organisation-config');
      return (data?.notificationChannels ?? []) as NotificationChannel[];
    },
    staleTime: 60_000,
  });
}

type Props = {
  opened: boolean;
  onClose: () => void;
  /** Token of the payment link (/shop/pay/:token) to send. */
  token: string | null;
  /** Optional context line, e.g. the order number or amount. */
  contextLabel?: string;
};

/**
 * "Send payment link to customer" — asks for the channel first (from the org's
 * configured channel codes), then POSTs to /payment-links/:token/send. Shared by
 * the POS payment modal and the website-orders list.
 */
export function SendPaymentLinkModal({ opened, onClose, token, contextLabel }: Props) {
  const { data: channels = [], isLoading, isError, error } = useNotificationChannels();
  const [channelId, setChannelId] = useState<string | null>(null);
  const [fallbackChannelId, setFallbackChannelId] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) return;
    setChannelId(null);
    setFallbackChannelId(null);
  }, [opened]);

  const send = useMutation({
    mutationFn: async () => {
      const { data } = await rxsoftApi.post(`/payment-links/${token}/send`, {
        channelId,
        fallbackChannelId: fallbackChannelId || undefined,
      });
      return data as { sent: boolean; recipient: string };
    },
    onSuccess: (data) => {
      notifications.show({
        color: data?.sent === false ? 'orange' : 'green',
        message:
          data?.sent === false
            ? 'The channel could not deliver the link — check the channel configuration.'
            : `Payment link sent to ${data?.recipient ?? 'the customer'}`,
      });
      onClose();
    },
    onError: (e) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(e) });
    },
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Send payment link to customer"
      data-testid="send-payment-link-modal"
    >
      <Stack>
        {contextLabel && (
          <Text size="sm" c="dimmed">
            {contextLabel}
          </Text>
        )}

        {isLoading ? (
          <Text size="sm">Loading channels…</Text>
        ) : isError ? (
          <Alert color="red" title="Could not load channels">
            {getApiErrorMessage(error)}
          </Alert>
        ) : channels.length === 0 ? (
          <Alert color="yellow" title="No channels configured">
            Add notification channel codes under Organisation Config, then try again.
          </Alert>
        ) : (
          <>
            <Radio.Group
              value={channelId}
              onChange={(value) => {
                setChannelId(value);
                // A channel can't be both primary and fallback.
                if (value && fallbackChannelId === value) {
                  setFallbackChannelId(null);
                }
              }}
              label="Send over"
              data-testid="send-payment-link-channel-group"
            >
              <Stack gap="xs" mt="xs">
                {channels.map((c) => (
                  <Radio
                    key={c.id}
                    value={c.id}
                    label={`${c.label} (${c.type})`}
                    data-testid={`send-channel-${c.id}`}
                  />
                ))}
              </Stack>
            </Radio.Group>

            <Select
              label="Fallback channel (optional)"
              description="Used if the primary channel fails to deliver."
              placeholder="None"
              data={channels
                .filter((c) => c.id !== channelId)
                .map((c) => ({ value: c.id, label: `${c.label} (${c.type})` }))}
              value={fallbackChannelId}
              onChange={setFallbackChannelId}
              clearable
              data-testid="send-payment-link-fallback-channel"
            />
          </>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={send.isPending}
            disabled={!channelId || !token}
            onClick={() => send.mutate()}
            data-testid="send-payment-link-submit"
          >
            Send
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
