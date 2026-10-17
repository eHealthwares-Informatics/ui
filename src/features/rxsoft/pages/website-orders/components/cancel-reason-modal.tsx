import { Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core';
import { useEffect, useState } from 'react';

/**
 * Prompts for a free-text reason before a destructive status change (cancel).
 * The reason is recorded on the order status-history entry.
 */
export function CancelReasonModal({
  opened,
  onClose,
  onConfirm,
  loading,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (opened) {
      setReason('');
    }
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Cancel order"
      centered
      data-testid="cancel-reason-modal"
    >
      <Stack>
        <Text size="sm">
          Provide a reason for cancelling this order. It is recorded with the status change.
        </Text>
        <Textarea
          label="Reason"
          data-testid="cancel-reason-input"
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          minRows={2}
          required
          autosize
        />
        <Group justify="flex-end">
          <Button variant="light" onClick={onClose} disabled={loading}>
            Back
          </Button>
          <Button
            color="red"
            data-testid="cancel-reason-confirm"
            disabled={!reason.trim()}
            loading={loading}
            onClick={() => onConfirm(reason.trim())}
          >
            Cancel order
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
