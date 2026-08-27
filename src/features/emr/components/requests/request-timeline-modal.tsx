import {
  Alert,
  Badge,
  Group,
  Loader,
  Modal,
  Stack,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { emrApi } from '@/lib/emr-api';
import { formatEnum } from '../../lib/emr-constants';
import type { RequestStatusHistory } from '../../lib/emr-types';
import { StatusBadge } from '../shared/status-badge';
import { RequestNoteComposer } from './request-note-composer';
import { StatusTimeline } from './status-timeline';

export type RequestSummary = {
  requestNumber?: string;
  status?: string;
  priority?: string;
  requestType?: string;
};

export function RequestTimelineModal({
  opened,
  onClose,
  requestId,
  summary,
}: {
  opened: boolean;
  onClose: () => void;
  requestId: string | null;
  summary?: RequestSummary | null;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['emr', 'requests', requestId, 'history'],
    queryFn: async () => {
      const { data: res } = await emrApi.get<{ data: RequestStatusHistory[] }>(
        `/requests/${requestId}/history`,
      );
      return res.data;
    },
    enabled: opened && Boolean(requestId),
    retry: false,
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={summary?.requestNumber ? `Request ${summary.requestNumber} — Activity` : 'Request Activity'}
      centered
    >
      {isLoading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : isError || !data ? (
        <Alert color="red" icon={<AlertCircle size={16} />} title="Unable to load activity">
          Request not found.
        </Alert>
      ) : (
        <Stack gap="md">
          {summary && (
            <Group gap="xs" wrap="wrap">
              <Badge variant="light">{summary.requestNumber}</Badge>
              <StatusBadge value={summary.status} kind="request" />
              <StatusBadge value={summary.priority} kind="priority" />
              {summary.requestType && (
                <Badge variant="light" color="grape">
                  {formatEnum(summary.requestType)}
                </Badge>
              )}
            </Group>
          )}
          <StatusTimeline history={data} />
          {requestId && <RequestNoteComposer requestId={requestId} />}
        </Stack>
      )}
    </Modal>
  );
}
