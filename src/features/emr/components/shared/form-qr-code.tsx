import { Alert, Button, CopyButton, Group, Loader, Stack, Text } from '@mantine/core';
import { AlertCircle, Copy, QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { emrApi } from '@/lib/emr-api';
import type { FormShareLink } from '../../lib/emr-types';

/**
 * QR code for a form link. Template links open the form for an unassigned
 * patient; instance links reopen the current submission values.
 */
export function FormQrCode({
  formDefinitionId,
  submissionId,
  patientId,
  mode = 'auto',
  size = 180,
  caption,
  publicUrl,
}: {
  formDefinitionId?: string;
  submissionId?: string | null;
  patientId?: string | null;
  mode?: 'auto' | 'template' | 'instance';
  size?: number;
  caption?: string;
  /** Already-known public URL (public form route). */
  publicUrl?: string;
}) {
  const [link, setLink] = useState<FormShareLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (publicUrl || !formDefinitionId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    emrApi
      .post<FormShareLink>(`/form-definitions/${formDefinitionId}/share-links`, {
        mode: mode === 'auto' ? undefined : mode,
        submissionId: submissionId ?? undefined,
        patientId: patientId ?? undefined,
      })
      .then(({ data }) => {
        if (!cancelled) {
          setLink(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              'Could not create the form link'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [formDefinitionId, mode, patientId, publicUrl, submissionId]);

  const url = publicUrl ?? link?.url;

  return (
    <Stack gap="xs" align="center">
      {loading ? (
        <Group gap="xs">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Generating link…
          </Text>
        </Group>
      ) : error ? (
        <Alert color="red" icon={<AlertCircle size={16} />}>
          {error}
        </Alert>
      ) : url ? (
        <>
          <QRCode value={url} size={size} />
          <Group gap="xs">
            <Text size="xs" c="dimmed" style={{ maxWidth: 360, wordBreak: 'break-all' }}>
              {url}
            </Text>
            <CopyButton value={url}>
              {({ copied, copy }) => (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  leftSection={<Copy size={12} />}
                  onClick={copy}
                  data-testid="form-qr-copy"
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </CopyButton>
          </Group>
        </>
      ) : (
        <Group gap="xs">
          <QrCode size={16} />
          <Text size="sm" c="dimmed">
            No link available
          </Text>
        </Group>
      )}
      {caption && (
        <Text size="xs" c="dimmed" ta="center">
          {caption}
        </Text>
      )}
    </Stack>
  );
}
