import { DataPageShell } from '@/features/components/page/data-page-shell';
import { identityLocationsConfig } from '../schema/locations';

export function IdentityLocationsPage() {
  return <DataPageShell config={identityLocationsConfig} />;
}
