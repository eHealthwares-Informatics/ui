import { Badge, Button, Group, Loader, Modal, SimpleGrid, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { emrApi } from '@/lib/emr-api';
import { useFormDefinition } from '../../hooks/use-form-definition';
import type { FormSubmission } from '../../lib/emr-types';
import { printSubmission } from '../../lib/print-submission';
import { StatusBadge } from '../shared/status-badge';

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '—';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function SubmissionViewModal({
  opened,
  onClose,
  submission,
  onJump,
}: {
  opened: boolean;
  onClose: () => void;
  submission: FormSubmission | null;
  /** Navigate to another version in the amend chain (parent swaps the viewed submission). */
  onJump?: (submission: FormSubmission) => void;
}) {
  const { data: form, isLoading } = useFormDefinition(submission?.formDefinitionId);

  const chainQuery = useQuery({
    queryKey: ['emr', 'form-submissions', submission?.id, 'chain'],
    queryFn: async () => {
      const { data: res } = await emrApi.get<{ data: FormSubmission[] }>(
        `/form-submissions/${submission!.id}/chain`
      );
      return res.data;
    },
    enabled: opened && Boolean(submission),
    retry: false,
  });

  const chain = chainQuery.data ?? [];
  const chainIndex = chain.findIndex((entry) => entry.id === submission?.id);

  return (
    <Modal opened={opened} onClose={onClose} title="View Documentation" size="lg" centered>
      {!submission ? null : isLoading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : (
        <Stack gap="md">
          <Group gap="xs" wrap="wrap">
            <Badge variant="light">{submission.submissionNumber}</Badge>
            <Text size="sm" fw={600}>
              {submission.formName}
            </Text>
            <Badge variant="light">v{submission.formVersion}</Badge>
            <StatusBadge value={submission.status} kind="submission" />
          </Group>

          {chain.length > 1 && (
            <Stack gap={6}>
              <Group justify="space-between">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Amendments
                </Text>
                <Text size="xs" c="dimmed">
                  Version {chainIndex + 1} of {chain.length} · {chain.length - 1} amendment
                  {chain.length - 1 === 1 ? '' : 's'}
                </Text>
              </Group>
              <Group gap={6} wrap="wrap">
                {chain.map((entry, index) => {
                  const isCurrent = entry.id === submission.id;
                  return (
                    <Button
                      key={entry.id}
                      size="compact-xs"
                      variant={isCurrent ? 'filled' : 'light'}
                      disabled={isCurrent}
                      onClick={() => onJump?.(entry)}
                    >
                      {index === 0 ? 'Original' : `Amend ${index}`}
                    </Button>
                  );
                })}
              </Group>
            </Stack>
          )}

          <Text size="xs" c="dimmed">
            Submitted by {submission.submittedByName ?? 'Unknown'} ·{' '}
            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '—'}
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {Object.entries(submission.dataJson ?? {}).map(([key, value]) => {
              const label =
                form?.schemaJson?.fields?.find((field) => field.key === key)?.label ?? key;
              return (
                <Stack key={key} gap={2}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    {label}
                  </Text>
                  <Text size="sm">{renderValue(value)}</Text>
                </Stack>
              );
            })}
          </SimpleGrid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              leftSection={<Printer size={14} />}
              onClick={() => {
                void printSubmission(submission).then((ok) => {
                  if (!ok) {
                    notifications.show({
                      color: 'red',
                      message: 'Could not generate the PDF — check your connection and try again.',
                    });
                  }
                });
              }}
            >
              Print / PDF
            </Button>
            <Button variant="light" onClick={onClose}>
              Close
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
