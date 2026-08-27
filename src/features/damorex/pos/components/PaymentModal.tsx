import { Badge, Button, Group, Loader, Modal, NumberInput, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
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
  ) as { code?: string } | undefined;
  const usesTerminal = selectedMethod && (selectedMethod.code === 'POS' || selectedMethod.code === 'WEB');
  const usesWallet = selectedMethod?.code === 'WALLET';
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
              paymentReference: paymentReference ?? null,
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

        <Text>Total: ₦{totals.total.toFixed(2)}</Text>
        <Text>Balance: ₦{Math.max(0, balance).toFixed(2)}</Text>
        {change > 0 && <Text c="green">Change: ₦{change.toFixed(2)}</Text>}

        <Group grow>
          <Button loading={mutation.isPending} onClick={handleComplete} disabled={!canComplete}>
            Complete Sale
          </Button>
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}