import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DataPageForm } from '@/features/components/page/data-page-form';
import { RxPage } from '@/features/components/page/rx-page';
import { conversationPageSchema } from '@/features/rxsoft/pages/conversation/components/conversation-page-schemas';
import { conversationApi } from '@/lib/conversation-api';

export const Route = createFileRoute('/_authenticated/conversation/$conversationId/edit')({
  component: ConversationEditPage,
});

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

  const data = (detailQuery.data?.data ?? detailQuery.data) as Record<string, unknown> | null;

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
      <DataPageForm
        config={conversationPageSchema}
        initialData={data ? { ...data, id: (data.id ?? data._id) ?? conversationId } : null}
        mode="edit"
      />
    </RxPage>
  );
}