import { Badge, Button, Group, Modal, PasswordInput, Stack, Table, Text } from '@mantine/core';
import { useState } from 'react';

export function ReceiptDetailModal({
  receipt,
  opened,
  onClose,
  onUnpost,
  isUnposting,
}: {
  receipt: any;
  opened: boolean;
  onClose: () => void;
  onUnpost: (receiptLineId: string, password: string) => void;
  isUnposting: boolean;
}) {
  const [password, setPassword] = useState('');
  const [unpostLineId, setUnpostLineId] = useState<string | null>(null);

  function handleUnpost() {
    if (!unpostLineId || !password) {
      return;
    }
    onUnpost(unpostLineId, password);
    setUnpostLineId(null);
    setPassword('');
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Receipt #${receipt?.receiptNumber ?? ''}`}
      size="lg"
      centered
    >
      <Stack>
        <Group>
          <Text size="sm">
            <b>PO:</b> {receipt?.purchaseOrder?.purchaseOrderNumber ?? receipt?.purchaseOrderId}
          </Text>
          <Text size="sm">
            <b>Date:</b>{' '}
            {receipt?.receivedDate ? new Date(receipt.receivedDate).toLocaleDateString() : '-'}
          </Text>
          {receipt?.note && (
            <Text size="sm">
              <b>Note:</b> {receipt.note}
            </Text>
          )}
        </Group>

        <Table striped withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              <Table.Th>Ordered</Table.Th>
              <Table.Th>Received</Table.Th>
              <Table.Th>UOM</Table.Th>
              <Table.Th>Unit Cost</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(receipt?.lines ?? []).map((l: any) => (
              <Table.Tr key={l.id}>
                <Table.Td>{l.item?.name ?? l.itemId}</Table.Td>
                <Table.Td>{l.orderedQty}</Table.Td>
                <Table.Td>{l.receivedQty}</Table.Td>
                <Table.Td>{l.uom?.code ?? l.uomId}</Table.Td>
                <Table.Td>{(+l.unitCost).toLocaleString()}</Table.Td>
                <Table.Td>
                  {l.isUnposted ? (
                    <Badge color="red">Unposted</Badge>
                  ) : (
                    <Badge color="green">Active</Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  {!l.isUnposted && (
                    <Button
                      size="compact-xs"
                      variant="light"
                      color="orange"
                      onClick={() => setUnpostLineId(l.id)}
                      loading={isUnposting && unpostLineId === l.id}
                    >
                      Unpost
                    </Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {unpostLineId && (
          <Group>
            <PasswordInput
              label="Unpost Password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
            />
            <Button
              color="orange"
              onClick={handleUnpost}
              loading={isUnposting}
              disabled={!password}
            >
              Confirm Unpost
            </Button>
            <Button
              variant="light"
              onClick={() => {
                setUnpostLineId(null);
                setPassword('');
              }}
            >
              Cancel
            </Button>
          </Group>
        )}
      </Stack>
    </Modal>
  );
}
