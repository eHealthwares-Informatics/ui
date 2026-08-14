import { Button, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useState } from 'react';

type Props = {
  opened: boolean;
  onSave: (phone: string) => void;
};

const PHONE_REGEX = /^[+]?[\d][\d\s-]{6,}$/;

export function PhoneSetupModal({ opened, onSave }: Props) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();

  const submit = () => {
    const value = phone.trim();
    if (!value) {
      setError('Phone number is required');
      return;
    }
    if (!PHONE_REGEX.test(value)) {
      setError('Enter a valid phone number');
      return;
    }
    setError(undefined);
    onSave(value);
  };

  return (
    <Modal
      closeOnClickOutside={false}
      closeOnEscape={false}
      onClose={() => {}}
      opened={opened}
      title="Set up your number"
      withCloseButton={false}
    >
      <Stack gap="sm">
        <Text size="sm">
          Enter the phone number you want to use on the web channel. It will be shown as the
          sender for your messages.
        </Text>
        <TextInput
          autoFocus
          error={error}
          onChange={(event) => setPhone(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {submit();}
          }}
          placeholder="+1 555 000 1234"
          value={phone}
        />
        <Button fullWidth onClick={submit}>
          Save
        </Button>
      </Stack>
    </Modal>
  );
}
