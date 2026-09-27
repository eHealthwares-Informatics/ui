import { Badge, Button, Card, Group, Stack, Table, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { rxsoftApi, downloadBlob } from '@/lib/rxsoft-api';

const typeColors: Record<string, string> = {
  asset: 'blue',
  liability: 'orange',
  equity: 'purple',
  income: 'green',
  expense: 'red',
};

export function TrialBalancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [asOfDate, setAsOfDate] = useState<string | null>(today);

  const queryKey = ['report-trial-balance', asOfDate];
  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await rxsoftApi.get('/reports/trial-balance', {
        params: { asOfDate },
      });
      return res.data;
    },
    enabled: !!asOfDate,
  });

  const handleExport = async () => {
    await downloadBlob(
      { method: 'GET', url: '/reports/trial-balance', params: { asOfDate, export: 'csv' } },
      `trial_balance_${asOfDate}.csv`
    );
  };

  const rows = data?.data ?? [];
  const totals = data?.totals ?? { debitTotal: 0, creditTotal: 0 };

  return (
    <RxPage
      title="Trial Balance"
      description="List of all general ledger accounts and their balances as of a specific date."
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
          ) : rows.length === 0 ? (
            <Text c="dimmed" size="sm">
              No data found for the selected date.
            </Text>
          ) : (
            <Table striped withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Account</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th ta="right">Debit</Table.Th>
                  <Table.Th ta="right">Credit</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((r: any) => (
                  <Table.Tr key={r.accountCode}>
                    <Table.Td>{r.accountCode}</Table.Td>
                    <Table.Td>{r.accountName}</Table.Td>
                    <Table.Td>
                      <Badge color={typeColors[r.accountType] ?? 'gray'} variant="light" size="sm">
                        {r.accountType}
                      </Badge>
                    </Table.Td>
                    <Table.Td ta="right">
                      {r.debitBalance > 0 ? r.debitBalance.toFixed(2) : ''}
                    </Table.Td>
                    <Table.Td ta="right">
                      {r.creditBalance > 0 ? r.creditBalance.toFixed(2) : ''}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr fw={700}>
                  <Table.Td colSpan={3}>Totals</Table.Td>
                  <Table.Td ta="right">{totals.debitTotal.toFixed(2)}</Table.Td>
                  <Table.Td ta="right">{totals.creditTotal.toFixed(2)}</Table.Td>
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          )}
        </Card>
      </Stack>
    </RxPage>
  );
}
