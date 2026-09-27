import {
  Card,
  Text,
  Stack,
  Group,
  Select,
  TextInput,
  Switch,
  Button,
  Title,
  Grid,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { ConceptSummaryCard, MetadataPreview, codingModuleOptions } from './shared';

export function CodingConceptSearchPage() {
  const [module, setModule] = useState('LOINC');
  const [term, setTerm] = useState('');
  const [metadata, setMetadata] = useState(false);
  const [submitted, setSubmitted] = useState<{
    module: string;
    term: string;
    metadata: boolean;
  } | null>(null);

  const query = useQuery({
    queryKey: ['coding-concept', 'search', submitted],
    enabled: Boolean(submitted?.term),
    retry: false,
    queryFn: async () => {
      const response = await codingConceptApi.get(
        `/concepts/search/${encodeURIComponent(submitted!.module)}/${encodeURIComponent(submitted!.term)}`,
        {
          params: submitted?.metadata ? { metadata: 'true' } : undefined,
        }
      );
      return response.data?.data ?? null;
    },
  });

  const title = useMemo(() => {
    if (!submitted?.term) {
      return 'Search a terminology concept';
    }
    return `Search result for ${submitted.module}:${submitted.term}`;
  }, [submitted]);

  return (
    <RxPage
      title="Coding Concept Search"
      description="Return the first best-matching concept by module and code or name."
      actions={
        <Button
          leftSection={<Search size={16} />}
          onClick={() =>
            setSubmitted({
              module,
              term: term.trim(),
              metadata,
            })
          }
          disabled={!term.trim()}
        >
          Search
        </Button>
      }
    >
      <Grid>
        {/* Left Panel */}
        <Grid.Col span={{ base: 12, xl: 4 }}>
          <Card withBorder radius="md" p="lg">
            <Stack gap="md">
              <div>
                <Title order={5}>Search Filters</Title>
                <Text size="sm" c="dimmed">
                  Select module and search term
                </Text>
              </div>

              <Select
                label="Module"
                data={codingModuleOptions}
                value={module}
                onChange={(v) => setModule(v || 'LOINC')}
                placeholder="Select module"
              />

              <TextInput
                label="Code or name"
                value={term}
                onChange={(e) => setTerm(e.currentTarget.value)}
                placeholder="e.g. CBC, 12345-6, chest x-ray"
              />

              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text size="sm" fw={500}>
                    Include metadata
                  </Text>
                  <Text size="xs" c="dimmed">
                    Returns metadata keyed by attribute ID
                  </Text>
                </div>
                <Switch checked={metadata} onChange={(e) => setMetadata(e.currentTarget.checked)} />
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Right Panel */}
        <Grid.Col span={{ base: 12, xl: 8 }}>
          <Stack gap="md">
            <ConceptSummaryCard concept={query.data} />

            {submitted?.metadata && (
              <Card withBorder radius="md" p="lg">
                <Stack gap="sm">
                  <div>
                    <Title order={5}>{title}</Title>
                    <Text size="sm" c="dimmed">
                      Metadata values returned as keyed attribute objects.
                    </Text>
                  </div>

                  <MetadataPreview metadata={query.data?.metadata} />
                </Stack>
              </Card>
            )}

            {query.isLoading && (
              <Text size="sm" c="dimmed">
                Searching concepts…
              </Text>
            )}

            {query.isError && (
              <Text size="sm" c="red">
                No concept matched the submitted module and search term.
              </Text>
            )}

            {!query.isLoading && !query.isError && submitted?.term && !query.data && (
              <Text size="sm" c="dimmed">
                No concept returned.
              </Text>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </RxPage>
  );
}
