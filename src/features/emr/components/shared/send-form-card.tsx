import { Alert, Badge, Button, CopyButton, Group, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { AlertCircle, Copy, Send } from 'lucide-react';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import type { FormShareLink } from '../../lib/emr-types';

/**
 * Generates a public form link and sends it to the patient by email and SMS.
 * Template forms use the sender's organisation/location; instance forms carry
 * the patient/submission so the recipient reopens the current values.
 */
export function SendFormCard({
  formDefinitionId,
  submissionId,
  patientId,
  phone,
  email,
  label = 'Send form link',
  channels = ['email', 'sms'],
}: {
  formDefinitionId: string;
  submissionId?: string | null;
  patientId?: string | null;
  phone?: string | null;
  email?: string | null;
  label?: string;
  channels?: Array<'email' | 'sms'>;
}) {
  const [link, setLink] = useState<FormShareLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState(phone ?? '');
  const [emailInput, setEmailInput] = useState(email ?? '');

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data } = await emrApi.post<{
        link: FormShareLink;
        dispatch: { sent: number; failed: number; skipped: number };
      }>('/form-notifications/share', {
        formDefinitionId,
        submissionId: submissionId ?? undefined,
        patientId: patientId ?? undefined,
        channels,
        phone: phoneInput.trim() || undefined,
        email: emailInput.trim() || undefined,
      });
      setLink(data.link);
      notifications.show({
        message:
          data.dispatch.sent > 0
            ? 'Form link sent by email and SMS'
            : 'Form link created — no email/SMS channel was available',
        color: data.dispatch.sent > 0 ? 'teal' : 'yellow',
      });
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Could not send the form link'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack gap="xs">
      <Group align="flex-end" gap="xs" wrap="wrap">
        {channels.includes('email') && (
          <TextInput
            label="Email"
            size="xs"
            value={emailInput}
            onChange={(event) => setEmailInput(event.currentTarget.value)}
            data-testid="send-form-email"
            style={{ flex: 1, minWidth: 200 }}
          />
        )}
        {channels.includes('sms') && (
          <TextInput
            label="Phone"
            size="xs"
            value={phoneInput}
            onChange={(event) => setPhoneInput(event.currentTarget.value)}
            data-testid="send-form-phone"
            style={{ flex: 1, minWidth: 180 }}
          />
        )}
      </Group>
      <Group gap="xs">
        <Button
          leftSection={<Send size={14} />}
          variant="light"
          loading={busy}
          onClick={send}
          data-testid="send-form-link-button"
        >
          {label}
        </Button>
        <Badge size="xs" variant="light">
          {channels.map((channel) => (channel === 'sms' ? 'SMS' : 'Email')).join(' + ')}
        </Badge>
      </Group>
      {(phone || email) && (
        <Text size="xs" c="dimmed">
          Recipient: {[email, phone].filter(Boolean).join(' · ')}
        </Text>
      )}
      {link && (
        <Group gap="xs">
          <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
            {link.url}
          </Text>
          <CopyButton value={link.url}>
            {({ copied, copy }) => (
              <Button
                size="compact-xs"
                variant="subtle"
                leftSection={<Copy size={12} />}
                onClick={copy}
                data-testid="send-form-copy-button"
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </CopyButton>
        </Group>
      )}
      {error && (
        <Alert color="red" icon={<AlertCircle size={16} />}>
          {error}
        </Alert>
      )}
    </Stack>
  );
}
