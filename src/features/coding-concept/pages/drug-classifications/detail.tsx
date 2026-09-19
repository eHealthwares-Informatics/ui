import { Badge, Card, Group, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@mantine/core';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { RxPage } from '@/features/components/page/rx-page';

type Relations = {
  genericDrugs: Array<{ id: string; code: string; name: string }>;
  genericProducts: Array<{ id: string; code: string; name: string }>;
};

function LinkList({ items, emptyLabel }: { items: Array<{ id: string; code: string; name: string }>; emptyLabel: string }) {
  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {emptyLabel}
      </Text>
    );
  }
  return (
    <Stack gap={4}>
      {items.map((item) => (
        <Group key={item.id} gap={8}>
          <Text size="sm" fw={600} c="dimmed" w={110}>
            {item.code}
          </Text>
          <Text size="sm">{item.name}</Text>
        </Group>
      ))}
    </Stack>
  );
}

export function CodedDrugClassificationDetailPage({ classificationId }: { classificationId: string }) {
  const navigate = useNavigate();

  const { data: classification, isLoading: loadingCls } = useQuery({
    queryKey: ['drug-classification', classificationId],
    queryFn: async () => {
      const { data } = await codingConceptApi.get(`/drug-classifications/${classificationId}`);
      return data.data as { id: string; code: string; type: string; name: string };
    },
  });

  const { data: relations, isLoading: loadingRel } = useQuery({
    queryKey: ['drug-classification', classificationId, 'relations'],
    queryFn: async () => {
      const { data } = await codingConceptApi.get(`/drug-classifications/${classificationId}/relations`);
      return data.data as Relations;
    },
  });

  return (
    <RxPage
      title="Drug Classification"
      description="Classification and its related generic drugs and products"
      actions={
        <Button variant="subtle" leftSection={<ArrowLeft size={16} />} onClick={() => navigate({ to: '/coding-concept/drug-classifications' })}>
          Back to Classifications
        </Button>
      }
    >
      <Stack gap="lg">
        <Card withBorder radius="md" p="md">
          <Group gap="sm" align="center">
            <Title order={4}>{classification?.name ?? '…'}</Title>
            <Badge variant="light">{classification?.type ?? '—'}</Badge>
            <Text size="sm" c="dimmed">
              {classification?.code ?? '…'}
            </Text>
          </Group>
        </Card>

        {loadingRel ? (
          <Loader size="sm" />
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Card withBorder radius="md" p="md">
              <Title order={5} mb="sm">
                Generic Drugs ({relations?.genericDrugs.length ?? 0})
              </Title>
              <LinkList items={relations?.genericDrugs ?? []} emptyLabel="No generic drugs linked." />
            </Card>
            <Card withBorder radius="md" p="md">
              <Title order={5} mb="sm">
                Generic Products ({relations?.genericProducts.length ?? 0})
              </Title>
              <LinkList items={relations?.genericProducts ?? []} emptyLabel="No generic products linked." />
            </Card>
          </SimpleGrid>
        )}
      </Stack>
    </RxPage>
  );
}
