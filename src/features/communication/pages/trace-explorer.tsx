import {
  Button,
  TextInput,
  Card,
  Stack,
  Group,
  Text,
  Loader,
  Code,
  ScrollArea,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { communicationApi } from '@/lib/communication-api';

export function TraceExplorerPage() {
  const [messageId, setMessageId] = useState('');
  const [searchId, setSearchId] = useState('');

  const { data, isLoading } = useQuery<any>({
    queryKey: ['communication', 'trace', searchId],
    queryFn: async () => {
      if (!searchId) {
        return null;
      }
      const res = await communicationApi.get(`/v1/flow/audit/${encodeURIComponent(searchId)}`);
      return res.data;
    },
    enabled: !!searchId,
    retry: false,
  });

  return (
    <RxPage
      title="Trace Explorer"
      description="Inspect the lifecycle of a message through the switch."
    >
      <Card withBorder radius="md" p="lg">
        <Stack gap="lg">
          {/* Search */}
          <Group align="flex-end">
            <TextInput
              style={{ flex: 1 }}
              value={messageId}
              onChange={(e) => setMessageId(e.currentTarget.value)}
              placeholder="Enter trace message ID"
            />
            <Button onClick={() => setSearchId(messageId.trim())} disabled={!messageId.trim()}>
              Load Trace
            </Button>
          </Group>

          {/* Loading */}
          {isLoading && <Loader size="sm" />}

          {/* Data */}
          {data && (
            <Stack gap="md">
              {/* Message ID */}
              <Card withBorder radius="md" p="sm" bg="gray.0">
                <Text size="sm" fw={600}>
                  Message ID
                </Text>
                <Text>{data.messageId}</Text>
              </Card>

              {/* Events */}
              {Array.isArray(data.events) && data.events.length > 0 ? (
                <Stack gap="sm">
                  {data.events.map((event: any, index: number) => (
                    <Card key={index} withBorder radius="md" p="sm">
                      <Stack gap={4}>
                        <Text fw={500}>{event.eventType}</Text>

                        <Text size="xs" c="dimmed">
                          {new Date(event.timestamp).toLocaleString()}
                        </Text>

                        <ScrollArea h={180}>
                          <Code block>{JSON.stringify(event.snapshot, null, 2)}</Code>
                        </ScrollArea>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">
                  No trace events found for this ID.
                </Text>
              )}
            </Stack>
          )}
        </Stack>
      </Card>
    </RxPage>
  );
}
