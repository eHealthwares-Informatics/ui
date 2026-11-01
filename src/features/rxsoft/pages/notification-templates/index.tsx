import { useMemo, useState } from 'react';
import { DataPageShell } from '../../../components/page/data-page-shell';
import { TemplatePreviewModal, type TemplatePreview } from '../templates/preview-modal';
import { buildNotificationTemplatesConfig } from './schema';

export function RxNotificationTemplatesPage() {
  const [preview, setPreview] = useState<TemplatePreview | null>(null);
  const config = useMemo(() => buildNotificationTemplatesConfig(setPreview), []);

  return (
    <>
      <DataPageShell config={config} />
      <TemplatePreviewModal preview={preview} onClose={() => setPreview(null)} />
    </>
  );
}
