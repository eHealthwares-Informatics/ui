import { Badge, Box, Group, Modal, Paper, Stack, Text } from '@mantine/core';
import { useMemo, useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { useAuthStore } from '@/stores/auth-store';
import {
  buildNotificationDeliveryConfig,
  statusColor,
  type DeliveryRow,
  type ExchangeState,
} from './schema';

export function RxNotificationDeliveryPage() {
  const selectedOrganisationId = useAuthStore((state) => state.selectedOrganisationId);
  const organizationId = selectedOrganisationId ?? null;
  // Tri-state scope: undefined → all organisations, null → global defaults,
  // id → that organisation.
  const scopeParams = useMemo<Record<string, string>>(() => {
    const params: Record<string, string> = {};
    if (selectedOrganisationId === null) params.organizationId = 'null';
    else if (selectedOrganisationId) params.organizationId = selectedOrganisationId;
    return params;
  }, [selectedOrganisationId]);
  const scopeKey =
    selectedOrganisationId === undefined ? 'all' : (selectedOrganisationId ?? 'global');

  const [detail, setDetail] = useState<DeliveryRow | null>(null);
  const [failuresOnly, setFailuresOnly] = useState(false);
  const [testsOnly, setTestsOnly] = useState(false);
  const [exchangeState, setExchangeState] = useState<ExchangeState>('all');

  const config = useMemo(
    () =>
      buildNotificationDeliveryConfig({
        organizationId,
        scopeKey,
        scopeParams,
        failuresOnly,
        testsOnly,
        exchangeState,
        onFailuresOnlyChange: setFailuresOnly,
        onTestsOnlyChange: setTestsOnly,
        onExchangeStateChange: setExchangeState,
        onViewDetails: setDetail,
      }),
    [organizationId, scopeKey, scopeParams, failuresOnly, testsOnly, exchangeState]
  );

  return (
    <Stack gap="lg">
      <DataPageShell key={scopeKey} config={config} />

      <Modal
        opened={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Delivery details"
        centered
        size="lg"
      >
        {detail && (
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600}>{detail.eventKey ?? 'Ad-hoc channel send'}</Text>
              <Badge color={statusColor(detail.status)} variant="light">
                {detail.status}
              </Badge>
            </Group>
            <Paper withBorder p="sm" radius="sm">
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Channel
                </Text>
                <Text size="sm">{detail.channelType ?? detail.channelId ?? '—'}</Text>
                <Text size="xs" c="dimmed">
                  Recipient
                </Text>
                <Text size="sm">{detail.recipient ?? '—'}</Text>
                <Text size="xs" c="dimmed">
                  Subject
                </Text>
                <Text size="sm">{detail.subject ?? '—'}</Text>
                <Text size="xs" c="dimmed">
                  Template
                </Text>
                <Text size="sm" ff="monospace">
                  {detail.templateId ?? '—'}
                </Text>
                <Text size="xs" c="dimmed">
                  Attempts
                </Text>
                <Text size="sm">{detail.attempts ?? 0}</Text>
                <Text size="xs" c="dimmed">
                  Created
                </Text>
                <Text size="sm">
                  {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : '—'}
                </Text>
                <Text size="xs" c="dimmed">
                  Sent at
                </Text>
                <Text size="sm">
                  {detail.sentAt ? new Date(detail.sentAt).toLocaleString() : '—'}
                </Text>
              </Stack>
            </Paper>

            <Paper withBorder p="sm" radius="sm">
              <Text size="xs" c="dimmed" mb={4}>
                Request payload
              </Text>
              <Box
                component="pre"
                style={{
                  margin: 0,
                  maxHeight: 240,
                  overflow: 'auto',
                  fontSize: 11,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {JSON.stringify(detail.requestPayload ?? {}, null, 2)}
              </Box>
            </Paper>

            {detail.error && (
              <Paper withBorder p="sm" radius="sm">
                <Text size="xs" c="dimmed" mb={4}>
                  Error
                </Text>
                <Text size="sm" c="red">
                  {detail.error}
                </Text>
              </Paper>
            )}

            <Box
              component="pre"
              style={{
                margin: 0,
                maxHeight: 320,
                overflow: 'auto',
                fontSize: 11,
                whiteSpace: 'pre-wrap',
              }}
            >
              {JSON.stringify(
                {
                  providerMessageId: detail.providerMessageId,
                  exchangeId: detail.exchangeId,
                  downstreamResponse: detail.downstreamResponse,
                },
                null,
                2
              )}
            </Box>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
