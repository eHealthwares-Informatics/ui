import { createFileRoute } from '@tanstack/react-router';
import { SubModulesPage } from '@/features/emr/pages/sub-modules';

export const Route = createFileRoute('/_authenticated/emr/modules/')({
  component: SubModulesPage,
});
