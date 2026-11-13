import { Badge, Button, Modal, NumberInput, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { conversationApi } from '@/lib/conversation-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useAuthStore } from '@/stores/auth-store';
import { buildBillingWalletsConfig } from './schema';

export function RxBillingWalletsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false;
  const selectedOrganisationId = useAuthStore((state) => state.selectedOrganisationId);
  const organizationId = selectedOrganisationId ?? null;

  const config = useMemo(
    () =>
      buildBillingWalletsConfig({
        organizationId,
        isSuperAdmin,
        onCredit: (row) => setCreditTarget(row),
        onEditWallet: (row) => setEditTarget(row),
      }),
    [organizationId, isSuperAdmin],
  );

  // ── Credit modal ──────────────────────────────────────────
  const [creditTarget, setCreditTarget] = useState<Record<string, unknown> | null>(null);
  const [creditAmount, setCreditAmount] = useState<number | string>(0);
  const [creditReason, setCreditReason] = useState('');

  const credit = useMutation({
    mutationFn: async () => {
      const id = String(creditTarget?.id ?? '');
      await conversationApi.post(`/billing/wallets/${id}/credit`, {
        amountCoins: Number(creditAmount),
        reason: creditReason.trim() || undefined,
      });
    },
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Wallet credited' });
      setCreditTarget(null);
      setCreditAmount(0);
      setCreditReason('');
      queryClient.invalidateQueries({ queryKey: ['billing-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['billing-charges'] });
    },
    onError: (error) => notifications.show({ color: 'red', message: getApiErrorMessage(error) }),
  });

  // ── Edit balance modal ────────────────────────────────────
  const [editTarget, setEditTarget] = useState<Record<string, unknown> | null>(null);
  const [editAmount, setEditAmount] = useState<number | string>(0);
  const [editReason, setEditReason] = useState('');

  const editWallet = useMutation({
    mutationFn: async () => {
      const id = String(editTarget?.id ?? '');
      await conversationApi.patch(`/billing/wallets/${id}`, {
        balanceCoins: Number(editAmount),
      });
    },
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Wallet updated' });
      setEditTarget(null);
      setEditAmount(0);
      setEditReason('');
      queryClient.invalidateQueries({ queryKey: ['billing-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['billing-charges'] });
    },
    onError: (error) => notifications.show({ color: 'red', message: getApiErrorMessage(error) }),
  });

  return (
    <>
      <DataPageShell config={config} />

      {/* Credit modal */}
      <Modal
        opened={Boolean(creditTarget)}
        onClose={() => setCreditTarget(null)}
        title="Credit wallet"
        centered
        size="md"
      >
        {creditTarget ? (
          <Stack gap="md">
            <Stack gap={2}>
              <Text size="xs" c="dimmed">Wallet</Text>
              <Text size="sm" ff="monospace">
                {String(creditTarget.ownerType ?? '')} ·
                {String(creditTarget.ownerId ?? '')}
              </Text>
              <Text size="xs" c="dimmed">
                Current balance: {Number(creditTarget.balanceCoins ?? 0)} coins
              </Text>
            </Stack>
            <NumberInput
              data-testid="billing-wallet-credit-amount"
              label="Coins"
              description="Positive to credit, negative to adjust down."
              value={creditAmount}
              onChange={setCreditAmount}
              allowDecimal
            />
            <Textarea
              data-testid="billing-wallet-credit-reason"
              label="Reason"
              placeholder="Manual top-up, correction, refund…"
              value={creditReason}
              onChange={(event) => setCreditReason(event.currentTarget.value)}
              autosize
              minRows={2}
            />
            <Button
              data-testid="billing-wallet-credit-submit"
              loading={credit.isPending}
              disabled={!Number(creditAmount)}
              onClick={() => credit.mutate()}
            >
              Credit wallet
            </Button>
          </Stack>
        ) : null}
      </Modal>

      {/* Edit wallet balance modal */}
      <Modal
        opened={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Edit wallet balance"
        centered
        size="md"
      >
        {editTarget ? (
          <Stack gap="md">
            <Stack gap={2}>
              <Text size="xs" c="dimmed">Wallet</Text>
              <Text size="sm" ff="monospace">
                {String(editTarget.ownerType ?? '')} ·
                {String(editTarget.ownerId ?? '')}
              </Text>
              <Text size="xs" c="dimmed">
                Current balance: {Number(editTarget.balanceCoins ?? 0)} coins
              </Text>
            </Stack>
            <NumberInput
              data-testid="billing-wallet-edit-amount"
              label="New balance (coins)"
              value={editAmount}
              onChange={setEditAmount}
              allowDecimal
            />
            <Textarea
              data-testid="billing-wallet-edit-reason"
              label="Reason"
              placeholder="Reason for balance adjustment…"
              value={editReason}
              onChange={(event) => setEditReason(event.currentTarget.value)}
              autosize
              minRows={2}
            />
            <Button
              data-testid="billing-wallet-edit-submit"
              loading={editWallet.isPending}
              disabled={!Number(editAmount)}
              onClick={() => editWallet.mutate()}
            >
              Update balance
            </Button>
          </Stack>
        ) : null}
      </Modal>
    </>
  );
}
