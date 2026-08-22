import { createFileRoute } from '@tanstack/react-router';
import { EncountersPage } from '@/features/emr/pages/encounters-page';

export const Route = createFileRoute('/_authenticated/emr/encounters/')({
  component: EncountersPage,
});
