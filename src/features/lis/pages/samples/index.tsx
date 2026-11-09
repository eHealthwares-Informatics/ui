import { DataPageShell } from '@/components/page/data-page-shell';
import { samplesConfig } from './schema';

export function LisSamplesPage() {
  return <DataPageShell config={samplesConfig} />;
}
