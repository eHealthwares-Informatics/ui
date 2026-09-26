import {
  Accordion,
  Anchor,
  Badge,
  Button,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { FileText, ClipboardList } from 'lucide-react';
import { formatEnum } from '../../lib/emr-constants';
import type { FormSubmission } from '../../lib/emr-types';
import { SubmissionSummary } from '../documentation/submission-summary';
import { StatusBadge } from '../shared/status-badge';
import { SchemaOutdatedBadge } from '../documentation/schema-outdated-badge';

function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : '—';
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text size="sm">{value || '—'}</Text>
    </Stack>
  );
}

export function DocumentsAccordion({
  submissions,
  isLoading,
  onView,
  onAmend,
}: {
  submissions: FormSubmission[];
  isLoading?: boolean;
  onView: (submission: FormSubmission) => void;
  onAmend?: (submission: FormSubmission) => void;
}) {
  if (isLoading) {
    return (
      <Stack gap="sm">
        <Skeleton height={44} radius="md" />
        <Skeleton height={44} radius="md" />
      </Stack>
    );
  }

  const sorted = [...submissions].sort((a, b) =>
    (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''),
  );

  if (sorted.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No documentation for this encounter yet.
      </Text>
    );
  }

  return (
    <Accordion variant="separated">
      {sorted.map((submission) => (
        <Accordion.Item key={submission.id} value={submission.id}>
          <Accordion.Control>
            <Group gap="xs" wrap="nowrap">
              <FileText size={16} style={{ flexShrink: 0 }} />
              <Badge variant="light" style={{ flexShrink: 0 }}>
                {submission.submissionNumber}
              </Badge>
              <Text size="sm" fw={500} truncate>
                {submission.formName}
              </Text>
              <Badge size="xs" variant="outline" style={{ flexShrink: 0 }}>
                v{submission.formVersion}
              </Badge>
              <SchemaOutdatedBadge submission={submission} />
              <StatusBadge value={submission.status} kind="submission" />
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="sm">
              <Text size="xs" c="dimmed">
                Submitted by {submission.submittedByName ?? 'Unknown'} ·{' '}
                {formatDate(submission.submittedAt)}
              </Text>
              {Object.keys(submission.dataJson ?? {}).length > 0 && (
                <SubmissionSummary submission={submission} />
              )}
              <Group gap={4} wrap="nowrap">
                <Button
                  size="compact-xs"
                  variant="light"
                  onClick={() => onView(submission)}
                >
                  View
                </Button>
                {submission.status === 'SUBMITTED' && onAmend && (
                  <Button
                    size="compact-xs"
                    variant="outline"
                    onClick={() => onAmend(submission)}
                  >
                    Amend
                  </Button>
                )}
              </Group>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

export function RequestsAccordion({
  requests,
  isLoading,
}: {
  requests: Array<Record<string, unknown>>;
  isLoading?: boolean;
}) {
  const navigate = useNavigate();
  const visit = (requestId?: string | null) => () => {
    if (requestId) {
      void navigate({ to: `/emr/requests/${String(requestId)}` });
    }
  };

  if (isLoading) {
    return (
      <Stack gap="sm">
        <Skeleton height={44} radius="md" />
        <Skeleton height={44} radius="md" />
      </Stack>
    );
  }

  if (requests.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No clinical requests for this encounter yet. Use “Create Request” to order labs,
        prescriptions, or imaging.
      </Text>
    );
  }

  return (
    <Accordion variant="separated">
      {requests.map((request) => (
        <Accordion.Item key={String(request.id)} value={String(request.id)}>
          <Accordion.Control>
            <Group gap="xs" wrap="nowrap">
              <ClipboardList size={16} style={{ flexShrink: 0 }} />
              <Badge variant="light" style={{ flexShrink: 0 }}>
                {String(request.requestNumber ?? '—')}
              </Badge>
              <Text size="sm" fw={500} truncate>
                {request.requestType != null ? formatEnum(String(request.requestType)) : '—'}
              </Text>
              <StatusBadge value={request.status} kind="request" />
              <StatusBadge value={request.priority} kind="priority" />
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="sm">
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                <InfoLine
                  label="Requested"
                  value={formatDate(String(request.requestedAt ?? ''))}
                />
                <InfoLine
                  label="Ordering provider"
                  value={String(request.orderingProviderName ?? '—')}
                />
                <InfoLine label="Diagnosis" value={String(request.diagnosis ?? '—')} />
              </SimpleGrid>
              <Anchor component="button" type="button" size="sm" fw={500} onClick={visit(String(request.id))}>
                View full request
              </Anchor>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}