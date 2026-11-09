import { DataPageShell } from '@/components/page/data-page-shell';
import { settingsConfig } from './schema';

export function RxSettingsPage() {
  return <DataPageShell config={settingsConfig} />;
}
