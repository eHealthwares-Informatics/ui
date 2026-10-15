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
    // `open` is consumed here, NOT spread onto <Modal>: leaving it in `actions`
    // leaked it to the DOM as an `open=""` attribute on the modal root.
    open,
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
      opened={open}
      onClose={() => handleConfirm && handleConfirm()}
      title={
        <Text fw={700} size="lg">
          {title}
        </Text>
      }
      centered
      {...actions}
    >
      {/*
       * `data-testid="confirm-dialog"` lives on the BODY, not on <Modal>.
       *
       * Mantine keeps the modal ROOT (`div.mantine-Modal-root`) mounted even
       * while closed, and that root is a zero-height wrapper: both of its
       * children (the overlay and `Modal-inner`) are `position: fixed`, so the
       * root never has a bounding box. Playwright's `isVisible()` requires a
       * non-empty box, so a testid on the root reports hidden in EVERY state —
       * including while the dialog is open. Verified in Chromium: root is
       * 1280×0 closed AND open; the content (`[role="dialog"]`) is 440×169 and
       * visible (rxsoft-qa#802).
       *
       * The body only exists while the dialog is open and has real layout, so
       * `getByTestId('confirm-dialog')` now matches exactly one visible node.
       */}
      <Stack gap="md" data-testid="confirm-dialog">
        <Text size="sm" c="dimmed">
          {dialogDescription}
        </Text>
        {children}
        <Group justify="flex-end" mt="lg">
          <Button
            data-testid="confirm-dialog-cancel"
            variant="default"
            onClick={() => onOpenChange && onOpenChange(false)}
          >
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
