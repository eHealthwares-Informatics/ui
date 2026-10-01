import { Button, Drawer, Group, Stack, Text } from '@mantine/core';
import { Printer } from 'lucide-react';
import { useMemo } from 'react';
import { usePosStore } from '../store/usePosStore';

interface Props {
  opened: boolean;
  onClose: () => void;
  onResume: (sessionId: string) => void;
  onPrintInvoice: (sessionId: string) => void;
}

export function HeldSalesDrawer({ opened, onClose, onResume, onPrintInvoice }: Props) {
  const sessions = usePosStore((state) => state.sessions);
  const allSales = useMemo(() => sessions, [sessions]);

  return (
    <Drawer opened={opened} onClose={onClose} title="Sales" position="right">
      <Stack>
        {allSales.map((sale) => {
          const itemCount = sale.cart.length;
          const total = sale.cart.reduce((s, i) => s + i.lineTotal, 0);
          return (
            <Group key={sale.id} gap="xs" wrap="nowrap">
              <Button
                variant="light"
                style={{ flex: 1 }}
                onClick={() => {
                  onResume(sale.id);
                  onClose();
                }}
              >
                {sale.saleCode} - {sale.customerName || 'Walk-in'} · {itemCount}{' '}
                item{itemCount !== 1 ? 's' : ''} · ₦
                {total.toFixed(2)}
              </Button>
              <Button
                size="xs"
                variant="outline"
                leftSection={<Printer size={14} />}
                onClick={() => {
                  onPrintInvoice(sale.id);
                  onClose();
                }}
              >
                Reprint
              </Button>
            </Group>
          );
        })}
        {!allSales.length && <Text>No sales</Text>}
      </Stack>
    </Drawer>
  );
}
