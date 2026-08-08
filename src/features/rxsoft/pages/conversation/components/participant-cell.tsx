import { HoverCard, Skeleton, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { conversationApi } from '@/lib/conversation-api';

type ParticipantCellProps = {
  participantId: string | null;
  fallback?: string;
};

function shortenId(id: string) {
  if (id.length <= 8) {return id;}
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function participantLabel(p: Record<string, unknown> | undefined): string | null {
  if (!p) {return null;}
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  if (name) {return name;}
  if (p.phone) {return String(p.phone);}
  if (p.email) {return String(p.email);}
  if (p.id) {return shortenId(String(p.id));}
  return null;
}

function ParticipantCellInner({ participantId, fallback }: ParticipantCellProps) {
  const { data, isFetching } = useQuery({
    queryKey: ['participants', participantId],
    queryFn: async () => {
      const { data } = await conversationApi.get(`/participants/${participantId}`);
      return data;
    },
    enabled: !!participantId,
  });

  if (!participantId) {return <>{fallback ?? '-'}</>;}

  const label = participantLabel(data as Record<string, unknown> | undefined);

  return (
    <HoverCard
      position="top"
      withArrow
      shadow="md"
      openDelay={300}
      closeDelay={300}
    >
      <HoverCard.Target>
        <span style={{ cursor: 'pointer', borderBottom: '1px dashed var(--mantine-color-gray-5)' }}>
          {label ?? shortenId(participantId)}
        </span>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        {isFetching ? (
          <Stack gap="xs" miw={200}>
            <Skeleton height={14} width="60%" />
            <Skeleton height={14} width="40%" />
          </Stack>
        ) : data ? (
          <Stack gap="xs" miw={200}>
            {label && <Text fw={600} size="sm">{label}</Text>}
            {data.phone && <Text size="xs" c="dimmed">Phone: {data.phone}</Text>}
            {data.email && <Text size="xs" c="dimmed">Email: {data.email}</Text>}
            <Text size="xs" c="dimmed">ID: {shortenId(String(participantId))}</Text>
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">No data</Text>
        )}
      </HoverCard.Dropdown>
    </HoverCard>
  );
}

export const ParticipantCell = memo(ParticipantCellInner);
