import { DataPageShell } from '@/features/components/page/data-page-shell';
import { ehealthwaresTeamConfig } from './schema';

export function EhealthwaresTeamPage() {
  return <DataPageShell config={ehealthwaresTeamConfig} />;
}
