import { Button, Group, Modal, Paper, ScrollArea, Stack, Table, Text, Title } from '@mantine/core';
import { useMemo } from 'react';
import { SaleSession } from '../types';
import { printInvoice } from '../utils/print';

interface Props {
  opened: boolean;
  onClose: () => void;
  session: SaleSession;
  onProceedToPayment: () => void;
}

export function InvoicePreviewModal({ opened, onClose, session, onProceedToPayment }: Props) {
  const subtotal = useMemo(
    () => session.cart.reduce((sum, item) => {
      const price = session.pricingMode === 'wholesale' ? item.wholesalePrice : item.retailPrice;
      return sum + price * item.quantity * item.uomFactor;
    }, 0),
    [session.cart, session.pricingMode],
  );

  const discount = session.discount || 0;
  const vatPercent = session.vatPercent || 0;
  const discounted = subtotal - discount;
  const vat = discounted * (vatPercent / 100);
  const total = discounted + vat;

  function handlePrintInvoice() {
    const items = session.cart.map((item) => {
      const price = session.pricingMode === 'wholesale' ? item.wholesalePrice : item.retailPrice;
      return {
        code: item.code,
        name: item.name,
        qty: item.quantity,
        price,
        total: price * item.quantity * item.uomFactor,
      };
    });
    printInvoice({
      saleNumber: session.saleCode,
      customerName: session.customerName,
      items,
      subtotal,
      discount,
      vat,
      total,
    });
  }

  return (
    <Modal opened={opened} onClose={onClose} title={`Invoice Preview - ${session.saleCode}`} size="lg" centered>
      <Stack gap="md">
        <Paper withBorder p="sm">
          <Text size="sm" c="dimmed">Customer: {session.customerName || 'Walk-in'}</Text>
          <Text size="sm" c="dimmed">Pricing: {session.pricingMode}</Text>
        </Paper>

        <ScrollArea h={300}>
          <Table withTableBorder withColumnBorders striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Code</Table.Th>
                <Table.Th>Item</Table.Th>
                <Table.Th w={60}>Qty</Table.Th>
                <Table.Th>UOM</Table.Th>
                <Table.Th w={100}>Price</Table.Th>
                <Table.Th w={100}>Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {session.cart.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6} ta="center">Cart is empty</Table.Td>
                </Table.Tr>
              )}
              {session.cart.map((item) => {
                const price = session.pricingMode === 'wholesale' ? item.wholesalePrice : item.retailPrice;
                const lineTotal = price * item.quantity * item.uomFactor;
                return (
                  <Table.Tr key={item.id}>
                    <Table.Td>{item.code}</Table.Td>
                    <Table.Td>{item.name}</Table.Td>
                    <Table.Td ta="center">{item.quantity}</Table.Td>
                    <Table.Td>{item.uomName}</Table.Td>
                    <Table.Td ta="right">₦{price.toFixed(2)}</Table.Td>
                    <Table.Td ta="right">₦{lineTotal.toFixed(2)}</Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        <Paper withBorder p="sm" bg="gray.0">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm">Subtotal</Text>
              <Text size="sm">₦{subtotal.toFixed(2)}</Text>
            </Group>
            {discount > 0 && (
              <Group justify="space-between">
                <Text size="sm">Discount</Text>
                <Text size="sm" c="red">-₦{discount.toFixed(2)}</Text>
              </Group>
            )}
            {vatPercent > 0 && (
              <Group justify="space-between">
                <Text size="sm">VAT ({vatPercent}%)</Text>
                <Text size="sm">₦{vat.toFixed(2)}</Text>
              </Group>
            )}
            <Group justify="space-between">
              <Title order={4}>Total</Title>
              <Title order={4}>₦{total.toFixed(2)}</Title>
            </Group>
          </Stack>
        </Paper>

        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="light" onClick={handlePrintInvoice}>Print Invoice</Button>
          <Button onClick={onProceedToPayment}>Proceed to Payment</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
