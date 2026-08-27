import { createFileRoute } from '@tanstack/react-router';
import { EncounterDetailPage } from '@/features/emr/pages/encounter-detail-page';

export const Route = createFileRoute('/_authenticated/emr/encounters/$encounterId')({
  component: EncounterDetailPage,
});
