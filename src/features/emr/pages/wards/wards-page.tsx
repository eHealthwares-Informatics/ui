import { DataPageShell } from '@/features/components/page/data-page-shell';
import { wardsConfig } from '../../registry/wards';

export function WardsPage() {
  return <DataPageShell config={wardsConfig} />;
}