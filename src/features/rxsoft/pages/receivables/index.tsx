import { DataPageShell } from '@/components/page/data-page-shell';
import { receivablesConfig } from './schema';

export function RxReceivablesPage() {
  return <DataPageShell config={receivablesConfig} />;
}
