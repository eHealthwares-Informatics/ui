import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Divider,
  Group,
  Loader,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle, Mail, RefreshCw, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { RxPage } from '../../../components/page/rx-page';
import { SendPaymentLinkModal } from '../../payment-links/SendPaymentLinkModal';

type PaymentEvent = {
  id: string;
  type: string;
  status: 'ok' | 'failed' | 'info';
  message: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  success: 'green',
  settled: 'teal',
  pending: 'yellow',
  initiated: 'blue',
  failed: 'red',
  cancelled: 'gray',
  reversed: 'orange',
  expired: 'gray',
  unknown: 'gray',
};

const EVENT_COLORS: Record<string, string> = {
  ok: 'green',
  failed: 'red',
  info: 'gray',
};

function fmtDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

function fmtMoney(amount?: number, currency = 'NGN') {
  if (amount === undefined || amount === null) {
    return '—';
  }
  return `${currency} ${Number(amount).toLocaleString()}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase">
        {label}
      </Text>
      <Text size="sm">{children}</Text>
    </Stack>
  );
}

/**
 * Payment transaction console — "view" for a provider payment with the repair
 * actions that previously only lived in log lines and SQL:
 *
 *   - resend the payment link to the customer,
 *   - re-check the status with the provider,
 *   - force fulfilment (post sale / credit wallet),
 *   - retry/reconcile (status-check + re-deliver the webhook if it failed),
 *   - the full event log.
 */
export function RxPaymentTransactionDetailPage({ transactionId }: { transactionId: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [resendOpen, setResendOpen] = useState(false);

  const { data: tx, isLoading } = useQuery({
    queryKey: ['payment-transaction-detail', transactionId],
    queryFn: async () => {
      const { data } = await rxsoftApi.get(`/payments/${transactionId}`);
      return data;
    },
    enabled: !!transactionId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['payment-transaction-events', transactionId],
    queryFn: async (): Promise<PaymentEvent[]> => {
      const { data } = await rxsoftApi.get(`/payments/${transactionId}/events`);
      return Array.isArray(data) ? data : (data?.data ?? []);
    },
    enabled: !!transactionId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['payment-transaction-detail', transactionId] });
    qc.invalidateQueries({ queryKey: ['payment-transaction-events', transactionId] });
    qc.invalidateQueries({ queryKey: ['rxsoft-data-page'] });
  };

  const action = useMutation({
    mutationFn: async ({ verb }: { verb: 'status-check' | 'complete' | 'retry' }) => {
      const { data } = await rxsoftApi.post(`/payments/${transactionId}/${verb}`);
      return data as { completedAt?: string | null };
    },
    onSuccess: (_data, vars) => {
      const label =
        vars.verb === 'status-check'
          ? 'Status re-checked with the provider'
          : vars.verb === 'complete'
            ? 'Payment marked as completed'
            : 'Retry finished';
      notifications.show({ color: 'green', message: label });
      invalidate();
    },
    onError: (err) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(err) });
      // The attempt (and its failure reason) is still recorded — refresh the log.
      qc.invalidateQueries({ queryKey: ['payment-transaction-events', transactionId] });
    },
  });

  const status = tx?.status ?? 'unknown';
  const linkToken = tx?.paymentLink?.token ?? null;

  if (isLoading) {
    return (
      <Group justify="center" p="xl">
        <Loader />
      </Group>
    );
  }

  if (!tx) {
    return (
      <RxPage
        title="Payment transaction"
        onBack={() => navigate({ to: '/rxsoft/payment-transactions' })}
      >
        <Alert color="red" title="Not found">
          This payment transaction could not be loaded.
        </Alert>
      </RxPage>
    );
  }

  return (
    <RxPage
      title={`Payment ${tx.reference}`}
      description={`${tx.provider?.name ?? tx.providerType} · ${tx.channel} · ${tx.sourceType ?? 'no source'}`}
      onBack={() => navigate({ to: '/rxsoft/payment-transactions' })}
      actions={
        <Group gap="xs">
          <Button
            variant="default"
            leftSection={<Mail size={16} />}
            disabled={!linkToken}
            onClick={() => setResendOpen(true)}
            data-testid="payment-resend"
          >
            Resend to customer
          </Button>
          <Button
            variant="default"
            leftSection={<RefreshCw size={16} />}
            loading={action.isPending && action.variables?.verb === 'status-check'}
            onClick={() => action.mutate({ verb: 'status-check' })}
            data-testid="payment-status-check"
          >
            Status check
          </Button>
          <Button
            variant="default"
            leftSection={<RotateCcw size={16} />}
            loading={action.isPending && action.variables?.verb === 'retry'}
            onClick={() => action.mutate({ verb: 'retry' })}
            data-testid="payment-retry"
          >
            Retry
          </Button>
          <Button
            leftSection={<CheckCircle size={16} />}
            loading={action.isPending && action.variables?.verb === 'complete'}
            disabled={status !== 'success' && status !== 'settled'}
            onClick={() => action.mutate({ verb: 'complete' })}
            data-testid="payment-complete"
          >
            Complete
          </Button>
        </Group>
      }
    >
      <Stack gap="lg">
        <Card withBorder padding="lg">
          <Group justify="space-between" mb="md">
            <Title order={4}>Summary</Title>
            <Group gap="xs">
              <Badge color={STATUS_COLORS[status] ?? 'gray'} variant="light">
                {status}
              </Badge>
              {tx.completedAt ? (
                <Badge color="green" variant="filled">
                  fulfilled
                </Badge>
              ) : (
                <Badge color="yellow" variant="light">
                  not fulfilled
                </Badge>
              )}
            </Group>
          </Group>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Field label="Amount">{fmtMoney(tx.amount, tx.currency)}</Field>
            <Field label="Amount paid">{fmtMoney(tx.amountPaid, tx.currency)}</Field>
            <Field label="Reference">
              <Code>{tx.reference}</Code>
            </Field>
            <Field label="Provider reference">{tx.providerReference ?? '—'}</Field>
            <Field label="Channel">{tx.channel}</Field>
            <Field label="Source">{tx.sourceType ?? '—'}</Field>
            <Field label="Provider">{tx.provider?.code ?? tx.providerType}</Field>
            <Field label="Mode">{tx.provider?.production ? 'live' : 'sandbox'}</Field>
            <Field label="Created">{fmtDateTime(tx.createdAt)}</Field>
            <Field label="Paid">{fmtDateTime(tx.paidAt)}</Field>
            <Field label="Settled">{fmtDateTime(tx.settledAt)}</Field>
            <Field label="Fulfilled">{fmtDateTime(tx.completedAt)}</Field>
          </SimpleGrid>

          {tx.checkoutUrl && (
            <>
              <Divider my="md" />
              <Field label="Checkout URL">
                <Code>{tx.checkoutUrl}</Code>
              </Field>
            </>
          )}
          {tx.paymentLink && (
            <Stack gap={2} mt="sm">
              <Text size="xs" c="dimmed" tt="uppercase">
                Payment link
              </Text>
              <Text size="sm">
                <Code>{tx.paymentLink.url}</Code> ({tx.paymentLink.status})
              </Text>
            </Stack>
          )}
        </Card>

        <Card withBorder padding="lg">
          <Title order={4} mb="md">
            Log
          </Title>
          {events.length === 0 ? (
            <Text size="sm" c="dimmed">
              No events recorded yet.
            </Text>
          ) : (
            <ScrollArea.Autosize mah={360} type="auto" offsetScrollbars>
              <Stack gap="sm" pr="xs">
                {events.map((ev) => (
                  <Group key={ev.id} align="flex-start" wrap="nowrap" gap="sm">
                    <Badge color={EVENT_COLORS[ev.status] ?? 'gray'} variant="light" w={90}>
                      {ev.type}
                    </Badge>
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Text size="sm">{ev.message ?? '—'}</Text>
                      <Text size="xs" c="dimmed">
                        {fmtDateTime(ev.createdAt)}
                      </Text>
                      {ev.data && (
                        <Code block style={{ fontSize: 11 }}>
                          {JSON.stringify(ev.data)}
                        </Code>
                      )}
                    </Stack>
                  </Group>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          )}
        </Card>

        {tx.raw && (
          <Card withBorder padding="lg">
            <Title order={4} mb="md">
              Provider payload
            </Title>
            <Code block style={{ fontSize: 11, maxHeight: 400, overflow: 'auto' }}>
              {JSON.stringify(tx.raw, null, 2)}
            </Code>
          </Card>
        )}
      </Stack>

      <SendPaymentLinkModal
        opened={resendOpen}
        onClose={() => {
          setResendOpen(false);
          invalidate();
        }}
        token={linkToken}
        contextLabel={`Order ${tx.sourceId ?? ''} · ${fmtMoney(tx.amount, tx.currency)}`}
      />
    </RxPage>
  );
}
