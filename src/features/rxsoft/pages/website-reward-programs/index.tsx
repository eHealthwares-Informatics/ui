import { DataPageShell } from '@/features/components/page/data-page-shell';
import { rewardProgramsConfig } from './schema';

export function RxWebsiteRewardProgramsPage() {
  return <DataPageShell config={rewardProgramsConfig} />;
}
