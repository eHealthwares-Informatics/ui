import { Button, Stack, Textarea } from '@mantine/core';
import { CheckCircle2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { ModelConfig } from '@/features/shared/model-schema';
import { lisApi } from '@/lib/lis-api';
import { type LisResourceConfig } from '../schema/resources';

function resourceToConfig(resource: LisResourceConfig): ModelConfig {
  return {
    id: resource.key,
    title: resource.title,
    description: resource.description,
    endpoint: resource.endpoint,
    columns: resource.columns,
    modalTitle: `Add ${resource.title}`,
    tabGroups: resource.tabGroups,
    createFields: resource.createFields,
    createFieldGroups: resource.createFieldGroups,
    buildCreatePayload: (values) => values,
    buildUpdatePayload: (values) => values,
    canDelete: true,
  };
}

export function LisResourcePage({ resource }: { resource: LisResourceConfig }) {
  const [coverage, setCoverage] = useState('');

  async function checkCoverage(formState: Record<string, unknown>) {
    const testId = String(formState.testId ?? '');
    if (!testId) {
      return;
    }
    const result = await lisApi.get(`/lis/reference-ranges/coverage/${testId}`);
    const issues = result.data?.issues ?? [];
    setCoverage(
      issues.length
        ? issues.map((issue: { message: string }) => issue.message).join('\n')
        : 'No uncovered or overlapping ranges found.'
    );
  }

  const renderCreateExtras =
    resource.key === 'reference-ranges'
      ? ({ formState }: { formState: Record<string, unknown> }) => (
          <Stack gap="xs">
            <Button
              variant="light"
              leftSection={<CheckCircle2 size={16} />}
              onClick={() => checkCoverage(formState)}
            >
              Check Coverage
            </Button>
            {coverage ? <Textarea value={coverage} readOnly minRows={3} /> : null}
          </Stack>
        )
      : undefined;

  const config: ModelConfig = {
    ...resourceToConfig(resource),
    renderCreateExtras,
  };

  return <DataPageShell config={config} />;
}
