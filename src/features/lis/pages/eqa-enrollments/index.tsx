import { DataPageShell } from '@/components/page/data-page-shell';
import { eqaEnrollmentsConfig } from './schema';

export function LisEqaEnrollmentsPage() {
  return <DataPageShell config={eqaEnrollmentsConfig} />;
}
