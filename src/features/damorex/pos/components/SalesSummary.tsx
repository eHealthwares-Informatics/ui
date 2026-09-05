import { Button, Flex, Paper, Stack, Text, Title } from '@mantine/core';
import { Calculator } from 'lucide-react';

interface Props {
  itemCount: number;
  totals: { subtotal: number; discount: number; vat: number; total: number };
  onCalculate: () => void;
  onCheckout: () => void;
  onHold: () => void;
  onNextCustomer: () => void;
  onSellPrint: () => void;
  onPrintWholesale: () => void;
  paidAmount: number;
  cartEmpty?: boolean;
  sessionCompleted?: boolean;
}

export function SalesSummary({
  itemCount,
  totals,
  onCalculate,
  onCheckout,
  onHold,
  onNextCustomer,
  onSellPrint,
  onPrintWholesale,
  paidAmount,
  cartEmpty = true,
  sessionCompleted = false,
}: Props) {
  return (
    <Paper radius={0} withBorder bg="#c7e6f1" h="100%" p="md" data-testid="pos-sales-summary">
      <Stack>
        <Title order={3} ta="center">
          Current Sales Summary
        </Title>

        <Paper withBorder p="xs" radius={0}>
          <Flex justify="space-between">
            <Text size="sm">Items on Cart</Text>
            <Text fw={700}>{itemCount}</Text>
          </Flex>
        </Paper>

        <Paper withBorder p="xs" radius={0}>
          <Flex justify="space-between">
            <Text size="sm">Total Cost</Text>
            <Text fw={700}>₦{totals.total.toFixed(2)}</Text>
          </Flex>
        </Paper>

        <Paper withBorder p="xs" radius={0}>
          <Flex justify="space-between">
            <Text size="sm">Total Paid</Text>
            <Text fw={700}>{paidAmount > 0 ? `₦${paidAmount.toFixed(2)}` : 'Not Yet Paid'}</Text>
          </Flex>
        </Paper>

        <Button fullWidth mt="md" leftSection={<Calculator size={16} />} onClick={onCalculate} disabled={cartEmpty || sessionCompleted}>
          Print Invoice
        </Button>

        <Paper mt="md" p="md" withBorder>
          <Text ta="center" fw={700}>
            Total Cost
          </Text>
          <Title order={2} ta="center">
            ₦{totals.total.toFixed(2)}
          </Title>
        </Paper>

        <Button fullWidth mt="md" onClick={onCheckout} disabled={cartEmpty || sessionCompleted} data-testid="pos-sell-only-btn">
          Sell Only
        </Button>
        <Button fullWidth mt="xs" onClick={onSellPrint} disabled={cartEmpty || sessionCompleted} data-testid="pos-sell-print-btn">
          Sell and Print
        </Button>
        <Button fullWidth mt="xs" onClick={onPrintWholesale} disabled={cartEmpty || sessionCompleted} data-testid="pos-sell-wholesale-btn">
          Sell and Print wholesale
        </Button>
        <Button fullWidth mt="xs" variant="light" onClick={onHold} disabled={cartEmpty || sessionCompleted} data-testid="pos-hold-sale-btn">
          Hold Sale
        </Button>
        <Button fullWidth mt="xs" variant="outline" onClick={onNextCustomer} disabled={!sessionCompleted} data-testid="pos-next-customer-btn">
          Next Customer
        </Button>
      </Stack>
    </Paper>
  );
}
