import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useState } from 'react';
import { useCreateCustomer } from '../../api/posApi';

interface Props {
  opened: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: { id: string; name: string }) => void;
}

export function CustomerQuickAddModal({ opened, onClose, onCustomerCreated }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const mutation = useCreateCustomer();

  async function handleSubmit() {
    if (!name.trim()) {return;}
    const result = await mutation.mutateAsync({
      name: name.trim(),
      phone: phone.trim() || undefined,
    });
    onCustomerCreated({ id: result.id, name: result.name });
    setName('');
    setPhone('');
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Quick Add Customer" centered>
      <Stack>
        <TextInput
          label="Name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Customer name"
          required
        />
        <TextInput
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
          placeholder="Phone number"
        />
        <Group grow>
          <Button loading={mutation.isPending} onClick={handleSubmit}>
            Create Customer
          </Button>
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
