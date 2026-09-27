import {
  Button,
  TextInput,
  Grid,
  Card,
  Stack,
  Group,
  Text,
  Loader,
  Alert,
  Code,
  ScrollArea,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { communicationApi } from '@/lib/communication-api';

export function AuditCenterPage() {
  const [selectedId, setSelectedId] = useState('');
  const [searchId, setSearchId] = useState('');

  const {
    data: traces,
    isLoading: isListing,
    isError: hasListError,
    refetch,
  } = useQuery({
    queryKey: ['communication', 'flow', 'traces'],
    queryFn: async () => {
      const res = await communicationApi.get('/v1/flow/traces?limit=50');
      return res.data;
    },
    retry: false,
  });

  const {
    data: audit,
    isLoading: isLoadingAudit,
    isError: hasAuditError,
  } = useQuery({
    queryKey: ['communication', 'flow', 'audit', selectedId],
    queryFn: async () => {
      if (!selectedId) {
        return null;
      }
      const res = await communicationApi.get(`/v1/flow/audit/${encodeURIComponent(selectedId)}`);
      return res.data;
    },
    enabled: !!selectedId,
    retry: false,
  });

  return (
    <RxPage
      title="Audit Center"
      description="Browse recent switch traces and inspect audit details for message delivery."
      actions={<Button onClick={() => refetch()}>Refresh Traces</Button>}
    >
      <Grid gap="lg">
        {/* LEFT */}
        <Grid.Col span={{ base: 12, xl: 7 }}>
          <Card withBorder radius="md" p="lg">
            <Stack gap="md">
              <Group align="flex-end">
                <TextInput
                  style={{ flex: 1 }}
                  value={searchId}
                  onChange={(e) => setSearchId(e.currentTarget.value)}
                  placeholder="Search trace by message ID"
                />
                <Button onClick={() => setSelectedId(searchId.trim())} disabled={!searchId.trim()}>
                  Load Audit
                </Button>
              </Group>

              {isListing && <Loader size="sm" />}

              {hasListError && (
                <Alert color="red" variant="light">
                  Unable to load recent traces.
                </Alert>
              )}

              {Array.isArray(traces) && traces.length > 0 ? (
                <Stack gap="xs">
                  {traces.map((trace: any) => (
                    <Card
                      key={trace.messageId}
                      withBorder
                      radius="md"
                      p="sm"
                      onClick={() => setSelectedId(trace.messageId)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Group justify="space-between">
                        <div>
                          <Text fw={500}>{trace.messageId}</Text>
                          <Text size="xs" c="dimmed">
                            Status: {trace.status}
                          </Text>
                        </div>

                        <Text size="xs" c="dimmed">
                          Events: {trace.events?.length ?? 0}
                        </Text>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              ) : (
                !isListing && (
                  <Text size="sm" c="dimmed">
                    No recent traces available yet.
                  </Text>
                )
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* RIGHT */}
        <Grid.Col span={{ base: 12, xl: 5 }}>
          <Card withBorder radius="md" p="lg">
            <Stack gap="md">
              <Group justify="space-between">
                <div>
                  <Text fw={600}>Audit Details</Text>
                  <Text size="sm" c="dimmed">
                    Selected message ID: {selectedId || 'None'}
                  </Text>
                </div>

                {selectedId && (
                  <Button variant="light" size="xs" onClick={() => setSelectedId('')}>
                    Clear
                  </Button>
                )}
              </Group>

              {isLoadingAudit && <Loader size="sm" />}

              {hasAuditError && (
                <Alert color="red" variant="light">
                  Unable to load audit for this message.
                </Alert>
              )}

              {audit ? (
                <Card withBorder radius="md" p="sm" bg="gray.0">
                  <Text size="sm" fw={600}>
                    Audit Summary
                  </Text>

                  <ScrollArea h={300} mt="sm">
                    <Code block>{JSON.stringify(audit, null, 2)}</Code>
                  </ScrollArea>
                </Card>
              ) : selectedId ? (
                <Text size="sm" c="dimmed">
                  No audit data found for this message ID.
                </Text>
              ) : (
                <Text size="sm" c="dimmed">
                  Select a trace to view audit details.
                </Text>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </RxPage>
  );
}
