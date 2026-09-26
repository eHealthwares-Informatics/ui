import { DataPageShell } from '@/features/components/page/data-page-shell';
import { referralsConfig } from './schema';

export function ReferralsPage() {
  return <DataPageShell config={referralsConfig} />;
}
