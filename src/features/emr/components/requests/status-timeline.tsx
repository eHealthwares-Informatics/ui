import { Text, Timeline } from '@mantine/core';
import { formatEnum } from '../../lib/emr-constants';
import type { RequestStatusHistory } from '../../lib/emr-types';

function timelineColor(status: RequestStatusHistory['toStatus']): string {
  switch (status) {
    case 'IN_PROGRESS':
      return 'cyan';
    case 'COMPLETED':
      return 'teal';
    case 'CANCELLED':
    case 'REJECTED':
      return 'red';
    default:
      return 'blue';
  }
}

export function StatusTimeline({ history }: { history: RequestStatusHistory[] }) {
  if (history.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No status activity recorded yet.
      </Text>
    );
  }

  return (
    <Timeline active={history.length - 1} bulletSize={20} lineWidth={2}>
      {history.map((entry) => {
        const isNote = entry.fromStatus === null && entry.toStatus === null;
        return (
          <Timeline.Item
            key={entry.id}
            title={isNote ? 'Note' : entry.fromStatus ? `${formatEnum(entry.fromStatus)} → ${formatEnum(entry.toStatus)}` : `Created · ${formatEnum(entry.toStatus)}`}
            color={isNote ? 'gray' : timelineColor(entry.toStatus)}
          >
            <Text size="xs" c="dimmed">
              {entry.actorUsername ?? 'System'} · {new Date(entry.createdAt).toLocaleString()}
            </Text>
            <Text size="sm" mt={4} c={isNote ? 'dark' : undefined} fw={isNote ? 400 : undefined}>
              {entry.reason}
            </Text>
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
}
