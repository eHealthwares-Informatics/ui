import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { DataPageForm } from '@/components/page/data-page-form';
import { getModelConfig } from '@/features/registry';
import type { ModelConfig } from '@/features/shared/model-schema';

export const Route = createFileRoute('/_authenticated/$page/create')({
  component: GenericCreatePage,
});

function GenericCreatePage() {
  const { page } = Route.useParams();
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);

  useEffect(() => {
    getModelConfig(page).then(setModelConfig);
  }, [page]);

  if (!modelConfig) {
    return <div>Loading...</div>;
  }

  return <DataPageForm config={modelConfig} />;
}
