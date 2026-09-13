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
  const heldSales = useMemo(() => sessions.filter((s) => s.held), [sessions]);

  return (
    <Drawer opened={opened} onClose={onClose} title="Held Sales" position="right">
      <Stack>
        {heldSales.map((sale) => (
          <Group key={sale.id} gap="xs" wrap="nowrap">
            <Button
              variant="light"
              style={{ flex: 1 }}
              onClick={() => {
                onResume(sale.id);
                onClose();
              }}
            >
              {sale.saleCode} - {sale.customerName || 'Walk-in'} (₦
              {sale.cart.reduce((s, i) => s + i.lineTotal, 0).toFixed(2)})
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
              Print
            </Button>
          </Group>
        ))}
        {!heldSales.length && <Text>No held sales</Text>}
      </Stack>
    </Drawer>
  );
}
