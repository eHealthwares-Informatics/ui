import {
  ActionIcon,
  Badge,
  Card,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Receipt, Wallet } from 'lucide-react';
import { useState } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';

type WalletRow = {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: string;
};

type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  reference: string;
  sourceType: string | null;
  note: string | null;
  createdAt: string;
};

const naira = (value: number | string) =>
  `₦${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const typeColor: Record<string, string> = {
  deposit: 'green',
  refund: 'teal',
  payment: 'orange',
  withdrawal: 'red',
};

/**
 * Admin console → Payments → Customer Wallets: every shopper wallet in the
 * organisation with its balance, and that wallet's statement.
 */
export function RxCustomerWalletsPage() {
  const [openWallet, setOpenWallet] = useState<WalletRow | null>(null);

  const {
    data: wallets = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['customer-wallets'],
    queryFn: () => rxsoftApi.get<WalletRow[]>('/customer/wallet/admin/wallets').then((r) => r.data),
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['customer-wallets', openWallet?.id, 'transactions'],
    queryFn: () =>
      rxsoftApi
        .get<WalletTransaction[]>(`/customer/wallet/admin/wallets/${openWallet?.id}/transactions`)
        .then((r) => r.data),
    enabled: !!openWallet?.id,
  });

  const totalBalance = wallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0);

  return (
    <Card withBorder radius="md" p="lg" data-testid="customer-wallets-page">
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <Wallet size={18} />
          <Title order={4}>Customer Wallets</Title>
        </Group>
        <Badge variant="light" color="green">
          {naira(totalBalance)} on deposit
        </Badge>
      </Group>
      <Text c="dimmed" size="sm" mb="md">
        Store credit held for shoppers in this organisation. Open a wallet to review its
        transactions.
      </Text>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Customer</Table.Th>
            <Table.Th>Balance</Table.Th>
            <Table.Th>Currency</Table.Th>
            <Table.Th>Updated</Table.Th>
            <Table.Th w={90}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed" size="sm">
                  Loading wallets…
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : isError ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="red" size="sm">
                  Could not load wallets.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : wallets.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed" size="sm">
                  No customer wallets yet — shoppers get one on their first top-up.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            wallets.map((wallet) => (
              <Table.Tr key={wallet.id} data-testid={`wallet-row-${wallet.id}`}>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {wallet.userId.slice(0, 8)}
                  </Text>
                </Table.Td>
                <Table.Td>{naira(wallet.balance)}</Table.Td>
                <Table.Td>{wallet.currency}</Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {wallet.updatedAt ? new Date(wallet.updatedAt).toLocaleString() : '—'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Tooltip label="Transactions">
                    <ActionIcon
                      variant="light"
                      size="sm"
                      aria-label="View wallet transactions"
                      onClick={() => setOpenWallet(wallet)}
                    >
                      <Receipt size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Modal
        opened={!!openWallet}
        onClose={() => setOpenWallet(null)}
        title={`Wallet ${openWallet?.userId.slice(0, 8) ?? ''} — transactions`}
        size="lg"
        centered
      >
        <Stack gap="sm">
          {txLoading ? (
            <Text size="sm" c="dimmed">
              Loading…
            </Text>
          ) : transactions.length === 0 ? (
            <Text size="sm" c="dimmed">
              No movements on this wallet yet.
            </Text>
          ) : (
            <ScrollArea h={360}>
              <Table striped withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Balance</Table.Th>
                    <Table.Th>When</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {transactions.map((tx) => (
                    <Table.Tr key={tx.id}>
                      <Table.Td>
                        <Badge size="sm" variant="light" color={typeColor[tx.type] ?? 'gray'}>
                          {tx.type}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{naira(tx.amount)}</Table.Td>
                      <Table.Td>{naira(tx.balanceAfter)}</Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {new Date(tx.createdAt).toLocaleString()}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Stack>
      </Modal>
    </Card>
  );
}
