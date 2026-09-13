import { Button, Group, Modal, PasswordInput, Stack, Text } from '@mantine/core';
import { useState } from 'react';

interface Props {
  opened: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  loading?: boolean;
}

export function UnpostPasswordModal({ opened, onClose, onConfirm, loading }: Props) {
  const [password, setPassword] = useState('');

  function handleSubmit() {
    onConfirm(password);
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Unpost Goods Receipt" centered>
      <Stack>
        <Text size="sm">Enter password to unpost this receipt line:</Text>
        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          placeholder="password12"
        />
        <Group grow>
          <Button loading={loading} onClick={handleSubmit}>Confirm Unpost</Button>
          <Button variant="light" onClick={onClose}>Cancel</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
