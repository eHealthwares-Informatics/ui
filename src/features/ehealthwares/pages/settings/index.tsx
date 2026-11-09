import { DataPageShell } from '@/components/page/data-page-shell';
import { ehealthwaresSettingsConfig } from './schema';

export function EhealthwaresSettingsPage() {
  return <DataPageShell config={ehealthwaresSettingsConfig} />;
}
