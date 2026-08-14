import { ActionIcon, Modal, Stack, Table, Text } from '@mantine/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import {
  listProjections,
  removeParticipantProjections,
} from '../services/chat-api';

type Props = {
  opened: boolean;
  onClose: () => void;
  conversationId?: string;
};

export function ParticipantModal({ opened, onClose, conversationId }: Props) {
  const { data: projections, isLoading } = useQuery({
    queryKey: ['projections', conversationId],
    enabled: Boolean(conversationId),
    queryFn: () => listProjections(conversationId!),
  });

  const removeMutation = useMutation({
    mutationFn: (participantId: string) =>
      removeParticipantProjections({
        conversationId: conversationId!,
        participantId,
      }),
    onSuccess: () => {
      onClose();
    },
  });

  const uniqueParticipants = projections
    ? projections.reduce<{ id: string; name: string; roles: string[] }[]>((acc, p) => {
        const existing = acc.find((a) => a.id === p.participant.id);
        if (existing) {
          existing.roles.push(p.role);
        } else {
          acc.push({
            id: p.participant.id,
            name:
              [p.participant.firstName, p.participant.lastName].filter(Boolean).join(' ') ||
              p.participant.phone ||
              p.participant.id,
            roles: [p.role],
          });
        }
        return acc;
      }, [])
    : [];

  return (
    <Modal opened={opened} onClose={onClose} title="Remove Participant" size="lg">
      <Stack gap="md">
        {isLoading ? (
          <Text>Loading participants...</Text>
        ) : uniqueParticipants.length === 0 ? (
          <Text c="dimmed">No participants found</Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Participant</Table.Th>
                <Table.Th>Roles</Table.Th>
                <Table.Th w={60} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {uniqueParticipants.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{p.name}</Table.Td>
                  <Table.Td>{p.roles.join(', ')}</Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="light"
                      loading={removeMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Remove ${p.name} from this conversation?`)) {
                          removeMutation.mutate(p.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
        <Stack align="flex-end">
          <Text size="sm" c="dimmed">
            Use the conversation menu to add participants.
          </Text>
        </Stack>
      </Stack>
    </Modal>
  );
}
