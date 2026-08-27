import { Badge, Button, Group, Paper, Text, TextInput, Title } from '@mantine/core';
import { Send } from 'lucide-react';
import { PoLineItem, PurchaseOrderStatus } from '../types';

interface Props {
  lines: PoLineItem[];
  status: PurchaseOrderStatus | null;
  receivedDate: string;
  receiptNumber: string;
  onReceivedDateChange: (date: string) => void;
  onReceiveAll: () => void;
  onSaveDraft: () => void;
  onSubmitApprove: () => void;
  saving?: boolean;
  submitting?: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'yellow',
  approved: 'blue',
  partially_received: 'orange',
  received: 'green',
  cancelled: 'gray',
};

export function PoSummary({
  lines,
  status,
  receivedDate,
  receiptNumber,
  onReceivedDateChange,
  onReceiveAll,
  onSaveDraft,
  onSubmitApprove,
  saving,
  submitting,
}: Props) {
  const orderedTotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const receivedTotal = lines.reduce((sum, l) => sum + (l.receivedLineTotal ?? 0), 0);
  const canReceive = lines.filter((l) => l.serverLineId && !l.isPosted && l.receivedQty > 0).length;

  const isReadOnly = status === 'received' || status === 'cancelled';
  const saveDraftDisabled = isReadOnly || status === 'approved';
  const submitApproveDisabled = isReadOnly || (status !== null && status !== 'draft');

  return (
    <Paper p="md" withBorder bg="#c7e6f1">
      <Group justify="space-between">
        <Group gap="xl">
          {status && (
            <Badge color={statusColors[status] || 'gray'} size="lg">
              {status.replace(/_/g, ' ')}
            </Badge>
          )}
          <TextInput
            label="Received Date"
            type="date"
            size="xs"
            value={receivedDate}
            onChange={(e) => onReceivedDateChange(e.currentTarget.value)}
            w={160}
            disabled={isReadOnly}
          />
          <Text size="xs">Lines: {lines.length}</Text>
          <Text size="xs">Receivable: {canReceive}</Text>
          <Title order={4}>Ordered Total: ₦{orderedTotal.toFixed(2)}</Title>
          <Title order={4}>Received Total: ₦{receivedTotal.toFixed(2)}</Title>
        </Group>
        <Group>
          {canReceive > 0 && !isReadOnly && status && status !== 'draft' && (
            <Button size="xs" color="green" onClick={onReceiveAll} disabled={!receiptNumber}>
              Receive All ({canReceive})
            </Button>
          )}
          <Button
            size="xs"
            leftSection={<Send size={14} />}
            onClick={onSaveDraft}
            loading={saving}
            disabled={saveDraftDisabled}
          >
            Save as Draft
          </Button>
          <Button
            size="xs"
            color="green"
            leftSection={<Send size={14} />}
            onClick={onSubmitApprove}
            loading={submitting}
            disabled={submitApproveDisabled}
          >
            Submit & Approve
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}
