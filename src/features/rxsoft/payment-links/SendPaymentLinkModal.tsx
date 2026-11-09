import { Alert, Button, Group, Modal, Radio, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getArrayPayload } from '@/components/utils';
import { conversationApi } from '@/lib/conversation-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { rxsoftApi } from '@/lib/rxsoft-api';

export type NotificationChannel = {
  id: string;
  label: string;
  type: string;
};

/**
 * The available notification channels. Staff pick one of these before a send —
 * configured in Channels.
 */
export function useNotificationChannels() {
  return useQuery({
    queryKey: ['notification-channels', 'payment-link-picker'],
    queryFn: async (): Promise<NotificationChannel[]> => {
      const { data } = await conversationApi.get('/notification-channels');
      const rows = getArrayPayload(data) as Array<{
        id: string;
        label: string;
        type: string;
        enabled: boolean;
      }>;
      return rows
        .filter((channel) => channel.enabled !== false)
        .map((channel) => ({
          id: channel.id,
          label: channel.label,
          type: channel.type,
        }));
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

  useEffect(() => {
    if (!opened) return;
    setChannelId(null);
  }, [opened]);

  const send = useMutation({
    mutationFn: async () => {
      const { data } = await rxsoftApi.post(`/payment-links/${token}/send`, {
        channelId,
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
            Enable notification channels under Notifications → Notification Channels, then try
            again.
          </Alert>
        ) : (
          <>
            <Radio.Group
              value={channelId}
              onChange={setChannelId}
              label="Send over"
              data-testid="send-payment-link-channel-group"
            >
              <Stack gap="xs" mt="xs">
                {channels.map((c) => (
                  <Radio
                    key={c.id}
                    value={c.id}
                    label={c.label}
                    data-testid={`send-channel-${c.id}`}
                  />
                ))}
              </Stack>
            </Radio.Group>

            <Text size="xs" c="dimmed">
              If the selected channel fails, the facility&apos;s configured fallback channel is used
              automatically.
            </Text>
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
