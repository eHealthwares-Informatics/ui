import { Modal, Button, Group, Text, Stack } from '@mantine/core';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  disabled?: boolean;
  desc?: React.JSX.Element | string;
  description?: React.JSX.Element | string;
  cancelBtnText?: string;
  confirmText?: React.ReactNode;
  destructive?: boolean;
  handleConfirm?: () => void;
  onConfirm?: () => void;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function ConfirmDialog(props: ConfirmDialogProps) {
  const {
    title,
    desc,
    description,
    children,
    className,
    confirmText,
    cancelBtnText,
    destructive,
    isLoading,
    disabled = false,
    handleConfirm,
    onConfirm,
    onOpenChange,
    ...actions
  } = props;
  const dialogDescription = desc ?? description;
  const confirmHandler = onConfirm ?? handleConfirm;
  return (
    <Modal
      data-testid="confirm-dialog"
      opened={props.open}
      onClose={() => handleConfirm && handleConfirm()}
      title={
        <Text fw={700} size="lg">
          {title}
        </Text>
      }
      centered
      {...actions}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {dialogDescription}
        </Text>
        {children}
        <Group justify="flex-end" mt="lg">
          <Button data-testid="confirm-dialog-cancel" variant="default" onClick={() => onOpenChange && onOpenChange(false)}>
            {cancelBtnText ?? 'Cancel'}
          </Button>
          <Button
            data-testid="confirm-dialog-confirm"
            color={destructive ? 'red' : 'blue'}
            onClick={confirmHandler}
            disabled={disabled || isLoading}
            loading={isLoading}
          >
            {confirmText ?? 'Continue'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
