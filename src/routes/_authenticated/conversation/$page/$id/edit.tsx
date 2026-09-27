import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { DataPageForm } from '@/features/components/page/data-page-form';
import { RxPage } from '@/features/components/page/rx-page';
import { getModelConfig } from '@/features/registry';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';

export const Route = createFileRoute('/_authenticated/conversation/$page/$id/edit')({
  component: ConversationEntityEditPage,
});

function ConversationEntityEditPage() {
  const { page, id } = Route.useParams();
  const navigate = useNavigate();
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);

  useEffect(() => {
    getModelConfig(page).then(setModelConfig);
  }, [page]);

  const apiProvider = modelConfig?.apiProvider ?? conversationApi;

  const detailQuery = useQuery({
    queryKey: [page, id],
    enabled: !!modelConfig,
    queryFn: async () => {
      const response = await apiProvider!.get(`${modelConfig!.endpoint}/${id}`);
      return response.data as Record<string, unknown>;
    },
  });

  if (!modelConfig) {
    return <div>Loading...</div>;
  }

  if (detailQuery.isLoading) {
    return <div>Loading...</div>;
  }

  const data = (detailQuery.data?.data ?? detailQuery.data) as Record<string, unknown> | null;

  return (
    <RxPage
      title={modelConfig.title}
      breadcrumbs={[{ label: modelConfig.title, href: `/conversation/${page}` }, { label: id }]}
      onBack={() => navigate({ to: `/conversation/${page}` })}
    >
      <DataPageForm config={modelConfig} initialData={data} mode="edit" />
    </RxPage>
  );
}
