import { DataPageShell } from '@/components/page/data-page-shell';
import { questionnairesConfig } from './schema';

export function RxQuestionnairesPage() {
  return <DataPageShell config={questionnairesConfig} />;
}

export { questionnairesConfig } from './schema';
