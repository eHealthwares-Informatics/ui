import { Alert, Anchor, Badge, Group, Loader, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Eye, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { RxPage } from '@/components/page/rx-page';
import type { Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { SubmissionAmendModal } from '../components/documentation/submission-amend-modal';
import { SubmissionViewModal } from '../components/documentation/submission-view-modal';
import { PatientHoverCard } from '../components/shared/patient-hover-card';
import { StatusBadge } from '../components/shared/status-badge';
import { FeatureSubmissionModal } from '../components/sub-modules/feature-submission-modal';
import { getApiErrorMessage } from '../lib/emr-errors';
import type { Feature, FormSubmission } from '../lib/emr-types';

/** CRUD for one feature: the submissions list of its form. */
export function FeaturePage() {
  const { featureId } = useParams({ strict: false }) as { featureId: string };
  const navigate = useNavigate();
  const [viewing, setViewing] = useState<FormSubmission | null>(null);
  const [amending, setAmending] = useState<FormSubmission | null>(null);

  const featureQuery = useQuery({
    queryKey: ['emr', 'features', featureId],
    queryFn: async () => {
      const { data } = await emrApi.get<Feature>(`/features/${featureId}`);
      return data;
    },
    enabled: Boolean(featureId),
  });

  const feature = featureQuery.data;
  const formName = feature?.form?.name ?? 'Feature';

  const config = useMemo<ModelConfig>(() => {
    const columns: Column[] = [
      {
        key: 'submissionNumber',
        label: 'Submission #',
        render: (row) => <Badge variant="light">{String(row.submissionNumber ?? '—')}</Badge>,
      },
      {
        key: 'patientId',
        label: 'Patient',
        render: (row) => (
          <PatientHoverCard
            mrn={row.patientId ? String(row.patientId) : null}
            label={row.patientId ? String(row.patientId) : '—'}
          />
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <StatusBadge value={row.status} kind="submission" />,
      },
      {
        key: 'formVersion',
        label: 'Version',
        render: (row) => `v${String(row.formVersion ?? '—')}`,
      },
      {
        key: 'submittedByName',
        label: 'Submitted by',
        render: (row) => String(row.submittedByName ?? '—'),
      },
      {
        key: 'submittedAt',
        label: 'Submitted at',
        render: (row) =>
          row.submittedAt ? new Date(String(row.submittedAt)).toLocaleString() : '—',
      },
      {
        key: 'encounterId',
        label: 'Encounter',
        render: (row) =>
          row.encounterId ? (
            <Anchor
              component="button"
              type="button"
              size="sm"
              fw={500}
              onClick={() =>
                void navigate({
                  to: `/emr/encounters/${String(row.encounterId)}`,
                })
              }
            >
              View
            </Anchor>
          ) : (
            <Text size="sm" c="dimmed">
              —
            </Text>
          ),
      },
    ];

    return {
      id: 'emr-feature-submissions',
      title: formName,
      description:
        feature?.form?.description ??
        'Records captured with this feature. Opening a form starts a same-day encounter.',
      endpoint: '/form-submissions',
      apiProvider: emrApi,
      queryKeyBase: [
        'emr',
        'form-submissions',
        'feature',
        featureId,
        feature?.formDefinitionId ?? '',
      ],
      listParamStyle: 'plain',
      listParams: feature?.formDefinitionId ? { formDefinitionId: feature.formDefinitionId } : {},
      columns,
      defaultSort: { sortBy: 'submittedAt', sortOrder: 'desc' },
      rowActions: [
        {
          label: 'View',
          icon: Eye,
          onClick: (row) => setViewing(row as unknown as FormSubmission),
        },
        {
          label: 'Amend',
          icon: Pencil,
          validate: (row) => row.status === 'SUBMITTED',
          onClick: (row) => setAmending(row as unknown as FormSubmission),
        },
      ],
      canCreate: feature?.form?.isPublished ?? false,
      canDelete: false,
      renderCreateModal: ({ onClose, refresh }) =>
        feature ? (
          <FeatureSubmissionModal
            opened
            onClose={onClose}
            feature={feature}
            onSubmitted={refresh}
          />
        ) : null,
    };
  }, [feature, featureId, formName, navigate]);

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
      description={config.description}
    >
      {featureQuery.isLoading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : featureQuery.isError || !feature ? (
        <Alert color="red">{getApiErrorMessage(featureQuery.error) || 'Feature not found.'}</Alert>
      ) : (
        <Stack gap="md">
          {!feature.form?.isPublished && (
            <Alert color="yellow">
              This form is a draft. Publish it under Admin Console → Configuration → Forms before
              capturing records.
            </Alert>
          )}
          <DataPageShell config={config} embedded />
        </Stack>
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
      />
    </RxPage>
  );
}
