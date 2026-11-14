import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Pagination,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { AlertCircle, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { RxPage } from '@/components/page/rx-page';
import { emrApi } from '@/lib/emr-api';
import { SubmissionAmendModal } from '../components/documentation/submission-amend-modal';
import { SubmissionViewModal } from '../components/documentation/submission-view-modal';
import { PatientHoverCard } from '../components/shared/patient-hover-card';
import { StatusBadge } from '../components/shared/status-badge';
import { FeatureSubmissionModal } from '../components/sub-modules/feature-submission-modal';
import { getApiErrorMessage } from '../lib/emr-errors';
import type { Feature, FormSubmission } from '../lib/emr-types';

const PAGE_SIZE = 20;

/** CRUD for one feature: the submissions list of its form. */
export function FeaturePage() {
  const { featureId } = useParams({ strict: false }) as { featureId: string };
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<FormSubmission | null>(null);
  const [amending, setAmending] = useState<FormSubmission | null>(null);
  const [newOpened, { open: openNew, close: closeNew }] = useDisclosure(false);

  const featureQuery = useQuery({
    queryKey: ['emr', 'features', featureId],
    queryFn: async () => {
      const { data } = await emrApi.get<Feature>(`/features/${featureId}`);
      return data;
    },
    enabled: Boolean(featureId),
  });

  const feature = featureQuery.data;

  const submissionsQuery = useQuery({
    queryKey: ['emr', 'form-submissions', 'feature', featureId, page, search],
    queryFn: async () => {
      const { data } = await emrApi.get<{
        data: FormSubmission[];
        meta: { page: number; limit: number; total: number };
      }>('/form-submissions', {
        params: {
          formDefinitionId: feature?.formDefinitionId,
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
        },
      });
      return data;
    },
    enabled: Boolean(feature?.formDefinitionId),
  });

  const rows = submissionsQuery.data?.data ?? [];
  const total = submissionsQuery.data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const formName = feature?.form?.name ?? 'Feature';

  return (
    <RxPage
      breadcrumbs={[
        { label: 'EMR' },
        ...(feature?.subModule
          ? [
              {
                label: feature.subModule.name,
                href: `/emr/modules/${feature.subModule.id}`,
              },
            ]
          : []),
        { label: formName },
      ]}
      title={formName}
      description={
        feature?.form?.description ??
        'Records captured with this feature. Opening a form starts a same-day encounter.'
      }
      actions={
        <Button
          leftSection={<Plus size={16} />}
          onClick={openNew}
          disabled={!feature?.form?.isPublished}
          data-testid="feature-new-record-button"
        >
          New Record
        </Button>
      }
    >
      {featureQuery.isLoading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : featureQuery.isError || !feature ? (
        <Alert color="red" icon={<AlertCircle size={16} />}>
          {getApiErrorMessage(featureQuery.error) || 'Feature not found.'}
        </Alert>
      ) : (
        <Stack gap="md">
          {!feature.form?.isPublished && (
            <Alert color="yellow" icon={<AlertCircle size={16} />}>
              This form is a draft. Publish it under Admin Console → EMR Configuration → Forms
              before capturing records.
            </Alert>
          )}

          <Group justify="space-between">
            <TextInput
              placeholder="Search records…"
              leftSection={<Search size={15} />}
              value={search}
              onChange={(event) => {
                setSearch(event.currentTarget.value);
                setPage(1);
              }}
              data-testid="feature-search-input"
              style={{ maxWidth: 320 }}
            />
            <Group gap="xs">
              <Badge variant="light">{feature.encounterType}</Badge>
              <Text size="xs" c="dimmed">
                {total} record{total === 1 ? '' : 's'}
              </Text>
            </Group>
          </Group>

          <Card withBorder radius="md" padding={0}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Submission #</Table.Th>
                  <Table.Th>Patient</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Version</Table.Th>
                  <Table.Th>Submitted by</Table.Th>
                  <Table.Th>Submitted at</Table.Th>
                  <Table.Th>Encounter</Table.Th>
                  <Table.Th style={{ width: 140 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {submissionsQuery.isLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={8}>Loading…</Table.Td>
                  </Table.Tr>
                ) : rows.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={8}>No records yet.</Table.Td>
                  </Table.Tr>
                ) : (
                  rows.map((row) => (
                    <Table.Tr key={row.id}>
                      <Table.Td>
                        <Badge variant="light">{row.submissionNumber}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <PatientHoverCard mrn={row.patientId} label={row.patientId} />
                      </Table.Td>
                      <Table.Td>
                        <StatusBadge value={row.status} kind="submission" />
                      </Table.Td>
                      <Table.Td>v{row.formVersion}</Table.Td>
                      <Table.Td>{row.submittedByName ?? '—'}</Table.Td>
                      <Table.Td>
                        {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '—'}
                      </Table.Td>
                      <Table.Td>
                        {row.encounterId ? (
                          <Anchor
                            component="button"
                            type="button"
                            size="sm"
                            fw={500}
                            onClick={() =>
                              void navigate({
                                to: `/emr/encounters/${row.encounterId}`,
                              })
                            }
                          >
                            View
                          </Anchor>
                        ) : (
                          '—'
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <Button
                            size="compact-xs"
                            variant="light"
                            onClick={() => setViewing(row)}
                            data-testid={`feature-view-${row.id}`}
                          >
                            View
                          </Button>
                          {row.status === 'SUBMITTED' && (
                            <Button
                              size="compact-xs"
                              variant="outline"
                              onClick={() => setAmending(row)}
                              data-testid={`feature-amend-${row.id}`}
                            >
                              Amend
                            </Button>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
            {totalPages > 1 && (
              <Group justify="flex-end" p="md">
                <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
              </Group>
            )}
          </Card>
        </Stack>
      )}

      {feature && (
        <FeatureSubmissionModal
          opened={newOpened}
          onClose={closeNew}
          feature={feature}
          onSubmitted={() => {
            void submissionsQuery.refetch();
          }}
        />
      )}

      <SubmissionViewModal
        opened={Boolean(viewing)}
        onClose={() => setViewing(null)}
        submission={viewing}
        onJump={setViewing}
      />

      <SubmissionAmendModal
        opened={Boolean(amending)}
        onClose={() => setAmending(null)}
        submission={amending}
        onSaved={() => {
          void submissionsQuery.refetch();
        }}
      />
    </RxPage>
  );
}
