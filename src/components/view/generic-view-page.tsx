import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { RxPage } from '@/components/page/rx-page';
import { GenericViewComponent } from '@/components/view';
import { deriveView } from '@/components/view/derive-view';
import { useEnhancedCodingConceptView } from '@/components/view/ehannced-view';
import { useApiProvider } from '@/context/module-context';
import { codingConceptView } from '@/features/coding-concept/schema/view';
import { getModelConfig } from '@/features/registry';
import type { View } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { codingConceptApi } from '@/lib/coding-concept-api';

type GenericViewPageProps = {
  page: string;
  id: string;
};

export function GenericViewPage({ page, id }: GenericViewPageProps) {
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getModelConfig(page).then(setModelConfig);
  }, [page]);

  const view = modelConfig ? deriveView(modelConfig) : null;
  const apiProvider = modelConfig?.apiProvider ?? useApiProvider();
  const detailQuery = useQuery({
    queryKey: [page, id],
    enabled: !!view && !!apiProvider && page !== 'coding-concepts',
    queryFn: async () => {
      const endpoint = view!.endpoint.replace(':id', id);
      return apiProvider!.get(endpoint);
    },
  });

  const data = detailQuery.data?.data?.data ?? detailQuery.data?.data;

  if (page === 'coding-concepts') {
    return <CodingConceptDetailView id={id} />;
  }

  if (!view) {
    return <div>Invalid page configuration</div>;
  }

  if (detailQuery.isLoading) {
    return <div>Loading...</div>;
  }

  const isEmpty = !data || (typeof data === 'object' && Object.keys(data as object).length === 0);
  if (detailQuery.isError || isEmpty) {
    return <div>Record not found</div>;
  }

  return (
    <RxPage
      title={view.title ?? modelConfig?.title ?? page}
      breadcrumbs={[{ label: modelConfig?.title ?? page }, { label: view.title ?? id }]}
      onBack={() => navigate({ to: '..' })}
    >
      <GenericViewComponent view={view as View<any>} data={data} />
    </RxPage>
  );
}

function CodingConceptDetailView({ id }: { id: string }) {
  const navigate = useNavigate();
  const view = useEnhancedCodingConceptView(codingConceptView, 'LOINC');
  const detailQuery = useQuery({
    queryKey: ['coding-concepts', id],
    enabled: true,
    queryFn: () => codingConceptApi.get(view!.endpoint.replace(':id', id)),
  });

  const data = detailQuery.data?.data?.data;

  if (detailQuery.isLoading) {
    return <div>Loading...</div>;
  }
  if (detailQuery.isError || !data) {
    return <div>Record not found</div>;
  }

  return (
    <RxPage
      title={view?.title ?? 'Coding Concept Details'}
      breadcrumbs={[{ label: 'Coding Concepts' }, { label: view?.title ?? id }]}
      onBack={() => navigate({ to: '/coding-concept' })}
    >
      <GenericViewComponent view={view as View<any>} data={data} />
    </RxPage>
  );
}
