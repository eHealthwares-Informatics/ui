import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, CreditCard, Wallet } from 'lucide-react';
import { useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useAccountDrawerStore } from '../website/account-drawer-store';
import { websiteApi } from '../website/api';
import { useAuthStore } from '../website/auth-store';
import { useWallet, useWalletDeposit, useWalletTransactions } from '../website/hooks';
import { WebsiteLayout, buttonStyles, green, ink, line, muted, soft } from '../website/layout';
import { PageLoader } from '../website/loaders';

const naira = (value: number) => `₦${Number(value || 0).toLocaleString()}`;

const TYPE_LABEL: Record<string, string> = {
  deposit: 'Top-up',
  payment: 'Payment',
  refund: 'Refund',
  withdrawal: 'Withdrawal',
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function WalletPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openAccountDrawer = useAccountDrawerStore((s) => s.open);

  const { data: wallet, isLoading: walletLoading } = useWallet(isAuthenticated);
  const { data: transactions = [], isLoading: txLoading } = useWalletTransactions();
  const deposit = useWalletDeposit();

  const { data: providers = [] } = useQuery({
    queryKey: ['website', 'payment-providers'],
    queryFn: () => websiteApi.listPaymentProviders(),
    staleTime: 60_000,
  });

  const [fundOpen, setFundOpen] = useState(false);
  const [amount, setAmount] = useState<number | string>(5000);
  const [providerId, setProviderId] = useState<string | null>(null);

  async function fund() {
    const value = Number(amount);
    if (!value || value < 100) {
      notifications.show({ color: 'orange', message: 'Enter at least ₦100' });
      return;
    }
    try {
      const result = await deposit.mutateAsync({
        amount: value,
        providerId: providerId ?? providers[0]?.id,
        returnUrl: `${window.location.origin}/shop/wallet`,
        callbackUrl: `${window.location.origin}/shop/wallet`,
      });
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      setFundOpen(false);
      notifications.show({
        color: 'green',
        message: 'Top-up started — you will be redirected to complete it.',
      });
    } catch (error) {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    }
  }

  if (!isAuthenticated) {
    return (
      <WebsiteLayout>
        <Container size="sm" py={80}>
          <Paper radius={28} p="xl" withBorder style={{ borderColor: line, textAlign: 'center' }}>
            <ThemeIcon radius="xl" size={64} color="gray" variant="light" mx="auto">
              <Wallet size={30} />
            </ThemeIcon>
            <Title order={3} className="damorex-heading" mt="md" style={{ color: ink }}>
              Sign in to use your wallet
            </Title>
            <Text c={muted} mt="xs" lh={1.7}>
              Top up once and pay for orders in a single tap — no card details at checkout.
            </Text>
            <Button
              mt="lg"
              radius="xl"
              styles={buttonStyles}
              style={{ background: green }}
              onClick={() => openAccountDrawer('signin')}
              data-testid="wallet-signin"
            >
              Sign in
            </Button>
          </Paper>
        </Container>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <Container size="md" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              Wallet &amp; Payments
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              Your store credit, top-ups and wallet payments in one place.
            </Text>
          </Box>

          <Paper radius={28} p="xl" style={{ background: green, color: '#fff' }}>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={4}>
                <Text size="sm" opacity={0.85}>
                  Available balance
                </Text>
                <Text fz={38} fw={800} lh={1.1} data-testid="wallet-balance">
                  {walletLoading ? '—' : naira(wallet?.balance ?? 0)}
                </Text>
                <Text size="xs" opacity={0.8}>
                  {wallet?.currency ?? 'NGN'} · store credit
                </Text>
              </Stack>
              <ThemeIcon radius="xl" size={56} variant="white" color="green">
                <Wallet size={28} />
              </ThemeIcon>
            </Group>
            <Group mt="lg">
              <Button
                radius="xl"
                variant="white"
                color="green"
                leftSection={<CreditCard size={16} />}
                onClick={() => setFundOpen(true)}
                data-testid="wallet-fund-open"
              >
                Add funds
              </Button>
            </Group>
          </Paper>

          <Box>
            <Group justify="space-between" mb="sm">
              <Title order={3} className="damorex-heading" style={{ color: ink }}>
                Transactions
              </Title>
              <Badge variant="light" color="green">
                {transactions.length}
              </Badge>
            </Group>

            <Paper radius={24} withBorder style={{ borderColor: line, background: soft }}>
              {txLoading ? (
                <Box p="xl">
                  <PageLoader />
                </Box>
              ) : transactions.length === 0 ? (
                <Stack align="center" gap={6} p="xl">
                  <ThemeIcon radius="xl" size={52} color="gray" variant="light">
                    <Wallet size={24} />
                  </ThemeIcon>
                  <Text fw={600} style={{ color: ink }}>
                    No transactions yet
                  </Text>
                  <Text size="sm" c={muted} ta="center">
                    Top up your wallet to start paying faster at checkout.
                  </Text>
                </Stack>
              ) : (
                <Stack gap={0}>
                  {transactions.map((tx, index) => {
                    const incoming = tx.type === 'deposit' || tx.type === 'refund';
                    return (
                      <Box key={tx.id} data-testid={`wallet-tx-${tx.id}`}>
                        {index > 0 ? <Divider color={line} /> : null}
                        <Group justify="space-between" p="md" wrap="nowrap" align="center">
                          <Group gap="sm" wrap="nowrap">
                            <ThemeIcon
                              radius="xl"
                              size={36}
                              variant="light"
                              color={incoming ? 'green' : 'orange'}
                            >
                              {incoming ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                            </ThemeIcon>
                            <Stack gap={0}>
                              <Text fw={600} size="sm" style={{ color: ink }}>
                                {TYPE_LABEL[tx.type] ?? tx.type}
                              </Text>
                              <Text size="xs" c={muted} lineClamp={1}>
                                {tx.note || tx.reference}
                              </Text>
                              <Text size="xs" c={muted}>
                                {formatDate(tx.createdAt)}
                              </Text>
                            </Stack>
                          </Group>
                          <Stack gap={0} align="flex-end">
                            <Text
                              fw={700}
                              size="sm"
                              c={incoming ? 'green' : 'orange'}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {incoming ? '+' : '−'}
                              {naira(tx.amount)}
                            </Text>
                            <Text size="xs" c={muted} style={{ whiteSpace: 'nowrap' }}>
                              Bal {naira(tx.balanceAfter)}
                            </Text>
                          </Stack>
                        </Group>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Paper>
          </Box>
        </Stack>
      </Container>

      <Modal
        opened={fundOpen}
        onClose={() => setFundOpen(false)}
        title="Add funds to your wallet"
        radius={24}
        centered
      >
        <Stack>
          <SimpleGrid cols={3} spacing="xs">
            {[2000, 5000, 10000].map((preset) => (
              <Button
                key={preset}
                variant={Number(amount) === preset ? 'filled' : 'light'}
                color="green"
                radius="xl"
                onClick={() => setAmount(preset)}
              >
                ₦{preset.toLocaleString()}
              </Button>
            ))}
          </SimpleGrid>
          <NumberInput
            label="Amount"
            value={amount}
            onChange={setAmount}
            min={100}
            step={500}
            prefix="₦"
            thousandSeparator=","
            data-testid="wallet-fund-amount"
          />
          <Select
            label="Pay with"
            data={providers.map((provider) => ({
              value: provider.id,
              label: provider.name,
            }))}
            value={providerId ?? providers[0]?.id ?? null}
            onChange={setProviderId}
            placeholder={providers.length ? 'Choose a provider' : 'No provider configured'}
            data-testid="wallet-fund-provider"
          />
          <Text size="xs" c={muted}>
            You will be redirected to the provider to complete the payment. Funds appear in your
            wallet as soon as it is confirmed.
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setFundOpen(false)}>
              Cancel
            </Button>
            <Button
              color="green"
              loading={deposit.isPending}
              onClick={fund}
              disabled={!providers.length}
              data-testid="wallet-fund-submit"
            >
              Continue
            </Button>
          </Group>
        </Stack>
      </Modal>
    </WebsiteLayout>
  );
}
