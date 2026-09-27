import {
  Anchor,
  Box,
  Card,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
  Badge,
  Table,
  Button,
  Modal,
  TextInput,
  Select,
  NumberInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { useWhatsAppGroups, useCreateWhatsAppGroup } from '../website/admin-hooks';
import { apmBlue, ink, muted } from '../website/layout';

const levelOptions = ['state', 'senatorial', 'lga', 'ward'].map((l) => ({
  value: l,
  label: l.charAt(0).toUpperCase() + l.slice(1),
}));

export function WhatsAppGroupsPage() {
  const [level, setLevel] = useState<string | undefined>('state');
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({
    level: 'state',
    name: '',
    description: '',
    groupLink: '',
    adminName: '',
    adminPhone: '',
    memberCount: 0,
  });

  const { data: groups, isLoading } = useWhatsAppGroups(level);
  const createMutation = useCreateWhatsAppGroup();

  const handleSubmit = () => {
    createMutation.mutate(form, {
      onSuccess: () => {
        close();
        setForm({
          level: 'state',
          name: '',
          description: '',
          groupLink: '',
          adminName: '',
          adminPhone: '',
          memberCount: 0,
        });
      },
    });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3} style={{ color: ink }}>
          WhatsApp Command Groups
        </Title>
        <Button onClick={open} style={{ background: apmBlue }}>
          Add Group
        </Button>
      </Group>

      <Group>
        {['state', 'senatorial', 'lga', 'ward'].map((l) => (
          <Badge
            key={l}
            style={{
              cursor: 'pointer',
              textTransform: 'capitalize',
              background: level === l ? apmBlue : '#E2E8F0',
              color: level === l ? '#fff' : muted,
              padding: '8px 16px',
            }}
            onClick={() => setLevel(l)}
          >
            {l}
          </Badge>
        ))}
      </Group>

      {isLoading ? (
        <Skeleton height={300} radius="md" />
      ) : (
        <Card padding="lg" radius="md" withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Group Name</Table.Th>
                <Table.Th>Level</Table.Th>
                <Table.Th>Admin</Table.Th>
                <Table.Th>Members</Table.Th>
                <Table.Th>Link</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(groups ?? []).map((g: any) => (
                <Table.Tr key={g.id}>
                  <Table.Td fw={600}>{g.name}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        g.level === 'state'
                          ? 'blue'
                          : g.level === 'senatorial'
                            ? 'violet'
                            : g.level === 'lga'
                              ? 'teal'
                              : 'gray'
                      }
                    >
                      {g.level}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ color: muted }}>
                    {g.adminName
                      ? `${g.adminName}${g.adminPhone ? ` (${g.adminPhone})` : ''}`
                      : '—'}
                  </Table.Td>
                  <Table.Td>{g.memberCount}</Table.Td>
                  <Table.Td>
                    {g.groupLink ? (
                      <Anchor href={g.groupLink} target="_blank" size="sm">
                        Open
                      </Anchor>
                    ) : (
                      '—'
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
              {(groups ?? []).length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5} style={{ textAlign: 'center', color: muted }}>
                    No WhatsApp groups found for this level
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal opened={opened} onClose={close} title="Add WhatsApp Group" size="md">
        <Stack gap="sm">
          <Select
            label="Level"
            data={levelOptions}
            value={form.level}
            onChange={(v) => setForm({ ...form, level: v ?? 'state' })}
            required
          />
          <TextInput
            label="Group Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <TextInput
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.currentTarget.value })}
          />
          <TextInput
            label="Group Link"
            value={form.groupLink}
            onChange={(e) => setForm({ ...form, groupLink: e.currentTarget.value })}
          />
          <TextInput
            label="Admin Name"
            value={form.adminName}
            onChange={(e) => setForm({ ...form, adminName: e.currentTarget.value })}
          />
          <TextInput
            label="Admin Phone"
            value={form.adminPhone}
            onChange={(e) => setForm({ ...form, adminPhone: e.currentTarget.value })}
          />
          <NumberInput
            label="Member Count"
            value={form.memberCount}
            min={0}
            onChange={(v) => setForm({ ...form, memberCount: (v as number) ?? 0 })}
          />
          <Button fullWidth onClick={handleSubmit} style={{ background: apmBlue }} mt="sm">
            Create Group
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
