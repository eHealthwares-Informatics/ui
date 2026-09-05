import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Badge, Button, Card, Group, Select, Table, Text, TextInput, Title } from '@mantine/core';
import { Search, X } from 'lucide-react';
import { RxPage } from '@/features/components/page/rx-page';
import { GenericViewComponent } from '@/features/components/view';
import {
  conversationPageSchema,
  questionPageSchema,
} from '@/features/rxsoft/pages/conversation/components/conversation-page-schemas';
import type { View } from '@/features/rxsoft/types';
import { conversationApi } from '@/lib/conversation-api';

export const Route = createFileRoute('/_authenticated/conversation/$conversationId/edit')({
  component: ConversationEditPage,
});

function isAIResponse(source?: string) {
  return !!source && (source.startsWith('questionnaire/ai') || source.includes('/ai/'));
}

function ResponsesSection({ responses }: { responses: any[] }) {
  const [sourceFilter, setSourceFilter] = useState<string | null>('all');
  const [directionFilter, setDirectionFilter] = useState<string | null>('all');
  const [attributeFilter, setAttributeFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  // Collect unique attributes for filter dropdown
  const uniqueAttributes = useMemo(() => {
    const attrs = new Set<string>();
    responses.forEach((r) => {
      if (r.attribute) attrs.add(r.attribute);
    });
    return Array.from(attrs).sort();
  }, [responses]);

  // Collect unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    responses.forEach((r) => {
      if (r.source) sources.add(r.source);
    });
    return Array.from(sources).sort();
  }, [responses]);

  const filtered = useMemo(() => {
    return responses.filter((r) => {
      // Source filter
      if (sourceFilter === 'ai' && !isAIResponse(r.source)) return false;
      if (sourceFilter === 'non-ai' && isAIResponse(r.source)) return false;
      if (sourceFilter && sourceFilter !== 'all' && sourceFilter !== 'ai' && sourceFilter !== 'non-ai') {
        if (r.source !== sourceFilter) return false;
      }

      // Direction filter
      if (directionFilter && directionFilter !== 'all' && r.direction !== directionFilter) return false;

      // Attribute filter
      if (attributeFilter && r.attribute !== attributeFilter) return false;

      // Text search
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const text = (r.textAnswer ?? r.message ?? '').toLowerCase();
        const attr = (r.attribute ?? '').toLowerCase();
        const src = (r.source ?? '').toLowerCase();
        if (!text.includes(q) && !attr.includes(q) && !src.includes(q)) return false;
      }

      return true;
    });
  }, [responses, sourceFilter, directionFilter, attributeFilter, searchText]);

  const hasFilters = sourceFilter !== 'all' || directionFilter !== 'all' || !!attributeFilter || !!searchText;

  if (!responses || responses.length === 0) {
    return (
      <Card withBorder radius="md" p="lg">
        <Title order={4} mb="md">Responses</Title>
        <Text size="sm" c="dimmed">No responses recorded yet.</Text>
      </Card>
    );
  }

  return (
    <Card withBorder radius="md" p="lg">
      <Group justify="space-between" mb="md">
        <Title order={4}>
          Responses
          {hasFilters ? (
            <Text component="span" size="sm" fw={400} c="dimmed"> ({filtered.length} of {responses.length})</Text>
          ) : (
            <Text component="span" size="sm" fw={400} c="dimmed"> ({responses.length})</Text>
          )}
        </Title>
        {hasFilters && (
          <Button
            variant="subtle"
            size="xs"
            leftSection={<X size={14} />}
            onClick={() => {
              setSourceFilter('all');
              setDirectionFilter('all');
              setAttributeFilter(null);
              setSearchText('');
            }}
          >
            Clear filters
          </Button>
        )}
      </Group>

      {/* Filter controls */}
      <Group mb="md" gap="sm">
        <Select
          label="Source"
          placeholder="All sources"
          data={[
            { value: 'all', label: 'All' },
            { value: 'ai', label: '🤖 AI Only' },
            { value: 'non-ai', label: 'Non-AI Only' },
            ...uniqueSources.map((s) => ({ value: s, label: s })),
          ]}
          value={sourceFilter}
          onChange={setSourceFilter}
          size="xs"
          w={200}
          searchable
          clearable
        />
        <Select
          label="Direction"
          placeholder="All directions"
          data={[
            { value: 'all', label: 'All' },
            { value: 'INBOUND', label: '📥 Inbound' },
            { value: 'OUTBOUND', label: '📤 Outbound' },
          ]}
          value={directionFilter}
          onChange={setDirectionFilter}
          size="xs"
          w={180}
        />
        <Select
          label="Attribute"
          placeholder="All attributes"
          data={uniqueAttributes.map((a) => ({ value: a, label: a }))}
          value={attributeFilter}
          onChange={setAttributeFilter}
          size="xs"
          w={200}
          searchable
          clearable
        />
        <TextInput
          label="Search"
          placeholder="Search text..."
          leftSection={<Search size={14} />}
          value={searchText}
          onChange={(e) => setSearchText(e.currentTarget.value)}
          size="xs"
          w={200}
        />
      </Group>

      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>Direction</Table.Th>
            <Table.Th>Attribute</Table.Th>
            <Table.Th>Answer</Table.Th>
            <Table.Th>Valid</Table.Th>
            <Table.Th>Source</Table.Th>
            <Table.Th>Timestamp</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={7}>
                <Text ta="center" c="dimmed" py="md">No responses match the current filters.</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            filtered.map((r, i) => (
              <Table.Tr key={r._id || r.id || i}>
                <Table.Td>{i + 1}</Table.Td>
                <Table.Td>
                  <Badge variant="light" color={r.direction === 'INBOUND' ? 'blue' : 'green'}>
                    {r.direction ?? '-'}
                  </Badge>
                </Table.Td>
                <Table.Td>{r.attribute ?? '-'}</Table.Td>
                <Table.Td>
                  <Text size="sm" truncate maw={300} title={r.textAnswer ?? r.message ?? ''}>
                    {r.textAnswer ?? r.message ?? '-'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color={r.valid ? 'green' : 'red'}>
                    {r.valid ? 'Yes' : 'No'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    variant="light"
                    color={isAIResponse(r.source) ? 'violet' : 'gray'}
                    size="sm"
                  >
                    {r.source ?? '-'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">
                    {r.timestamp ? new Date(r.timestamp).toLocaleString() : '-'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Card>
  );
}

function ConversationEditPage() {
  const { conversationId } = Route.useParams();
  const navigate = useNavigate();

  const detailQuery = useQuery({
    queryKey: ['conversations', conversationId],
    queryFn: async () => {
      const response = await conversationApi.get(`/conversations/${conversationId}`);
      return response.data as Record<string, unknown>;
    },
  });

  const data = detailQuery.data?.data ?? detailQuery.data;

  const view: View<any> = {
    endpoint: '/conversations/:id',
    fieldGroups: [
      {
        title: 'Conversation Details',
        fields: [
          {
            key: 'questionnaire',
            label: 'Questionnaire',
            render: (v: any) => v?.name ?? '-',
          },
          {
            key: 'questionnaire',
            label: 'Code',
            render: (v: any) => v?.code ?? '-',
          },
          {
            key: 'questionnaire',
            label: 'Strategy',
            render: (v: any) => v?.processingStrategy ?? '-',
          },
          {
            key: 'channel',
            label: 'Channel',
            render: (v: any) => v?.name ?? '-',
          },
          {
            key: 'channel',
            label: 'Channel Type',
            render: (v: any) => v?.type ?? '-',
          },
          { key: 'status', label: 'Status' },
          { key: 'state', label: 'State' },
          { key: 'participantId', label: 'Participant ID' },
          {
            key: 'participant',
            label: 'Participant Phone',
            render: (v: any) => v?.phone ?? '-',
          },
          {
            key: 'currentQuestion',
            label: 'Current Question',
            render: (v: any) => v?.text ?? '-',
          },
          {
            key: 'currentQuestion',
            label: 'Question Type',
            render: (v: any) => v?.questionType ?? '-',
          },
          {
            key: 'workflowInstanceId',
            label: 'Workflow Instance',
            render: (v: any) => v ? String(v).slice(0, 12) + '...' : '-',
          },
        ],
      },
    ],
    accordions: [
      {
        key: 'questions',
        title: 'Questions',
        labelKey: 'text',
        itemEditConfig: questionPageSchema,
      },
    ],
  };

  if (detailQuery.isLoading) {
    return (
      <RxPage
        title={conversationPageSchema.title}
        description={conversationPageSchema.description}
        breadcrumbs={[
          { label: 'Conversations', href: '/conversation' },
          { label: conversationId },
        ]}
        onBack={() => navigate({ to: '/conversation' })}
      >
        <div>Loading...</div>
      </RxPage>
    );
  }

  const responses = (data as any)?.responses ?? [];

  return (
    <RxPage
      title={conversationPageSchema.title}
      description={conversationPageSchema.description}
      breadcrumbs={[
        { label: 'Conversations', href: '/conversation' },
        { label: conversationId },
      ]}
      onBack={() => navigate({ to: '/conversation' })}
    >
      <GenericViewComponent view={view} data={data} />
      <ResponsesSection responses={responses} />
    </RxPage>
  );
}
