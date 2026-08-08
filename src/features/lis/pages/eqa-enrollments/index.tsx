import { DataPageShell } from '@/features/components/page/data-page-shell';
import { eqaEnrollmentsConfig } from './schema';

export function LisEqaEnrollmentsPage() {
  return <DataPageShell config={eqaEnrollmentsConfig} />;
}