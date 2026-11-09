import {
  AppShell,
  Card,
  Checkbox,
  Group,
  Stack,
  Text,
  TextInput,
  Button,
  Loader,
  Alert,
  Switch,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { ListFilter } from 'lucide-react';
import { useState } from 'react';
import { SelectField } from '@/components/form/select';
import { RxPage } from '@/components/page/rx-page';
import { Option } from '@/features/rxsoft/types';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { ConceptSummaryCard, MetadataPreview, codingModuleOptions } from './shared';

export function CodingConceptMatchPage() {
  const [module, setModule] = useState<Option | null>({ value: 'DICOM', label: 'DICOM' });
  const [term, setTerm] = useState('');
  const [metadata, setMetadata] = useState(false);
  const [submitted, setSubmitted] = useState<{
    module: string;
    term: string;
    metadata: boolean;
  } | null>(null);

  const query = useQuery({
    queryKey: ['coding-concept', 'match', submitted],
    enabled: Boolean(submitted?.term),
    retry: false,
    queryFn: async () => {
      const response = await codingConceptApi.get(
        `/concepts/match/${encodeURIComponent(submitted!.module)}/${encodeURIComponent(submitted!.term)}`,
        {
          params: submitted?.metadata ? { metadata: 'true' } : undefined,
        }
      );

      return Array.isArray(response.data?.data) ? response.data.data : [];
    },
  });

  return (
    <RxPage
      title="Coding Concept Match"
      description="Return all matching concepts by module using code, short name, or full name."
      actions={
        <Button
          leftSection={<ListFilter size={16} />}
          onClick={() =>
            setSubmitted({
              module: module?.value || '',
              term: term.trim(),
              metadata,
            })
          }
          disabled={!term.trim()}
        >
          Match
        </Button>
      }
    >
      <Group align="flex-start" grow>
        {/* LEFT PANEL */}
        <Card withBorder radius="md" style={{ maxWidth: 340 }}>
          <Stack gap="md">
            <SelectField
              label="Module"
              value={module}
              onChange={(option) => setModule(option)}
              options={codingModuleOptions}
              placeholder="Select module"
            />

            <TextInput
              label="Code or name"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. XRAY, glucose, platelet"
            />

            <Card withBorder radius="md" p="sm">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text size="sm" fw={500}>
                    Include metadata
                  </Text>
                  <Text size="xs" c="dimmed">
                    Each matched concept includes keyed metadata by attribute ID.
                  </Text>
                </div>

                <Switch checked={metadata} onChange={(e) => setMetadata(e.currentTarget.checked)} />
              </Group>
            </Card>
          </Stack>
        </Card>

        {/* RIGHT PANEL */}
        <Stack gap="md">
          {query.isLoading && (
            <Group>
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Matching concepts…
              </Text>
            </Group>
          )}

          {query.isError && <Alert color="red">Unable to load concept matches.</Alert>}

          {!query.isLoading &&
            !query.isError &&
            submitted?.term &&
            (query.data?.length ?? 0) === 0 && (
              <Text size="sm" c="dimmed">
                No matches found.
              </Text>
            )}

          {(query.data ?? []).map((concept: Record<string, any>) => (
            <Stack key={concept.id} gap="sm">
              <ConceptSummaryCard concept={concept} />

              {submitted?.metadata && <MetadataPreview metadata={concept.metadata} />}
            </Stack>
          ))}
        </Stack>
      </Group>
    </RxPage>
  );
}
