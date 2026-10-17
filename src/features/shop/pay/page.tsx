import {
  Alert,
  Box,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Radio,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { ShieldCheck, Wallet, CheckCircle2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { WebsiteLayout, green, ink, darkGreen, muted, line, soft } from '../website/layout';
import { clearPaySession, loadPaySession, payApi, savePaySession, type PaySession } from './payApi';

function naira(amount: number) {
  return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type StatusPayment = {
  status: string;
  reference: string;
  providerType?: string;
  checkoutUrl?: string | null;
  amount?: number;
};

export default function PayPage() {
  const { token } = useParams({ from: '/shop/pay/$token' });
  const [providerId, setProviderId] = useState<string | null>(null);
  const [session, setSession] = useState<PaySession | null>(loadPaySession(token));
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  // The SERVER payment (provider payment record) — the source of truth for
  // "a provider payment has already been generated". The local session is
  // only a display fallback (it is device/browser scoped).
  const [payment, setPayment] = useState<StatusPayment | null>(null);
  // Escape hatch: reveal the chooser again for a failed/abandoned attempt.
  const [forceChoose, setForceChoose] = useState(false);

  const { data: link, isLoading } = useQuery({
    queryKey: ['pay-link', token],
    queryFn: () => payApi.getLink(token),
    staleTime: 30_000,
  });

  const providers = link?.providers ?? [];
  useEffect(() => {
    if (!providerId && providers.length) {
      setProviderId(providers[0].id);
    }
  }, [providers, providerId]);

  const paid = (link?.amount ?? 0) > 0;
  const returnUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    return `${window.location.origin}/shop/pay/${token}`;
  }, [token]);

  const startPayment = useCallback(async () => {
    if (!providerId) {
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const res = await payApi.initialize(token, { providerId, returnUrl });
      const sessionObj: PaySession = {
        reference: res.reference,
        status: res.status,
        provider: res.provider.code,
        checkoutUrl: res.checkoutUrl,
      };
      savePaySession(token, sessionObj);
      setSession(sessionObj);
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (e: any) {
      setError(getApiErrorMessage(e));
    } finally {
      setStarting(false);
    }
  }, [providerId, token, returnUrl]);

  const refreshStatus = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const res = await payApi.status(token);
      setPayment(res.payment ?? null);
      setLiveStatus(res.payment?.status ?? res.link.status ?? 'pending');
      if (res.payment?.status === 'success') {
        clearPaySession(token);
      }
    } catch {
      setLiveStatus('unknown');
    }
  }, [token]);

  // Always ask the server on load — a provider payment may already exist even
  // when this browser has no local session (different device / cleared storage).
  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const confirmed =
    liveStatus === 'success' || liveStatus === 'used' || payment?.status === 'success';
  const hasPayment = !!payment;
  // "A provider payment has been generated" = a server payment exists, or the
  // local session recorded the initialize() reference. Either way, don't offer
  // the provider list again.
  const inProgress = !confirmed && !forceChoose && (hasPayment || !!session);
  const showProviderChooser = !confirmed && !forceChoose && !inProgress;
  const providerName = session?.provider ?? payment?.providerType ?? '';
  const reference = session?.reference ?? payment?.reference ?? '';
  const paymentStatus = payment?.status ?? session?.status ?? 'pending';

  return (
    <WebsiteLayout>
      <Box bg="#FFFFFF">
        <Container size="sm" py={70}>
          <Stack gap="lg">
            <Group gap={8}>
              <ShieldCheck color={green} size={22} />
              <Title order={2} className="damorex-heading" style={{ color: ink }}>
                Secure Payment
              </Title>
            </Group>

            {isLoading ? (
              <Group justify="center" py={40}>
                <Loader size="sm" />
              </Group>
            ) : !link ? (
              <Alert color="red" title="Payment link not found or expired" />
            ) : (
              <>
                <Paper
                  radius={24}
                  p="xl"
                  withBorder
                  style={{ borderColor: line, background: soft }}
                >
                  <Stack gap="md">
                    {link.type === 'order_payment' && link.order ? (
                      <>
                        <Group justify="space-between">
                          <Text c={muted}>Order</Text>
                          <Text fw={800}>{link.order.orderNumber}</Text>
                        </Group>
                        {link.order.items.map((item) => (
                          <Group key={item.id} justify="space-between">
                            <Text size="sm" c={muted}>
                              {item.freetextName ?? item.itemId ?? 'Item'} x{item.quantity}
                            </Text>
                            <Text size="sm" fw={700}>
                              {naira(item.unitPrice * item.quantity)}
                            </Text>
                          </Group>
                        ))}
                        <Box style={{ borderTop: `1px dashed ${line}`, marginTop: 4 }} />
                      </>
                    ) : link.type === 'receivable' && link.receivable ? (
                      <>
                        <Group justify="space-between">
                          <Text c={muted}>Receivable</Text>
                          <Text fw={800}>{link.receivable.receivableNumber}</Text>
                        </Group>
                        {link.receivable.customerName && (
                          <Group justify="space-between">
                            <Text size="sm" c={muted}>
                              Customer
                            </Text>
                            <Text size="sm" fw={700}>
                              {link.receivable.customerName}
                            </Text>
                          </Group>
                        )}
                        <Group justify="space-between">
                          <Text size="sm" c={muted}>
                            Original Amount
                          </Text>
                          <Text size="sm" fw={700}>
                            {naira(link.receivable.originalAmount)}
                          </Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c={muted}>
                            Outstanding
                          </Text>
                          <Text size="sm" fw={700} c={darkGreen}>
                            {naira(link.receivable.outstandingAmount)}
                          </Text>
                        </Group>
                        <Box style={{ borderTop: `1px dashed ${line}`, marginTop: 4 }} />
                      </>
                    ) : (
                      <Group justify="space-between">
                        <Group gap={8}>
                          <Wallet size={18} color={green} />
                          <Text fw={700}>Wallet Top-up</Text>
                        </Group>
                        <Text c={muted}>{link.note ?? 'Deposit to your wallet'}</Text>
                      </Group>
                    )}

                    <Group justify="space-between">
                      <Text fw={800} size="lg" className="damorex-heading">
                        Amount Due
                      </Text>
                      <Text fw={900} size="xl" c={darkGreen} className="damorex-heading">
                        {naira(link.amount)}
                      </Text>
                    </Group>
                  </Stack>
                </Paper>

                {showProviderChooser && (
                  <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
                    <Stack gap="md">
                      <Text fw={900} size="lg" className="damorex-heading">
                        Choose payment method
                      </Text>
                      <Radio.Group value={providerId} onChange={setProviderId}>
                        <Stack gap="xs">
                          {providers.map((p) => (
                            <Paper
                              key={p.id}
                              radius={16}
                              withBorder
                              p="sm"
                              style={{
                                borderColor: providerId === p.id ? green : line,
                                background: providerId === p.id ? soft : '#FFFFFF',
                                cursor: 'pointer',
                              }}
                              onClick={() => setProviderId(p.id)}
                            >
                              <Radio
                                value={p.id}
                                label={`${p.name} (${p.production ? 'Live' : 'Test'})`}
                              />
                            </Paper>
                          ))}
                        </Stack>
                      </Radio.Group>

                      {error && (
                        <Alert color="red" title="Payment error">
                          {error}
                        </Alert>
                      )}

                      <Button
                        size="lg"
                        radius="xl"
                        loading={starting}
                        disabled={!providerId || !paid}
                        onClick={startPayment}
                        fullWidth
                        style={{ backgroundColor: green }}
                      >
                        {paid ? 'Pay Now' : 'Start Payment'}
                      </Button>
                    </Stack>
                  </Paper>
                )}

                {confirmed ? (
                  <Paper
                    radius={24}
                    p="xl"
                    withBorder
                    style={{ borderColor: green, background: soft }}
                  >
                    <Stack align="center" gap="sm">
                      <CheckCircle2 size={36} color={green} />
                      <Text fw={900} size="lg" c={darkGreen} className="damorex-heading">
                        Payment successful
                      </Text>
                      <Text size="sm" c={muted}>
                        {link.type === 'order_payment'
                          ? 'Your order has been confirmed.'
                          : link.type === 'receivable'
                            ? 'Your receivable has been settled.'
                            : 'Your wallet has been credited.'}
                      </Text>
                    </Stack>
                  </Paper>
                ) : inProgress ? (
                  <Paper radius={24} p="xl" withBorder style={{ borderColor: line }}>
                    <Stack gap="md" align="center">
                      <Text fw={900} size="lg" className="damorex-heading">
                        Payment in progress
                      </Text>
                      <Stack gap={6} w="100%">
                        <Group justify="space-between">
                          <Text size="sm" c={muted}>
                            Amount
                          </Text>
                          <Text size="sm" fw={700}>
                            {naira(payment?.amount ?? link.amount)}
                          </Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c={muted}>
                            Provider
                          </Text>
                          <Text size="sm" fw={700}>
                            {providerName || '—'}
                          </Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c={muted}>
                            Reference
                          </Text>
                          <Text size="sm" fw={700}>
                            {reference}
                          </Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c={muted}>
                            Status
                          </Text>
                          <Text size="sm" fw={700} tt="capitalize">
                            {paymentStatus}
                          </Text>
                        </Group>
                      </Stack>
                      <Button
                        variant="light"
                        radius="xl"
                        leftSection={<RefreshCw size={16} />}
                        onClick={refreshStatus}
                        fullWidth
                      >
                        Check payment status
                      </Button>
                      <Button
                        variant="subtle"
                        size="xs"
                        c={muted}
                        onClick={() => {
                          clearPaySession(token);
                          setSession(null);
                          setLiveStatus(null);
                          setForceChoose(true);
                        }}
                      >
                        Use a different payment method
                      </Button>
                    </Stack>
                  </Paper>
                ) : null}
              </>
            )}
          </Stack>
        </Container>
      </Box>
    </WebsiteLayout>
  );
}
