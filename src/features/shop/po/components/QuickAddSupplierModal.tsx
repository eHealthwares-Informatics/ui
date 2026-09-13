import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useState } from 'react';
import { useCreateSupplier } from '../api/poApi';

interface Props {
  opened: boolean;
  onClose: () => void;
  onSupplierCreated: (supplier: { id: string; name: string }) => void;
}

export function QuickAddSupplierModal({ opened, onClose, onSupplierCreated }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const mutation = useCreateSupplier();

  async function handleSubmit() {
    if (!name.trim()) {return;}
    const result = await mutation.mutateAsync({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    });
    onSupplierCreated({ id: result.id, name: result.name });
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Quick Add Supplier" centered>
      <Stack>
        <TextInput label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder="Supplier name" required />
        <TextInput label="Phone" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} placeholder="Phone number" />
        <TextInput label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} placeholder="Email address" type="email" />
        <TextInput label="Address" value={address} onChange={(e) => setAddress(e.currentTarget.value)} placeholder="Address" />
        <Group grow>
          <Button loading={mutation.isPending} onClick={handleSubmit}>Create Supplier</Button>
          <Button variant="light" onClick={onClose}>Cancel</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
