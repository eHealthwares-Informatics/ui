import { Button, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Printer, Send } from 'lucide-react';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';

type PrintArtifact = {
  url?: string | null;
  cloudinaryUrl?: string | null;
  awsUrl?: string | null;
  localUrl?: string | null;
};

type DispatchResponse = {
  prints?: {
    a4?: PrintArtifact;
    pos?: PrintArtifact;
  } | null;
  sent?: number;
  failed?: number;
  skipped?: number;
};

function artifactUrl(print?: PrintArtifact | null): string | null {
  return print?.url ?? print?.cloudinaryUrl ?? print?.awsUrl ?? print?.localUrl ?? null;
}

/**
 * Print/Send actions for a saved submission. Both call the notification
 * dispatch proxy; the form's event_key drives the rendered print body.
 */
export function PrintSendActions({
  submissionId,
  printFormat = 'a4_print',
  phone,
  email,
}: {
  submissionId?: string | null;
  printFormat?: 'a4_print' | 'pos_print';
  phone?: string | null;
  email?: string | null;
}) {
  const [printing, setPrinting] = useState(false);
  const [sending, setSending] = useState(false);

  const print = async () => {
    if (!submissionId) {
      return;
    }
    setPrinting(true);
    try {
      const { data } = await emrApi.post<DispatchResponse>('/form-notifications/send', {
        submissionId,
        printFormat,
      });
      const url = artifactUrl(data.prints?.a4) ?? artifactUrl(data.prints?.pos);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        notifications.show({
          color: 'yellow',
          message: 'The notification template has no printable body configured for this event.',
        });
      }
    } catch (err) {
      notifications.show({
        color: 'red',
        message:
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Could not render the print document',
      });
    } finally {
      setPrinting(false);
    }
  };

  const send = async () => {
    if (!submissionId) {
      return;
    }
    setSending(true);
    try {
      const { data } = await emrApi.post<DispatchResponse>('/form-notifications/send', {
        submissionId,
        printFormat,
        recipients: {
          phone: phone ?? undefined,
          email: email ?? undefined,
        },
      });
      notifications.show({
        message:
          (data.sent ?? 0) > 0
            ? 'Form sent to the patient'
            : 'No channel was available to send the form',
        color: (data.sent ?? 0) > 0 ? 'teal' : 'yellow',
      });
    } catch (err) {
      notifications.show({
        color: 'red',
        message:
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Could not send the form',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Stack gap={4}>
      <Group gap="xs">
        <Button
          variant="light"
          leftSection={<Printer size={14} />}
          loading={printing}
          disabled={!submissionId}
          onClick={print}
          data-testid="form-print-button"
        >
          Print
        </Button>
        <Button
          variant="light"
          leftSection={<Send size={14} />}
          loading={sending}
          disabled={!submissionId}
          onClick={send}
          data-testid="form-send-button"
        >
          Send
        </Button>
      </Group>
      {!phone && !email && (
        <Text size="xs" c="dimmed">
          No patient phone/email on file — Send will report a skipped channel.
        </Text>
      )}
    </Stack>
  );
}
