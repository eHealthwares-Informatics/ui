import {
  ActionIcon,
  Alert,
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
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Link, Mail, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SendPaymentLinkModal } from '@/features/rxsoft/payment-links/SendPaymentLinkModal';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { rxsoftApi } from '@/lib/rxsoft-api';
import {
  useCreateCustomer,
  useCreateSale,
  useCustomers,
  useDebitWallet,
  useInitiatePosPayment,
  usePaymentMethods,
  usePosTerminals,
  useQueryPosPayment,
} from '../../api/posApi';
import { usePosStore } from '../store/usePosStore';
import { isNetworkError } from '../utils/offline-sales';

interface Props {
  opened: boolean;
  onClose: () => void;
  totals: { total: number };
  session: any;
  onComplete: (saleResult?: any) => void;
}

/** Digits only — phone formats differ between customers. */
function phoneDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

const POS_TERMINAL_TIMEOUT_MS = 120_000;
const POS_POLL_INTERVAL_MS = 3_000;

/**
 * Sentinel select value for "no customer" (a walk-in sale). The select shows
 * "Walk-In" and the sale is submitted with `customerId: null`, but the sentinel
 * must never leak to the API or be mistaken for a real customer id.
 */
export const WALK_IN_CUSTOMER_ID = '__walk_in__';

export function PaymentModal({ opened, onClose, totals, session, onComplete }: Props) {
  const [paid, setPaid] = useState(totals.total);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [terminalId, setTerminalId] = useState<string | null>(null);
  const [posRef, setPosRef] = useState<string | null>(null);
  const [posStatus, setPosStatus] = useState<
    'idle' | 'initiating' | 'awaiting' | 'success' | 'failed'
  >('idle');
  const [providerId, setProviderId] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<{ token: string; url: string } | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [sendLinkOpen, setSendLinkOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  /**
   * Selected customer. The payment dialog shows a customer SELECT; the free-text
   * name remains only as "the thing being typed", so a walk-in with just a name
   * still resolves to a new customer (rxsoft-qa#806).
   */
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [walletPaymentRef, setWalletPaymentRef] = useState<string | null>(null);
  const [walletDebited, setWalletDebited] = useState(false);
  const [offlinePrompt, setOfflinePrompt] = useState(false);
  const lastPayloadRef = useRef<any>(null);
  const walletDebitedRef = useRef(false);
  const cashDefaultedRef = useRef(false);
  const enqueueOfflineSale = usePosStore((s) => s.enqueueOfflineSale);

  function resetAttemptState() {
    setWalletPaymentRef(null);
    setWalletDebited(false);
    setOfflinePrompt(false);
    lastPayloadRef.current = null;
    walletDebitedRef.current = false;
  }

  // ── Customer: select + phone lookup (rxsoft-qa#806) ──────────────────────
  // The select is server-searched (name/phone/email all match on the backend).
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedCustomerSearch] = useDebouncedValue(customerSearch, 300);
  const { data: customerResults = [] } = useCustomers(debouncedCustomerSearch.trim() || undefined, {
    enabled: debouncedCustomerSearch.trim().length >= 3,
  });

  // …and typing a NUMBER first looks the customer up and selects them.
  const [debouncedPhone] = useDebouncedValue(customerPhone, 400);
  const phoneDigitsTyped = phoneDigits(debouncedPhone);
  const { data: phoneResults = [] } = useCustomers(
    phoneDigitsTyped.length >= 6 ? debouncedPhone.trim() : undefined,
    { enabled: phoneDigitsTyped.length >= 6 }
  );

  useEffect(() => {
    if (phoneDigitsTyped.length < 6) {
      return;
    }
    // Exact phone equality only — a partial number must not hijack the select.
    const match = (phoneResults as Array<{ id: string; name?: string; phone?: string }>).find(
      (c) => phoneDigits(c.phone) === phoneDigitsTyped
    );
    if (match && match.id !== customerId) {
      setCustomerId(match.id);
      setCustomerName(match.name ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneDigitsTyped, phoneResults]);

  // The customer selected in the toolbar (if any) must be an option even when
  // the server-side search has not returned it — otherwise the select would
  // hold a value with no label and the prefill would look empty.
  const sessionCustomer = session?.customerId
    ? {
        id: String(session.customerId),
        name: String(session.customerName ?? session.customer?.name ?? ''),
        phone: session.customer?.phone as string | undefined,
      }
    : null;

  // Options come from the session selection + BOTH searches: a customer found
  // by their phone number must also be an option, or the picked customer would
  // be invisible to the operator.
  const rawCustomerOptions = [
    ...(sessionCustomer ? [sessionCustomer] : []),
    ...(customerResults as Array<{ id: string; name?: string; phone?: string }>),
    ...(phoneResults as Array<{ id: string; name?: string; phone?: string }>),
  ].filter((c, index, all) => all.findIndex((o) => o.id === c.id) === index);

  // "Walk-In" is always available as the explicit no-customer choice.
  const customerSelectData = [
    { value: WALK_IN_CUSTOMER_ID, label: 'Walk-In' },
    ...rawCustomerOptions.map((c) => ({
      value: c.id,
      label: `${c.name || c.id}${c.phone ? ` · ${c.phone}` : ''}`,
    })),
  ];

  useEffect(() => {
    if (opened) {
      setPaid(totals.total);
      setMethodId(null);
      cashDefaultedRef.current = false;
      setTerminalId(null);
      setPosRef(null);
      setPosStatus('idle');
      setProviderId(null);
      setPaymentLink(null);
      setIsGeneratingLink(false);
      resetAttemptState();
      // Pre-fill customer name + phone from the toolbar selection. With no
      // customer selected the sale defaults to Walk-In with an empty phone.
      const hasCustomer = !!session?.customerId;
      setCustomerId(hasCustomer ? String(session.customerId) : WALK_IN_CUSTOMER_ID);
      setCustomerName(
        hasCustomer ? String(session?.customerName ?? session?.customer?.name ?? '') : 'Walk-In'
      );
      setCustomerPhone(session?.customer?.phone || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    opened,
    totals.total,
    session?.customerId,
    session?.customerName,
    session?.customer?.name,
    session?.customer?.phone,
  ]);

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
      return (Array.isArray(data) ? data : (data?.data ?? [])) as Array<{
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

  const createCustomer = useCreateCustomer();
  const mutation = useCreateSale({
    onSuccess: (data) => {
      resetAttemptState();
      onComplete(data);
      onClose();
    },
    onError: (error) => {
      // Transport failure → offer an offline completion. Business errors (4xx
      // e.g. insufficient stock) must never be completed offline.
      if (isNetworkError(error)) {
        setOfflinePrompt(true);
        notifications.show({
          color: 'orange',
          title: 'Backend unreachable',
          message: 'Complete this sale offline? It will be queued and synced automatically.',
          autoClose: false,
        });
        return;
      }
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
      if (walletDebitedRef.current) {
        notifications.show({
          color: 'orange',
          title: 'Wallet debited, sale not recorded',
          message: 'Retry will reuse the payment reference — do not debit again.',
          autoClose: false,
        });
      }
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

  // Default the payment method to Cash on each open (once the methods load).
  // A manual change is respected — the ref stops us re-defaulting if the
  // cashier clears the select.
  useEffect(() => {
    if (!opened || cashDefaultedRef.current) {
      return;
    }
    const methods = Array.isArray(paymentMethods) ? paymentMethods : [];
    if (methods.length === 0) {
      return;
    }
    const cash = methods.find(
      (pm: any) => pm.code === 'CASH' || /^cash$/i.test(String(pm.name ?? '').trim())
    );
    if (cash) {
      setMethodId(cash.id);
    }
    cashDefaultedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, paymentMethods]);

  const usesTerminal =
    selectedMethod && (selectedMethod.code === 'POS' || selectedMethod.code === 'WEB');
  const usesWallet = selectedMethod?.code === 'WALLET';
  const usesTransfer = selectedMethod?.methodType === 'transfer';
  const balance = totals.total - paid;
  const change = paid > totals.total ? paid - totals.total : 0;

  useEffect(() => {
    return () => {
      if (pollTimer.current) {
        clearTimeout(pollTimer.current);
      }
    };
  }, []);

  function clearPosState() {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
    }
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
      const res = await initiate.mutateAsync({
        amount: paid,
        terminalId,
        paymentMethodId: methodId,
      });
      setPosRef(res.reference);
      setPosStatus('awaiting');
      pollPos(res.reference, 0);
      notifications.show({
        color: 'blue',
        message: `POS charge started (${res.nextAction ?? 'swipe/pin on terminal'})`,
      });
    } catch (e: any) {
      setPosStatus('failed');
      notifications.show({ color: 'red', message: getApiErrorMessage(e) });
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
          notifications.show({
            color: 'orange',
            message: 'POS payment timed out — polling stopped',
          });
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
    if (!providerId) {
      return;
    }
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
        message: getApiErrorMessage(e),
      });
    } finally {
      setIsGeneratingLink(false);
    }
  }

  function handleSendToCustomer() {
    if (!paymentLink) {
      return;
    }
    // Ask which org-configured channel to send over (channel codes live in
    // Organisation Config) before sending to the customer — do NOT just open a tab.
    setSendLinkOpen(true);
  }

  function handleCopyLink() {
    if (!paymentLink) {
      return;
    }
    navigator.clipboard.writeText(paymentLink.url);
    notifications.show({ color: 'green', message: 'Link copied to clipboard' });
  }

  async function handleComplete() {
    // Customer: a selected customer wins; otherwise a typed name or the phone
    // number creates one. The Walk-In sentinel means "no customer" and must
    // never create a customer or leak into the payload. A number with no match
    // still resolves to a customer (rxsoft-qa#806), using the number itself as
    // the name when nothing else is known.
    const isWalkIn = customerId === WALK_IN_CUSTOMER_ID;
    let resolvedCustomerId = isWalkIn ? null : (customerId ?? session.customerId ?? null);
    // Mantine mirrors the selected option's label into `searchValue`, so a
    // Walk-In selection can also surface as the search text. Ignore the
    // "Walk-In" label in both places or we would create a customer literally
    // named Walk-In.
    const typedNameRaw = customerName.trim();
    const searchName = customerSearch.trim();
    const notWalkInLabel = (value: string) => value.toLowerCase() !== 'walk-in';
    const typedName =
      (typedNameRaw && notWalkInLabel(typedNameRaw) ? typedNameRaw : '') ||
      (searchName && notWalkInLabel(searchName) ? searchName : '');
    const typedPhone = customerPhone.trim();
    if (!resolvedCustomerId && (typedName || typedPhone)) {
      try {
        const newCustomer = await createCustomer.mutateAsync({
          name: typedName || typedPhone,
          phone: typedPhone || undefined,
        });
        resolvedCustomerId = newCustomer.id;
      } catch (e: any) {
        if (isNetworkError(e)) {
          // Backend unreachable — do not block the sale. Continue as a walk-in
          // and let the sale mutation surface the offline prompt so the sale
          // can be queued offline.
          notifications.show({
            color: 'orange',
            title: 'Customer not created (offline)',
            message:
              'The customer could not be created because the backend is unreachable — continuing as a walk-in. The sale will be queued offline.',
            autoClose: false,
          });
          resolvedCustomerId = null;
        } else {
          notifications.show({
            color: 'red',
            message: 'Failed to create customer: ' + getApiErrorMessage(e),
          });
          return;
        }
      }
    }

    const lines = (session.cart || []).map((item: any) => ({
      itemId: item.id,
      orderItemId: item.orderItemId ?? undefined,
      uomId: item.uomId || '',
      quantity: item.quantity,
      unitPrice: session.pricingMode === 'wholesale' ? item.wholesalePrice : item.retailPrice,
      priceListId: session.priceListId || undefined,
    }));

    let paymentReference: string | undefined;
    const payAmount = paid;

    if (usesWallet) {
      if (walletPaymentRef) {
        // A previous debit succeeded but the sale did not. Reuse the same
        // reference on retry instead of debiting the wallet a second time.
        paymentReference = walletPaymentRef;
      } else {
        try {
          const res = await debitWallet.mutateAsync({
            amount: payAmount,
            note: 'Sale paid from wallet',
          });
          paymentReference = res.reference;
          setWalletPaymentRef(res.reference ?? null);
          setWalletDebited(true);
          walletDebitedRef.current = true;
        } catch (e: any) {
          notifications.show({ color: 'red', message: getApiErrorMessage(e) });
          return;
        }
      }
    } else if (usesTerminal) {
      if (posStatus !== 'success' || !posRef) {
        notifications.show({
          color: 'red',
          message: 'Complete the POS charge before finalising the sale',
        });
        return;
      }
      paymentReference = posRef;
    }

    const payload: any = {
      saleNumber: session.saleCode,
      saleChannel: 'pos',
      storeId: posConfig?.storeId ?? 'default',
      customerId: resolvedCustomerId,
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

    lastPayloadRef.current = payload;
    mutation.mutate(payload);
  }

  function handleCompleteOffline() {
    const payload = lastPayloadRef.current;
    if (!payload) {
      setOfflinePrompt(false);
      return;
    }
    enqueueOfflineSale({ payload, saleCode: session.saleCode });
    resetAttemptState();
    onComplete({ offline: true, saleNumber: session.saleCode, id: undefined });
    onClose();
  }

  const canComplete = usesTerminal
    ? posStatus === 'success'
    : usesWallet
      ? !debitWallet.isPending
      : usesTransfer
        ? !!paymentLink
        : true && !!methodId;

  return (
    <Modal
      opened={opened}
      onClose={() => {
        clearPosState();
        resetAttemptState();
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

        <Select
          label="Customer"
          data-testid="pos-customer-select"
          placeholder="Search by name or phone (leave blank for walk-in)"
          searchable
          clearable
          nothingFoundMessage="No match — this name/number will create a customer"
          data={customerSelectData}
          value={customerId}
          searchValue={customerSearch}
          onSearchChange={setCustomerSearch}
          onChange={(value) => {
            const next = value ?? WALK_IN_CUSTOMER_ID;
            setCustomerId(next);
            if (next === WALK_IN_CUSTOMER_ID) {
              setCustomerName('Walk-In');
              setCustomerPhone('');
              return;
            }
            const picked = rawCustomerOptions.find((c) => c.id === next);
            if (picked) {
              setCustomerName(picked.name ?? '');
              setCustomerPhone(picked.phone ?? '');
            }
          }}
        />
        <TextInput
          label="Customer Phone"
          placeholder="Enter phone number"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.currentTarget.value)}
          data-testid="pos-customer-phone"
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
              data={terminals.map((t) => ({
                value: t.id,
                label: `${t.label ?? t.code} (${t.providerType})`,
              }))}
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

        {walletDebited && !offlinePrompt && (
          <Alert color="yellow" data-testid="pos-wallet-outstanding">
            Wallet was debited but the sale was not recorded. Retrying reuses the payment reference
            — do not debit again.
          </Alert>
        )}

        {offlinePrompt && (
          <Alert color="orange" title="Backend unreachable" data-testid="pos-offline-prompt">
            <Text size="sm">
              The sale could not reach the server. Complete it offline? It will be queued and synced
              automatically when the connection returns.
            </Text>
            <Group mt="sm">
              <Button
                color="orange"
                size="xs"
                onClick={handleCompleteOffline}
                data-testid="pos-complete-offline-btn"
              >
                Complete sale offline
              </Button>
              <Button variant="subtle" size="xs" onClick={() => setOfflinePrompt(false)}>
                Cancel
              </Button>
            </Group>
          </Alert>
        )}

        <Group grow>
          <Button
            loading={mutation.isPending}
            onClick={handleComplete}
            disabled={!canComplete}
            data-testid="pos-complete-sale-btn"
          >
            Complete Sale
          </Button>
          <Button
            variant="light"
            onClick={() => {
              resetAttemptState();
              onClose();
            }}
            data-testid="pos-cancel-payment-btn"
          >
            Cancel
          </Button>
        </Group>
      </Stack>

      {sendLinkOpen && (
        <SendPaymentLinkModal
          opened
          onClose={() => setSendLinkOpen(false)}
          token={paymentLink?.token ?? null}
          contextLabel={`Payment link for ₦${paid.toFixed(2)}`}
        />
      )}
    </Modal>
  );
}
