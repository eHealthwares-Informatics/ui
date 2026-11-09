import { Button, Modal, NumberInput, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { conversationApi } from '@/lib/conversation-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { buildBillingWalletsConfig } from './schema';

export function RxBillingWalletsPage() {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<Record<string, unknown> | null>(null);
  const [amount, setAmount] = useState<number | string>(0);
  const [reason, setReason] = useState('');

  const credit = useMutation({
    mutationFn: async () => {
      const id = String(target?.id ?? '');
      await conversationApi.post(`/billing/wallets/${id}/credit`, {
        amountCoins: Number(amount),
        reason: reason.trim() || undefined,
      });
    },
    onSuccess: () => {
      notifications.show({
        color: 'green',
        message: 'Wallet credited',
      });
      setTarget(null);
      setAmount(0);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['billing-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['billing-charges'] });
    },
    onError: (error) => notifications.show({ color: 'red', message: getApiErrorMessage(error) }),
  });

  const onCredit = useCallback((row: Record<string, unknown>) => {
    setTarget(row);
    setAmount(0);
    setReason('');
  }, []);

  const config = useMemo(() => buildBillingWalletsConfig({ onCredit }), [onCredit]);

  return (
    <>
      <DataPageShell config={config} />

      <Modal
        opened={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Credit wallet"
        centered
        size="md"
      >
        {target ? (
          <Stack gap="md">
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Wallet
              </Text>
              <Text size="sm" ff="monospace">
                {String(target.ownerType ?? '')} · {String(target.ownerId ?? '')}
              </Text>
              <Text size="xs" c="dimmed">
                Current balance: {Number(target.balanceCoins ?? 0)} coins
              </Text>
            </Stack>

            <NumberInput
              data-testid="billing-wallet-credit-amount"
              label="Coins"
              description="Positive to credit, negative to adjust down."
              value={amount}
              onChange={setAmount}
              allowDecimal
            />

            <Textarea
              data-testid="billing-wallet-credit-reason"
              label="Reason"
              placeholder="Manual top-up, correction, refund…"
              value={reason}
              onChange={(event) => setReason(event.currentTarget.value)}
              autosize
              minRows={2}
            />

            <Button
              data-testid="billing-wallet-credit-submit"
              loading={credit.isPending}
              disabled={!Number(amount)}
              onClick={() => credit.mutate()}
            >
              Credit wallet
            </Button>
          </Stack>
        ) : null}
      </Modal>
    </>
  );
}
