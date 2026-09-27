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
            accounts.map((a: any) => (
              <Table.Tr key={a.accountCode}>
                <Table.Td>{a.accountCode}</Table.Td>
                <Table.Td>{a.accountName}</Table.Td>
                <Table.Td ta="right">{a.balance.toFixed(2)}</Table.Td>
              </Table.Tr>
            ))
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

export function IncomeStatementPage() {
  const today = new Date().toISOString().slice(0, 10);
  const startOfYear = `${new Date().getFullYear()}-01-01`;
  const [fromDate, setFromDate] = useState<string | null>(startOfYear);
  const [toDate, setToDate] = useState<string | null>(today);

  const queryKey = ['report-income-statement', fromDate, toDate];
  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await rxsoftApi.get('/reports/income-statement', {
        params: { fromDate, toDate },
      });
      return res.data;
    },
    enabled: !!fromDate && !!toDate,
  });

  const handleExport = async () => {
    await downloadBlob(
      {
        method: 'GET',
        url: '/reports/income-statement',
        params: { fromDate, toDate, export: 'csv' },
      },
      `income_statement_${fromDate}_${toDate}.csv`
    );
  };

  return (
    <RxPage
      title="Income Statement"
      description="Revenue, costs, and expenses for a period."
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
            <DatePickerInput label="From" value={fromDate} onChange={setFromDate} />
            <DatePickerInput label="To" value={toDate} onChange={setToDate} />
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
              {sectionTable(
                'Revenue',
                data.revenue?.accounts ?? [],
                data.revenue?.total ?? 0,
                'green'
              )}
              {sectionTable(
                'Cost of Goods Sold',
                data.cogs?.accounts ?? [],
                data.cogs?.total ?? 0,
                'red'
              )}

              <Group justify="space-between" px="md">
                <Text fw={600}>Gross Profit</Text>
                <Text fw={600} c={data.grossProfit >= 0 ? 'green' : 'red'}>
                  {data.grossProfit?.toFixed(2)}
                </Text>
              </Group>

              <Divider />

              {sectionTable(
                'Operating Expenses',
                data.operatingExpenses?.accounts ?? [],
                data.operatingExpenses?.total ?? 0,
                'orange'
              )}

              <Divider />

              <Group justify="space-between" px="md">
                <Title order={4}>Net Income</Title>
                <Title order={4} c={data.netIncome >= 0 ? 'green' : 'red'}>
                  {data.netIncome?.toFixed(2)}
                </Title>
              </Group>
            </Stack>
          )}
        </Card>
      </Stack>
    </RxPage>
  );
}
