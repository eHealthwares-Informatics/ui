import { Button, Card, Divider, Group, Stack, Table, Text, Title } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { rxsoftApi, downloadBlob } from '@/lib/rxsoft-api';

function sectionTable(title: string, accounts: any[], total: number, color: string) {
  return (
    <Stack gap="xs">
      <Title order={5} c={color}>
        {title}
      </Title>
      <Table striped withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Code</Table.Th>
            <Table.Th>Account</Table.Th>
            <Table.Th ta="right">Balance</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {accounts.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={3}>
                <Text c="dimmed" size="sm">
                  No accounts
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            accounts.map((a: any) => {
              const balance =
                a.accountType === 'asset'
                  ? a.debitBalance - a.creditBalance
                  : a.creditBalance - a.debitBalance;
              return (
                <Table.Tr key={a.accountCode}>
                  <Table.Td>{a.accountCode}</Table.Td>
                  <Table.Td>{a.accountName}</Table.Td>
                  <Table.Td ta="right">{balance.toFixed(2)}</Table.Td>
                </Table.Tr>
              );
            })
          )}
        </Table.Tbody>
        <Table.Tfoot>
          <Table.Tr fw={700}>
            <Table.Td colSpan={2}>Total {title}</Table.Td>
            <Table.Td ta="right">{total.toFixed(2)}</Table.Td>
          </Table.Tr>
        </Table.Tfoot>
      </Table>
    </Stack>
  );
}

export function BalanceSheetPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [asOfDate, setAsOfDate] = useState<string | null>(today);

  const queryKey = ['report-balance-sheet', asOfDate];
  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await rxsoftApi.get('/reports/balance-sheet', {
        params: { asOfDate },
      });
      return res.data;
    },
    enabled: !!asOfDate,
  });

  const handleExport = async () => {
    await downloadBlob(
      { method: 'GET', url: '/reports/balance-sheet', params: { asOfDate, export: 'csv' } },
      `balance_sheet_${asOfDate}.csv`
    );
  };

  return (
    <RxPage
      title="Balance Sheet"
      description="Financial position showing assets, liabilities, and equity."
      actions={
        <Button
          variant="subtle"
          leftSection={<Download size={14} />}
          onClick={handleExport}
          loading={isFetching}
          size="sm"
        >
          Export
        </Button>
      }
    >
      <Stack gap="md">
        <Card withBorder>
          <Group>
            <DatePickerInput label="As of date" value={asOfDate} onChange={setAsOfDate} />
          </Group>
        </Card>

        <Card withBorder>
          {isFetching ? (
            <Text c="dimmed" size="sm">
              Loading...
            </Text>
          ) : !data ? (
            <Text c="dimmed" size="sm">
              No data found.
            </Text>
          ) : (
            <Stack gap="lg">
              {sectionTable('Assets', data.assets?.accounts ?? [], data.assets?.total ?? 0, 'blue')}
              {sectionTable(
                'Liabilities',
                data.liabilities?.accounts ?? [],
                data.liabilities?.total ?? 0,
                'orange'
              )}
              {sectionTable(
                'Equity',
                data.equity?.accounts ?? [],
                data.equity?.total ?? 0,
                'purple'
              )}

              <Divider />

              <Group justify="space-between" px="md">
                <Text fw={700}>Total Liabilities & Equity</Text>
                <Text fw={700}>{data.totalLiabilitiesAndEquity?.toFixed(2)}</Text>
              </Group>
              <Group justify="space-between" px="md">
                <Text c="dimmed" size="sm">
                  Assets
                </Text>
                <Text size="sm">{data.assets?.total?.toFixed(2)}</Text>
              </Group>
              <Group justify="space-between" px="md">
                <Text c="dimmed" size="sm">
                  Liabilities + Equity
                </Text>
                <Text size="sm">{data.totalLiabilitiesAndEquity?.toFixed(2)}</Text>
              </Group>
            </Stack>
          )}
        </Card>
      </Stack>
    </RxPage>
  );
}
