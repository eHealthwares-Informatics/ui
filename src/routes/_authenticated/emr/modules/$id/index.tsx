import { createFileRoute } from '@tanstack/react-router';
import { SubModuleDetailPage } from '@/features/emr/pages/sub-modules/detail-page';

export const Route = createFileRoute('/_authenticated/emr/modules/$id/')({
  component: SubModuleDetailPage,
});
