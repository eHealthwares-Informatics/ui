import { Button, Card, Center, Loader, Stack, Text } from '@mantine/core';
import { QueryKey, useQuery } from '@tanstack/react-query';
import { Link } from 'lucide-react';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { RxPage } from '../page/rx-page';

function titleFromPath(pathname: string) {
  return pathname
    .split('/')
    .filter(Boolean)
    .map((item) => item.replace(/-/g, ' '))
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' / ');
}
export function JsonDetailCard({
  title,
  endpoint,
  backTo,
  emptyLabel,
}: {
  title: string;
  endpoint: string;
  backTo: string;
  emptyLabel: string;
}) {
  const query = useQuery({
    queryKey: ['rxsoft-detail', endpoint] satisfies QueryKey,
    queryFn: async () => {
      const response = await rxsoftApi.get(endpoint);
      return response.data;
    },
  });

  return (
    <RxPage
      title={title}
      description={titleFromPath(endpoint)}
      actions={
        <Button variant="outline">
          <Link to={backTo}>Back</Link>
        </Button>
      }
    >
      <Card withBorder>
        <Stack gap="sm" p="md">
          <Text fw={600}>{title}</Text>
          <Text size="sm" c="dimmed">
            {emptyLabel}
          </Text>

          {/* LOADING */}
          {query.isLoading && (
            <Center py="sm">
              <Loader size="sm" />
            </Center>
          )}

          {/* ERROR */}
          {query.isError && (
            <Text size="sm" c="red">
              Failed to load record.
            </Text>
          )}

          {/* DATA */}
          {query.data && (
            <pre
              style={{
                overflowX: 'auto',
                background: 'var(--mantine-color-gray-0)',
                padding: 12,
                borderRadius: 8,
                border: '1px solid var(--mantine-color-gray-3)',
                fontSize: 12,
              }}
            >
              {JSON.stringify(query.data, null, 2)}
            </pre>
          )}
        </Stack>
      </Card>
    </RxPage>
  );
}
