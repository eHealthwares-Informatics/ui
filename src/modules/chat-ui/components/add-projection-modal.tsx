import { ActionIcon, Alert, Button, Group, Input, Modal, Paper, Select, Stack, Text } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AsyncSelectField } from '@/features/components/form/async-field';
import {
  addProjection,
  createParticipant,
  fetchChannels,
  findParticipantByPhone,
} from '../services/chat-api';
import type { ParticipantRole } from '../types';
import type { Option } from '@/features/rxsoft/types';

type Entry = {
  participantId?: string;
  phone: string;
  channelId: string;
  channelLabel: string;
  role: ParticipantRole;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  conversationId?: string;
  defaultChannelId?: string;
};

const ROLES: Array<{ value: ParticipantRole; label: string }> = [
  { value: 'USER', label: 'User' },
  { value: 'PATIENT', label: 'Patient' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'NURSE', label: 'Nurse' },
  { value: 'AGENT', label: 'Agent' },
];

function createEntry(defaultChannelId?: string): Entry {
  return {
    participantId: undefined,
    phone: '',
    channelId: defaultChannelId ?? '',
    channelLabel: '',
    role: 'USER',
  };
}

export function AddProjectionModal({
  opened,
  onClose,
  conversationId,
  defaultChannelId,
}: Props) {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<Entry[]>([createEntry(defaultChannelId)]);

  useEffect(() => {
    if (!opened) {return;}
    setEntries([createEntry(defaultChannelId)]);

    if (!defaultChannelId) {return;}
    fetchChannels()
      .then((channels) => {
        const match = (channels ?? []).find((c: any) => String(c.id) === defaultChannelId);
        if (match) {
          setEntries((prev) =>
            prev.map((entry, index) =>
              index === 0
                ? { ...entry, channelId: defaultChannelId, channelLabel: String(match.name ?? '') }
                : entry
            ),
          );
        }
      })
      .catch(() => {});
  }, [opened, defaultChannelId]);

  const addMutation = useMutation({
    mutationFn: async (list: Entry[]) => {
      if (!conversationId) {throw new Error('No conversation selected');}
      for (const entry of list) {
        let participantId = entry.participantId;
        if (!participantId) {
          const phone = entry.phone.trim();
          if (!phone) {throw new Error('Each projection needs a phone number or participant');}
          const existing = await findParticipantByPhone(phone);
          if (existing?.id) {
            participantId = existing.id;
          } else {
            const created = await createParticipant({ phone });
            participantId = created.id;
          }
        }
        if (!participantId) {throw new Error('Could not resolve participant');}
        await addProjection({
          conversationId,
          participantId,
          channelId: entry.channelId || defaultChannelId || '',
          role: entry.role,
        });
      }
    },
    onSuccess: () => {
      setEntries([createEntry(defaultChannelId)]);
      queryClient.invalidateQueries({ queryKey: ['conversation-inbox'] });
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['projections', conversationId] });
      }
      onClose();
    },
  });

  const canSubmit =
    Boolean(conversationId) &&
    entries.length > 0 &&
    entries.every((entry) => entry.participantId || entry.phone.trim()) &&
    entries.every((entry) => entry.channelId || defaultChannelId);

  const handleSubmit = () => {
    if (!canSubmit) {return;}
    addMutation.mutate(entries);
  };

  function updateEntry(index: number, patch: Partial<Entry>) {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function addEntry() {
    setEntries((prev) => [...prev, createEntry(defaultChannelId)]);
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function onParticipantSelect(index: number, option: Option | null) {
    if (option) {
      updateEntry(index, { participantId: option.value, phone: option.label });
    } else {
      updateEntry(index, { participantId: undefined });
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Add Projection" size="lg">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Add participants as projections to this conversation.
        </Text>
        {entries.map((entry, index) => (
          <Paper key={index} withBorder p="sm" radius="md">
            <Stack gap="xs">
              <Group gap="xs" align="end">
                <AsyncSelectField
                  value={entry.participantId ? { value: entry.participantId, label: entry.phone } : null}
                  field={{
                    name: `participant-${index}`,
                    label: 'Participant',
                    type: 'async-select',
                    searchParam: {
                      endpoint: '/participants',
                      queryParam: 'search',
                      minChars: 3,
                      valueKey: 'id',
                      labelKey: 'phone',
                      staticParams: { attribute: 'phone' },
                    },
                    placeholder: 'Search by phone',
                  }}
                  onChange={(option) => onParticipantSelect(index, option)}
                />
                {index > 0 && (
                  <ActionIcon color="red" variant="light" onClick={() => removeEntry(index)}>
                    <Trash2 size={16} />
                  </ActionIcon>
                )}
              </Group>
              {!entry.participantId && (
                <Input
                  value={entry.phone}
                  onChange={(e) => updateEntry(index, { phone: e.target.value })}
                  placeholder="Or enter a new phone number"
                />
              )}
              <AsyncSelectField
                value={entry.channelId ? { value: entry.channelId, label: entry.channelLabel } : null}
                field={{
                  name: `channel-${index}`,
                  label: 'Channel',
                  type: 'async-select',
                  searchParam: {
                    endpoint: '/channels',
                    queryParam: 'search',
                    minChars: 0,
                    valueKey: 'id',
                    labelKey: 'name',
                  },
                  placeholder: 'Select channel',
                }}
                onChange={(option) =>
                  updateEntry(index, { channelId: option?.value || '', channelLabel: option?.label || '' })
                }
              />
              <Select
                value={entry.role}
                onChange={(v) => updateEntry(index, { role: (v || 'USER') as ParticipantRole })}
                data={ROLES}
                placeholder="Select role"
              />
            </Stack>
          </Paper>
        ))}
        <Button variant="subtle" size="sm" onClick={addEntry} leftSection={<Plus size={16} />}>
          Add participant
        </Button>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || addMutation.isPending} onClick={handleSubmit}>
            {addMutation.isPending ? 'Adding...' : 'Add'}
          </Button>
        </Group>
        {addMutation.isError && (
          <Alert icon={<AlertCircle size={16} />} color="red" title="Error">
            {(addMutation.error as Error)?.message || 'Failed to add projection'}
          </Alert>
        )}
      </Stack>
    </Modal>
  );
}
