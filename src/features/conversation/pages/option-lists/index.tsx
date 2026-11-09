import { DataPageShell } from '@/components/page/data-page-shell';
import { optionListsConfig } from './schema';

export function RxOptionListsPage() {
  return <DataPageShell config={optionListsConfig} />;
}

export { optionListsConfig } from './schema';
export { questionOptionsConfig } from './option-schema';
