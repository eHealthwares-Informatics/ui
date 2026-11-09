import { useMemo, useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { TemplatePreviewModal, type TemplatePreview } from '../templates/preview-modal';
import { buildPrintTemplatesConfig } from './schema';

export function RxPrintTemplatesPage() {
  const [preview, setPreview] = useState<TemplatePreview | null>(null);
  const config = useMemo(() => buildPrintTemplatesConfig(setPreview), []);

  return (
    <>
      <DataPageShell config={config} />
      <TemplatePreviewModal preview={preview} onClose={() => setPreview(null)} />
    </>
  );
}
