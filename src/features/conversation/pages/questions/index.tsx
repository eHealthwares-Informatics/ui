import { DataPageShell } from '@/components/page/data-page-shell';
import { questionsConfig } from './schema';

export function RxQuestionsPage() {
  return <DataPageShell config={questionsConfig} />;
}

export { questionsConfig } from './schema';
