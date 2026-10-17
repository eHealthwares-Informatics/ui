import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { AlertTriangle } from 'lucide-react';

/**
 * Prompt shown when cancelling a parent order that still has open child orders
 * (created to hold leftover unreconciled items): cancel the children too, or
 * cancel the parent only.
 */
export function CascadeCancelModal({
  order,
  cancellableChildren,
  onConfirm,
  onCancel,
}: {
  order: any;
  cancellableChildren: any[];
  onConfirm: (cascade: boolean) => void;
  onCancel: () => void;
}) {
  if (!order) {
    return null;
  }
  return (
    <Modal
      opened={!!order}
      onClose={onCancel}
      title="Cancel child orders too?"
      centered
      data-testid="cascade-cancel-modal"
    >
      <Stack>
        <Alert
          icon={<AlertTriangle size={16} />}
          color="orange"
          title="This parent has open child orders"
        >
          <Text size="sm">
            {cancellableChildren.length} child order(s) created for leftover unreconciled items are
            still open:
          </Text>
          <Stack gap={2} mt="xs">
            {cancellableChildren.map((c: any) => (
              <Text key={c.id} size="sm">
                • {c.orderNumber} — {c.unreconciledItems} of {c.totalItems} item(s) unreconciled
              </Text>
            ))}
          </Stack>
        </Alert>
        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={onCancel}>
            Go back
          </Button>
          <Button
            variant="light"
            color="red"
            data-testid="cascade-cancel-parent-only"
            onClick={() => onConfirm(false)}
          >
            Cancel parent only
          </Button>
          <Button
            color="red"
            data-testid="cascade-cancel-parent-children"
            onClick={() => onConfirm(true)}
          >
            Cancel parent + children
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
