import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ExternalLink, Link, Mail, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rxsoftApi } from '@/lib/rxsoft-api';
import {
  useCreateSale,
  useDebitWallet,
  useInitiatePosPayment,
  usePaymentMethods,
  usePosTerminals,
  useQueryPosPayment,
} from '../../api/posApi';

interface Props {
  opened: boolean;
  onClose: () => void;
  totals: { total: number };
  session: any;
  onComplete: () => void;
}

const POS_TERMINAL_TIMEOUT_MS = 120_000;
const POS_POLL_INTERVAL_MS = 3_000;

export function PaymentModal({ opened, onClose, totals, session, onComplete }: Props) {
  const [paid, setPaid] = useState(totals.total);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [terminalId, setTerminalId] = useState<string | null>(null);
  const [posRef, setPosRef] = useState<string | null>(null);
  const [posStatus, setPosStatus] = useState<'idle' | 'initiating' | 'awaiting' | 'success' | 'failed'>('idle');
  const [providerId, setProviderId] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<{ token: string; url: string } | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  useEffect(() => {
    if (opened) {
      setPaid(totals.total);
      setMethodId(null);
      setTerminalId(null);
      setPosRef(null);
      setPosStatus('idle');
      setProviderId(null);
      setPaymentLink(null);
      setIsGeneratingLink(false);
    }
  }, [opened, totals.total]);

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: terminals = [] } = usePosTerminals();
  const { data: posConfig } = useQuery({
    queryKey: ['user-pos-config', 'me'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/user-pos-config/me');
      return data;
    },
    staleTime: 60_000,
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['payment-providers', 'available', 'web'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/payment-providers/available', {
        params: { channel: 'web' },
      });
      return (Array.isArray(data) ? data : data?.data ?? []) as Array<{
        id: string;
        code: string;
        name: string;
        providerType: string;
        production: boolean;
        configured: boolean;
      }>;
    },
    staleTime: 60_000,
  });

  const mutation = useCreateSale({
    onSuccess: () => {
      onComplete();
      onClose();
    },
  });

  const initiate = useInitiatePosPayment();
  const queryPos = useQueryPosPayment();
  const debitWallet = useDebitWallet();

  const methodOptions = (Array.isArray(paymentMethods) ? paymentMethods : []).map((pm: any) => ({
    value: pm.id,
    label: pm.name,
  }));

  const selectedMethod = (Array.isArray(paymentMethods) ? paymentMethods : []).find(
    (pm: any) => pm.id === methodId
  ) as { code?: string; methodType?: string } | undefined;

  const usesTerminal = selectedMethod && (selectedMethod.code === 'POS' || selectedMethod.code === 'WEB');
  const usesWallet = selectedMethod?.code === 'WALLET';
  const usesTransfer = selectedMethod?.methodType === 'transfer';
  const balance = totals.total - paid;
  const change = paid > totals.total ? paid - totals.total : 0;

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  function clearPosState() {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    setPosRef(null);
    setPosStatus('idle');
    setPaymentLink(null);
    setIsGeneratingLink(false);
    setProviderId(null);
  }

  async function handleInitiatePos() {
    if (!terminalId) {
      notifications.show({ color: 'red', message: 'Select a POS terminal first' });
      return;
    }
    setPosStatus('initiating');
    try {
      const res = await initiate.mutateAsync({ amount: paid, terminalId, paymentMethodId: methodId });
      setPosRef(res.reference);
      setPosStatus('awaiting');
      pollPos(res.reference, 0);
      notifications.show({ color: 'blue', message: `POS charge started (${res.nextAction ?? 'swipe/pin on terminal'})` });
    } catch (e: any) {
      setPosStatus('failed');
      notifications.show({ color: 'red', message: e?.response?.data?.message ?? e?.message ?? 'POS charge failed' });
    }
  }

  function pollPos(reference: string, elapsed: number) {
    pollTimer.current = setTimeout(async () => {
      try {
        const res = await queryPos.mutateAsync(reference);
        if (res.status === 'success') {
          setPosStatus('success');
          return;
        }
        if (res.status === 'failed' || res.status === 'cancelled' || res.status === 'expired') {
          setPosStatus('failed');
          notifications.show({ color: 'red', message: `POS payment ${res.status}` });
          return;
        }
        if (elapsed < POS_TERMINAL_TIMEOUT_MS) {
          pollPos(reference, elapsed + POS_POLL_INTERVAL_MS);
        } else {
          setPosStatus('failed');
          notifications.show({ color: 'orange', message: 'POS payment timed out — polling stopped' });
        }
      } catch {
        if (elapsed < POS_TERMINAL_TIMEOUT_MS) {
          pollPos(reference, elapsed + POS_POLL_INTERVAL_MS);
        } else {
          setPosStatus('failed');
        }
      }
    }, POS_POLL_INTERVAL_MS);
  }

  async function handleGenerateLink() {
    if (!providerId) return;
    setIsGeneratingLink(true);
    try {
      const { data } = await rxsoftApi.post('/payment-links', {
        type: 'wallet_deposit',
        amount: paid,
        customerId: session.customerId || null,
        userId: null,
      });
      setPaymentLink({ token: data.token, url: data.url });
      notifications.show({ color: 'green', message: 'Payment link generated' });
    } catch (e: any) {
      notifications.show({
        color: 'red',
        message: e?.response?.data?.message ?? 'Failed to generate payment link',
      });
    } finally {
      setIsGeneratingLink(false);
    }
  }

  function handleSendToCustomer() {
    if (!paymentLink) return;
    window.open(paymentLink.url, '_blank');
    notifications.show({ color: 'green', message: 'Payment link opened for customer' });
  }

  function handleCopyLink() {
    if (!paymentLink) return;
    navigator.clipboard.writeText(paymentLink.url);
    notifications.show({ color: 'green', message: 'Link copied to clipboard' });
  }

  async function handleComplete() {
    const lines = (session.cart || []).map((item: any) => ({
      itemId: item.id,
      uomId: item.uomId || '',
      quantity: item.quantity,
      unitPrice: session.pricingMode === 'wholesale' ? item.wholesalePrice : item.retailPrice,
    }));

    let paymentReference: string | undefined;
    let payAmount = paid;

    if (usesWallet) {
      const res = await debitWallet.mutateAsync({ amount: payAmount, note: 'Sale paid from wallet' });
      paymentReference = res.reference;
    } else if (usesTerminal) {
      if (posStatus !== 'success' || !posRef) {
        notifications.show({ color: 'red', message: 'Complete the POS charge before finalising the sale' });
        return;
      }
      paymentReference = posRef;
    }

    const payload: any = {
      saleNumber: session.saleCode,
      saleChannel: 'pos',
      storeId: posConfig?.storeId ?? 'default',
      customerId: session.customerId || null,
      stockLocationId: posConfig?.stockLocationId ?? null,
      lines,
      payments: methodId
        ? [
            {
              paymentMethodId: methodId,
              amount: payAmount,
              paymentReference: paymentLink?.token ?? paymentReference ?? null,
            },
          ]
        : [],
    };

    mutation.mutate(payload);
  }

  const canComplete = usesTerminal
    ? posStatus === 'success'
    : usesWallet
      ? debitWallet.isPending
      : usesTransfer
        ? !!paymentLink
        : true && !!methodId;

  return (
    <Modal
      opened={opened}
      onClose={() => {
        clearPosState();
        onClose();
      }}
      title="Payment"
      centered
      data-testid="pos-payment-modal"
    >
      <Stack>
        <Select
          label="Payment Method"
          value={methodId}
          onChange={(v) => {
            setMethodId(v || null);
            clearPosState();
          }}
          data={methodOptions}
          placeholder="Select method"
          clearable
          data-testid="pos-payment-method"
        />

        <NumberInput
          label="Amount Paid"
          value={paid}
          onChange={(v) => setPaid(Number(v) || 0)}
          min={0}
        />

        {usesTerminal && (
          <>
            <Select
              label="POS Terminal"
              value={terminalId}
              onChange={(v) => setTerminalId(v || null)}
              placeholder={terminals.length ? 'Select terminal' : 'No terminals configured'}
              data={terminals.map((t) => ({ value: t.id, label: `${t.label ?? t.code} (${t.providerType})` }))}
              disabled={terminals.length === 0}
            />
            <Group grow>
              <Button
                variant="light"
                color={posStatus === 'success' ? 'green' : 'blue'}
                loading={posStatus === 'initiating'}
                leftSection={posStatus === 'awaiting' ? <Loader size={14} /> : undefined}
                disabled={!terminalId || posStatus === 'awaiting' || posStatus === 'success'}
                onClick={handleInitiatePos}
              >
                {posStatus === 'success' ? 'Card approved' : 'Charge Card on Terminal'}
              </Button>
              {posStatus !== 'idle' && posStatus !== 'success' && (
                <Button variant="subtle" onClick={clearPosState}>
                  Reset
                </Button>
              )}
            </Group>
            {posStatus === 'awaiting' && (
              <Badge variant="light" color="blue">
                Waiting for terminal payment… {posRef}
              </Badge>
            )}
          </>
        )}

        {usesWallet && (
          <Badge variant="light" color="teal">
            Wallet payment — balance debited on completion
          </Badge>
        )}

        {usesTransfer && (
          <>
            {!paymentLink && (
              <>
                <Select
                  label="Payment Provider"
                  value={providerId}
                  onChange={(v) => setProviderId(v || null)}
                  placeholder="Select provider"
                  data={providers
                    .filter((p) => p.configured)
                    .map((p) => ({ value: p.id, label: `${p.name} (${p.providerType})` }))}
                />
                <Button
                  loading={isGeneratingLink}
                  disabled={!providerId}
                  onClick={handleGenerateLink}
                  leftSection={<Link size={14} />}
                >
                  Generate Payment Link
                </Button>
              </>
            )}

            {paymentLink && (
              <Stack gap="sm">
                <TextInput
                  value={paymentLink.url}
                  readOnly
                  rightSection={
                    <ActionIcon variant="subtle" onClick={handleCopyLink} title="Copy link">
                      <Copy size={14} />
                    </ActionIcon>
                  }
                />
                <Group>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<ExternalLink size={14} />}
                    onClick={() => window.open(paymentLink.url, '_blank')}
                  >
                    Open in Tab
                  </Button>
                  <Button
                    variant="light"
                    size="xs"
                    color="teal"
                    leftSection={<Mail size={14} />}
                    onClick={handleSendToCustomer}
                  >
                    Send to Customer
                  </Button>
                </Group>
                <Badge variant="light" color="teal">
                  Link generated — waiting for customer to pay
                </Badge>
              </Stack>
            )}
          </>
        )}

        <Text data-testid="pos-payment-total">Total: ₦{totals.total.toFixed(2)}</Text>
        <Text data-testid="pos-payment-balance">Balance: ₦{Math.max(0, balance).toFixed(2)}</Text>
        {change > 0 && <Text c="green">Change: ₦{change.toFixed(2)}</Text>}

        <Group grow>
          <Button loading={mutation.isPending} onClick={handleComplete} disabled={!canComplete} data-testid="pos-complete-sale-btn">
            Complete Sale
          </Button>
          <Button variant="light" onClick={onClose} data-testid="pos-cancel-payment-btn">
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}