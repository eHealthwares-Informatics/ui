import { ActionIcon, Menu } from '@mantine/core';
import { useState } from 'react';
import { History, MoreHorizontal } from 'lucide-react';
import { RequestTimelineModal } from './request-timeline-modal';

export function RequestRowActions({ row }: { row: Record<string, unknown> }) {
  const [timelineRequestId, setTimelineRequestId] = useState<string | null>(null);
  const id = String(row.id ?? '');

  return (
    <>
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon variant="subtle" aria-label="Request actions">
            <MoreHorizontal size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<History size={14} />}
            onClick={() => setTimelineRequestId(id)}
          >
            Timeline
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <RequestTimelineModal
        opened={Boolean(timelineRequestId)}
        onClose={() => setTimelineRequestId(null)}
        requestId={timelineRequestId}
        summary={{
          requestNumber: row.requestNumber != null ? String(row.requestNumber) : undefined,
          status: row.status != null ? String(row.status) : undefined,
          priority: row.priority != null ? String(row.priority) : undefined,
          requestType: row.requestType != null ? String(row.requestType) : undefined,
        }}
      />
    </>
  );
}
