import { DataPageShell } from '../../../components/page/data-page-shell';
import { posTerminalsConfig } from './schema';

export function RxPosTerminalsPage() {
  return <DataPageShell config={posTerminalsConfig} />;
}