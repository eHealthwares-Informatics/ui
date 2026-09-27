import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useApiProvider } from '@/context/module-context';
import { codingConceptView } from '@/features/coding-concept/schema/view';
import { GenericViewComponent } from '@/features/components/view';
import { deriveView } from '@/features/components/view/derive-view';
import { useEnhancedCodingConceptView } from '@/features/components/view/ehannced-view';
import { getModelConfig } from '@/features/registry';
import type { View } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { modules } from '@/features/shared/module-data';
import { codingConceptApi } from '@/lib/coding-concept-api';

export const Route = createFileRoute('/_authenticated/$page/$id')({
  component: GenericViewPage,
});

function findModuleForResource(page: string) {
  return modules.find((m) => m.resources.includes(page));
}

function GenericViewPage() {
  const { page, id } = Route.useParams();
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);

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

  return <GenericViewComponent view={view as View<any>} data={data} />;
}

function CodingConceptDetailView({ id }: { id: string }) {
  const view = useEnhancedCodingConceptView(codingConceptView, 'LOINC');
  const detailQuery = useQuery({
    queryKey: ['coding-concepts', id],
    enabled: true,
    queryFn: () => codingConceptApi.get(view!.endpoint.replace(':id', id)),
  });

  const data = detailQuery.data?.data?.data;

  if (!data) {
    return <div>Loading...</div>;
  }

  return <GenericViewComponent view={view as View<any>} data={data} />;
}

export default GenericViewPage;
